import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';

const $ = load(await fs.readFile('references/home.html', 'utf8'));
const clean = (value) => (value || '').trim();
const images = (selector, limit = 100) => $(selector).toArray().slice(0, limit).map(el => ({
  source: clean($(el).attr('src')),
  alt: clean($(el).attr('alt')),
})).filter(x => x.source);
const data = {
  hero: images('#TopSliderIn li img'),
  thumbnails: $('#TMSMenuIn li').toArray().slice(0,6).map(el=>({
    source: clean($(el).find('img').attr('src')),
    category: $(el).find('.TMSMMaker').text().trim(),
    text: $(el).find('.TMSMInfo').text().trim(),
  })),
  side: images('#TopSideBanner img', 4),
  banners: images('#TopMainBanner img', 14),
  footer: images('#FBSlider img', 5),
  social: images('#SideSns img, #SideSnsAbroad img'),
  videos: images('#youtubeList .youtubeImg > a > img', 1),
  news: $('#TopNewsLoad li').toArray().slice(0,3).map(el=>({date:$(el).find('span').text(),text:$(el).find('a').text()})),
};
const sources = new Set(Object.values(data).flat().map(x=>x.source).filter(Boolean));
for (const s of ['/img/Logo.png','/img/dollnuma_title.jpg','/ReUp/Banner/banner_img20260915202422.jpg','/ReUp/Banner/banner_img20260915202408.jpg']) sources.add(s);
// These are decorative textures only, never additional doll photographs.
for (const s of ['main_bg01.png','main_bg02.png','introduction_bg01.png','introduction_bg02.png','about_bg01.png','about_bg02.png']) sources.add('/pages/saihito/img/index/'+s);
const downloaded = {};
await fs.mkdir('public/images/site', {recursive:true});
const queue = [...sources];
await Promise.all(Array.from({length:6},async()=>{
  while(queue.length){
    const source=queue.shift();
    const url=new URL(source,'https://dolk.jp/');
    const filename=path.basename(url.pathname);
    const output='public/images/site/'+filename;
    try {
      let bytes;
      try { bytes=await fs.readFile(output); }
      catch { bytes=execFileSync('curl',['-L','--fail','--silent','--show-error','--retry','2','--max-time','30',url.href]); }
      await sharp(bytes).metadata();
      await fs.writeFile(output,bytes);
      downloaded[source]='images/site/'+filename;
    }catch(e){console.log('Asset unavailable:',source,e.message);}
  }
}));
for(const values of Object.values(data))for(const item of values)if(item.source)item.src=downloaded[item.source];
data.assets=downloaded;
await fs.mkdir('src/data',{recursive:true});
await fs.writeFile('src/data/site.json',JSON.stringify(data,null,2));
console.log('Website assets saved:',Object.keys(downloaded).length);

for(const dir of ['DingDang-pic','HappyFullset-pic']){
  const files=(await fs.readdir('../'+dir)).filter(x=>/\.jpe?g$/i.test(x)).sort();
  const tiles=[];
  for(const [i,file] of files.entries()){
    const img=await sharp('../'+dir+'/'+file).resize(220,255,{fit:'contain',background:'#ececec'}).toBuffer();
    tiles.push({input:img,left:(i%4)*240+10,top:Math.floor(i/4)*290+10});
    const label=Buffer.from(`<svg width="230" height="24"><text x="6" y="17" font-size="15" font-family="sans-serif">${i+1} · ${file.slice(-9)}</text></svg>`);
    tiles.push({input:label,left:(i%4)*240+5,top:Math.floor(i/4)*290+266});
  }
  await sharp({create:{width:960,height:Math.ceil(files.length/4)*290,channels:3,background:'#ffffff'}}).composite(tiles).jpeg().toFile('references/'+dir+'-contact.jpg');
  console.log(dir,files.map((f,i)=>`${i+1}: ${f}`).join('\n'));
}
