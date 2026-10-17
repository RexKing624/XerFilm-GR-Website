# XerFilm GR

**XerFilm GR** 是为 RICOH GR IV 胶片模拟固件制作的 Vue 3 下载网站。

[网站源码](https://github.com/RexKing624/XerFilm-GR-Website) · [作者](https://xergnik.com/) · [联系](mailto:hello@xergnik.com)

> 本仓库仅开源网站，**不包含相机固件、固件注入代码、固件源码压缩包或原厂固件**。页面显示的 V1 是公开发行名称。

## 功能

- 桌面左右 1:2 布局，中文 / English / 日本語，明暗主题。
- 当前版本与功能介绍，17 个胶片家族 / 27 种效果的目录抽屉。
- 三项必选确认 → 手动输入 → 下载抽屉。
- 分段下载、单段与完整文件 SHA-256 校验。
- 固件风险说明、从作者网站获取的提示及独立的网站源码页脚链接。

手动确认只是浏览器端的阅读提醒，不能阻止绕过页面直接访问静态文件，也不是防破解措施。

## 开发

Node.js 20.19+ 或 22+，npm：

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

网站源码可以独立构建与预览。下载功能还需要下述单独维护的发布资源。

## 部署与自定义域名

网站使用 GitHub Actions → GitHub Pages，正式域名为 https://filmgr.xergnik.com/ 。推送 main 后自动构建并发布，`public/CNAME` 保留该域名。

GitHub Pages 仅发布网站界面与页面素材，不上传固件、固件分片或固件源码压缩包。下载入口指向原独立下载站点，该站点当前需要访问权限。

维护者在独立下载站点部署时，可以将现有下载文件放入 `public/downloads/`，执行 `npm run check:release` 后再构建。构建配置会检测下载文件是否齐全；源码仓库构建不会生成缺失文件的下载链接。

- 安装：`npm ci`
- 构建：`npm run build`
- 输出：`dist`
- 源码站点强制使用独立下载入口：`VITE_RELEASE_MODE=external npm run build`
- 原下载站点地址可在 `src/App.vue` 的 `downloadSite` 中调整。

## 修改内容

- `src/App.vue`：页面、确认流程、抽屉。
- `src/i18n.js`：三语文案。
- `src/style.css`：桌面样式。
- `src/films.json`、`public/films/`：胶片目录与图标。
- `src/release.json`：发布名称、文件大小、分段与完整 SHA-256。
- `src/download.js`：下载与完整性校验。

页脚：© 2026 XER_GNIK · Tokyo · Japan · hello@xergnik.com。

## 许可证与来源

网站代码以 GPL-2.0-only 发布，详见 [LICENSE](LICENSE)。相关来源、图标和品牌说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。这是网站的开源仓库，不代表对未包含在仓库中的固件或第三方资源重新授权。

## 品牌素材

新标志为两张错位胶片框与几何 F，提供深浅色 SVG、favicon 和 PNG。`public/brand/` 包含三语胶片列表拼贴项目图，保留原有胶片图标。可用 `python3 tools/design-brand.py` 重新生成矢量稿。
