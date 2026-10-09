import { describe, expect, it } from 'vitest';
import { PROXY_REGEX } from '../src/commands/proxy.js';

describe('PROXY_REGEX', () => {
  it.each([
    'http://127.0.0.1:8080',
    'https://proxy.example.com:3128',
    'http://abc:xxx@38.154.185.97:6370',
    'http://user:p%40ss@proxy.example.com:3128',
    'http://user@127.0.0.1:8080',
  ])('accepts %s', (proxy) => {
    expect(PROXY_REGEX.test(proxy)).toBe(true);
  });

  it.each([
    'off',
    '127.0.0.1:8080',
    'http://127.0.0.1',
    'http://abc:xxx@:8080',
    'http://abc:x x@127.0.0.1:8080',
  ])('rejects %s', (proxy) => {
    expect(PROXY_REGEX.test(proxy)).toBe(false);
  });
});
