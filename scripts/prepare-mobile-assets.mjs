import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {load} from 'cheerio';
import sharp from 'sharp';

// The official mobile response has its own art direction; never crop PC banners.
const $ = load(await fs.readFile('references/mobile.html', 'utf8'));
const assets = new Map();
function asset(src) {
  const source = src.trim();
  const local = 'images/site/mobile/' + path.basename(source);
  assets.set(source, local);
  return local;
}
const section = (heading) => $('section.common_contents').filter((_, el) => $(el).find('h2 img').first().attr('src') === `/img/common/${heading}`).first();
const topicSection = section('top_03.jpg');
const campaignSection = section('top_10.jpg');
const releaseSection = section('top_14.jpg');
const images = (scope, selector) => scope.find(selector).toArray().map(el => asset($(el).attr('src')));
const data = {
  header: images($('#common_header'), 'img'),
  shortcuts: $('#common_g_nav img').toArray().map(el => ({src: asset($(el).attr('src')), alt: $(el).attr('alt')})),
  hero: asset($('#thumb-slider-item img').first().attr('src')),
  ticker: $('#common_slider .slider_box').slice(0, 3).toArray().map(el => ({src: asset($(el).find('img').attr('src')), text: $(el).find('p').text().trim()})),
  topicsHeading: asset(topicSection.find('h2 img').attr('src')),
  topics: images(topicSection, '.common_contents_banner_typeA img'),
  campaignHeading: asset(campaignSection.find('h2 img').attr('src')),
  campaigns: images(campaignSection, 'img').slice(1),
  releaseHeading: asset(releaseSection.find('h2 img').attr('src')),
  release: {
    src: asset(releaseSection.find('.common_news_type_first img').attr('src')),
    text: releaseSection.find('.common_news_type_first h3').text().trim(),
  },
};
await fs.mkdir('public/images/site/mobile', {recursive: true});
await Promise.all([...assets].map(async ([source, local]) => {
  try { await fs.access('public/' + local); }
  catch { execFileSync('curl', ['-fLsS', '--retry', '2', '--max-time', '30', 'https://dolk.jp' + source, '-o', 'public/' + local]); }
  const meta = await sharp('public/' + local).metadata();
  console.log(path.basename(local), meta.width, meta.height);
}));
await fs.writeFile('src/data/mobile-site.json', JSON.stringify(data, null, 2) + '\n');
console.log(`Prepared ${assets.size} original mobile assets, ${data.topics.length} square topics.`);
