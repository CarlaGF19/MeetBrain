const LOOP_MARKER = "[segmento repetido descartado]";

function normalizeSpaces(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function stripMarkdown(text: string) {
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[(x| )\]/gi, "[$1]");
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
  const withoutMarkdown = stripMarkdown(text || "");
  const paragraphs = withoutMarkdown
    .split(/\n{2,}|\r?\n/)
    .map((paragraph) => collapseConsecutivePhraseLoops(paragraph))
    .map(normalizeSpaces)
    .filter(Boolean)
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
