import { enqueue } from './queue';
import type { RouterCredentials } from './types';
import { LOGIN_TOKEN_REGEX, SESSION_TOKEN_REGEX } from './endpoints';

export class SessionExpiredError extends Error {
  constructor() {
    super('Router session expired — please log in again.');
    this.name = 'SessionExpiredError';
  }
}

export class RouterNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RouterNetworkError';
  }
}

export class LoginFailedError extends Error {
  constructor() {
    super('Login failed — wrong username or password, or account locked out.');
    this.name = 'LoginFailedError';
  }
}

const TIMEOUT_MS = 10_000;

// ZTE GM630: session is IP-based. No cookie needed; the server identifies
// the caller by source IP. _SESSION_TOKEN in POST bodies is required for mutations.
// Basic Auth header is NOT used — the router ignores it. Auth is form-based only.

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new RouterNetworkError('Router did not respond within 10 seconds.');
    }
    throw new RouterNetworkError((err as Error).message);
  } finally {
    clearTimeout(timer);
  }
}

function isLoginPage(body: string): boolean {
  // The ZTE login page contains 'Frm_Logintoken' or the logout_redirect function.
  // Distinguish from a real session-expired redirect vs just the login form.
  return body.includes('Frm_Logintoken') || body.includes('logout_redirect()');
}

// Returns the login token N from: getObj("Frm_Logintoken").value = "N";
function extractLoginToken(html: string): string {
  const m = html.match(LOGIN_TOKEN_REGEX);
  return m ? m[1] : '1';
}

// Returns the session token from: var session_token = "...";
export function extractSessionToken(html: string): string | null {
  const m = html.match(SESSION_TOKEN_REGEX);
  return m ? m[1] : null;
}

// Performs form login. Returns the session token extracted from the post-login page.
// Must be called before any mutation. Reads are IP-session-based and work after login.
export async function login(credentials: RouterCredentials): Promise<string> {
  const host = credentials.host;
  const baseUrl = `http://${host}`;

  // Step 1: get login page to extract the current Frm_Logintoken
  const loginPageResp = await fetchWithTimeout(`${baseUrl}/`, { method: 'GET' });
  const loginPageHtml = await loginPageResp.text();
  const loginToken = extractLoginToken(loginPageHtml);

  // Step 2: POST login form — do NOT follow redirect so we can check for 302
  const body = new URLSearchParams({
    action: 'login',
    username: credentials.username,
    Password: credentials.password,
    Frm_Logintoken: loginToken,
    frashnum: '',
  }).toString();

  const loginResp = await fetchWithTimeout(`${baseUrl}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `${baseUrl}/`,
    },
    body,
    redirect: 'manual',
  });

  // 302 to /start.ghtml = success. 200 = failure (wrong credentials or lockout).
  if (loginResp.status !== 302) {
    throw new LoginFailedError();
  }

  // Step 3: fetch start.ghtml to establish the IP session and get the session token
  const startResp = await fetchWithTimeout(`${baseUrl}/start.ghtml`, {
    method: 'GET',
    headers: { Referer: `${baseUrl}/` },
  });
  const startHtml = await startResp.text();
  const sessionToken = extractSessionToken(startHtml);
  return sessionToken ?? '';
}

export async function get(path: string, credentials: RouterCredentials): Promise<string> {
  return enqueue(async () => {
    const url = `http://${credentials.host}${path}`;
    let response: Response;
    try {
      response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: { Referer: `http://${credentials.host}/` },
      });
    } catch (err) {
      throw err;
    }
    const body = await response.text();
    if (isLoginPage(body)) throw new SessionExpiredError();
    return body;
  });
}

export async function post(
  path: string,
  fields: Record<string, string>,
  credentials: RouterCredentials,
  sessionToken: string,
): Promise<string> {
  return enqueue(async () => {
    const url = `http://${credentials.host}${path}`;
    const bodyFields = { ...fields, _SESSION_TOKEN: sessionToken };
    const bodyStr = new URLSearchParams(bodyFields).toString();
    let response: Response;
    try {
      response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: `http://${credentials.host}/`,
        },
        body: bodyStr,
      });
    } catch (err) {
      throw err;
    }
    const responseBody = await response.text();
    if (isLoginPage(responseBody)) throw new SessionExpiredError();
    return responseBody;
  });
}
