import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { userCan } from "@/lib/permissions/user-can";
import { prisma } from "@/lib/prisma";
import { readAudioFile } from "@/services/storage/local-audio";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ callId: string }> };

function parseRangeHeader(rangeHeader: string, total: number): { start: number; end: number } | null {
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!m) return null;
  const [, rawStart, rawEnd] = m;

  if (!rawStart && !rawEnd) return null;

  if (!rawStart && rawEnd) {
    const suffixLen = Number(rawEnd);
    if (!Number.isFinite(suffixLen) || suffixLen <= 0) return null;
    const length = Math.min(suffixLen, total);
    return { start: total - length, end: total - 1 };
  }

  const start = Number(rawStart);
  let end = rawEnd ? Number(rawEnd) : total - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 0 || end < 0 || start > end) return null;
  if (start >= total) return null;
  end = Math.min(end, total - 1);
  return { start, end };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { callId } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userCan(user, "calls", "r")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const call = await prisma.call.findFirst({
    where: { id: callId, organisationId: user.organisationId },
  });

  if (!call) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readAudioFile(call.audioStorageKey);
    const total = buffer.length;
    const baseHeaders = {
      "Content-Type": call.mimeType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    };

    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      const range = parseRangeHeader(rangeHeader, total);
      if (!range) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes */${total}`,
          },
        });
      }
      const { start, end } = range;
      const chunk = buffer.subarray(start, end + 1);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${start}-${end}/${total}`,
        },
      });
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": String(total),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not available" }, { status: 404 });
  }
}
