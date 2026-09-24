const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll<HTMLElement>('[data-home-carousel]').forEach(root => {
  const mobile = root.dataset.homeCarousel === 'mobile';
  const track = root.querySelector<HTMLElement>('.home-carousel-track')!;
  const viewport = root.querySelector<HTMLElement>('.home-carousel-viewport')!;
  const slides = Array.from(root.querySelectorAll<HTMLAnchorElement>('.home-carousel-slide'));
  const selectors = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-carousel-select]'));
  const pause = root.querySelector<HTMLButtonElement>('[data-carousel-pause]')!;
  const status = root.querySelector<HTMLElement>('[data-carousel-status]')!;
  const names = ['DingDang', 'Happy Fullset'];
  let index=0, position=2, moving=false, visible=false, hovered=false, focused=false, stopped=reduced.matches;
  let transitionStarted=0;
  let timer:ReturnType<typeof setTimeout>|undefined, transitionTimer:ReturnType<typeof setTimeout>|undefined;
  const sync = (delay=3500) => {
    clearTimeout(timer);
    pause.textContent=stopped?'▷':'Ⅱ';
    pause.setAttribute('aria-pressed',String(stopped));
    pause.setAttribute('aria-label',stopped?'自動切り替えを再開':'自動切り替えを停止');
    if(visible&&!hovered&&!focused&&!stopped&&!document.hidden&&!reduced.matches&&!moving) timer=setTimeout(()=>step(1),delay);
  };
  const render = () => {
    root.style.setProperty('--carousel-offset',`${(mobile?0:22)-position*(mobile?100:60)}%`);
    root.dataset.activeSlide=String(index);
    slides.forEach((slide,i)=>{
      const active=i===position;
      slide.classList.toggle('is-current',active);
      slide.inert=!active;
      slide.tabIndex=active?0:-1;
      slide.setAttribute('aria-hidden',String(!active));
    });
    selectors.forEach(button=>{
      const active=Number(button.dataset.carouselSelect)===index;
      button.classList.toggle(button.classList.contains('thumbnail')?'selected':'active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    root.querySelectorAll<HTMLElement>('[data-carousel-caption]').forEach(el=>el.hidden=Number(el.dataset.carouselCaption)!==index);
    root.querySelectorAll<HTMLElement>('[data-carousel-preview]').forEach(el=>el.hidden=Number(el.dataset.carouselPreview)===index);
  };
  const finish = () => {
    if(!moving)return;
    clearTimeout(transitionTimer);
    root.classList.add('is-resetting');
    position=2+index;
    render();
    // Commit the equivalent loop position before enabling the next transition.
    void track.offsetWidth;
    root.classList.remove('is-resetting');
    moving=false;
    sync(Math.max(0,3500-(performance.now()-transitionStarted)));
  };
  const step = (direction:number,manual=false) => {
    if(moving)return;
    clearTimeout(timer);
    position+=direction;
    index=(index+direction+2)%2;
    moving=true;
    transitionStarted=performance.now();
    render();
    if(manual)status.textContent=`${index+1} / 2 — ${names[index]}`;
    if(reduced.matches)finish();
    else transitionTimer=setTimeout(finish,750);
  };
  track.addEventListener('transitionend',event=>{if(event.target===track&&event.propertyName==='transform')finish();});
  root.querySelectorAll('[data-carousel-prev]').forEach(button=>button.addEventListener('click',()=>step(-1,true)));
  root.querySelectorAll('[data-carousel-next]').forEach(button=>button.addEventListener('click',()=>step(1,true)));
  selectors.forEach(button=>button.addEventListener('click',()=>{const next=Number(button.dataset.carouselSelect);if(next!==index)step(next-index,true);}));
  pause.addEventListener('click',()=>{stopped=!stopped;if(!stopped)focused=false;sync();});
  root.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;sync();}});
  root.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){hovered=false;sync();}});
  root.addEventListener('focusin',()=>{focused=true;sync();});
  root.addEventListener('focusout',event=>{if(!root.contains(event.relatedTarget as Node|null)){focused=false;sync();}});
  root.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();step(event.key==='ArrowRight'?1:-1,true);}
  });
  let start:{x:number;y:number}|undefined, suppressClickUntil=0;
  viewport.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse')start={x:event.clientX,y:event.clientY};},{passive:true});
  viewport.addEventListener('pointercancel',()=>{start=undefined;});
  viewport.addEventListener('pointerup',event=>{
    if(!start)return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;
    start=undefined;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2){suppressClickUntil=Date.now()+500;step(dx<0?1:-1,true);}
  },{passive:true});
  viewport.addEventListener('click',event=>{if(Date.now()<suppressClickUntil){event.preventDefault();event.stopPropagation();}},true);
  document.addEventListener('visibilitychange',()=>sync());
  reduced.addEventListener('change',()=>{if(reduced.matches){stopped=true;finish();}sync();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.15}).observe(viewport);
  root.querySelectorAll<HTMLButtonElement>('button').forEach(button=>button.disabled=false);
  render();
  sync();
});
