/** Header used for photobooth role capabilities. */
export const PHOTOBOOTH_TOKEN_HEADER = "x-photobooth-token";

/** Read a bounded capability token from request headers. */
export function tokenFromHeaders(headers: Headers): string | null {
  const token = headers.get(PHOTOBOOTH_TOKEN_HEADER)?.trim();
  return token && token.length <= 200 ? token : null;
}

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body is too large.");
    this.name = "RequestBodyTooLargeError";
  }
}

export class InvalidJsonBodyError extends Error {
  constructor() {
    super("Invalid JSON body.");
    this.name = "InvalidJsonBodyError";
  }
}

/**
 * Read and parse JSON without buffering more than the route's hard limit.
 * Content-Length is only a hint, so the body is also checked while streaming.
 */
export async function readLimitedJson(request: Request, maxBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestBodyTooLargeError();
  }
  if (!request.body) throw new InvalidJsonBodyError();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new InvalidJsonBodyError();
  }
}
