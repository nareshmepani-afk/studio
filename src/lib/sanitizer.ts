/**
 * Client and server-safe sanitizer that forcefully strips all screenplay, camera, film editing cues,
 * and stage notes from narrative prose to guarantee 100% spoken human story integrity.
 */
export function stripScreenplayCues(text: string): string {
  if (!text) return "";
  let cleaned = text
    // Strip leading camera/scene cut phrases (e.g. "Cut to a frame of ", "Cut to ", "Cut to: ")
    .replace(/^(?:Cut to\s*(?:a\s*frame\s*of|a\s*shot\s*of|a|the)?|Wide shot(?:\s*of|\s*:)?|Close-up(?:\s*on|\s*:)?|Pan to|Zoom in on|Zoom to|Hard freeze on|Fade in(?:\s*:)?|Dissolve to)\s*/i, '')
    // Strip inline camera/lens/stage directives (e.g. "The lens zooms past ", "Cut to ")
    .replace(/\b(?:Cut to\s*(?:a\s*frame\s*of|a\s*shot\s*of|a|the)?|Wide shot(?:\s*of|\s*:)?|Close-up(?:\s*on|\s*:)?|Pan to|Zoom in on|Zoom to|The lens zooms(?:\s*past|\s*in|\s*to)?|Hard freeze on|Fade in(?:\s*:)?|Dissolve to)\s*/gi, '')
    // Strip stage directions in brackets or parentheses (e.g. [Fade in], (pause))
    .replace(/\[(?:Fade in|Fade out|Wide shot|Close up|Cut to|Camera|Interior|Exterior|Dissolve).*?\]/gi, '')
    .replace(/\((?:pause|camera|wide shot|close up|zoom).*?\)/gi, '')
    .trim();

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}
