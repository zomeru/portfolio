function publicHeaders(init: ResponseInit, contentType: string) {
  const headers = new Headers(init.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "public, max-age=300");
  if (!headers.has("Content-Type")) headers.set("Content-Type", contentType);
  return headers;
}

export function publicJson(value: unknown, init: ResponseInit = {}) {
  const headers = publicHeaders(init, "application/json; charset=utf-8");
  return Response.json(value, { ...init, headers });
}

export function publicText(value: string, contentType: string, init: ResponseInit = {}) {
  const headers = publicHeaders(init, contentType);
  headers.set("Content-Type", contentType);
  return new Response(value, { ...init, headers });
}

export function publicHead(contentType: string, init: ResponseInit = {}) {
  return new Response(null, { ...init, headers: publicHeaders(init, contentType) });
}
