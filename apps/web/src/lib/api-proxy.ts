const DEFAULT_API_TARGET = "http://127.0.0.1:8787";

function readProxyTarget(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed.replace(/\/$/u, "");
    }
  }
  return DEFAULT_API_TARGET;
}

export function getApiProxyTarget(): string {
  return readProxyTarget(
    process.env.API_PROXY_TARGET,
    process.env.NEXT_PUBLIC_CONFIG_API_URL,
    process.env.NEXT_PUBLIC_AGENT_RUNTIME_URL?.replace(/\/api\/copilotkit\/?$/u, ""),
  );
}

export async function proxyToApi(request: Request, pathname: string): Promise<Response> {
  const incoming = new URL(request.url);
  const targetUrl = `${getApiProxyTarget()}${pathname}${incoming.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(targetUrl, init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
