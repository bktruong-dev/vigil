// Story grouping without any AI model: plain text statistics.
//
// 1. Each story becomes a bag of words and two-word phrases from its headline
//    (weighted ×2) and the start of its summary.
// 2. TF-IDF weighting: words that appear in few stories ("Mythos", "RAISE
//    Act") count a lot; words in every story ("AI", "says") count for nothing.
// 3. Stories are compared by cosine similarity and grouped greedily, newest
//    first, into "developing stories" when they're about the same thing and
//    published within a few days of each other.
// 4. Each group is named by its most distinctive phrases, and every story
//    gets its own key phrases, which drive the filters across the site.
// Re-run every hour, so groups, names and filters follow the news.

export interface Doc { id: string; title: string; summary: string; date: string; source: string; kind: string }
export interface Cluster { id: string; label: string; terms: string[]; items: string[]; sources: number; first: string; last: string; score: number }

const STOP = new Set(`a about above after again against all also am an and any are aren't as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself just let me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your
ai artificial intelligence says said new news report reports update updates week today year years one two first how why what more use using used make makes made get gets via video podcast episode watch read part says could would may might will can just like also here inside latest first best top big real time way ways need needs want wants know think help helps world people thing things lot going really model models system systems company companies data research study paper papers work working approach based towards toward llm llms language large tech technology tool tools build building launch launches new
can't can’t don't don’t won't won’t isn't isn’t doesn't doesn’t introducing introduces announce announces announced exclusive official trailer teaser full breakdown explained explainer problem problems stop keep knowledge thing according around amid among within without behind ahead back still even ever never much many every another always across start starts started end ends ending look looks show shows find finds found take takes took give gives gave come comes came tell tells told say ask asks asked call calls called hd 2025 2026 2027 vs
next previous construction neural network networks latent expert experts researcher researchers result results method methods analysis framework frameworks approach approaches toward evidence paper study studies propose proposes proposed novel task tasks setting settings performance benchmark benchmarks dataset datasets show shows across`.split(/\s+/));

// Very light stemming so "jailbreaks"/"jailbreaking"/"jailbreak" match.
function stem(w: string) {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('es') && /(ch|sh|x|ss)es$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
  return w;
}

// Words with their display form (keeps capitals like "OpenAI", "EU").
function words(text: string) {
  return (text.match(/[A-Za-z][A-Za-z0-9’'.-]*[A-Za-z0-9]|[A-Z]{2,}/g) ?? [])
    .map(raw => raw.replace(/[’']s$/, '').replace(/\.$/, ''))
    .filter(raw => raw.length >= 2)
    .map(raw => ({ raw, key: stem(raw.toLowerCase()) }))
    .filter(w => w.key.length >= 3 || /^[A-Z]{2,}$/.test(w.raw))
    .filter(w => !STOP.has(w.raw.toLowerCase()) && !STOP.has(w.key));
}

function features(d: Doc, display: Map<string, Map<string, number>>) {
  const tf = new Map<string, number>();
  const add = (k: string, w: number, shown: string) => {
    tf.set(k, (tf.get(k) ?? 0) + w);
    const m = display.get(k) ?? new Map<string, number>();
    m.set(shown, (m.get(shown) ?? 0) + 1);
    display.set(k, m);
  };
  for (const [text, w] of [[d.title, 2], [d.summary.slice(0, 220), 1]] as const) {
    const ws = words(text);
    ws.forEach((x, i) => {
      add(x.key, w, x.raw);
      if (i + 1 < ws.length) add(`${x.key} ${ws[i + 1].key}`, w * 1.6, `${x.raw} ${ws[i + 1].raw}`);
    });
  }
  return tf;
}

type Vec = Map<string, number>;
const norm = (v: Vec) => { let s = 0; for (const x of v.values()) s += x * x; s = Math.sqrt(s) || 1; for (const [k, x] of v) v.set(k, x / s); return v; };
const dot = (a: Vec, b: Vec) => { let s = 0; const [p, q] = a.size < b.size ? [a, b] : [b, a]; for (const [k, x] of p) { const y = q.get(k); if (y) s += x * y; } return s; };

export function cluster(docs: Doc[], opts = { threshold: 0.22, windowDays: 6 }) {
  const display = new Map<string, Map<string, number>>();
  const tfs = docs.map(d => features(d, display));
  // Document frequency and inverse document frequency.
  const df = new Map<string, number>();
  for (const tf of tfs) for (const k of tf.keys()) df.set(k, (df.get(k) ?? 0) + 1);
  const N = docs.length;
  const idf = (k: string) => Math.log((N + 1) / ((df.get(k) ?? 0) + 1)) + 0.5;
  // Phrases that appear only once can't link stories, and very common ones are noise.
  const useful = (k: string) => { const n = df.get(k) ?? 0; return n >= 1 && n <= Math.max(6, N * 0.12); };
  const vecs: Vec[] = tfs.map(tf => {
    const v: Vec = new Map();
    for (const [k, x] of tf) if (useful(k)) v.set(k, (1 + Math.log(x)) * idf(k));
    return norm(v);
  });

  const show = (k: string) => [...(display.get(k)?.entries() ?? [])].sort((a, b) => b[1] - a[1])[0]?.[0] ?? k;

  // Key phrases per story: its highest-weighted terms that other stories share.
  const keys = docs.map((_, i) => [...vecs[i].entries()]
    .filter(([k]) => (df.get(k) ?? 0) >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k));

  // Greedy grouping, newest first, against each group's centroid.
  const order = docs.map((d, i) => i).sort((a, b) => docs[b].date.localeCompare(docs[a].date));
  const groups: { members: number[]; centroid: Vec; last: number }[] = [];
  for (const i of order) {
    const t = Date.parse(docs[i].date);
    let best = -1, bestSim = 0;
    groups.forEach((g, gi) => {
      if (Math.abs(g.last - t) > opts.windowDays * 864e5) return;
      const s = dot(vecs[i], g.centroid);
      if (s > bestSim) { bestSim = s; best = gi; }
    });
    if (best >= 0 && bestSim >= opts.threshold) {
      const g = groups[best];
      g.members.push(i);
      g.last = Math.min(g.last, t);
      const c: Vec = new Map();
      for (const m of g.members) for (const [k, x] of vecs[m]) c.set(k, (c.get(k) ?? 0) + x);
      g.centroid = norm(c);
    } else {
      groups.push({ members: [i], centroid: new Map(vecs[i]), last: t });
    }
  }

  const clusters: Cluster[] = [];
  for (const g of groups) {
    if (g.members.length < 2) continue;
    const srcs = new Set(g.members.map(m => docs[m].source));
    // Name: the most distinctive terms shared by at least two members; prefer phrases.
    const share = new Map<string, number>();
    for (const m of g.members) for (const k of new Set(vecs[m].keys())) share.set(k, (share.get(k) ?? 0) + 1);
    const ranked = [...g.centroid.entries()]
      .filter(([k]) => (share.get(k) ?? 0) >= 2)
      .map(([k, x]) => [k, x * (k.includes(' ') ? 1.35 : 1)] as const)
      .sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const terms: string[] = [];
    for (const k of ranked) {
      if (terms.some(t => t.includes(k) || k.includes(t))) continue;
      terms.push(k);
      if (terms.length === 3) break;
    }
    if (!terms.length) continue;
    const dates = g.members.map(m => docs[m].date).sort();
    const ageH = (Date.now() - Date.parse(dates[dates.length - 1])) / 36e5;
    const members = [...g.members].sort((a, b) => docs[b].date.localeCompare(docs[a].date));
    const earliest = g.members.reduce((a, b) => (docs[a].date < docs[b].date ? a : b));
    // Title the group with its most representative headline (closest to the group centre),
    // preferring written reports over videos.
    const rep = [...g.members].sort((a, b) => (dot(vecs[b], g.centroid) + (docs[b].kind === 'video' ? 0 : 0.15)) - (dot(vecs[a], g.centroid) + (docs[a].kind === 'video' ? 0 : 0.15)))[0];
    clusters.push({
      id: docs[earliest].id,
      label: docs[rep].title,
      terms: terms.map(show),
      items: members.map(m => docs[m].id),
      sources: srcs.size,
      first: dates[0], last: dates[dates.length - 1],
      // Bigger, more widely covered and more recent stories rank higher.
      score: +(Math.log2(1 + g.members.length) * (1 + 0.5 * (srcs.size - 1)) * Math.exp(-ageH / 72)).toFixed(4),
    });
  }
  clusters.sort((a, b) => b.score - a.score);

  const clusterOf = new Map<string, string>();
  for (const c of clusters) for (const id of c.items) clusterOf.set(id, c.id);
  return {
    clusters,
    keys: new Map(docs.map((d, i) => [d.id, keys[i].slice(0, 6).map(show)])),
    clusterOf,
  };
}
