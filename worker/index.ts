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
  delete(key: string): Promise<void>;
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
  "resources/college-physics-1/7e41a650ce35fec121c90f17.pdf",
]);

const APPROVED_DELETE_KEYS = new Set([
"resources/college-physics-1/060be256f5175018b1a4f1a1.pdf",
  "resources/college-physics-1/9220c85e8399b63fc337a47f.pdf",
  "resources/college-physics-1/ee3b1eee694d762cb9290234.pdf",
  "resources/college-physics-1/6affc675caabf163ce61a863.pdf",
  "resources/college-physics-1/596bb40b3df16212c7091db0.pdf",
  "resources/college-physics-1/717518b26d8c54180d425932.pdf",
  "resources/college-physics-1/f3dc769dfb85d0c8853afe1f.pdf",
  "resources/college-physics-1/79a55a4f6783a5be8bfc47af.pdf",
  "resources/college-physics-1/f9c4b1c79b170a4cd974b97b.pdf",
  "resources/college-physics-1/3e773ea130eaec8036dbad33.pdf",
  "resources/college-physics-1/776d32a9afa18eed3c5b48b6.pdf",
  "resources/college-physics-1/80d3eec369c1705da1712498.pdf",
  "resources/college-physics-1/8f5602088f9e5702849e622b.pdf",
  "resources/college-physics-1/97e39894050ea18027460a27.pdf",
  "resources/college-physics-1/c0efc94d7ea0569e18cb3405.pdf",
  "resources/college-physics-1/ae92eee1893699a47e0666ab.pdf",
  "resources/college-physics-1/1a9df30b21b6eefc8ea16188.pdf",
  "resources/college-physics-1/55712603b3d2314440ebcd23.pdf",
  "resources/college-physics-1/7f9134c2adc8917e5c6319cb.pdf",
  "resources/college-physics-1/d44440d46cf72b911d53f47c.pdf",
  "resources/college-physics-1/e38b84e140577278aa0a4f64.pdf",
  "resources/college-physics-1/636e4f5916c2dd705b84be49.pdf",
  "resources/college-physics-1/cd1df03a9346cf769008c875.pdf",
  "resources/college-physics-1/1adfa2d1b14cd0be123a1d28.pdf",
  "resources/college-physics-1/126150c8d7ff9bdcd1e93eb1.pdf",
  "resources/college-physics-1/98bf828c2791695f94a5dcf3.pdf",
  "resources/college-physics-1/6abaacda4d0471d33a37230c.pdf",
  "resources/college-physics-1/4208e6aef2ca62edeeeb439e.pdf",
  "resources/college-physics-1/dcba73d1dbe888a66c614b0a.pdf",
  "resources/college-physics-1/8761011749610af5900e4649.pdf",
  "resources/college-physics-1/b038641268d7e51d96de5890.pdf",
  "resources/college-physics-1/0952621aca671abd2c6f1bde.pdf",
  "resources/college-physics-1/9a95a35bbdbd2db766b78a79.pdf",
  "resources/college-physics-1/7305a8f85432996fed583a2b.pdf",
  "resources/college-physics-1/d6b4028fb3236bcd7f04e823.pdf",
  "resources/college-physics-1/574bf0613aa930829ccd4f18.pdf",
  "resources/college-physics-1/3c77643d288c751f8a8e82c9.pdf",
  "resources/college-physics-1/b00787e0ca0f82b144ca5928.pdf",
  "resources/college-physics-1/0153b3788ecf9415a407f01c.pdf",
  "resources/college-physics-1/2fd51caaa3f1c3dd1a6491bb.pdf",
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
  const action = url.searchParams.get("action");
  if (request.method === "DELETE" && action === "delete" && APPROVED_DELETE_KEYS.has(key)) {
    await env.RESOURCES.delete(key);
    return Response.json({ ok: true });
  }
  if (!APPROVED_UPLOAD_KEYS.has(key)) return new Response("Not found", { status: 404 });

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
