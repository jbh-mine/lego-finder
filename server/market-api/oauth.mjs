import { createHmac, randomBytes } from 'node:crypto';

export function encode(value) { return encodeURIComponent(String(value)).replace(/[!'()*]/g, char => '%' + char.charCodeAt(0).toString(16).toUpperCase()); }
export function oauthHeader(method, input, credentials, { now = Date.now(), nonce = randomBytes(16).toString('hex') } = {}) {
  const url = new URL(input);
  const oauth = { oauth_consumer_key: credentials.consumerKey, oauth_token: credentials.token, oauth_nonce: nonce,
    oauth_timestamp: String(Math.floor(now / 1000)), oauth_signature_method: 'HMAC-SHA1', oauth_version: '1.0' };
  const pairs = [...url.searchParams.entries(), ...Object.entries(oauth)].map(([key, value]) => [encode(key), encode(value)]);
  pairs.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
  const normalized = pairs.map(pair => pair.join('=')).join('&');
  const base = [method.toUpperCase(), url.origin + url.pathname, normalized].map(encode).join('&');
  oauth.oauth_signature = createHmac('sha1', encode(credentials.consumerSecret) + '&' + encode(credentials.tokenSecret)).update(base).digest('base64');
  return 'OAuth ' + Object.entries(oauth).sort().map(([key, value]) => encode(key) + '="' + encode(value) + '"').join(', ');
}
