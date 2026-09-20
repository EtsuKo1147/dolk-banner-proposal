import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://etsuko1147.github.io',
  base: '/dolk-banner-proposal',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
