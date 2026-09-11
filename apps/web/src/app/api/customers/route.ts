import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  getSessionToken,
  nestResponse,
  proxyNestAuth,
  readNestJson,
} from "@/lib/server/nest-auth-proxy";

const listQueryKeys = ["search", "isActive", "page", "pageSize"] as const;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = getSessionToken(request);

  if (!token) {
    const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }

  const query = new URLSearchParams();
  for (const key of listQueryKeys) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }
  const path = query.size > 0 ? `/customers?${query.toString()}` : "/customers";
  const nest = await proxyNestAuth(request, path, {
    headers: { authorization: `Bearer ${token}` },
  });

  return nestResponse(nest.status, await readNestJson(nest));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const nest = await proxyNestAuth(request, "/customers", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return nestResponse(nest.status, await readNestJson(nest));
}
