import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'invoice_session';

function getNestApiUrl(): string {
  const apiUrl = process.env.NEST_API_URL;

  if (!apiUrl) {
    throw new Error('NEST_API_URL is required');
  }

  return apiUrl;
}

function getOriginalHost(request: NextRequest): string {
  // The edge proxy must overwrite this header rather than forward a
  // client-supplied value before it reaches Next.
  const forwardedHost = request.headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim();
  const host = forwardedHost || request.headers.get('host');

  if (!host) {
    throw new Error('Request host is required');
  }

  return host;
}

export async function proxyNestAuth(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  headers.set('x-forwarded-host', getOriginalHost(request));

  return fetch(new URL(path, getNestApiUrl()), {
    ...init,
    headers,
    cache: 'no-store',
    redirect: 'manual',
  });
}

export async function readNestJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: 'Invalid response from authentication service' };
  }
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function getSessionToken(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value;
}

export function nestResponse(
  status: number,
  payload: unknown,
): NextResponse {
  const response = NextResponse.json(payload, { status });

  if (status === 401) {
    clearSessionCookie(response);
  }

  return response;
}
