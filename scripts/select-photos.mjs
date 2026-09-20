import fs from 'node:fs/promises';
import sharp from 'sharp';

const selection = {
  dingdang: { folder: 'DingDang-pic', indices: [1, 3, 4, 6, 9] },
  'happy-fullset': { folder: 'HappyFullset-pic', indices: [1, 4, 8, 13, 16] },
};
for (const [slug, spec] of Object.entries(selection)) {
  const files = (await fs.readdir('../' + spec.folder)).filter(f => /\.jpg$/i.test(f)).sort();
  await fs.mkdir(`public/images/${slug}`, {recursive:true});
  const manifest=[];
  for (const [index, sourceIndex] of spec.indices.entries()) {
    const source=files[sourceIndex-1];
    const output=`public/images/${slug}/photo-${index+1}.webp`;
    await sharp(`../${spec.folder}/${source}`).resize({width:1600,withoutEnlargement:true}).webp({quality:90}).toFile(output);
    manifest.push({file:`photo-${index+1}.webp`,source,folder:spec.folder});
  }
  await fs.writeFile(`src/data/${slug}-photos.json`,JSON.stringify(manifest,null,2));
}
await fs.mkdir('public/images/banners',{recursive:true});
for (const slug of Object.keys(selection)) {
  for (const [w,h] of [[730,135],[1080,1080]]) {
    const square=w===h;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#e8eaf0"/><rect x="12" y="12" width="${w-24}" height="${h-24}" rx="3" fill="none" stroke="#aeb7cd"/><text x="${w/2}" y="${h/2-8}" text-anchor="middle" font-family="Georgia,serif" font-size="${square?66:30}" letter-spacing="${square?10:5}" fill="#17264f">BANNER DESIGN</text><text x="${w/2}" y="${h/2+(square?55:24)}" text-anchor="middle" font-family="sans-serif" font-size="${square?23:13}" letter-spacing="3" fill="#71809e">${w} × ${h} · COMING SOON</text></svg>`;
    await sharp(Buffer.from(svg)).png().toFile(`public/images/banners/${slug}-${w}x${h}.png`);
  }
}
console.log('Selected exactly 5 photos per product; created 4 replaceable banner PNGs.');
