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
  type?: 'rss' | 'arxiv' | 'anthropic' | 'gnews' | 'hn';
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

  // YouTube
  { id: 'yt-miles', name: 'Robert Miles AI Safety', home: 'https://www.youtube.com/@RobertMilesAI', feed: yt('UCLB7AzTwc6VFZrBsO2ucBMg'), kind: 'video', trust: 0.9, minScore: 0, perspective: 'creator' },
  { id: 'yt-rational', name: 'Rational Animations', home: 'https://www.youtube.com/@RationalAnimations', feed: yt('UCgqt1RE0k0MIr0LoyJRy2lg'), kind: 'video', trust: 0.75, minScore: 0, perspective: 'creator' },
  { id: 'yt-aiexplained', name: 'AI Explained', home: 'https://www.youtube.com/@aiexplained-official', feed: yt('UCNJ1Ymd5yFuUPtn21xtRbbw'), kind: 'video', trust: 0.7, minScore: 0, perspective: 'creator' },
  { id: 'yt-anthropic', name: 'Anthropic (YouTube)', home: 'https://www.youtube.com/@anthropic-ai', feed: yt('UCrDwWp7EBBv4NwvScIpBDOA'), kind: 'video', trust: 0.85, minScore: 0, perspective: 'company' },
  { id: 'yt-openai', name: 'OpenAI (YouTube)', home: 'https://www.youtube.com/@OpenAI', feed: yt('UCXZCJLdBC09xxGZ6gcdrc6A'), kind: 'video', trust: 0.75, minScore: 1, perspective: 'company' },
  { id: 'yt-deepmind', name: 'Google DeepMind (YouTube)', home: 'https://www.youtube.com/@GoogleDeepMind', feed: yt('UCP7jMXSY2xbc3KCAE0MHQ-A'), kind: 'video', trust: 0.75, minScore: 1, perspective: 'company' },
  { id: 'yt-dwarkesh', name: 'Dwarkesh Patel (YouTube)', home: 'https://www.youtube.com/@DwarkeshPatel', feed: yt('UCXl4i9dYBrFOabk0xGmbkRA'), kind: 'video', trust: 0.7, minScore: 1, perspective: 'creator' },
  { id: 'yt-species', name: 'Species | Documenting AGI', home: 'https://www.youtube.com/@AISpecies', feed: yt('UCEENWVBdvDy-QWfuQoXC9HQ'), kind: 'video', trust: 0.8, minScore: 0, perspective: 'creator' },
  { id: 'yt-fli', name: 'Future of Life Institute (YouTube)', home: 'https://www.youtube.com/@futureoflifeinstitute', feed: yt('UC-rCCy3FQ-GItDimSR9lhzw'), kind: 'video', trust: 0.75, minScore: 0, perspective: 'nonprofit' },
  { id: 'yt-80k', name: '80,000 Hours (YouTube)', home: 'https://www.youtube.com/@eightythousandhours', feed: yt('UCafjal1QYJ3rb0Y9xZk1Ezg'), kind: 'video', trust: 0.75, minScore: 1, perspective: 'nonprofit' },
  { id: 'yt-cais', name: 'Center for AI Safety (YouTube)', home: 'https://www.youtube.com/@CenterforAISafety', feed: yt('UCY_K5gXsXHtuiP8mj3BiWxA'), kind: 'video', trust: 0.8, minScore: 0, perspective: 'nonprofit' },
  { id: 'yt-far', name: 'FAR.AI (YouTube)', home: 'https://www.youtube.com/@FARAIResearch', feed: yt('UCCV6kbjBZje3LPxRp0NHfxg'), kind: 'video', trust: 0.8, minScore: 0, perspective: 'research' },
  { id: 'yt-insideview', name: 'The Inside View', home: 'https://www.youtube.com/@TheInsideView', feed: yt('UCb9F9_uV24PGj6x63PhXEVw'), kind: 'video', trust: 0.7, minScore: 0, perspective: 'creator' },
  { id: 'yt-doom', name: 'Doom Debates', home: 'https://www.youtube.com/@DoomDebates', feed: yt('UCote8RH_wwSLza2Qb0GAQJw'), kind: 'video', trust: 0.6, minScore: 0, perspective: 'creator' },
  { id: 'yt-siliconversations', name: 'Siliconversations', home: 'https://www.youtube.com/@Siliconversations', feed: yt('UCaItA_xyCNvDSf-DLkzClRg'), kind: 'video', trust: 0.65, minScore: 0, perspective: 'creator' },
  { id: 'yt-cogrev', name: 'Cognitive Revolution', home: 'https://www.youtube.com/@CognitiveRevolutionPodcast', feed: yt('UCjNRVMBVI30Sak_p6HRWhIA'), kind: 'video', trust: 0.65, minScore: 1, perspective: 'creator' },
  { id: 'yt-mlst', name: 'Machine Learning Street Talk', home: 'https://www.youtube.com/@MachineLearningStreetTalk', feed: yt('UCMLtBahI5DMrt0NPvDSoIRQ'), kind: 'video', trust: 0.6, minScore: 2, perspective: 'creator' },
  { id: 'yt-computerphile', name: 'Computerphile', home: 'https://www.youtube.com/@Computerphile', feed: yt('UC9-y-6csu5WGm29I7JiwpnA'), kind: 'video', trust: 0.65, minScore: 2, perspective: 'creator' },
  { id: 'yt-2mp', name: 'Two Minute Papers', home: 'https://www.youtube.com/@TwoMinutePapers', feed: yt('UCbfYPyITQ-7l4upoX8nvctg'), kind: 'video', trust: 0.55, minScore: 2, perspective: 'creator' },
  { id: 'yt-lex', name: 'Lex Fridman', home: 'https://www.youtube.com/@lexfridman', feed: yt('UCSHZKyawb77ixDdsGog4iWA'), kind: 'video', trust: 0.55, minScore: 2, perspective: 'creator' },

  // More newsrooms (general tech outlets must show a clear safety signal)
  { id: 'wired', name: 'WIRED', home: 'https://www.wired.com/tag/ai/', feed: 'https://www.wired.com/feed/tag/ai/latest/rss', kind: 'news', trust: 0.75, minScore: 2, perspective: 'journalism' },
  { id: 'guardian', name: 'The Guardian', home: 'https://www.theguardian.com/technology/artificialintelligenceai', feed: 'https://www.theguardian.com/technology/artificialintelligenceai/rss', kind: 'news', trust: 0.8, minScore: 2, perspective: 'journalism' },
  { id: 'techcrunch', name: 'TechCrunch', home: 'https://techcrunch.com/category/artificial-intelligence/', feed: 'https://techcrunch.com/category/artificial-intelligence/feed/', kind: 'news', trust: 0.65, minScore: 2, perspective: 'journalism' },
  { id: 'register', name: 'The Register', home: 'https://www.theregister.com/software/ai_ml/', feed: 'https://www.theregister.com/software/ai_ml/headlines.atom', kind: 'news', trust: 0.65, minScore: 2, perspective: 'journalism' },
  { id: 'ieee', name: 'IEEE Spectrum', home: 'https://spectrum.ieee.org/topic/artificial-intelligence/', feed: 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss', kind: 'news', trust: 0.75, minScore: 2, perspective: 'journalism' },
  { id: '404media', name: '404 Media', home: 'https://www.404media.co', feed: 'https://www.404media.co/rss/', kind: 'news', trust: 0.7, minScore: 2, perspective: 'journalism' },
  { id: 'bbc', name: 'BBC News', home: 'https://www.bbc.com/news/technology', feed: 'https://feeds.bbci.co.uk/news/technology/rss.xml', kind: 'news', trust: 0.8, minScore: 2, perspective: 'journalism' },
  { id: 'axios', name: 'Axios', home: 'https://www.axios.com/technology', feed: 'https://www.axios.com/feeds/feed.rss', kind: 'news', trust: 0.7, minScore: 3, perspective: 'journalism' },
  { id: 'semafor', name: 'Semafor', home: 'https://www.semafor.com/vertical/tech', feed: 'https://www.semafor.com/rss.xml', kind: 'news', trust: 0.7, minScore: 3, perspective: 'journalism' },
  { id: 'nature', name: 'Nature', home: 'https://www.nature.com/subjects/machine-learning', feed: 'https://www.nature.com/subjects/machine-learning.rss', kind: 'paper', trust: 0.9, minScore: 2, perspective: 'research' },
  { id: 'transformer', name: 'Transformer', home: 'https://www.transformernews.ai', feed: 'https://www.transformernews.ai/feed', kind: 'essay', trust: 0.8, minScore: 0, perspective: 'journalism' },
  { id: 'understandingai', name: 'Understanding AI', home: 'https://www.understandingai.org', feed: 'https://www.understandingai.org/feed', kind: 'essay', trust: 0.7, minScore: 1, perspective: 'creator' },
  { id: 'zvi', name: 'Don’t Worry About the Vase', home: 'https://thezvi.substack.com', feed: 'https://thezvi.substack.com/feed', kind: 'essay', trust: 0.65, minScore: 1, perspective: 'creator' },
  { id: 'snakeoil', name: 'AI as Normal Technology', home: 'https://www.aisnakeoil.com', feed: 'https://www.aisnakeoil.com/feed', kind: 'essay', trust: 0.7, minScore: 1, perspective: 'research' },
  { id: 'marcus', name: 'Marcus on AI', home: 'https://garymarcus.substack.com', feed: 'https://garymarcus.substack.com/feed', kind: 'essay', trust: 0.55, minScore: 2, perspective: 'creator' },
  { id: 'willison', name: 'Simon Willison', home: 'https://simonwillison.net', feed: 'https://simonwillison.net/atom/everything/', kind: 'essay', trust: 0.7, minScore: 3, perspective: 'creator' },
  { id: 'googleai', name: 'Google AI blog', home: 'https://blog.google/technology/ai/', feed: 'https://blog.google/technology/ai/rss/', kind: 'lab', trust: 0.75, minScore: 2, perspective: 'company' },
  { id: 'msr', name: 'Microsoft Research', home: 'https://www.microsoft.com/en-us/research/', feed: 'https://www.microsoft.com/en-us/research/feed/', kind: 'lab', trust: 0.7, minScore: 2, perspective: 'company' },

  // Light web search: news searches that find AI safety stories from any outlet.
  // Run every update, a few queries only, so it stays fast and polite.
  ...[
    ['gn-safety', '"AI safety"'],
    ['gn-incident', 'AI chatbot lawsuit OR "AI incident" OR deepfake scam'],
    ['gn-jailbreak', 'AI jailbreak OR "prompt injection"'],
    ['gn-policy', '"AI regulation" OR "AI Act" OR "AI bill"'],
    ['gn-alignment', '"AI alignment" OR "frontier AI" safety'],
  ].map(([id, q]): Source => ({
    id, name: `Web search: ${q.replace(/"/g, '')}`, home: `https://news.google.com/search?q=${encodeURIComponent(q)}`,
    feed: `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:7d')}&hl=en-US&gl=US&ceid=US:en`,
    kind: 'news', trust: 0.6, minScore: 2, perspective: 'journalism', type: 'gnews',
  })),
  { id: 'hn', name: 'Hacker News', home: 'https://news.ycombinator.com', feed: 'https://hn.algolia.com/api/v1/search_by_date?query=%22AI%20safety%22&tags=story&numericFilters=points%3E40&hitsPerPage=40', kind: 'news', trust: 0.55, minScore: 2, perspective: 'journalism', type: 'hn' },
];
