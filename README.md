# XerFilm GR

**XerFilm GR** 是为 RICOH GR IV / HDF、GR III / HDF 与 GR IIIx / HDF 胶片模拟固件制作的 Vue 3 下载网站。

[网站源码](https://github.com/RexKing624/XerFilm-GR-Website) · [作者](https://xergnik.com/) · [联系](mailto:hello@xergnik.com)

> 本项目包含 Vue 网站与三款机型的发布资源，点击下载会在本页完成校验并保存原始 `.bin`，无需跳转或登录其他下载站点。固件许可证保留在发布资源中。

## 功能

- 桌面左右 1:2 布局，中文 / English / 日本語，明暗主题。
- 当前版本与功能介绍，17 个胶片家族 / 27 种效果的目录抽屉。
- 三款机型单选卡片 → 三项必选确认 → 手动输入 → 独立下载抽屉。
- 仅 GR IIIx / HDF 需要下载密码；其下载资源以 AES-GCM 加密，解密后再校验原始固件。
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

GitHub Pages 同时部署网站与 `public/downloads/` 中的各机型发布文件。浏览器下载分片并校验 SHA-256，分别保存为 GR IV 的 `fwdc248b.bin`、GR III 的 `fwdc239b.bin` 或 GR IIIx 的 `fwdc243b.bin`。分片不能单独用于刷机。

- 安装：`npm ci`
- 发布校验：`npm run check:release`
- 下载、密码、完整性及三语回归：`npm run test:downloads`
- 构建：`npm run build`
- 输出：`dist`

## 修改内容

- `src/App.vue`：页面、确认流程、抽屉。
- `src/i18n.js`：三语文案。
- `src/style.css`：桌面样式。
- `src/films.json`、`public/films/`：胶片目录与图标。
- `src/releases.js` 与各 `*-release.json`：机型、版本、文件大小、分段、加密参数及 SHA-256。
- `src/download.js`：下载与完整性校验。

页脚：© 2026 XER_GNIK · Tokyo · Japan · hello@xergnik.com。

## 许可证与来源

网站代码以 GPL-2.0-only 发布，详见 [LICENSE](LICENSE)。相关来源、图标和品牌说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。第三方素材遵循各自授权。

## 品牌素材

新标志为两张错位胶片框与几何 F，提供深浅色 SVG、favicon 和 PNG。`public/brand/` 包含三语胶片列表拼贴项目图，保留原有胶片图标。可用 `python3 tools/design-brand.py` 重新生成矢量稿。

## Enhanced installation test build

GR IV keeps a separate collapsed download section for bodies that cannot install the standard build, including newer/anniversary bodies with installation restrictions. The installation-failure acknowledgement reveals v23-H (installation version 1.12.10.7), without a password. A user has confirmed successful camera testing of this enhanced build. It is not offered for GR III or IIIx. Firmware source ZIP downloads remain removed.

## Model releases

- GR IV / HDF: V1.1, v23, base firmware 1.11.
- GR III / HDF: V1, R12, base firmware 2.10; user camera-tested.
- GR IIIx / HDF: V1 test release, R12, base firmware 1.60; pending camera feedback. Its password gate is separate from the common reading reminders. A short shared password is not an anti-reverse-engineering guarantee.
