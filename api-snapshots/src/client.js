/**
 * Minimal HTTP client for the OpenBoxes API with session-cookie auth.
 * Uses global fetch (Node >= 18) and manually carries the JSESSIONID cookie.
 */

const BASE_URL = process.env.OPENBOXES_BASE_URL || 'http://localhost:8080/openboxes';
const USERNAME = process.env.OPENBOXES_USERNAME || 'admin';
const PASSWORD = process.env.OPENBOXES_PASSWORD || 'password';

let cookies = {};

function cookieHeader() {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function storeCookies(response) {
  const setCookies = response.headers.getSetCookie
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  for (const c of setCookies) {
    const [pair] = c.split(';');
    const idx = pair.indexOf('=');
    if (idx > 0) {
      cookies[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  }
}

async function request(method, path, { body, headers = {} } = {}) {
  const url = path.startsWith('http') ? path : BASE_URL + path;
  const opts = {
    method,
    redirect: 'manual',
    headers: {
      Accept: 'application/json',
      Cookie: cookieHeader(),
      ...headers,
    },
  };
  if (body !== undefined) {
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    opts.headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, opts);
  storeCookies(response);
  const text = await response.text();
  let json = null;
  try {
    json = text.length ? JSON.parse(text) : null;
  } catch (e) {
    // Non-JSON response (HTML error page, CSV, binary...)
  }
  return {
    status: response.status,
    contentType: (response.headers.get('content-type') || '').split(';')[0],
    text,
    json,
  };
}

async function login(locationId) {
  cookies = {};
  const body = { username: USERNAME, password: PASSWORD };
  if (locationId) body.location = locationId;
  const res = await request('POST', '/api/login', { body });
  if (res.status !== 200) {
    throw new Error(`Login failed: HTTP ${res.status} ${res.text.slice(0, 200)}`);
  }
  return res;
}

async function chooseLocation(locationId) {
  const res = await request('GET', `/api/chooseLocation/${locationId}`);
  if (res.status !== 200) {
    throw new Error(`chooseLocation failed: HTTP ${res.status} ${res.text.slice(0, 200)}`);
  }
  return res;
}

module.exports = { BASE_URL, request, login, chooseLocation };
