import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

export async function saveUpload(orgId: string, projectId: string, filename: string, buffer: Buffer) {
  const dir = path.join(STORAGE_ROOT, orgId, projectId);
  await mkdir(dir, { recursive: true });
  const key = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(dir, key);
  await writeFile(filePath, buffer);
  return path.join(orgId, projectId, key);
}

export async function readUpload(relativePath: string) {
  const filePath = path.join(STORAGE_ROOT, relativePath);
  if (!filePath.startsWith(STORAGE_ROOT)) {
    throw new Error("Invalid file path");
  }
  return readFile(filePath);
}

export async function deleteUpload(relativePath: string) {
  const filePath = path.join(STORAGE_ROOT, relativePath);
  if (!filePath.startsWith(STORAGE_ROOT)) {
    throw new Error("Invalid file path");
  }
  await unlink(filePath).catch(() => {});
}
