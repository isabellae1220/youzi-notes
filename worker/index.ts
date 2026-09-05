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

interface ResourceBucket {
  head(key: string): Promise<StoredResource | null>;
  get(key: string, options?: { onlyIf?: Headers; range?: Headers }): Promise<StoredResource | null>;
  delete(key: string): Promise<void>;
}

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: unknown;
  RESOURCES?: ResourceBucket;
  RESOURCE_TAKEDOWN_TOKEN?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

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

const APPROVED_TAKEDOWN_KEYS = [
  "resources/database-basics/349112d051f375f3075dde49.pdf",
  "resources/database-basics/f22bdb16844b747046c8887b.pdf",
] as const;

async function performApprovedTakedown(request: Request, env: Env) {
  if (request.method !== "POST" || !env.RESOURCES || !env.RESOURCE_TAKEDOWN_TOKEN) {
    return new Response("Not found", { status: 404 });
  }
  if (request.headers.get("authorization") !== `Bearer ${env.RESOURCE_TAKEDOWN_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await Promise.all(APPROVED_TAKEDOWN_KEYS.map((key) => env.RESOURCES!.delete(key)));
  return Response.json({ deleted: APPROVED_TAKEDOWN_KEYS.length });
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
    if (url.pathname === "/__approved-takedown-20260905") return performApprovedTakedown(request, env);

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
