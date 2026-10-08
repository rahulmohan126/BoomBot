import { ProxyAgent, fetch as undiciFetch } from 'undici';
import type { Cookies } from '../config.js';

/**
 * Converts cookies.json contents into a Cookie header value
 */
export function toCookieHeader(cookies: Cookies | null): string | undefined {
  if (!cookies) return undefined;
  return cookies.map(({ name, value }) => `${name}=${value}`).join('; ') || undefined;
}

/**
 * Creates a fetch function that routes every request through the given proxy
 */
export function createProxyFetch(proxy: string): typeof fetch {
  const dispatcher = new ProxyAgent(proxy);

  const proxyFetch = (input: string | URL | Request, init: RequestInit = {}) => {
    if (input instanceof Request) {
      init = { method: input.method, headers: input.headers, ...init };
      input = input.url;
    }

    return undiciFetch(input, { ...(init as Parameters<typeof undiciFetch>[1]), dispatcher });
  };

  return proxyFetch;
}
