// Filters for a story grid: topic chips, a perspective menu, search and "show more".

const stream = document.getElementById('stream');
if (stream) {
  const cards = [...stream.querySelectorAll<HTMLElement>('.story')];
  const input = document.getElementById('q') as HTMLInputElement | null;
  const persp = document.getElementById('persp') as HTMLSelectElement | null;
  const more = document.getElementById('more') as HTMLButtonElement | null;
  const empty = document.getElementById('empty');
  const PAGE = 24;
  let topic = 'all', limit = PAGE;

  const match = (c: HTMLElement) => {
    const q = (input?.value ?? '').trim().toLowerCase();
    const okTopic = topic === 'all' || (c.dataset.topics ?? '').split(',').includes(topic);
    const okPersp = !persp || persp.value === 'all' || c.dataset.persp === persp.value;
    return okTopic && okPersp && (!q || q.split(/\s+/).every(w => c.dataset.search!.includes(w)));
  };

  function render() {
    let shown = 0, total = 0;
    for (const c of cards) {
      const ok = match(c);
      if (ok) total++;
      c.hidden = !(ok && shown < limit);
      if (!c.hidden) shown++;
    }
    if (empty) empty.hidden = total > 0;
    if (more) { more.hidden = total <= limit; more.textContent = `Show more (${total - shown} left)`; }
  }

  document.querySelectorAll<HTMLButtonElement>('[data-f="topic"]').forEach(b => b.addEventListener('click', () => {
    topic = b.dataset.v!;
    limit = PAGE;
    document.querySelectorAll('[data-f="topic"]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  persp?.addEventListener('change', () => { limit = PAGE; render(); });
  let t = 0;
  input?.addEventListener('input', () => { clearTimeout(t); t = window.setTimeout(() => { limit = PAGE; render(); }, 120); });
  more?.addEventListener('click', () => { limit += PAGE; render(); });
  render();
}
