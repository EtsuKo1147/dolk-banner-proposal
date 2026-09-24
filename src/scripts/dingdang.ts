const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealElements = document.querySelectorAll<HTMLElement>('.dd-reveal');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('dd-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  revealElements.forEach((element) => {
    element.classList.add('dd-will-reveal');
    observer.observe(element);
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      observer.disconnect();
      revealElements.forEach((element) => element.classList.add('dd-visible'));
    }
  });
}

const gallery = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-gallery]'));
const lightbox = document.querySelector<HTMLDialogElement>('.dd-lightbox');
if (lightbox) {
  const image = lightbox.querySelector<HTMLImageElement>('img')!;
  const caption = lightbox.querySelector<HTMLElement>('figcaption')!;
  const photoWindow = lightbox.querySelector<HTMLElement>('.dd-lightbox-photo')!;
  let current = 0;
  let trigger: HTMLButtonElement | null = null;
  let previousOverflow = '';
  const show = (index: number) => {
    current = (index + gallery.length) % gallery.length;
    const item = gallery[current];
    image.src = item.dataset.src!;
    image.alt = item.dataset.alt!;
    photoWindow.style.setProperty('--photo-zoom', item.dataset.zoom ?? '1.08');
    photoWindow.style.setProperty('--photo-ratio', item.dataset.ratio ?? '0.6667');
    caption.textContent = `${current + 1} / ${gallery.length} — ${item.dataset.alt}`;
  };
  gallery.forEach((button, index) => button.addEventListener('click', () => {
    trigger = button;
    show(index);
    previousOverflow = document.body.style.overflow;
    lightbox.showModal();
    document.body.style.overflow = 'hidden';
  }));
  lightbox.querySelector('.dd-lightbox-close')?.addEventListener('click', () => lightbox.close());
  lightbox.querySelector('.dd-lightbox-prev')?.addEventListener('click', () => show(current - 1));
  lightbox.querySelector('.dd-lightbox-next')?.addEventListener('click', () => show(current + 1));
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  lightbox.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    trigger?.focus({ preventScroll: true });
  });
  let touchStart: { x: number; y: number } | null = null;
  image.addEventListener('touchstart', (event) => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  image.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
}
