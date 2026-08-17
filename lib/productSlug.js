const IMAGE_EXT = "jpe?g|png|webp|gif|avif|bmp|svg|jfif|heic|heif";

function earliestImageFilenameStart(text) {
  const markers = [];
  const imageToken = /[-_]image[-_]?\d+/gi;
  const extension = new RegExp(`\\.(?:${IMAGE_EXT})\\b`, "gi");

  let match;
  while ((match = imageToken.exec(text)) !== null) {
    markers.push(match.index);
  }
  while ((match = extension.exec(text)) !== null) {
    markers.push(match.index);
  }

  let cutAt = -1;
  for (const markerIndex of markers) {
    let start = markerIndex;
    while (start > 0 && /[a-z0-9-]/.test(text[start - 1])) {
      start -= 1;
    }
    const prefix = text.slice(start, markerIndex);
    const hyphenCount = (prefix.match(/-/g) || []).length;
    if (hyphenCount >= 2 && start > 0 && (cutAt < 0 || start < cutAt)) {
      cutAt = start;
    }
  }
  return cutAt;
}

/**
 * Keep the product title only. Drop concatenated image filenames such as
 * "...Grindingv-guard-massivo-...-image-3.jpg".
 */
export function productNameWithoutImageFilenames(name) {
  if (name == null) return "";
  let text = String(name);

  const gluedTitle = text.match(
    new RegExp(
      `[A-Z][a-z]+(?=[a-z0-9]+(?:-[a-z0-9]+){2,}(?:-image[-_]?\\d+|\\.(?:${IMAGE_EXT})\\b))`
    )
  );
  if (gluedTitle && gluedTitle.index != null) {
    text = text.slice(0, gluedTitle.index + gluedTitle[0].length);
  } else {
    const cutAt = earliestImageFilenameStart(text);
    if (cutAt > 0) {
      text = text.slice(0, cutAt);
    }
  }

  text = text.replace(/[-_]image[-_]?\d+/gi, "");
  text = text.replace(new RegExp(`\\.(?:${IMAGE_EXT})\\b`, "gi"), "");

  return text.replace(/\s+/g, " ").trim();
}

/** Slug from product name only. Never from image filenames. No max length. */
export function slugFromProductName(name) {
  return productNameWithoutImageFilenames(name)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}
