import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  getSessionToken,
  nestResponse,
  proxyNestAuth,
  readNestJson,
} from "@/lib/server/nest-auth-proxy";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const token = getSessionToken(request);

  if (!token) {
    const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }

  const { id } = await params;
  const nest = await proxyNestAuth(request, `/customers/${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${token}` },
  });

  return nestResponse(nest.status, await readNestJson(nest));
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const token = getSessionToken(request);

  if (!token) {
    const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid customer request" }, { status: 400 });
  }

  const { id } = await params;
  const nest = await proxyNestAuth(request, `/customers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return nestResponse(nest.status, await readNestJson(nest));
}
