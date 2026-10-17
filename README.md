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

1. 使用 `npm ci` 安装依赖。
2. 由项目维护者将实际发布资源放入 `public/downloads/`，文件清单见该目录的 README。资源不会提交到这个仓库。
3. 执行 `npm run build`。
4. 将完整 `dist/` 部署到支持 HTTPS 的静态托管服务；构建命令为 `npm run build`，输出目录为 `dist`。
5. 在你选择的托管服务中添加自定义域名，再按其要求配置 DNS。

若使用 GitHub 连接静态托管，必须在私有构建步骤中补齐发布资源，或在部署时单独上传它们。单纯从本仓库构建不包含固件下载文件。

单个固件资源不超过 16 MiB。完整文件会在浏览器中校验后保存为 `fwdc248b.bin`。必须使用 HTTPS 或 localhost；不要通过 `file://` 打开。

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
