import sharp from 'sharp';

// Keep the supplied PNG/JPEG originals. The page only loads these smaller web copies.
for (let n = 1; n <= 5; n++) {
  const target = `public/images/dingdang/dd-${n}.webp`;
  const result = await sharp(`public/images/dingdang/dd-${n}.jpg`)
    .rotate()
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(target);
  console.log(`${target}: ${result.width} × ${result.height}, ${Math.round(result.size / 1024)} KB`);
}
const background = await sharp('public/images/dingdang-pdp/dingdang-1200px.png')
  .webp({ quality: 91 })
  .toFile('public/images/dingdang-pdp/dingdang-background.webp');
console.log(`Hero background: ${background.width} × ${background.height}, ${Math.round(background.size / 1024)} KB`);
