// Community board: links readers submit through the GitHub issue form
// (.github/ISSUE_TEMPLATE/submit.yml). Only issues the maintainer labels
// "approved" are shown, so spam never reaches the site. Votes are 👍 reactions
// on the issue; comments on the issue are the discussion.
//
// Ranking is Hacker News' formula: (points - 1) / (age in hours + 2)^1.8
// Uses GitHub's free public API (a GITHUB_TOKEN is used if present, for a
// higher rate limit, but is not required).

const REPO = 'bktruong-dev/vigil';

export interface Post {
  n: number; title: string; url: string; site: string; type: string; why: string;
  by: string; date: string; points: number; comments: number; discuss: string; score: number;
}

function field(body: string, label: string) {
  const m = body.match(new RegExp(`###\\s*${label}[^\\n]*\\n+([\\s\\S]*?)(?=\\n###|$)`, 'i'));
  const v = m?.[1].trim() ?? '';
  return v === '_No response_' ? '' : v;
}

export async function community(): Promise<{ posts: Post[]; pending: number; ok: boolean }> {
  const headers: Record<string, string> = { accept: 'application/vnd.github+json', 'user-agent': 'VigilBot/0.1' };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const get = async (labels: string) => {
      const res = await fetch(`https://api.github.com/repos/${REPO}/issues?labels=${labels}&state=open&per_page=100`, { headers, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as any[];
    };
    const [approved, all] = await Promise.all([get('approved'), get('submission')]);
    const now = Date.now();
    const posts: Post[] = [];
    for (const is of approved) {
      if (is.pull_request) continue;
      const body = String(is.body ?? '');
      let url = field(body, 'Link');
      try { const u = new URL(url); if (u.protocol !== 'https:' && u.protocol !== 'http:') continue; url = u.href; } catch { continue; }
      const title = (field(body, 'Headline') || String(is.title).replace(/^\[Submit\]\s*/i, '')).slice(0, 200);
      const points = 1 + (is.reactions?.['+1'] ?? 0) + (is.reactions?.heart ?? 0) + (is.reactions?.hooray ?? 0);
      const hours = (now - Date.parse(is.created_at)) / 36e5;
      posts.push({
        n: is.number, title, url, site: new URL(url).hostname.replace(/^www\./, ''),
        type: field(body, 'Type') || 'Link', why: field(body, 'Why it matters').slice(0, 300),
        by: is.user?.login ?? 'someone', date: is.created_at, points, comments: is.comments ?? 0,
        discuss: is.html_url, score: (points - 1 + 0.5) / Math.pow(hours + 2, 1.8),
      });
    }
    posts.sort((a, b) => b.score - a.score);
    const pending = all.filter(i => !i.labels?.some((l: any) => l.name === 'approved')).length;
    return { posts, pending, ok: true };
  } catch {
    return { posts: [], pending: 0, ok: false };
  }
}
