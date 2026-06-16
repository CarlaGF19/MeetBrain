export interface TranscriptSegment {
  label: string;
  timestamp: string;
  text: string;
}

export const parseDurationToSeconds = (duration?: string | number): number => {
  if (typeof duration === "number" && Number.isFinite(duration)) return Math.max(0, Math.floor(duration));
  if (!duration) return 0;

  const parts = String(duration)
    .trim()
    .split(":")
    .map((part) => Number.parseInt(part, 10));

  if (parts.some((part) => Number.isNaN(part))) return 0;
  if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  if (parts.length === 2) return (parts[0] * 60) + parts[1];
  return parts[0] || 0;
};

export const formatSegmentTimestamp = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const cleanTranscriptForAcademicPdf = (text: string): string => (
  (text || "")
    .replace(/\[(?:m[uú]sica|music|audio|sonido|silencio)\]/gi, "")
    .replace(/[♪♫]+/g, "")
    .replace(/\b(?:speaker\s*\d+|profesor|estudiante|alumno|alumna|docente)\s*:\s*/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
);

const normalizeTimestamp = (value: string): string => {
  const seconds = parseDurationToSeconds(value);
  return formatSegmentTimestamp(seconds);
};

const stripLeadingSpeakerLabel = (text: string): string => (
  text
    .replace(/^\s*(?:speaker\s*\d+|profesor|estudiante|alumno|alumna|docente)\s*:\s*/i, "")
    .trim()
);

export const buildAcademicTranscriptSegments = (
  transcript: string,
  duration?: string | number,
  wordsPerSegment = 130,
): TranscriptSegment[] => {
  const cleaned = cleanTranscriptForAcademicPdf(transcript);
  if (!cleaned) {
    return [{ label: "Segmento 1", timestamp: "00:00", text: "(Sin transcripcion disponible)" }];
  }

  const timestampRegex = /(?:^|\s|\n)\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*/g;
  const matches = Array.from(cleaned.matchAll(timestampRegex));

  if (matches.length > 0) {
    const segments = matches
      .map((match, index) => {
        const start = (match.index || 0) + match[0].length;
        const end = index + 1 < matches.length ? (matches[index + 1].index || cleaned.length) : cleaned.length;
        const text = stripLeadingSpeakerLabel(cleaned.slice(start, end));
        return {
          label: `Segmento ${index + 1}`,
          timestamp: normalizeTimestamp(match[1]),
          text,
        };
      })
      .filter((segment) => segment.text.length > 0);

    if (segments.length > 0) return segments;
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  const totalSeconds = parseDurationToSeconds(duration);
  const segments: TranscriptSegment[] = [];

  for (let start = 0; start < words.length; start += wordsPerSegment) {
    const chunk = words.slice(start, start + wordsPerSegment).join(" ");
    const progress = words.length > 0 ? start / words.length : 0;
    const timestamp = formatSegmentTimestamp(totalSeconds > 0 ? totalSeconds * progress : segments.length * 90);

    segments.push({
      label: `Segmento ${segments.length + 1}`,
      timestamp,
      text: chunk,
    });
  }

  return segments;
};
