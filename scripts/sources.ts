// Every feed Vigil reads. All are public, official feeds (RSS, Atom, the arXiv
// API, YouTube channel feeds) except Anthropic, which has no feed, so we read
// its public sitemap and each post's own metadata.
//
// minScore: how much safety relevance an item needs to be kept.
//   0 = keep everything (the source is about AI safety already)
//   1 = needs at least one safety keyword
//   2 = needs a clear safety signal (general tech news)

// Perspective: who is speaking, so readers can weigh each story.
//   company     an AI company writing about its own work (a stake in the story)
//   journalism  an independent news outlet
//   research    independent researchers or a research forum
//   nonprofit   a safety or policy organisation (has a mission it advocates for)
//   creator     an independent YouTuber, podcaster or newsletter writer
//   database    a public record of incidents
export type Perspective = 'company' | 'journalism' | 'research' | 'nonprofit' | 'creator' | 'database';

export type Kind = 'news' | 'lab' | 'paper' | 'video' | 'podcast' | 'incident' | 'essay';

export interface Source {
  id: string;
  name: string;
  home: string;
  feed: string;
  kind: Kind;
  trust: number; // 0..1, how much weight the source gets in ranking
  minScore: number;
  perspective: Perspective;
  type?: 'rss' | 'arxiv' | 'anthropic';
}

const yt = (id: string) => `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;

export const SOURCES: Source[] = [
  // Labs
  { id: 'anthropic', name: 'Anthropic', home: 'https://www.anthropic.com/news', feed: 'https://www.anthropic.com/sitemap.xml', kind: 'lab', trust: 0.9, minScore: 0, perspective: 'company', type: 'anthropic' },
  { id: 'openai', name: 'OpenAI', home: 'https://openai.com/news', feed: 'https://openai.com/news/rss.xml', kind: 'lab', trust: 0.85, minScore: 1, perspective: 'company' },
  { id: 'deepmind', name: 'Google DeepMind', home: 'https://deepmind.google/blog', feed: 'https://deepmind.google/blog/rss.xml', kind: 'lab', trust: 0.85, minScore: 1, perspective: 'company' },
  { id: 'metr', name: 'METR', home: 'https://metr.org', feed: 'https://metr.org/feed.xml', kind: 'lab', trust: 0.9, minScore: 0, perspective: 'research' },
  { id: 'redwood', name: 'Redwood Research', home: 'https://blog.redwoodresearch.org', feed: 'https://blog.redwoodresearch.org/feed', kind: 'lab', trust: 0.85, minScore: 0, perspective: 'research' },
  { id: 'fli', name: 'Future of Life Institute', home: 'https://futureoflife.org', feed: 'https://futureoflife.org/feed/', kind: 'lab', trust: 0.75, minScore: 0, perspective: 'nonprofit' },

  // Research and essays
  { id: 'arxiv', name: 'arXiv', home: 'https://arxiv.org', feed: 'https://export.arxiv.org/api/query?search_query=%28cat%3Acs.AI+OR+cat%3Acs.LG+OR+cat%3Acs.CL+OR+cat%3Acs.CR%29+AND+%28abs%3A%22AI+safety%22+OR+abs%3Aalignment+OR+abs%3Ajailbreak+OR+abs%3Ainterpretability+OR+abs%3A%22red+teaming%22+OR+abs%3A%22reward+hacking%22%29&sortBy=submittedDate&sortOrder=descending&max_results=150', kind: 'paper', trust: 0.7, minScore: 3, perspective: 'research', type: 'arxiv' },
  { id: 'alignmentforum', name: 'Alignment Forum', home: 'https://www.alignmentforum.org', feed: 'https://www.alignmentforum.org/feed.xml', kind: 'essay', trust: 0.75, minScore: 0, perspective: 'research' },
  { id: 'lesswrong', name: 'LessWrong (curated)', home: 'https://www.lesswrong.com', feed: 'https://www.lesswrong.com/feed.xml?view=curated-rss', kind: 'essay', trust: 0.6, minScore: 1, perspective: 'research' },
  { id: 'cais', name: 'AI Safety Newsletter (CAIS)', home: 'https://newsletter.safe.ai', feed: 'https://newsletter.safe.ai/feed', kind: 'essay', trust: 0.85, minScore: 0, perspective: 'nonprofit' },
  { id: 'importai', name: 'Import AI', home: 'https://importai.substack.com', feed: 'https://importai.substack.com/feed', kind: 'essay', trust: 0.75, minScore: 0, perspective: 'creator' },

  // News
  { id: 'mittr', name: 'MIT Technology Review', home: 'https://www.technologyreview.com', feed: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', kind: 'news', trust: 0.8, minScore: 2, perspective: 'journalism' },
  { id: 'verge', name: 'The Verge', home: 'https://www.theverge.com/ai-artificial-intelligence', feed: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', kind: 'news', trust: 0.65, minScore: 2, perspective: 'journalism' },
  { id: 'ars', name: 'Ars Technica', home: 'https://arstechnica.com/ai/', feed: 'https://arstechnica.com/ai/feed/', kind: 'news', trust: 0.7, minScore: 2, perspective: 'journalism' },

  // Incidents
  { id: 'aiid', name: 'AI Incident Database', home: 'https://incidentdatabase.ai', feed: 'https://incidentdatabase.ai/rss.xml', kind: 'incident', trust: 0.85, minScore: 0, perspective: 'database' },

  // Podcasts
  { id: 'axrp', name: 'AXRP', home: 'https://axrp.net', feed: 'https://axrp.net/feed.xml', kind: 'podcast', trust: 0.85, minScore: 0, perspective: 'creator' },
  { id: '80k', name: '80,000 Hours Podcast', home: 'https://80000hours.org/podcast/', feed: 'https://feeds.transistor.fm/80000-hours-podcast', kind: 'podcast', trust: 0.8, minScore: 0, perspective: 'nonprofit' },
  { id: 'dwarkesh', name: 'Dwarkesh Podcast', home: 'https://www.dwarkesh.com', feed: 'https://www.dwarkesh.com/feed', kind: 'podcast', trust: 0.7, minScore: 1, perspective: 'creator' },

  // YouTube
  { id: 'yt-miles', name: 'Robert Miles AI Safety', home: 'https://www.youtube.com/@RobertMilesAI', feed: yt('UCLB7AzTwc6VFZrBsO2ucBMg'), kind: 'video', trust: 0.9, minScore: 0, perspective: 'creator' },
  { id: 'yt-rational', name: 'Rational Animations', home: 'https://www.youtube.com/@RationalAnimations', feed: yt('UCgqt1RE0k0MIr0LoyJRy2lg'), kind: 'video', trust: 0.75, minScore: 0, perspective: 'creator' },
  { id: 'yt-aiexplained', name: 'AI Explained', home: 'https://www.youtube.com/@aiexplained-official', feed: yt('UCNJ1Ymd5yFuUPtn21xtRbbw'), kind: 'video', trust: 0.7, minScore: 0, perspective: 'creator' },
  { id: 'yt-anthropic', name: 'Anthropic (YouTube)', home: 'https://www.youtube.com/@anthropic-ai', feed: yt('UCrDwWp7EBBv4NwvScIpBDOA'), kind: 'video', trust: 0.85, minScore: 0, perspective: 'company' },
  { id: 'yt-openai', name: 'OpenAI (YouTube)', home: 'https://www.youtube.com/@OpenAI', feed: yt('UCXZCJLdBC09xxGZ6gcdrc6A'), kind: 'video', trust: 0.75, minScore: 1, perspective: 'company' },
  { id: 'yt-deepmind', name: 'Google DeepMind (YouTube)', home: 'https://www.youtube.com/@GoogleDeepMind', feed: yt('UCP7jMXSY2xbc3KCAE0MHQ-A'), kind: 'video', trust: 0.75, minScore: 1, perspective: 'company' },
  { id: 'yt-dwarkesh', name: 'Dwarkesh Patel (YouTube)', home: 'https://www.youtube.com/@DwarkeshPatel', feed: yt('UCXl4i9dYBrFOabk0xGmbkRA'), kind: 'video', trust: 0.7, minScore: 1, perspective: 'creator' },
];
