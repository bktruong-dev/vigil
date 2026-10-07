// Fallback for YouTube channels when the official RSS feed is down (it often
// returns 404/500). Reads the channel's public "Videos" page and pulls the
// video id, title and "3 days ago" text from the page's embedded data.

export interface YtVideo { id: string; title: string; ago: string }

function walk(node: any, out: YtVideo[]) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const n of node) walk(n, out); return; }
  const lv = node.lockupViewModel;
  if (lv?.contentId && lv.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
    const meta = lv.metadata?.lockupMetadataViewModel;
    const title = meta?.title?.content ?? '';
    const parts: string[] = [];
    for (const row of meta?.metadata?.contentMetadataViewModel?.metadataRows ?? [])
      for (const p of row.metadataParts ?? []) if (p.text?.content) parts.push(p.text.content);
    out.push({ id: lv.contentId, title, ago: parts.find(p => /ago$/.test(p)) ?? '' });
    return;
  }
  const vr = node.videoRenderer;
  if (vr?.videoId) {
    out.push({ id: vr.videoId, title: vr.title?.runs?.[0]?.text ?? '', ago: vr.publishedTimeText?.simpleText ?? '' });
    return;
  }
  for (const k in node) walk(node[k], out);
}

export function parseChannelPage(html: string): YtVideo[] {
  const m = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
  if (!m) return [];
  const out: YtVideo[] = [];
  walk(JSON.parse(m[1]), out);
  const seen = new Set<string>();
  return out.filter(v => v.title && !seen.has(v.id) && seen.add(v.id));
}

// "3 days ago" -> an approximate date.
export function agoToDate(ago: string, now = Date.now()) {
  // Both "3 days ago" and the compact "3d ago" / "3mo ago" forms.
  const m = ago.toLowerCase().match(/(\d+)\s*(seconds?|s|minutes?|min|m|hours?|h|days?|d|weeks?|w|months?|mo|years?|y)\s+ago/);
  if (!m) return '';
  const u = m[2];
  const ms = u.startsWith('mo') ? 2592e6 : u.startsWith('mi') || u === 'm' ? 6e4 : u.startsWith('s') ? 1e3
    : u.startsWith('h') ? 36e5 : u.startsWith('d') ? 864e5 : u.startsWith('w') ? 6048e5 : 31536e6;
  return new Date(now - Number(m[1]) * ms).toISOString();
}
