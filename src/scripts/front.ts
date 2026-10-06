// Front page: filter chips, search and "show more" for the story stream.

const stream = document.getElementById('stream');
if (stream) {
  const cards = [...stream.querySelectorAll<HTMLElement>('.story')];
  const input = document.getElementById('q') as HTMLInputElement;
  const more = document.getElementById('more') as HTMLButtonElement;
  const empty = document.getElementById('empty')!;
  const PAGE = 24;
  let chip = 'all', limit = PAGE;

  const match = (c: HTMLElement) => {
    const q = input.value.trim().toLowerCase();
    const okChip = chip === 'all' || (chip === 'good' ? c.dataset.tone === 'good' : c.dataset.kind === chip);
    return okChip && (!q || q.split(/\s+/).every(w => c.dataset.search!.includes(w)));
  };

  function render() {
    let shown = 0, total = 0;
    for (const c of cards) {
      const ok = match(c);
      if (ok) total++;
      c.hidden = !(ok && shown < limit);
      if (!c.hidden) shown++;
    }
    empty.hidden = total > 0;
    more.hidden = total <= limit;
    more.textContent = `Show more (${total - shown} left)`;
  }

  document.querySelectorAll<HTMLButtonElement>('[data-chip]').forEach(b => b.addEventListener('click', () => {
    chip = b.dataset.chip!;
    limit = PAGE;
    document.querySelectorAll('[data-chip]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  let t = 0;
  input.addEventListener('input', () => { clearTimeout(t); t = window.setTimeout(() => { limit = PAGE; render(); }, 120); });
  more.addEventListener('click', () => { limit += PAGE; render(); });
  render();
}
