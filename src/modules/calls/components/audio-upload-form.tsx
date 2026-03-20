"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callDetail } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function AudioUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function uploadWithProgress(fd: FormData) {
    return new Promise<{ callId: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/calls/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText) as { callId?: string; error?: string };
          if (xhr.status >= 200 && xhr.status < 300 && data.callId) {
            resolve({ callId: data.callId });
          } else {
            reject(new Error(data.error ?? `Upload failed (${xhr.status})`));
          }
        } catch {
          reject(new Error("Invalid response"));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(fd);
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose an audio file.");
      return;
    }
    setBusy(true);
    setProgress(0);
    const fd = new FormData();
    fd.set("file", file);
    if (title.trim()) fd.set("title", title.trim());
    try {
      const { callId } = await uploadWithProgress(fd);
      router.push(callDetail(callId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Acme — discovery call"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">Audio file</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
        <p className="text-muted-foreground text-xs">Supported: MP3, WAV, WebM, M4A, OGG — max 50MB.</p>
      </div>

      {progress !== null ? (
        <div className="space-y-1">
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className={cn("bg-primary h-2 rounded-full transition-all")}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs tabular-nums">{progress}%</p>
        </div>
      ) : null}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy}>
        {busy ? "Uploading…" : "Upload & queue analysis"}
      </Button>
    </form>
  );
}
