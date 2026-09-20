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
    assert.equal($('a').length,2,'Homepage should have only two product links');
    assert.equal($('picture source').length,2);
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
