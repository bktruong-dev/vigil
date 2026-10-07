import data from '../data/feed.json';

export type Kind = 'news' | 'lab' | 'paper' | 'video' | 'podcast' | 'incident' | 'essay';
export type Tone = 'risk' | 'good' | 'research' | 'neutral';
export type Perspective = 'company' | 'journalism' | 'research' | 'nonprofit' | 'creator' | 'database';
export interface Place { name: string; country: string; lon: number; lat: number }
export interface Item {
  id: string; title: string; url: string; source: string; sourceName: string; kind: Kind;
  date: string; summary: string; thumb?: string; relevance: number; score: number; tone: Tone;
  topics: string[]; place?: Place; site?: string; via?: string; also: { sourceName: string; url: string }[];
}
export interface SourceInfo {
  id: string; name: string; home: string; feed: string; kind: Kind; trust: number; minScore: number;
  perspective: Perspective; ok: boolean; error?: string; count: number;
}

export const generated = new Date(data.generated);
export const items = (data.items as Item[]).filter(i => i.kind !== 'podcast');
export const sources = (data.sources as SourceInfo[]).filter(s => s.kind !== 'podcast');
const bySource = new Map(sources.map(s => [s.id, s]));
export const perspectiveOf = (i: Item): Perspective => bySource.get(i.source)?.perspective ?? 'journalism';

export const KIND_LABEL: Record<Kind, string> = {
  news: 'News', lab: 'Lab', paper: 'Paper', video: 'Video', podcast: 'Podcast', incident: 'Incident', essay: 'Essay',
};
export const TONE_LABEL: Record<Tone, string> = { risk: 'Risk', good: 'Good news', research: 'Research', neutral: 'Update' };

// "A measure of bias": who is speaking. Shown on every story and as a mix per page.
export const PERSPECTIVES: Record<Perspective, { label: string; note: string }> = {
  company: { label: 'Company', note: 'An AI company writing about its own work. It has a stake in the story.' },
  journalism: { label: 'Journalism', note: 'An independent news outlet reporting on others.' },
  research: { label: 'Research', note: 'Independent researchers, a preprint or a research forum. Often not yet peer-reviewed.' },
  nonprofit: { label: 'Non-profit', note: 'A safety or policy organisation. It advocates for its mission.' },
  creator: { label: 'Creator', note: 'An independent YouTuber, podcaster or newsletter writer. Personal views.' },
  database: { label: 'Record', note: 'A public database of reported incidents, linking to the original reporting.' },
};
export const PERSPECTIVE_ORDER: Perspective[] = ['journalism', 'research', 'nonprofit', 'creator', 'company', 'database'];

export const host = (url: string) => new URL(url).hostname.replace(/^www\./, '');
// The publisher's own site, even when the link goes through Google News.
export const siteOf = (i: Item) => host(i.site ?? i.url);

// Links that highlight what you read here on the original page (text fragments).
// Supported in Chrome, Edge and Safari; other browsers just open the page.
const enc = (s: string) => encodeURIComponent(s).replace(/-/g, '%2D').replace(/,/g, '%2C').replace(/&/g, '%26');
export function linkTo(i: Item) {
  if (i.kind === 'video' || i.kind === 'podcast' || /youtube\.com|youtu\.be|news\.google\.com/.test(i.url)) return i.url;
  const parts = [i.title.replace(/[“”"]/g, '').trim()];
  const words = i.summary.replace(/…$/, '').split(/\s+/).filter(Boolean);
  if (words.length >= 6) parts.push(words.slice(0, 8).join(' ').replace(/[“”"]/g, ''));
  const frag = ':~:' + parts.map(p => `text=${enc(p)}`).join('&');
  return i.url.includes('#') ? `${i.url}${frag}` : `${i.url}#${frag}`;
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function ago(iso: string) {
  const h = (generated.getTime() - Date.parse(iso)) / 36e5;
  if (h < 1) return 'Just now';
  if (h < 24) return `${Math.round(h)}h ago`;
  const d = Math.round(h / 24);
  return d < 8 ? `${d}d ago` : fmtDate(iso);
}

export const readMins = (i: Item) => (i.kind === 'video' || i.kind === 'podcast' ? null : Math.max(2, Math.round(i.summary.length / 60)));

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// The first edition. Each day after adds one.
const FIRST = Date.UTC(2026, 9, 6);
export const edition = Math.max(1, Math.floor((generated.getTime() - FIRST) / 864e5) + 1);

export const by = (pred: (i: Item) => boolean, n = Infinity) => items.filter(pred).slice(0, n);
export const newest = (list: Item[]) => [...list].sort((a, b) => b.date.localeCompare(a.date));
const DAY = 864e5;
export const within = (i: Item, days: number) => generated.getTime() - Date.parse(i.date) <= days * DAY;

// ---------- Sections (each has its own page) ----------
export interface Section { slug: string; num: string; title: string; dek: string; match: (i: Item) => boolean; sort?: 'score' | 'date' }
export const SECTIONS: Section[] = [
  { slug: 'latest', num: 'I', title: 'Latest', dek: 'Everything new from labs, newsrooms, researchers and the incident record, ranked.', match: i => i.kind !== 'video' && i.kind !== 'podcast' },
  { slug: 'research', num: 'II', title: 'Research', dek: 'New papers and long-form essays on alignment, interpretability, evaluations and attacks.', match: i => i.kind === 'paper' || i.kind === 'essay', sort: 'date' },
  { slug: 'watch', num: 'III', title: 'Watch', dek: 'Explainers, interviews and talks from YouTube. Press play to watch right here, or open it on youtube.com.', match: i => i.kind === 'video', sort: 'date' },
  { slug: 'incidents', num: 'IV', title: 'Incidents', dek: 'Real-world harms and failures involving AI, from the AI Incident Database and the press.', match: i => i.kind === 'incident' || (i.tone === 'risk' && i.kind === 'news'), sort: 'date' },
  { slug: 'good-news', num: 'V', title: 'Good News', dek: 'Progress worth knowing about: new safeguards, laws, research funding and commitments.', match: i => i.tone === 'good' },
];
export const sectionItems = (s: Section) => {
  const list = items.filter(s.match);
  return s.sort === 'date' ? newest(list) : list;
};

// ---------- Topics: hand-written briefs + live headlines ----------
export interface Topic { slug: string; name: string; keys: string[]; brief: string; why: string }
export const TOPICS: Topic[] = [
  { slug: 'alignment', name: 'Alignment', keys: ['Alignment'],
    brief: 'Alignment is the work of making AI systems pursue the goals their designers actually intend, and keep doing so as they become more capable.',
    why: 'Recent research looks at failures like reward hacking, sycophancy and models that behave differently when they think they are being tested.' },
  { slug: 'interpretability', name: 'Interpretability', keys: ['Interpretability'],
    brief: 'Interpretability tries to understand what is happening inside a neural network: which features it represents and how it reaches an answer.',
    why: 'If we can read a model’s internal reasoning, we can catch deception or hidden goals that its outputs alone would not reveal.' },
  { slug: 'attacks', name: 'Attacks & jailbreaks', keys: ['Attacks'],
    brief: 'Jailbreaks, prompt injection and adversarial inputs trick AI systems into ignoring their safeguards or leaking data.',
    why: 'As AI agents get access to email, code and the web, a single malicious instruction hidden in a page can turn into a real security breach.' },
  { slug: 'evaluations', name: 'Evaluations', keys: ['Evaluations'],
    brief: 'Evaluations and red-teaming test what a model can do, especially dangerous capabilities, before and after it is released.',
    why: 'Good tests are how labs, governments and the public decide whether a model is safe enough to deploy.' },
  { slug: 'governance', name: 'Governance & policy', keys: ['Governance'],
    brief: 'Laws, standards, lawsuits and company policies that shape how AI is built and used, from the EU AI Act to state bills in the US.',
    why: 'Rules decide who is responsible when AI causes harm, and what testing frontier systems must pass.' },
  { slug: 'misuse', name: 'Misuse', keys: ['Misuse'],
    brief: 'People using AI to cause harm on purpose: deepfakes, scams, disinformation and help with weapons or cyberattacks.',
    why: 'Misuse is already happening at scale, which makes it one of the most concrete AI safety problems today.' },
  { slug: 'risk', name: 'Catastrophic risk', keys: ['Risk'],
    brief: 'Concern that advanced AI could cause large-scale harm, through accidents, misuse or systems acting against human interests.',
    why: 'Many leading researchers think the chance is serious enough to prepare for now, while others disagree; the debate shapes policy.' },
  { slug: 'safety', name: 'Everyday safety', keys: ['Safety', 'Reliability', 'Privacy', 'Fairness'],
    brief: 'The safety of AI people use every day: protecting teens, mental health, privacy, fairness and systems that make things up.',
    why: 'These harms affect millions of users now and are where most new laws and lawsuits begin.' },
];
export const topicItems = (t: Topic) => items.filter(i => i.topics.some(k => t.keys.includes(k)));

export function perspectiveMix(list: Item[]) {
  const counts = Object.fromEntries(PERSPECTIVE_ORDER.map(p => [p, 0])) as Record<Perspective, number>;
  for (const i of list) counts[perspectiveOf(i)]++;
  const total = list.length || 1;
  return PERSPECTIVE_ORDER.map(p => ({ p, n: counts[p], pct: Math.round((counts[p] / total) * 100) })).filter(x => x.n > 0);
}
