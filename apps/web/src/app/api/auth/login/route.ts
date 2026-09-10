import { NextRequest, NextResponse } from 'next/server';
import {
  nestResponse,
  proxyNestAuth,
  readNestJson,
  setSessionCookie,
} from '@/lib/server/nest-auth-proxy';

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid login request' }, { status: 400 });
  }

  if (typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ message: 'Invalid login request' }, { status: 400 });
  }

  const nest = await proxyNestAuth(request, '/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  const payload = await readNestJson(nest);

  if (!nest.ok) {
    return nestResponse(nest.status, payload);
  }

  const accessToken = (payload as { accessToken?: unknown })?.accessToken;
  const user = (payload as { user?: unknown })?.user;

  if (typeof accessToken !== 'string' || !user) {
    return NextResponse.json(
      { message: 'Invalid response from authentication service' },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ user });
  setSessionCookie(response, accessToken);

  return response;
}
