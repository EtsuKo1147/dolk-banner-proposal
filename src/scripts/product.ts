const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const reveals = document.querySelectorAll<HTMLElement>('.reveal');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-enabled');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
  }), {threshold:0.08});
  reveals.forEach(el=>observer.observe(el));
}

document.querySelectorAll<HTMLElement>('[data-slider]').forEach(root => {
  const slides=Array.from(root.querySelectorAll<HTMLElement>('.slide'));
  const dots=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-slide]'));
  const pause=root.querySelector<HTMLButtonElement>('[data-pause]')!;
  let index=0, timer:ReturnType<typeof setInterval>|undefined, visible=false, stopped=reducedMotion.matches;
  const render=(next:number)=>{
    index=(next+slides.length)%slides.length;
    slides.forEach((slide,i)=>{
      slide.classList.toggle('is-previous',slide.classList.contains('is-active') && i!==index);
      slide.classList.toggle('is-active',i===index);
      slide.setAttribute('aria-hidden',String(i!==index));
    });
    dots.forEach((dot,i)=>{dot.classList.toggle('is-active',i===index);dot.setAttribute('aria-pressed',String(i===index));});
  };
  const sync=()=>{
    clearInterval(timer);
    if(visible && !stopped && !document.hidden && !reducedMotion.matches) timer=setInterval(()=>render(index+1),5500);
    pause.textContent=stopped?'▷':'Ⅱ';
    pause.setAttribute('aria-label',stopped?'自動切り替えを再開':'自動切り替えを停止');
  };
  const manual=(next:number)=>{stopped=true;render(next);sync();};
  root.querySelector('[data-prev]')?.addEventListener('click',()=>manual(index-1));
  root.querySelector('[data-next]')?.addEventListener('click',()=>manual(index+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>manual(i)));
  pause.addEventListener('click',()=>{stopped=!stopped;sync();});
  root.addEventListener('focusin',e=>{if(e.target!==pause){stopped=true;sync();}});
  document.addEventListener('visibilitychange',sync);
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)stopped=true;sync();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.15}).observe(root);
  let startX=0;
  root.addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX;},{passive:true});
  root.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-startX;if(Math.abs(delta)>55)manual(index+(delta<0?1:-1));},{passive:true});
  sync();
});

const gallery=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-gallery]'));
const lightbox=document.querySelector<HTMLDialogElement>('.lightbox')!;
const bigImage=lightbox.querySelector<HTMLImageElement>('img')!;
let current=0;
function showPhoto(next:number) {
  current=(next+gallery.length)%gallery.length;
  bigImage.src=gallery[current].dataset.src!;
  bigImage.alt=gallery[current].querySelector('img')!.alt;
  lightbox.querySelector('figcaption')!.textContent=`${current+1} / ${gallery.length}`;
}
gallery.forEach((button,i)=>button.addEventListener('click',()=>{showPhoto(i);lightbox.showModal();document.body.style.overflow='hidden';}));
lightbox.querySelector('.lightbox-close')?.addEventListener('click',()=>lightbox.close());
lightbox.querySelector('.lightbox-prev')?.addEventListener('click',()=>showPhoto(current-1));
lightbox.querySelector('.lightbox-next')?.addEventListener('click',()=>showPhoto(current+1));
lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowRight')showPhoto(current+1);if(e.key==='ArrowLeft')showPhoto(current-1);});
lightbox.addEventListener('close',()=>{document.body.style.overflow='';gallery[current].focus({preventScroll:true});});

const toggle=document.querySelector<HTMLButtonElement>('[data-menu-toggle]')!;
const menu=document.querySelector<HTMLDialogElement>('.mobile-menu')!;
toggle.addEventListener('click',()=>{menu.showModal();toggle.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';});
menu.querySelector('.menu-close')?.addEventListener('click',()=>menu.close());
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));
menu.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');document.body.style.overflow='';});
const fixed=document.querySelector('.mobile-fixed-nav')!;
new IntersectionObserver(entries=>fixed.classList.toggle('is-visible',!entries[0].isIntersecting)).observe(document.querySelector('.lp-hero')!);
