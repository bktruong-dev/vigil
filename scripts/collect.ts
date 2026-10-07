// Vigil's collector. Reads every source in sources.ts, keeps the AI safety
// items, ranks them, merges duplicate stories, places them on the map and
// writes src/data/feed.json. Run: npm.cmd run collect
//
// Nothing here costs money: only public feeds, no API keys, no AI calls.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';
import { SOURCES, type Source, type Kind } from './sources.ts';
import { locate, type Place } from './places.ts';
import { parseChannelPage, agoToDate } from './youtube.ts';
import { community } from './community.ts';

const OUT = new URL('../src/data/feed.json', import.meta.url);
const UA = 'VigilBot/0.1 (+https://github.com/bktruong-dev) AI-safety news reader';
const KEEP_DAYS: Record<Kind, number> = { news: 45, lab: 120, paper: 30, video: 120, podcast: 180, incident: 180, essay: 60 };
const PER_SOURCE = 25;

export type Tone = 'risk' | 'good' | 'research' | 'neutral';

export interface Item {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceName: string;
  kind: Kind;
  date: string;
  summary: string;
  thumb?: string;
  relevance: number;
  score: number;
  tone: Tone;
  topics: string[];
  place?: Place;
  also: { sourceName: string; url: string }[];
  via?: string;
  site?: string;
  group?: string;
}

// ---------- Relevance: weighted safety keywords ----------
const SIGNALS: [RegExp, number, string?][] = [
  [/\bAI safety\b/i, 3, 'Safety'], [/\balign(ment|ed)\b/i, 3, 'Alignment'], [/\bmisalign/i, 3, 'Alignment'],
  [/\binterpretab/i, 3, 'Interpretability'], [/\bmechanistic\b/i, 2, 'Interpretability'],
  [/\bjailbreak/i, 3, 'Attacks'], [/\bprompt injection/i, 3, 'Attacks'], [/\bred[- ]?team/i, 3, 'Evaluations'],
  [/\breward hacking\b/i, 3, 'Alignment'], [/\bschem(ing|e to)\b/i, 2, 'Alignment'], [/\bdecepti(on|ve)\b/i, 2, 'Alignment'],
  [/\bsycophan/i, 2, 'Alignment'], [/\bresponsible scaling\b/i, 3, 'Governance'], [/\bfrontier (model|AI)\b/i, 2, 'Governance'],
  [/\bsafeguard/i, 2, 'Safety'], [/\bsafety\b/i, 2, 'Safety'], [/\boversight\b/i, 2, 'Governance'],
  [/\bregulat/i, 2, 'Governance'], [/\bgovernance\b/i, 2, 'Governance'], [/\bAI Act\b/, 2, 'Governance'], [/\blegislat|\bbill\b|\blaw\b/i, 1, 'Governance'],
  [/\bpolicy\b/i, 1, 'Governance'], [/\bexistential\b/i, 2, 'Risk'], [/\bcatastroph/i, 2, 'Risk'], [/\bx-risk\b/i, 3, 'Risk'],
  [/\bsuperintelligen/i, 2, 'Risk'], [/\bAGI\b/, 1, 'Risk'], [/\bbioweapon|\bbiosecurity|\bpathogen/i, 3, 'Risk'],
  [/\bcyber(attack|security)?\b/i, 1, 'Attacks'], [/\bdeepfake/i, 2, 'Misuse'], [/\bmisuse\b/i, 2, 'Misuse'], [/\bscam|\bfraud/i, 1, 'Misuse'],
  [/\bdisinformation|\bmisinformation/i, 2, 'Misuse'], [/\bharm(s|ful)?\b/i, 2, 'Risk'], [/\brisk/i, 1, 'Risk'],
  [/\beval(uation)?s?\b/i, 1, 'Evaluations'], [/\bbenchmark/i, 1, 'Evaluations'], [/\baudit/i, 2, 'Evaluations'],
  [/\badversarial\b/i, 2, 'Attacks'], [/\brobust(ness)?\b/i, 1, 'Safety'], [/\bwatermark/i, 2, 'Safety'], [/\bhallucinat/i, 1, 'Reliability'],
  [/\bbias(ed)?\b/i, 1, 'Fairness'], [/\bprivacy\b/i, 1, 'Privacy'], [/\bsurveillance\b/i, 2, 'Privacy'], [/\bmodel welfare\b/i, 2, 'Alignment'],
  [/\bchain[- ]of[- ]thought\b/i, 1, 'Interpretability'], [/\bcontrol\b/i, 1, 'Alignment'], [/\bchild safety|\bteen/i, 2, 'Safety'],
  [/\bsuicide|\bself-harm|\bmental health/i, 2, 'Safety'], [/\blawsuit|\bsued\b|\bsues\b/i, 2, 'Governance'],
];

function relevance(text: string) {
  let raw = 0; const topics = new Set<string>();
  for (const [re, w, t] of SIGNALS) if (re.test(text)) { raw += w; if (t) topics.add(t); }
  return { raw, rel: Math.min(1, raw / 7), topics: [...topics].slice(0, 3) };
}

// ---------- Tone: risk, good news, research ----------
// Risk words count once each; the headline counts double. "Good news" needs a
// clear positive event (a law passed, funding, a new safeguard) AND no risk
// language in the headline, so a story like "AI could cover up misbehavior"
// is never filed as good news.
const RISK = /\b(incidents?|lawsuits?|sued|sues|jailbr\w*|deepfakes?|scams?|fraud|harms?|harmful|attacks?|exploit\w*|vulnerab\w*|breach\w*|leak\w*|misuse|fake|fabricat\w*|hallucinat\w*|death|died|suicide|arrest\w*|manipulat\w*|malware|bioweapons?|surveillance|danger\w*|misinformation|disinformation|wrongful|hack\w*|abuse|stalk\w*|threat\w*|crash\w*|fined|recall\w*|warn\w*|cover(s|ed)? up|misbehav\w*|decepti\w*|deceiv\w*|schem\w*|sabotag\w*|evad\w*|bypass\w*|steal\w*|stolen|unsafe|fail\w*|lie|lies|lying|cheat\w*|reward hacking|misaligned|misalignment|catastroph\w*|extinction|risks?|concern\w*|worr\w*|alarm\w*|steganograph\w*|covert|exfiltrat\w*|injection|weaponi\w*|blackmail\w*|quits?|resign\w*|fears?|probes?|investigat\w*|crosshairs|protest\w*)\b/gi;
const GOOD = /\b(pass(es|ed)\b.*\b(law|bill|act)|signs?\b.*\b(law|bill|agreement|pledge)|signed into law|new (law|safeguards?|protections?)|safeguards? for|commits? to|pledges?|treaty|fund(s|ing|ed)? (for |new )?.*(safety|research)|grants? (to|for|from|of)\b|wins? grants?|fellowships?|scholarships?|\$\d+\S* (to|for)|breakthrough|protect(s|ing)? (children|teens|users|people)|safety institute|partnership|launch(es|ed)? .*(safety|safeguard|protection)|bans? deepfakes?|crack(s|ing)? down|ruling (for|in favou?r)|hiring|academy|scholars|award(s|ed)?)\b/gi;

function tone(kind: Kind, title: string, summary: string): Tone {
  if (kind === 'incident') return 'risk';
  const count = (re: RegExp, s: string) => (s.match(re) ?? []).length;
  const rTitle = count(RISK, title), r = rTitle * 2 + count(RISK, summary);
  const g = count(GOOD, title) * 2 + count(GOOD, summary);
  if (g >= 2 && rTitle === 0 && g > r) return 'good';
  if (rTitle > 0 || r >= 2) return 'risk';
  if (kind === 'paper' || kind === 'essay') return 'research';
  return 'neutral';
}

// ---------- Fetch helpers ----------
const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', textNodeName: '#text', processEntities: true });

async function get(url: string) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/rss+xml, application/atom+xml, application/xml, text/html;q=0.8' }, signal: AbortSignal.timeout(20000), redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const text = (v: any): string => {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return text(v[0]);
  return text(v['#text'] ?? '');
};

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”' };
function clean(s: string, max = 280) {
  const decode = (x: string) => x.replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (m, e: string) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e] ?? m);
  // Decode first so escaped markup (&lt;style&gt;) is stripped too, then decode once more for text.
  let t = decode(decode(s).replace(/<(style|script|figcaption)\b[\s\S]*?<\/(?:style|script|figcaption)>/gi, ' ').replace(/<[^>]*>/g, ' '))
    .replace(/\(https?:\/\/incidentdatabase\.ai\/cite[^)]*\)/g, '')
    .replace(/The post .* appeared first on .*$/i, '')
    .replace(/\s+/g, ' ').trim();
  if (t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return t;
}

const safeUrl = (u: string) => { try { const x = new URL(u.trim()); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href.replace(/^http:/, 'https:') : ''; } catch { return ''; } };
const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };

// Article images: the picture the publisher offers for link previews.
// We link to it (never copy it), and skip placeholders and tracking pixels.
function goodImage(u?: string) {
  if (!u) return undefined;
  const url = safeUrl(u.replace(/&amp;/g, '&'));
  if (!url || /d_fallback|d41d8cd98f00b204e9800998ecf8427e|pixel|spacer|\.gif(\?|$)|gravatar|feeds\.feedburner/i.test(url)) return undefined;
  return url.replace(/^https:\/\/i\d\.ytimg\.com\//, 'https://i.ytimg.com/');
}

async function ogImage(url: string) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, signal: AbortSignal.timeout(8000), redirect: 'follow' });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('html')) return undefined;
    // Only the <head> is needed.
    const reader = res.body!.getReader();
    let html = '';
    while (html.length < 200_000 && !/<\/head>/i.test(html)) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
    }
    reader.cancel().catch(() => {});
    const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)(?::src)?["'][^>]*content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["']/i);
    return goodImage(m?.[1] ? new URL(m[1], url).href : undefined);
  } catch { return undefined; }
}

interface Raw { title: string; url: string; date: string; summary: string; thumb?: string; group?: string; publisher?: string; site?: string }

function parseFeed(body: string): Raw[] {
  const doc = xml.parse(body);
  const rss = doc.rss?.channel?.item;
  const atom = doc.feed?.entry;
  const list = [rss ?? atom ?? []].flat();
  return list.map((e: any): Raw => {
    const link = rss ? text(e.link) || text(e.guid)
      : [e.link].flat().find((l: any) => !l?.['@rel'] || l['@rel'] === 'alternate')?.['@href'] ?? '';
    const media = e['media:group'];
    const attr = (v: any, k: string) => [v].flat().find((x: any) => x?.[k])?.[k];
    const enclosure = [e.enclosure].flat().find((x: any) => /^image\//.test(x?.['@type'] ?? ''))?.['@url'];
    const inline = (text(e['content:encoded']) || text(e.content) || text(e.description)).match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    const thumb = attr(media?.['media:thumbnail'], '@url') ?? attr(e['media:content'], '@url') ?? attr(e['media:thumbnail'], '@url')
      ?? enclosure ?? attr(e['itunes:image'], '@href') ?? inline;
    const desc = text(e.description);
    return {
      group: desc.match(/incidentdatabase\.ai\/cite\/(\d+)/)?.[1],
      title: clean(text(e.title), 200),
      url: link,
      date: text(e.pubDate) || text(e.published) || text(e.updated) || text(e['dc:date']),
      summary: text(media?.['media:description']) || text(e.description) || text(e.summary) || text(e['content:encoded']) || text(e.content),
      thumb,
      publisher: text(e.source) || undefined,
      site: e.source?.['@url'] || undefined,
    };
  });
}

// YouTube: the channel RSS feed first (with one retry); if YouTube's feed
// service is down, the channel's public Videos page instead.
async function youtube(src: Source): Promise<Raw[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try { return parseFeed(await get(src.feed)); } catch { await new Promise(r => setTimeout(r, 1200)); }
  }
  const res = await fetch(`${src.home}/videos`, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; VigilBot/0.1)', 'accept-language': 'en' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseChannelPage(await res.text()).slice(0, 15).map(v => ({
    title: clean(v.title, 200), url: `https://www.youtube.com/watch?v=${v.id}`, date: agoToDate(v.ago), summary: '',
    thumb: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
  }));
}

// Hacker News search (Algolia's free public API): stories people are discussing.
async function hackerNews(src: Source): Promise<Raw[]> {
  const data = JSON.parse(await get(src.feed));
  return (data.hits ?? []).filter((h: any) => h.url && h.title).map((h: any): Raw => ({
    title: clean(h.title, 200), url: h.url, date: h.created_at, summary: '',
    publisher: (() => { try { return new URL(h.url).hostname.replace(/^www./, ''); } catch { return undefined; } })(),
  }));
}

async function anthropic(src: Source): Promise<Raw[]> {
  const map = await get(src.feed);
  const urls = [...map.matchAll(/<loc>(https:\/\/www\.anthropic\.com\/(?:news|research)\/[^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)]
    .map(m => ({ url: m[1], mod: Date.parse(m[2]) }))
    .sort((a, b) => b.mod - a.mod).slice(0, 30);
  const pages = await Promise.all(urls.map(async ({ url }) => {
    try {
      const html = await get(url);
      const meta = (p: string) => html.match(new RegExp(`<meta[^>]+property="${p}"[^>]+content="([^"]*)"`))?.[1] ?? '';
      return { title: clean(meta('og:title'), 200), url, date: meta('article:published_time'), summary: meta('og:description'), thumb: meta('og:image') } as Raw;
    } catch { return null; }
  }));
  return pages.filter((p): p is Raw => !!p && !!p.date);
}

// ---------- Collect one source ----------
async function collect(src: Source): Promise<{ items: Item[]; ok: boolean; error?: string }> {
  try {
    const raws = src.type === 'anthropic' ? await anthropic(src) : src.type === 'hn' ? await hackerNews(src)
      : src.kind === 'video' ? await youtube(src) : parseFeed(await get(src.feed));
    // Google News: headline ends in " - Publisher" and the description is just links.
    if (src.type === 'gnews') for (const r of raws) {
      if (r.publisher && r.title.endsWith(` - ${r.publisher}`)) r.title = r.title.slice(0, -(r.publisher.length + 3));
      r.summary = '';
    }
    const now = Date.now();
    const items: Item[] = [];
    for (const r of raws) {
      const url = safeUrl(r.url);
      const t = Date.parse(r.date);
      if (!url || !r.title || Number.isNaN(t)) continue;
      const ageDays = (now - t) / 864e5;
      if (ageDays > KEEP_DAYS[src.kind] || ageDays < -2) continue;
      const summary = clean(r.summary).replace(/^Anthropic is an AI safety and research company.*$/, '');
      const { raw, rel, topics } = relevance(`${r.title} ${summary}`);
      if (raw < src.minScore) continue;
      // arXiv uses "alignment" in other fields too (e.g. signal alignment), so papers must be about AI models.
      if (src.kind === 'paper' && !/\b(language models?|LLMs?|AI|agents?|neural|transformers?|reinforcement learning|chatbots?)\b/.test(`${r.title} ${summary}`)) continue;
      const kind = src.kind;
      items.push({
        id: hash(url), title: r.title, url, source: src.id, sourceName: (src.type === 'gnews' || src.type === 'hn') && r.publisher ? r.publisher : src.name, kind,
        site: r.site ? safeUrl(r.site) || undefined : undefined,
        via: src.type === 'gnews' ? 'Google News' : src.type === 'hn' ? 'Hacker News' : undefined,
        date: new Date(t).toISOString(), summary, thumb: goodImage(r.thumb),
        relevance: Math.max(rel, src.minScore === 0 ? 0.5 : 0), score: 0,
        tone: tone(kind, r.title, summary), topics,
        place: kind === 'incident' || kind === 'news' || kind === 'lab' ? locate(r.title, summary, src.name) : undefined,
        also: [], group: r.group ? `aiid-${r.group}` : undefined,
      });
      if (items.length >= PER_SOURCE) break;
    }
    return { items, ok: true };
  } catch (e) {
    return { items: [], ok: false, error: (e as Error).message };
  }
}

// ---------- Ranking ----------
// score = 0.45 relevance + 0.25 source trust + 0.30 freshness (+ coverage bonus)
// freshness halves about every 3 days, so the front page turns over naturally.
function score(it: Item, trust: number) {
  const ageH = (Date.now() - Date.parse(it.date)) / 36e5;
  const fresh = Math.exp(-ageH / 100);
  const coverage = Math.min(0.15, it.also.length * 0.05);
  return +(0.45 * it.relevance + 0.25 * trust + 0.3 * fresh + coverage).toFixed(4);
}

// ---------- Duplicate stories ----------
const STOP = new Set('a an the of to in on for and or is are with by at as from its it this that new how why what ai says after over into about'.split(' '));
const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));
function similar(a: Set<string>, b: Set<string>) {
  let n = 0; for (const w of a) if (b.has(w)) n++;
  return n / Math.max(1, Math.min(a.size, b.size));
}

function merge(items: Item[], trust: Map<string, number>) {
  items.sort((a, b) => (trust.get(b.source)! - trust.get(a.source)!) || Date.parse(b.date) - Date.parse(a.date));
  const out: (Item & { _w: Set<string> })[] = [];
  for (const it of items) {
    if (out.some(o => o.url === it.url)) continue;
    const w = words(it.title);
    const dup = (it.group && out.find(o => o.group === it.group)) || w.size >= 4 && out.find(o => o.kind !== 'paper' && it.kind !== 'paper' && o.source !== it.source && similar(o._w, w) >= 0.7
      && Math.abs(Date.parse(o.date) - Date.parse(it.date)) < 5 * 864e5);
    if (dup) { dup.also.push({ sourceName: it.sourceName, url: it.url }); dup.place ??= it.place; continue; }
    out.push({ ...it, _w: w });
  }
  return out.map(({ _w, ...it }) => it);
}

// ---------- Main ----------
const results = await Promise.all(SOURCES.map(async s => ({ s, ...(await collect(s)) })));

// Keep what we saw last time, so incidents build up on the map between runs.
let previous: Item[] = [];
try { previous = JSON.parse(await readFile(OUT, 'utf8')).items ?? []; } catch {}
const fresh = results.flatMap(r => r.items);
const seen = new Set(fresh.map(i => i.id));
const failed = new Set(results.filter(r => !r.ok).map(r => r.s.id));
const carried = previous.filter(p => !seen.has(p.id) && (Date.now() - Date.parse(p.date)) / 864e5 <= KEEP_DAYS[p.kind]
  && (failed.has(p.source) || p.kind === 'incident'));

const trust = new Map(SOURCES.map(s => [s.id, s.trust]));
const items = merge([...fresh, ...carried].map(i => ({ ...i, also: [] })), trust)
  .map(i => ({ ...i, score: score(i, trust.get(i.source) ?? 0.5) }))
  .sort((a, b) => b.score - a.score);

// Fill in preview images for the top stories that lack one. Results from the
// last run are reused, so each article page is fetched at most once.
const prevImg = new Map<string, string | undefined>();
for (const p of previous) prevImg.set(p.id, p.thumb ?? ((p as any).noImage ? 'none' : undefined));
// Feed images are often tiny thumbnails (e.g. 140px wide), which look
// pixelated on a big card. The article's own share image (og:image) is
// almost always full size (~1200px), so we prefer it for every story.
// YouTube thumbnails are already a good size; arXiv papers have none.
const need = items.filter(i => i.kind !== 'paper' && i.kind !== 'video' && !/news\.google\.com/.test(i.url)).slice(0, 260);
let fetched = 0;
for (let k = 0; k < need.length; k += 14) {
  await Promise.all(need.slice(k, k + 14).map(async it => {
    fetched++;
    const img = await ogImage(it.url);
    if (img) it.thumb = img;
    else if (it.thumb && isTiny(it.thumb)) it.thumb = undefined;
  }));
}
// Video thumbnails: the full HD version (the page falls back to hqdefault if a video has none).
for (const i of items) if (i.thumb && /i\.ytimg\.com\/vi\/[^/]+\/hqdefault/.test(i.thumb)) i.thumb = i.thumb.replace('hqdefault', 'maxresdefault');

function isTiny(u: string) {
  const m = u.match(/[?&](?:w|width|resize)=(\d+)/i) ?? u.match(/[-_/](\d{2,3})x\d{2,3}[._/-]/);
  return !!m && Number(m[1]) < 500;
}

// An image used by several different stories is a site logo, not a story picture.
const imgUses = new Map<string, number>();
for (const i of items) if (i.thumb) imgUses.set(i.thumb, (imgUses.get(i.thumb) ?? 0) + 1);
for (const i of items) if (i.thumb && imgUses.get(i.thumb)! >= 3) i.thumb = undefined;

const sources = SOURCES.map(s => {
  const r = results.find(x => x.s.id === s.id)!;
  return { id: s.id, name: s.name, home: s.home, feed: s.feed, kind: s.kind, trust: s.trust, minScore: s.minScore, perspective: s.perspective, ok: r.ok, error: r.error, count: items.filter(i => i.source === s.id).length };
});

await mkdir(new URL('.', OUT), { recursive: true });
// Community board (reader submissions approved on GitHub). Keep the last good copy if GitHub is unreachable.
const board = await community();
let prevBoard = { posts: [], pending: 0 };
try { prevBoard = JSON.parse(await readFile(OUT, 'utf8')).community ?? prevBoard; } catch {}
const communityOut = board.ok ? { posts: board.posts, pending: board.pending } : prevBoard;

await writeFile(OUT, JSON.stringify({ generated: new Date().toISOString(), sources, items, community: communityOut }, null, 1));
console.log(`community: ${board.ok ? 'ok' : 'FAIL'} · ${communityOut.posts.length} posts · ${communityOut.pending} pending`);

for (const s of sources) console.log(`${s.ok ? 'ok  ' : 'FAIL'} ${String(s.count).padStart(3)}  ${s.name}${s.error ? '  (' + s.error + ')' : ''}`);
console.log(`\n${items.length} items · ${items.filter(i => i.place).length} on the map · ${items.filter(i => i.tone === 'good').length} good news`);
