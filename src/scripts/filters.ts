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
    const okTopic = topic === 'all' || (c.dataset.keys ?? '').split('|').includes(topic) || (c.dataset.search ?? '').includes(topic);
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

  document.querySelectorAll<HTMLButtonElement>('[data-f="key"]').forEach(b => b.addEventListener('click', () => {
    topic = b.dataset.v!;
    limit = PAGE;
    document.querySelectorAll('[data-f="key"]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  persp?.addEventListener('change', () => { limit = PAGE; render(); });
  let t = 0;
  input?.addEventListener('input', () => { clearTimeout(t); t = window.setTimeout(() => { limit = PAGE; render(); }, 120); });
  more?.addEventListener('click', () => { limit += PAGE; render(); });
  // Arriving from a trending link (?k=phrase): select that phrase, or search for it.
  const k = new URLSearchParams(location.search).get('k')?.toLowerCase().slice(0, 80);
  if (k) {
    const chip = [...document.querySelectorAll<HTMLButtonElement>('[data-f="key"]')].find(b => b.dataset.v === k);
    if (chip) chip.click(); else if (input) { input.value = k; }
  }
  render();
}
