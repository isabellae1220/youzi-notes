/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface StoredResource {
  body?: ReadableStream;
  size: number;
  httpEtag: string;
  range?: { offset?: number; length?: number };
  customMetadata?: Record<string, string>;
  writeHttpMetadata(headers: Headers): void;
}

interface UploadedPart {
  partNumber: number;
  etag: string;
}

interface MultipartResourceUpload {
  uploadId: string;
  uploadPart(partNumber: number, value: ReadableStream | ArrayBuffer): Promise<UploadedPart>;
  complete(parts: UploadedPart[]): Promise<StoredResource>;
  abort(): Promise<void>;
}

interface ResourceBucket {
  head(key: string): Promise<StoredResource | null>;
  get(key: string, options?: { onlyIf?: Headers; range?: Headers }): Promise<StoredResource | null>;
  createMultipartUpload(key: string, options?: {
    httpMetadata?: { contentType?: string; contentDisposition?: string };
    customMetadata?: Record<string, string>;
  }): Promise<MultipartResourceUpload>;
  resumeMultipartUpload(key: string, uploadId: string): MultipartResourceUpload;
}

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: unknown;
  RESOURCES?: ResourceBucket;
  RESOURCE_UPLOAD_TOKEN?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

const APPROVED_UPLOAD_KEYS = new Set([
  "resources/physics-lab-1/9aa41289777cf196150f24ab.pdf",
  "resources/physics-lab-1/fbf11d316785c2633a6042d8.pdf",
  "resources/physics-lab-1/168e20dd6d7a274add7eead7.pdf",
  "resources/physics-lab-1/dbaaa7929e3df66e7e5bc145.pdf",
  "resources/physics-lab-1/8fc98dc4d134b05b73884280.pdf",
]);

function objectKey(pathname: string, prefix: string) {
  const encoded = pathname.slice(prefix.length);
  try {
    return encoded.split("/").map(decodeURIComponent).join("/");
  } catch {
    return "";
  }
}

function safeResourceKey(key: string) {
  return key.startsWith("resources/") && !key.includes("..") && !key.includes("\\");
}

async function serveResource(request: Request, env: Env, url: URL) {
  if (!env.RESOURCES) return new Response("Storage unavailable", { status: 503 });
  const key = objectKey(url.pathname, "/files/");
  if (!safeResourceKey(key)) return new Response("Not found", { status: 404 });

  if (request.method === "HEAD") {
    const object = await env.RESOURCES.head(key);
    if (!object) return new Response(null, { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("content-length", String(object.size));
    headers.set("etag", object.httpEtag);
    headers.set("accept-ranges", "bytes");
    headers.set("cache-control", "public, max-age=31536000, immutable");
    if (object.customMetadata?.sha256) headers.set("x-content-sha256", object.customMetadata.sha256);
    return new Response(null, { headers });
  }

  if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
  const object = await env.RESOURCES.get(key, { onlyIf: request.headers, range: request.headers });
  if (!object) return new Response("Not found", { status: 404 });
  if (!("body" in object)) return new Response(null, { status: 412 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  let status = 200;
  if (object.range && "offset" in object.range && typeof object.range.offset === "number") {
    const length = object.range.length ?? object.size - object.range.offset;
    headers.set("content-range", `bytes ${object.range.offset}-${object.range.offset + length - 1}/${object.size}`);
    headers.set("content-length", String(length));
    status = 206;
  } else {
    headers.set("content-length", String(object.size));
  }
  if (url.searchParams.get("download") === "1") {
    const name = url.searchParams.get("name") || "resource.pdf";
    headers.set("content-disposition", `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
  }
  return new Response(object.body, { status, headers });
}

async function uploadApprovedResource(request: Request, env: Env, url: URL) {
  if (!env.RESOURCES || !env.RESOURCE_UPLOAD_TOKEN) return new Response("Not found", { status: 404 });
  if (request.headers.get("authorization") !== `Bearer ${env.RESOURCE_UPLOAD_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const key = objectKey(url.pathname, "/__resource-upload/");
  if (!APPROVED_UPLOAD_KEYS.has(key)) return new Response("Not found", { status: 404 });
  const action = url.searchParams.get("action");

  if (request.method === "POST" && action === "create") {
    const metadata = await request.json() as { fileName?: string; sha256?: string };
    if (!metadata.fileName || !metadata.sha256) return new Response("Bad request", { status: 400 });
    const upload = await env.RESOURCES.createMultipartUpload(key, {
      httpMetadata: { contentType: "application/pdf" },
      customMetadata: { fileName: metadata.fileName, sha256: metadata.sha256 },
    });
    return Response.json({ uploadId: upload.uploadId });
  }

  const uploadId = url.searchParams.get("uploadId");
  if (!uploadId) return new Response("Bad request", { status: 400 });
  const upload = env.RESOURCES.resumeMultipartUpload(key, uploadId);
  if (request.method === "PUT" && action === "part") {
    const partNumber = Number(url.searchParams.get("partNumber"));
    if (!Number.isInteger(partNumber) || partNumber < 1 || !request.body) return new Response("Bad request", { status: 400 });
    return Response.json(await upload.uploadPart(partNumber, request.body));
  }
  if (request.method === "POST" && action === "complete") {
    const body = await request.json() as { parts?: UploadedPart[] };
    if (!Array.isArray(body.parts) || body.parts.length === 0) return new Response("Bad request", { status: 400 });
    await upload.complete(body.parts);
    return Response.json({ ok: true });
  }
  if (request.method === "DELETE" && action === "abort") {
    await upload.abort();
    return Response.json({ ok: true });
  }
  return new Response("Method not allowed", { status: 405 });
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    if (url.pathname.startsWith("/files/")) return serveResource(request, env, url);
    if (url.pathname.startsWith("/__resource-upload/")) return uploadApprovedResource(request, env, url);

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
