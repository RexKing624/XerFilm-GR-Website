# XerFilm GR

**XerFilm GR** 是为 RICOH GR IV / HDF、GR III / HDF 与 GR IIIx / HDF 胶片模拟固件制作的 Vue 3 下载网站。

[网站源码](https://github.com/RexKing624/XerFilm-GR-Website) · [作者](https://xergnik.com/) · [联系](mailto:hello@xergnik.com)

> 本项目包含 Vue 网站与三款机型的发布资源，点击下载会在本页完成校验并保存原始 `.bin`，无需跳转或登录其他下载站点。固件许可证保留在发布资源中。

## 功能

- 桌面左右 1:2 布局，中文 / English / 日本語，明暗主题。
- 当前版本与功能介绍，17 个胶片家族 / 27 种效果的目录抽屉。
- 三款机型单选卡片 → 四项必选确认 → 手动输入 → 独立下载抽屉。
- 三款机型及 GR IV 增强版均免密码，保留阅读确认及增强版安装失败确认。
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
- 免密码下载、完整性及三语回归：`npm run test:downloads`
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

## GR IV / HDF firmware V3.0 — 2026-10-24

GR IV / HDF ordinary and enhanced downloads now use the camera-tested regular v49/v49-H files. Features include persistent custom/community film imports, separate author updates, Film Fn adjustments, ADJ frame selection with 1:1, playback INFO grain/highlight status, updated icons and device-code display. This is the regular release, without the one-time preset reset.

GR III / HDF and GR IIIx / HDF remain V2.0 R20/R20-H. Their files and changelogs are unchanged. The historical firmware source archive is unchanged.

## Website V3.0 — 2026-10-24

The website, static community and public browser Studio share the V3.0 header, theme and language controls. Routes remain on the same domain: `/`, `/community/`, `/community/studio/`. The old `/studio/` address redirects to the Studio route.

The initial website-only V3.0 update retained all V2.0 firmware downloads. The subsequent GR IV / HDF firmware release is described above. Community imports support GR IV / HDF V3.0; GR III / IIIx V2.0 does not support imports.

`studio/` contains the public browser editor source. Install its dependencies with `npm ci --prefix studio`; `npm run build` prepares the embedded editor before building the site. When the sibling local Studio workspace exists, the preparation script copies only its browser source/build inputs. Author servers, signing keys, release ledgers, local drafts and uploads are excluded. CI builds solely from this repository.

The community is curated static content. The submission button opens an email draft; there is no backend upload endpoint or automatic publication. See `COMMUNITY.md`.

### Firmware V2.0 — 2026-10-22

The latest local page and all six camera-tested firmware files are published together as V2.0. GR IV uses v32/v32-H, GR III and IIIx use R20/R20-H. The installed firmware metadata stays model-specific (1.11/1.12.10.7, 2.10/2.11.21.27, 1.60/1.61.21.27); V2.0 is the public project release.

- All models: Highlight Simulation (white HDF-style diffusion and red800T halation; Off/Weak/Medium/Strong); frame selection (645/67/4433/XPan, live mask and white frame border, JPG crop with full RAW retained).
- III/IIIx: Film ADJ is available in all five slots.
- All modified downloads stay password-free. The enhanced-installation acknowledgement and original-firmware archive modal are preserved.
- Current local page includes effect examples, frame demonstration and a fourth acknowledgement about resetting settings before restoring stock firmware. Chinese, English and Japanese are included.

Archived original firmware remains pinned to GR III/HDF2.10, GR IIIx/HDF1.60 and GR IV/HDF1.11. Providing backups does not establish downgrade compatibility. Existing compatibility messages are retained.

## GR IIIx / HDF V3.0 R29 stable release (2026-10-24)

The user confirmed the R29 test firmware passed physical-camera testing. Ordinary R29 and enhanced R29-H are now the password-free V3.0 stable downloads, using the exact same BIN files. The prior IIIx V2.0 assets and separate password-gated test panel/assets are withdrawn. The existing four acknowledgements, manual confirmation and enhanced-installation acknowledgement remain.

The IIIx changelog matches the GR IV V3.0 changelog in Chinese, English and Japanese. Community and Studio compatibility now includes GR IIIx / HDF V3.0. GR III / HDF retains V2.0 and GR IV / HDF retains V3.0. The historical firmware source archive remains unchanged.

Download tests verify the pinned R29 / R29-H BINs, cancellation and corruption handling. Release and build guards reject retired IIIx distribution assets.

## GR IIIx V3.0 withdrawn pending retesting (2026-10-24)

Following physical-camera feedback, IIIx V3.0 ordinary and enhanced downloads are withdrawn. The exact previously released V2.0 R20 / R20-H files and changelog are restored. No IIIx V3.0 test download is exposed. Community and Studio compatibility is again limited to GR IV / HDF V3.0. GR III and GR IV releases remain unchanged.

## GR IIIx / HDF V3.0 R31 password-verified test (2026-10-25)

V2.0 remains the stable IIIx download. A separate V3.0 R31/R31-H test panel below the enhanced panel offers ordinary and enhanced variants with the existing password2222 PBKDF2/AES-GCM flow. The reading confirmations and test acknowledgement remain required. The exact supplied R31 BINs are encrypted and split into same-site parts; final decrypted SHA-256 identities are pinned in checks. R31 fixes Film Fn physical MENU return and native Cinema right-column parameter values. Hardware retesting is pending. Other stable releases, compatibility text and historical firmware source remain unchanged.

## GR IIIx / HDF V3.0 R31 stable (2026-10-25)

The user confirmed R31 passed physical-camera testing. Stable ordinary R31 and enhanced R31-H downloads use the exact approved BINs without firmware changes or a download password. IIIx V2.0 and password-gated test assets are withdrawn. Chinese, English and Japanese V3.0 changelogs match GR IV; Community and Studio now include released GR IIIx / HDF V3.0 support. GR III, GR IV, manufacturer backups and the historical source archive remain unchanged.

## Download statistics (2026-10-25)

The website reports checksum-verified downloads after the browser save action. Ordinary, enhanced and original firmware are separated by model/version/revision; verified community ZIPs are tracked separately. A separate Cloudflare Worker stores idempotent events in D1 and serves a token-protected owner dashboard. No firmware or download bytes change. See statistics/README.md for deployment, privacy, exclusions and verification details.


## GR III / HDF V3.0 R32 test downloads (2026-10-25)

GR III V2.0 R20/R20-H remains the stable download. The separate R32/R32-H test entry below it retains the prior IIIx test layout, all four reading confirmations, manual phrase, test acknowledgement and password2222 PBKDF2/AES-GCM validation. Decrypted BINs exactly match the supplied GRIII-V3.0-R32 test package; no firmware bytes changed. R32 remains pending physical-camera testing. Other models and the historical source archive are unchanged.

Completed, checksum-verified test downloads use the existing private statistics service: model gr3, version V3.0-test, revisions R32/R32-H and standard/enhanced variants. The ASCII statistics version is separate from the translated display label. No synthetic production download records are inserted.


## GR III / HDF V3.0 R32 正式发布（2026-10-25）

按项目所有者要求，将指定的 R32 测试包原样转为 V3.0 正式下载。普通版 R32（安装版本 2.10）与增强版 R32-H（2.11）均免密码；撤下 GR III V2.0 与独立测试入口。未重新构建或修改固件 BIN，发布检查固定核对原包 SHA-256。保留 R32 原始测试记录，不将正式发布授权标记为新增实机测试。

GR III 的三语言日志更新为 V3.0，社群兼容说明加入 GR III / HDF。下载统计归入 V3.0，原有测试版统计保留。GR IV v49、GR IIIx R31、原厂备份及 V1.1 历史源码包不变。


## 摄影作品与社群（2026-10-26）

本地运行 `npm run dev -- --port 5192`，打开 `http://127.0.0.1:5192/community/`。顶栏沿用固件／社群，社群内切换摄影作品／胶片效果。照片详情可打开关联效果，效果详情可筛选其相关照片。URL 的 `tab`、`photo`、`look`、`fromLook` 参数支持链接、刷新与浏览器返回。

`src/photography-data.json` 保存手动整理的摄影作品，`lookId` 关联 `src/community-data.json` 的效果 ID。保留海边样张并明确标为演示；移除两张灯光样张，参数为示例。用户通过 JPG、相机 INFO 截图、名称和标题生成投稿 ZIP（可加头像／可选拍摄信息），不要求 RAW 或效果包；ZIP 原样保留 JPG 与 INFO 截图，另附 JSON 和人工审核说明。邮件链接仅预填正文，需要使用者自己附上 ZIP 并发送。

本地投稿可加入当前页面的预览列表，刷新后消失。摄影点赞仅在当前浏览器保存，不连接生产点赞服务，不自动发布。运行 `npm run test:photography` 检查投稿文件校验与 ZIP 内容。本次仅发布网页，未修改固件或统计数据库。

摄影作品的关联选择优先使用官网 `films.json` 中的 27 款内置效果，按具体子胶片展开，之后才列出社群效果与不关联选项。默认内置 PROVIA。内置关联使用稳定的 `builtin-图标编号` ID；投稿 JSON 同时保存 `lookType`、`builtinIcon` 和规范胶片名称，页面预览与邮件使用同一份关联。内置详情说明无需另装效果包，可反查使用作品或返回固件页。

摄影投稿中的机型现在只保存 GR IV／III／IIIx，HDF 作为独立选填复选项及布尔字段。画幅、颗粒、高光模拟均为原生单选按钮组，保留未填写选项。投稿必须附同一作品的相机回放 INFO 页面照片／截图（JPG／PNG，10 MB以内），用于人工核对。截图原样收入 ZIP 的 `camera-info.jpg/png`，在 JSON 中记录文件名，仅供审核，不加入公开作品预览。

官网已装胶片目录及首页胶片图标可跳转摄影作品：母图标按 `family-图标编号` 查看所有子型号，子图标按具体 `builtin-图标编号` 精确筛选。摄影区提供作品／作者／胶卷关键词搜索及胶卷、机型筛选，筛选写入 URL，支持刷新与返回。搜索词输入替换当前历史记录，避免每个字符占用一次返回。

主图限制提高到 50 MB；INFO 截图仍为 10 MB，头像仍为 5 MB。头像上传在左侧以小圆图与两行文字显示，选图后立即预览；主图和 INFO 文件不在表单内另显示缩略图（单独点击作品预览仍可查看作品）。

胶片效果页不再单独陈列内置胶片。首页“探索社群”沿用“查看已装效果”的描边按钮。官网、社群、制作页与弹窗统一隐藏滚动条，不预留滚动条宽度，滚轮／触控／键盘滚动保持可用。
