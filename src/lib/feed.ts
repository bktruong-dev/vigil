import data from '../data/feed.json';

export type Kind = 'news' | 'lab' | 'paper' | 'video' | 'podcast' | 'incident' | 'essay';
export type Tone = 'risk' | 'good' | 'research' | 'neutral';
export interface Place { name: string; country: string; lon: number; lat: number }
export interface Item {
  id: string; title: string; url: string; source: string; sourceName: string; kind: Kind;
  date: string; summary: string; thumb?: string; relevance: number; score: number; tone: Tone;
  topics: string[]; place?: Place; also: { sourceName: string; url: string }[];
}
export interface SourceInfo {
  id: string; name: string; home: string; feed: string; kind: Kind; trust: number; minScore: number;
  ok: boolean; error?: string; count: number;
}

export const generated = new Date(data.generated);
export const items = data.items as Item[];
export const sources = data.sources as SourceInfo[];

export const KIND_LABEL: Record<Kind, string> = {
  news: 'News', lab: 'Lab', paper: 'Paper', video: 'Video', podcast: 'Podcast', incident: 'Incident', essay: 'Essay',
};
export const TONE_LABEL: Record<Tone, string> = { risk: 'Risk', good: 'Good news', research: 'Research', neutral: 'Update' };

export const host = (url: string) => new URL(url).hostname.replace(/^www\./, '');

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// The first edition. Each day after adds one.
const FIRST = Date.UTC(2026, 9, 6);
export const edition = Math.max(1, Math.floor((generated.getTime() - FIRST) / 864e5) + 1);

export const by = (pred: (i: Item) => boolean, n = Infinity) => items.filter(pred).slice(0, n);
