const CITATION_PATTERN = /\[(\d{1,4})\](?!\()/g;

export function sourceForCitation(sources, citationIndex) {
  if (!Array.isArray(sources)) return null;
  return sources.find((source, position) => {
    if (!source || typeof source === "string") return position + 1 === citationIndex;
    return Number(source.citation_id ?? source.index ?? position + 1) === citationIndex;
  }) || null;
}

export function linkifyInlineCitations(markdown, sources) {
  if (!markdown || !Array.isArray(sources) || !sources.length) return markdown || "";
  // Odd segments are fenced/inline code and must remain byte-for-byte unchanged.
  return String(markdown)
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((segment, segmentIndex) => {
      if (segmentIndex % 2 === 1) return segment;
      return segment.replace(CITATION_PATTERN, (match, rawIndex) => {
        const index = Number(rawIndex);
        return sourceForCitation(sources, index) ? `[${index}](#source-${index})` : match;
      });
    })
    .join("");
}
