/** Interpret one question followed by at least two newline-separated answers. */
export function interpretQuestionPaste(text: string) {
  const lines = text.split(/\r\n|\r|\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 3) return undefined;
  return { prompt: lines[0], answers: lines.slice(1) };
}
