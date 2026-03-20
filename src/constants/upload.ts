/** Default max upload size (bytes). */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Allowed audio MIME types for call uploads (extend per product needs). */
export const ALLOWED_AUDIO_MIME: readonly string[] = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/ogg",
];
