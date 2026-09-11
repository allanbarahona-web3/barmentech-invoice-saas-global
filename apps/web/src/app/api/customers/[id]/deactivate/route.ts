import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSessionToken, nestResponse, proxyNestAuth, readNestJson } from "@/lib/server/nest-auth-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const token = getSessionToken(request);
  if (!token) {
    const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }

  const { id } = await params;
  const nest = await proxyNestAuth(request, `/customers/${encodeURIComponent(id)}/deactivate`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
  });
  return nestResponse(nest.status, await readNestJson(nest));
}
