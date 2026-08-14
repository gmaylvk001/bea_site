import fs from "fs";
import path from "path";
import sharp from "sharp";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function getExt(fileName = "", mime = "") {
  const fromName = path.extname(fileName).toLowerCase();
  if (ALLOWED_EXT.has(fromName)) return fromName;
  if (mime.includes("avif")) return ".avif";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("png")) return ".png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  return fromName || ".png";
}

function isAvifOrWebp(ext, mime) {
  return (
    ext === ".avif" ||
    ext === ".webp" ||
    mime.includes("avif") ||
    mime.includes("webp")
  );
}

/**
 * Save home-settings images (JPG/PNG/WebP/AVIF).
 * If Sharp cannot decode AVIF (common libheif limitation), save the original file bytes.
 */
export async function saveHomeSettingImage(file, options = {}) {
  const {
    folder,
    expectedWidth = null,
    expectedHeight = null,
  } = options;

  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("No file uploaded");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mime = String(file.type || "").toLowerCase();
  const safeName = String(file.name || "image").replace(/\s/g, "_");
  const ext = getExt(safeName, mime);

  if (!ALLOWED_EXT.has(ext) && !ALLOWED_MIME.has(mime)) {
    throw new Error(
      "Only JPG, PNG, WebP, and AVIF image files are allowed."
    );
  }

  let metadata = null;
  let canUseSharp = true;

  try {
    metadata = await sharp(buffer, { failOn: "none" }).metadata();
  } catch (err) {
    canUseSharp = false;
    // Sharp/libheif often fails on some AVIF bitstreams — still allow save
    if (!isAvifOrWebp(ext, mime)) {
      throw new Error(
        "Invalid image file. Please upload a valid JPG, PNG, WebP, or AVIF image."
      );
    }
    console.warn(
      `[saveHomeSettingImage] Sharp decode failed for ${safeName}; saving original bytes.`,
      err?.message || err
    );
  }

  if (
    canUseSharp &&
    expectedWidth &&
    expectedHeight &&
    metadata?.width &&
    metadata?.height
  ) {
    if (
      metadata.width !== expectedWidth ||
      metadata.height !== expectedHeight
    ) {
      throw new Error(
        `Image must be exactly ${expectedWidth}x${expectedHeight} pixels. Your image is ${metadata.width}x${metadata.height} pixels.`
      );
    }
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const baseName = (
    path.basename(safeName, path.extname(safeName)) || "image"
  )
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";

  // Always store a real JPEG so browsers display the file instead of downloading
  // it (common on live when AVIF/WebP is served as application/octet-stream).
  if (canUseSharp) {
    const filename = `${Date.now()}-${baseName}.jpg`;
    const filepath = path.join(uploadDir, filename);
    try {
      await sharp(buffer)
        .rotate()
        .toColorspace("srgb")
        .jpeg({ quality: 88, mozjpeg: true })
        .toFile(filepath);
      return `/uploads/${folder}/${filename}`;
    } catch (err) {
      console.warn(
        `[saveHomeSettingImage] JPEG encode failed for ${safeName}; writing original.`,
        err?.message || err
      );
    }
  }

  const filename = `${Date.now()}-${baseName}${ext}`;
  const filepath = path.join(uploadDir, filename);
  await fs.promises.writeFile(filepath, buffer);
  return `/uploads/${folder}/${filename}`;
}
