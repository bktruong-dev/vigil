// The Vigil's own RSS feed: the top-ranked stories, each linking to its source.
import { items, generated, siteOf, KIND_LABEL } from '../lib/feed';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET({ site }: { site?: URL }) {
  const base = site?.href ?? 'https://vigil.vercel.app/';
  const top = items.filter(i => i.kind !== 'video').slice(0, 60);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>The Vigil — A daily watch on AI safety</title>
  <link>${esc(base)}</link>
  <atom:link href="${esc(new URL('rss.xml', base).href)}" rel="self" type="application/rss+xml" />
  <description>AI safety news, research and incidents, ranked hourly. Every story links to its original source. Kept by Benjamin Truong.</description>
  <language>en</language>
  <lastBuildDate>${generated.toUTCString()}</lastBuildDate>
${top.map(i => `  <item>
    <title>${esc(i.title)}</title>
    <link>${esc(i.url)}</link>
    <guid isPermaLink="false">vigil-${i.id}</guid>
    <pubDate>${new Date(i.date).toUTCString()}</pubDate>
    <source url="${esc(i.site ?? i.url)}">${esc(i.sourceName)}</source>
    <category>${esc(KIND_LABEL[i.kind])}</category>
    <description>${esc(`${i.summary ? i.summary + ' ' : ''}(${i.sourceName} · ${siteOf(i)})`)}</description>
  </item>`).join('\n')}
</channel>
</rss>`;
  return new Response(body, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
}
