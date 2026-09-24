import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import sharp from 'sharp';

const base='/dolk-banner-proposal/';
for(const route of ['', 'dingdang/', 'happy-fullset/']){
  const html=await fs.readFile('dist/'+route+'index.html','utf8');
  const $=load(html);
  assert.equal($('meta[name=robots]').attr('content'),'noindex, nofollow');
  const expectedTitle=route ? `【非公式・選考課題】${route==='dingdang/'?'DingDang':'Happy Fullset'}｜商品紹介デモ` : '選考課題｜掲載イメージ確認用モックアップ';
  assert.equal($('title').text(),expectedTitle);
  for(const el of $('[src],link[href],a[href],source[srcset]').toArray()){
    const ref=$(el).attr('src') || $(el).attr('href') || $(el).attr('srcset');
    if(!ref || ref.startsWith('https:') || ref.startsWith('data:'))continue;
    if(ref.startsWith('#')) {assert.ok($(ref).length,`${route}: missing anchor ${ref}`);continue;}
    assert.ok(ref.startsWith(base),`${route}: incorrect GitHub Pages path ${ref}`);
    const pathname=ref.slice(base.length).split(/[?#]/)[0];
    let target=path.join('dist',pathname);
    if(pathname.endsWith('/'))target=path.join(target,'index.html');
    await fs.access(target);
  }
  if(!route){
    assert.equal($('.demo-marquee-group').length,2);
    assert.equal($('.demo-marquee-group').first().text(),$('.demo-marquee-group').last().text(),'Marquee groups must match for a seamless loop');
    assert.equal($('.campaigns img[src$="banner_img20260915202422.jpg"]').length,0,'Original blue promotional artwork must be removed');
    assert.equal($('.campaign-strip img[src$="banner_img20260915202408.jpg"]').length,6,'Keep the red promotional strip unchanged');
    assert.equal($('.welcome small').text(),'非公式・選考課題');
    assert.equal($('.welcome strong').text(),'by Koetsu');
    assert.equal($('.store-header .header-demo-note').length,1);
    assert.equal($('.account-links,.utility-links').length,0);
    assert.equal($('.demo-notice').length,0,'No extra notice bar should change the page dimensions');
    assert.equal($('[data-home-carousel]').length,2,'Provide a desktop and a mobile two-product carousel');
    for(const variant of ['desktop','mobile']){
      const carousel=$(`[data-home-carousel="${variant}"]`);
      const realSlides=carousel.find('.home-carousel-slide:not([data-loop-copy])');
      assert.equal(realSlides.length,2,'Only DingDang and Happy may be real carousel slides');
      assert.deepEqual(realSlides.toArray().map(el=>$(el).attr('href')),[base+'dingdang/',base+'happy-fullset/']);
      const size=variant==='desktop'?'870x359':'1080x1080';
      const expected=['dingdang','happy-fullset'].map(slug=>base+`images/banners/${slug}-${size}.png`);
      assert.deepEqual(realSlides.find('img').toArray().map(el=>$(el).attr('src')),expected);
      assert.deepEqual([...new Set(carousel.find('.home-carousel-slide img').toArray().map(el=>$(el).attr('src')))].sort(),expected.sort(),'Loop copies must not introduce other campaigns');
      assert.equal(carousel.find('.is-current').attr('href'),base+'dingdang/');
      assert.equal(carousel.find('.home-carousel-slide[aria-hidden="false"]').length,1);
      assert.equal(carousel.find('.carousel-dots button').length,2);
      assert.equal(carousel.find('[data-carousel-pause]').length,1);
    }
    assert.equal($('.proposal-banner').length,2);
    assert.equal($('.proposal-caption').length,0,'Product banners should have no visible text overlay');
    assert.equal($('picture source').length,2);
    assert.ok($('.hero-center').attr('src').endsWith('dingdang-870x359.png'));
    assert.equal($('.thumbnail').length,6);
    assert.ok($('.thumbnail').first().hasClass('selected'));
    assert.ok($('.carousel-dots button').first().hasClass('active'));
    assert.equal($('.thumbnail').eq(2).find('.thumbnail-label').text(),'DOLLZONE');
    assert.ok($('.thumbnail').eq(2).find('img').attr('src').endsWith('happy-fullset-870x359.png'));
    assert.ok($('.thumbnail').eq(2).text().includes('Happy Fullset特別再販'));
    const mobile=JSON.parse(await fs.readFile('src/data/mobile-site.json','utf8'));
    assert.ok($('.mobile-hero').attr('src').includes(mobile.hero));
    assert.equal($('.mobile-ticker-item').first().find('img').attr('src'),base+'images/banners/dingdang-1080x1080.png','Mobile hero caption must use the DingDang thumbnail');
    assert.equal($('.mobile-ticker-item').first().find('p').text(),$('.thumbnail').first().find('p').text(),'Mobile and desktop DingDang announcements must match');
    assert.ok(!$('.mobile-ticker-item').first().text().includes('スカーレット'),'Remove the previous product announcement below the mobile hero');
    assert.equal($('.mobile-ticker-item').length,2,'Mobile captions must rotate only the two requested products');
    assert.equal($('.mobile-ticker-item').eq(1).find('p').text(),$('.thumbnail').eq(2).find('p').text());
    assert.equal($('.mobile-topic img').length,mobile.topics.length);
    assert.equal($('.mobile-campaign-banners img').length,3);
    assert.equal($('.mobile-header').length,1);
    assert.equal($('.mobile-release-image').length,1);
    for(const src of [mobile.hero,...mobile.topics]){
      const meta=await sharp('public/'+src).metadata();
      assert.equal(meta.width,meta.height,`Mobile image must use original square artwork: ${src}`);
    }
    console.log('PASS independent mobile layout and original square assets');
  }else{
    assert.equal($('.detail-number,.dd-detail-index,.dd-nav a span').length,0,'Product pages must not render decorative section numbers');
    assert.ok(!/(^|\s)0[1-9](\s|\/|$)/.test($('main').text()),'Remove zero-padded numbering from product headings, navigation and captions');
    assert.equal($('[data-gallery]').length,5);
    const photoSources=$('main img[src]').toArray().map(el=>$(el).attr('src')).filter(src=>src.includes(`/images/${route}`));
    if(route==='dingdang/'){
      const expected=['photo-1','photo-2','photo-3','photo-4','photo-5','dd-1','dd-2','dd-3','dd-4','dd-5'].map(name=>base+'images/dingdang/'+name+'.webp');
      assert.equal(photoSources.length,10,'DingDang must have exactly ten photograph placements');
      assert.equal(new Set(photoSources).size,10,'Every DingDang photograph must appear exactly once');
      assert.deepEqual([...photoSources].sort(),expected.sort(),'Use all original five and all five newly supplied photographs');
      assert.equal($('main .dd-photo-window > img').length,10,'Every product photo must use a clipped display window');
      for(const button of $('[data-gallery]').toArray()){
        const zoom=Number($(button).attr('data-zoom'));
        assert.ok(zoom>=1.08,'Gallery lightbox must retain the display crop');
        assert.ok($(button).find('.dd-photo-window').attr('style').includes(`--photo-zoom:${zoom}`));
      }
      assert.equal($('.dd-lightbox-photo > img').length,1,'Lightbox must also clip enlarged artwork');
    }else{
      assert.equal(new Set(photoSources).size,5,`${route}: expected exactly five unique product photos`);
      assert.equal($('.lp-hero [data-slider]').length,0,'Happy hero must be a static composition, not a slideshow');
      assert.equal($('.happy-background').attr('src'),base+'images/happy-pdp/happy-back.png');
      assert.equal($('.happy-layer').length,4,'Happy must use all four independent SVG layers');
      const happyLayers=$('.happy-layer').toArray().map(el=>$(el).attr('src')).sort();
      assert.deepEqual(happyLayers,['happy-name','happy-choice','happy-word','happy-date'].map(name=>base+'images/happy-pdp/'+name+'.svg').sort());
      assert.equal($('.happy-carriage > .happy-date').length,1,'Date carriage needs its own horizontal entrance layer');
      assert.equal($('.happy-title').length,1);
      assert.equal($('.hero-shade,.hero-emblem,.vertical-copy').length,0,'Do not retain the old navy and gold hero overlays');
      assert.equal($('meta[name="theme-color"]').attr('content'),'#3f7fd3');
      assert.equal($('.product-card').length,1);
      assert.equal($('.happy-section-nav a').length,3);
    }
    if(route==='dingdang/'){
      assert.equal($('.dd-hero-layer').length,3,'DingDang hero must preserve the three independent text layers');
      assert.ok($('.dd-hero-layer').toArray().every(el=>$(el).attr('src').endsWith('.svg')),'All hero text layers must use SVG');
      assert.equal($('img.dd-footer-wordmark').attr('src'),base+'images/dingdang-pdp/dingdang-name.svg','Footer must use the supplied DingDang SVG wordmark');
      assert.equal($('.dd-hero-action a').attr('href'),'#information','Demo CTA must only open page information');
      assert.equal($('.dd-background').length,1);
      assert.equal($('.dd-hero > .dd-background').length,1,'Long background must stay inside the full-width hero to avoid overflowing the footer');
      assert.equal($('.dd-lightbox').length,1);
      assert.equal($('.lp-hero').length,0,'DingDang should not use the old shared product layout');
      assert.equal($('.dd-nav a').length,4);
      assert.ok($('.dd-demo-message').text().includes('実際の応募・購入はできません'));
    }
  }
  console.log('PASS',base+route,'assets, navigation, metadata, photo count');
}
for(const slug of ['dingdang','happy-fullset'])for(const [w,h] of [[730,135],[870,359],[1080,1080]]){
  const meta=await sharp(`public/images/banners/${slug}-${w}x${h}.png`).metadata();
  assert.equal(meta.width,w);assert.equal(meta.height,h);
}
console.log('PASS all six banner dimensions');
