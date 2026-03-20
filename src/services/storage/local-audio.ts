import { existsSync } from "fs";
import { mkdir, writeFile, readFile, access } from "fs/promises";
import path from "path";
import { env } from "@/lib/env";

/**
 * Find repo root by walking up from cwd until `prisma/schema.prisma` exists.
 * Helps when the shell cwd is a parent folder; run worker from the app root when possible.
 */
function resolveProjectRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 14; i++) {
    if (existsSync(path.join(dir, "prisma", "schema.prisma"))) {
      return dir;
    }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return process.cwd();
}

function uploadRoot(): string {
  return path.join(resolveProjectRoot(), env.UPLOAD_DIR);
}

export function resolveAudioPath(storageKey: string): string {
  return path.join(uploadRoot(), ...storageKey.split("/").filter(Boolean));
}

export async function saveAudioFile(storageKey: string, data: Buffer): Promise<void> {
  const full = resolveAudioPath(storageKey);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

export async function readAudioFile(storageKey: string): Promise<Buffer> {
  const full = resolveAudioPath(storageKey);
  await access(full);
  return readFile(full);
}
