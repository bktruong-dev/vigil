// Everything on The Vigil, as a small JSON file the search palette loads on demand.
import { items, linkTo, siteOf, KIND_LABEL } from '../lib/feed';

export function GET() {
  const data = items.map(i => ({
    id: i.id, t: i.title, u: linkTo(i), s: i.sourceName, h: siteOf(i), k: KIND_LABEL[i.kind], tone: i.tone, d: i.date,
    tp: [...i.topics, i.place?.name ?? '', i.place?.country ?? ''].join(' '), x: i.summary.slice(0, 160),
  }));
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8' } });
}
