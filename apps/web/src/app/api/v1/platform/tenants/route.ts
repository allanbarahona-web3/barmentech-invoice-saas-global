import { NextRequest, NextResponse } from 'next/server';
import {
  clearSessionCookie,
  getSessionToken,
  nestResponse,
  proxyNestAuth,
  readNestJson,
} from '@/lib/server/nest-auth-proxy';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = getSessionToken(request);

  if (!token) {
    const response = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }

  const nest = await proxyNestAuth(request, '/v1/platform/tenants', {
    headers: { authorization: `Bearer ${token}` },
  });
  const payload = await readNestJson(nest);

  return nestResponse(nest.status, payload);
}
