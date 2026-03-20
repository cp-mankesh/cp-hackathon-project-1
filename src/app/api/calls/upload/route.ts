import { randomUUID } from "crypto";
import path from "path";
import { NextResponse } from "next/server";
import { AnalysisJobStatus, CallProcessingStatus } from "@prisma/client";
import { ALLOWED_AUDIO_MIME, MAX_UPLOAD_BYTES } from "@/constants/upload";
import { logAnalysisEvent } from "@/lib/logger";
import { getSessionUser } from "@/lib/auth/session";
import { userCan } from "@/lib/permissions/user-can";
import { prisma } from "@/lib/prisma";
import { saveAudioFile } from "@/services/storage/local-audio";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userCan(user, "calls", "c")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const titleRaw = formData.get("title");
  const title = typeof titleRaw === "string" && titleRaw.trim() ? titleRaw.trim().slice(0, 200) : null;

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (buf.length > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_AUDIO_MIME.includes(mime)) {
    return NextResponse.json(
      { error: `Unsupported type: ${mime}. Use a supported audio format.` },
      { status: 415 },
    );
  }

  const callId = randomUUID();
  const ext = path.extname(file.name) || ".bin";
  const storageKey = `${user.organisationId}/${callId}${ext}`;

  await saveAudioFile(storageKey, buf);

  const call = await prisma.$transaction(async (tx) => {
    const c = await tx.call.create({
      data: {
        id: callId,
        organisationId: user.organisationId,
        uploadedById: user.id,
        title,
        originalFileName: file.name,
        audioStorageKey: storageKey,
        mimeType: mime,
        sizeBytes: buf.length,
        status: CallProcessingStatus.QUEUED,
      },
    });

    await tx.analysisJob.create({
      data: {
        callId: c.id,
        status: AnalysisJobStatus.QUEUED,
      },
    });

    return c;
  });

  await logAnalysisEvent({
    level: "info",
    message: "call_uploaded",
    organisationId: user.organisationId,
    userId: user.id,
    callId: call.id,
  });

  return NextResponse.json({ callId: call.id });
}
