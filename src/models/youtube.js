const vm = require('vm');
const { Innertube, Platform } = require('youtubei.js');
const { ProxyAgent, fetch: undiciFetch } = require('undici');

/**
 * YouTube serves obfuscated stream URLs that have to be deciphered by running
 * code extracted from its player script. youtubei.js leaves the choice of
 * JavaScript evaluator to the user, so run it in an isolated VM context.
 */
Platform.shim.eval = (data) => {
	// The generated script ends with a top-level `return`, so wrap it in a function
	const code = `(function () {\n${data.output}\n})()`;
	return vm.runInNewContext(code, { URL, URLSearchParams }, { timeout: 5000 });
};

/**
 * Converts the cookies file into a Cookie header string. Accepts either a
 * string or an array of cookie objects (e.g. exported by a browser extension).
 * @param {String|Object[]} cookies
 * @returns {String|undefined}
 */
function toCookieHeader(cookies) {
	if (!cookies) return undefined;
	if (typeof cookies === 'string') return cookies;
	if (Array.isArray(cookies)) {
		return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ') || undefined;
	}
	return undefined;
}

/**
 * Builds a fetch function that sends every request through the given proxy
 * @param {String} proxy
 */
function createProxyFetch(proxy) {
	const dispatcher = new ProxyAgent(proxy);

	return (input, init = {}) => {
		if (input instanceof Request) {
			init = { method: input.method, headers: input.headers, ...init };
			input = input.url;
		}

		return undiciFetch(input, { ...init, dispatcher });
	};
}

/**
 * Creates a YouTube client
 * @param {String|Object[]} cookies
 * @param {String|null} proxy
 * @returns {Promise<Innertube>}
 */
function createClient(cookies, proxy) {
	return Innertube.create({
		cookie: toCookieHeader(cookies),
		fetch: proxy ? createProxyFetch(proxy) : undefined
	});
}

module.exports = { createClient };
