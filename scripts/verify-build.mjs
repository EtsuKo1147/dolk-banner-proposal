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
  const expectedTitle=route ? `【非公式・選考課題】${route==='dingdang/'?'DingDang':'Happy Fullset'}｜商品紹介デモ` : '【非公式・選考課題】DOLK バナー掲載デモ';
  assert.equal($('title').text(),expectedTitle);
  for(const el of $('[src],link[href],a[href],source[srcset]').toArray()){
    const ref=$(el).attr('src') || $(el).attr('href') || $(el).attr('srcset');
    if(!ref || ref.startsWith('https:') || ref.startsWith('data:'))continue;
    if(ref.startsWith('#')) {assert.ok($(ref).length,`${route}: missing anchor ${ref}`);continue;}
    assert.ok(ref.startsWith(base),`${route}: incorrect GitHub Pages path ${ref}`);
    let target=path.join('dist',ref.slice(base.length).split('#')[0]);
    if(ref.endsWith('/'))target=path.join(target,'index.html');
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
    assert.equal($('a').length,2,'Homepage should have only two product links');
    assert.equal($('picture source').length,2);
    assert.ok($('.hero-center').attr('src').endsWith('banner_img20260821190552.jpg'));
    assert.equal($('.thumbnail').length,6);
    assert.ok($('.thumbnail').first().hasClass('selected'));
    assert.ok($('.carousel-dots span').first().hasClass('active'));
    const mobile=JSON.parse(await fs.readFile('src/data/mobile-site.json','utf8'));
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
    assert.equal($('[data-gallery]').length,5);
    const photos=new Set($('img[src]').toArray().map(el=>$(el).attr('src')).filter(src=>src.includes(`/images/${route}photo-`)));
    assert.equal(photos.size,5,`${route}: expected exactly five unique product photos`);
  }
  console.log('PASS',base+route,'assets, navigation, metadata, photo count');
}
for(const slug of ['dingdang','happy-fullset'])for(const [w,h] of [[730,135],[1080,1080]]){
  const meta=await sharp(`public/images/banners/${slug}-${w}x${h}.png`).metadata();
  assert.equal(meta.width,w);assert.equal(meta.height,h);
}
console.log('PASS all four banner dimensions');
