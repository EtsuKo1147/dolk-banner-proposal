# DOLK Banner Proposal

面试课题展示：DOLK 首页的指定区域 + DingDang / Happy Fullset 两个商品专题页。

## 本地查看

```sh
npm install
npm run dev
```

打开终端提示的网址，并进入 `/dolk-banner-proposal/`。

## 替换四张 Banner

将最终 PNG 覆盖到 `public/images/banners/` 中，保留文件名：

| 商品 | 电脑端 730 × 135 | 手机端 1080 × 1080 |
| --- | --- | --- |
| DingDang | dingdang-730x135.png | dingdang-1080x1080.png |
| Happy Fullset | happy-fullset-730x135.png | happy-fullset-1080x1080.png |

电脑展示两张横幅；700px 及以下自动展示两张方形图。四张图都通过各自商品链接进入 LP。首页只有这两组 Banner 有交互。

## 修改 LP 文案

编辑 `src/data/products.ts`。商品名、标题、竖排文案、介绍、卖点、销售及展示信息、价格和套装内容都集中在此。当前营销文案为草稿，销售时间和价格明确为占位内容，不代表官方条件。

## 修改照片

每款 LP 恰好使用 5 张不同照片，多处复用：

- `public/images/dingdang/photo-1.webp` 至 `photo-5.webp`
- `public/images/happy-fullset/photo-1.webp` 至 `photo-5.webp`

`src/data/*-photos.json` 记录所选照片的原文件名。原始素材文件夹未修改。`scripts/select-photos.mjs` 仅用于首次准备素材；完成 Banner 替换后不要重新运行它，否则会恢复占位 Banner。

## 首页范围

对应参考截图：头部、促销条、左侧栏、静态首屏与缩略图、右侧宣传图、通知、双列 Banner、浏览历史、页脚。未加入其他商品列表。官网素材已保存到 `public/images/site/`，没有加载官网追踪脚本、登录、搜索或购买功能。

手机首页（700px 及以下）使用独立布局：固定 DOLK 导航、四个快捷入口的静态图示、通栏促销条、正方形主视觉、缩略图文字条、双列正方形专题图、单列横幅活动区和浅色新品介绍区。手机素材来自官网独立移动版，保存在 `public/images/site/mobile/`，清单为 `src/data/mobile-site.json`；没有把电脑端横幅裁成方形。两个商品占位 Banner 位于专题区首行，沿用原来的 LP 链接。电脑端与 LP 不受手机首页布局影响。

LP 包括轮播（可暂停、键盘操作和触控滑动）、滚动出现、Sticky 背景、5 张图库照片、可关闭的图库弹窗、销售/展示/商品信息、手机页内导航。减少动态效果的系统偏好会关闭自动播放和动画。

## 发布

仓库名：`dolk-banner-proposal`。`astro.config.mjs` 设置了 GitHub Pages 子路径。GitHub Settings → Pages 的 Source 设为 GitHub Actions。推送 `main` 后自动构建发布：

`https://etsuko1147.github.io/dolk-banner-proposal/`

页面为非官方面试课题展示，已添加 `noindex, nofollow`。图片与 Logo 的权利属于各自权利人。
