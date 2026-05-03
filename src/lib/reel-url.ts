import { S3_PUBLIC_BASE } from "./s3";

export function urlForKey(key?: string | null): string | null {
  if (!key) return null;
  return `${S3_PUBLIC_BASE}/${key}`;
}
