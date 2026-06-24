const LOOP_MARKER = "[segmento repetido descartado]";

function normalizeSpaces(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function repairCommonMojibake(text: string) {
  const markerCount = (text.match(/[\u00c2\u00c3\u00e2]/g) || []).length;
  if (markerCount === 0 || typeof TextDecoder === "undefined") return text;

  try {
    const bytes = Uint8Array.from(Array.from(text), (character) => character.charCodeAt(0));
    const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const repairedMarkerCount = (repaired.match(/[\u00c2\u00c3\u00e2]/g) || []).length;
    return repairedMarkerCount < markerCount ? repaired : text;
  } catch {
    return text;
  }
}

function stripMarkdown(text: string) {
  return repairCommonMojibake(text)
    .replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "- ")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[(x| )\]/gi, "")
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, "");
}

function isExportNoise(text: string) {
  const compact = text.replace(/\s+/g, "");
  if (!compact || /^(?:[-*_])+$/.test(compact)) return true;

  const alphaNumeric = Array.from(compact).filter((character) => /[\p{L}\p{N}]/u.test(character)).length;
  const suspicious = (compact.match(/[&\u00d8\u00ac\ufffd]/g) || []).length;
  return compact.length >= 16 && (
    alphaNumeric / compact.length < 0.45 ||
    (suspicious >= 4 && suspicious / compact.length > 0.08)
  );
}

export function looksLikeRepeatedLoop(text: string) {
  const words = normalizeSpaces(text).toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 24) return false;

  const uniqueRatio = new Set(words).size / words.length;
  if (uniqueRatio < 0.34) return true;

  const grams = new Map<string, number>();
  for (let size = 3; size <= 7; size += 1) {
    grams.clear();
    for (let i = 0; i <= words.length - size; i += 1) {
      const key = words.slice(i, i + size).join(" ");
      const count = (grams.get(key) || 0) + 1;
      if (count >= 4) return true;
      grams.set(key, count);
    }
  }

  return false;
}

function collapseConsecutivePhraseLoops(text: string) {
  const tokens = normalizeSpaces(text).split(/\s+/);
  const output: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    let collapsed = false;

    for (let size = 2; size <= 8; size += 1) {
      if (i + size * 3 > tokens.length) continue;

      const phrase = tokens.slice(i, i + size).join(" ").toLowerCase();
      let repeats = 1;

      while (
        i + size * (repeats + 1) <= tokens.length &&
        tokens.slice(i + size * repeats, i + size * (repeats + 1)).join(" ").toLowerCase() === phrase
      ) {
        repeats += 1;
      }

      if (repeats >= 3) {
        output.push(...tokens.slice(i, i + size), LOOP_MARKER);
        i += size * repeats;
        collapsed = true;
        break;
      }
    }

    if (!collapsed) {
      output.push(tokens[i]);
      i += 1;
    }
  }

  return output.join(" ").replace(new RegExp(`(?:${LOOP_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*){2,}`, "g"), LOOP_MARKER);
}

export function cleanTextForExport(text: string, options: { fallback?: string; maxWords?: number } = {}) {
  const fallback = options.fallback || "(Sin contenido disponible)";
  const paragraphs = stripMarkdown(text || "")
    .split(/\n{2,}|\r?\n/)
    .map((paragraph) => collapseConsecutivePhraseLoops(paragraph))
    .map(normalizeSpaces)
    .filter(Boolean)
    .filter((paragraph) => !isExportNoise(paragraph))
    .filter((paragraph) => !looksLikeRepeatedLoop(paragraph));

  let cleaned = paragraphs.join("\n\n").trim();
  if (!cleaned) cleaned = fallback;

  if (options.maxWords) {
    const words = cleaned.split(/\s+/);
    if (words.length > options.maxWords) {
      cleaned = `${words.slice(0, options.maxWords).join(" ")}\n\n[Texto recortado para mantener el PDF legible.]`;
    }
  }

  return cleaned;
}