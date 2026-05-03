import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT!;
const region = process.env.S3_REGION || "ru-1";
const bucket = process.env.S3_BUCKET!;
const prefix = (process.env.S3_PREFIX || "ansara-reels").replace(/^\/+|\/+$/g, "");
const publicBase = (
  process.env.S3_PUBLIC_BASE || `${endpoint}/${bucket}`
).replace(/\/+$/, "");

export const S3_PREFIX = prefix;
export const S3_BUCKET = bucket;
export const S3_PUBLIC_BASE = publicBase;

export const s3 = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

export interface PresignParams {
  key: string;
  contentType: string;
  expiresIn?: number;
}

export async function presignPut({ key, contentType, expiresIn = 60 * 5 }: PresignParams) {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn });
  return { url, publicUrl: publicUrlFor(key) };
}

export function publicUrlFor(key: string) {
  return `${publicBase}/${key}`;
}

export async function deleteObject(key: string) {
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function buildKey(parts: {
  userId: string;
  projectId: string;
  reelId?: string;
  kind: "bg" | "hover" | "main" | "font";
  ext: string;
  id: string;
}): string {
  const segments = [prefix, parts.userId, parts.projectId];
  if (parts.reelId) segments.push(parts.reelId);
  segments.push(`${parts.kind}-${parts.id}.${parts.ext.replace(/^\./, "")}`);
  return segments.join("/");
}
