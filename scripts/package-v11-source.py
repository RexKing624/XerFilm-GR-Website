"""Publish only frozen V1.1 modification archives, never current worktrees."""
from pathlib import Path, PurePosixPath
import hashlib, io, json, re, tarfile, zipfile

SITE = Path(__file__).resolve().parents[1]
WORKSPACE = SITE.parents[1]
OUT = SITE / 'public/historical-source/v1.1/XerFilm-GR-V1.1-source.zip'
entries = {}
def add(name, data):
    path = PurePosixPath(name)
    assert not path.is_absolute() and '..' not in path.parts
    assert not any(x in path.parts for x in ['private', '.git', 'node_modules', 'decoded'])
    assert path.suffix.lower() not in ['.bin', '.o', '.decoded', '.pem', '.key', '.heic', '.jpg', '.jpeg'], name
    assert not re.search(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}', data), name
    assert name not in entries or entries[name] == data
    entries[name] = data

def archive(path, prefix=''):
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None
        for name in z.namelist():
            if name.endswith('/'): continue
            data = z.read(name)
            if name.endswith('.zip'):
                archive(io.BytesIO(data), prefix + name[:-4] + '/')
            elif name.endswith('.tar.gz'):
                with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as tar:
                    for member in tar.getmembers():
                        if member.isfile() and PurePosixPath(member.name).suffix.lower() not in ['.jpg', '.jpeg', '.heic']:
                            add(prefix + name[:-7] + '/' + member.name, tar.extractfile(member).read())
            else: add(prefix + name, data)

snapshots = [
    ('GR-IV/', 'outputs/GR4-v23-H-高小版本-2026-10-19/源码与验证.zip'),
    ('GR-III/', 'outputs/XerFilm-GRIII-R14-MenuFix-2026-10-21/XerFilm-GRIII-R14-MenuFix-SOURCE.zip'),
    ('GR-IIIx/', 'outputs/XerFilm-GRIIIx-R14-MenuFix-2026-10-21/XerFilm-GRIIIx-R14-MenuFix-SOURCE.zip'),
    ('III-Series-Enhanced/', 'outputs/XerFilm-GRIII-Series-R13-H-2026-10-21/XerFilm-GRIII-Series-R13-H-SOURCE.zip'),
]
for prefix, path in snapshots: archive(WORKSPACE / path, prefix)
for model, folder in [('GRIII', 'gr3-native-menu-r14'), ('GRIIIx', 'gr3x-native-menu-r14')]:
    prefix = ('GR-III/' if model == 'GRIII' else 'GR-IIIx/') + f'XerFilm-{model}-R14-Source/'
    c = (WORKSPACE / 'work' / folder / 'stamp-research/film-stamp.c').read_bytes()
    ts = entries[prefix + 'src/film-stamp-code.ts']
    assert hashlib.sha256(c).hexdigest().encode() in ts, 'C source must match archived generated module'
    add(prefix + 'stamp-research/film-stamp.c', c)

readme = '''XerFilm GR V1.1 — historical modification source archive

中文：这是历史 V1.1 修改源码：GR IV v23、GR III / IIIx R14，包含普通版和增强版相关构建资料。不是当前 V2.0 的对应源码，也不包含后续自定义胶片包和 Fn 测试功能。没有提供或重新授权理光原厂固件源码。构建需另行取得匹配的原厂固件及归档文档列出的依赖；还原各脚本记录的工作目录后使用。此下载不是固件，不可刷入相机。

English: Historical V1.1 modification sources: GR IV v23 and GR III / IIIx R14, with ordinary/enhanced build material. This is not the corresponding source for the currently distributed V2.0. Later custom-pack and Fn experiments are excluded. Ricoh proprietary original firmware source is not supplied or relicensed. Rebuilding requires separately obtained matching official firmware, documented dependencies and original workspace paths. This download is not flashable firmware.

日本語：V1.1の改変ソースの履歴アーカイブです。GR IV v23、GR III / IIIx R14の通常版・拡張版に関するビルド資料を含みます。現在配布中のV2.0に対応するソースではありません。後のカスタムフィルムパックやFnテスト機能は含みません。リコーの非公開ファームウェア原本のソースは提供・再許諾しません。ビルドには対応する公式ファームウェア、各資料に記載の依存関係、元の作業パスが必要です。このファイルはカメラに書き込めません。

Licenses and attribution: Retain all included LICENSE/NOTICE files. GPL-covered code remains GPL-2.0; MIT test/support components retain their notices. Original additions do not cancel upstream license obligations. Third-party camera assets and brand names are not relicensed by a code license. Publishing this historical archive does not replace source obligations for any other distributed version.

GR IV ordinary v23 firmware SHA-256: 072713abe6ff99f06e9cca4f743c71e4aeb27046e96314d8768ed9981c0a8482
GR IV enhanced v23-H firmware SHA-256: e394f2b6e5119c88feb132d9d198fb3f653393f17fef5a9cb7e82aae318850fe
GR III ordinary R14 firmware SHA-256: 67d62f0f9a66ce71743cf9cecb7faaa1c02930f2edaa2bda69bf0b5f77ccf6cd
GR IIIx ordinary R14 firmware SHA-256: 00770c1b1d9d9b7098c7833df89a8dd293f47629ea58b3576ae5ecd8e511b974
GR III enhanced R14-H firmware SHA-256: 9ae280c3e5a3eb5230c1480ecb2d949baeac1c7791e8b9ec173020cb191f4e53
GR IIIx enhanced R14-H firmware SHA-256: 0f4d1610471c7a1be66a09508fc15029f89360451960ff5300400a8223fc5cb9
'''
add('README-V1.1.txt', readme.encode())
add('SHA256SUMS.txt', ('\n'.join(hashlib.sha256(data).hexdigest()+'  '+name for name, data in sorted(entries.items()))+'\n').encode())
OUT.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, data in sorted(entries.items()):
        info = zipfile.ZipInfo(name, (2026, 10, 21, 0, 0, 0)); info.compress_type = zipfile.ZIP_DEFLATED
        z.writestr(info, data)
with zipfile.ZipFile(OUT) as z: assert z.testzip() is None
manifest = {'version': 'V1.1', 'historical': True, 'correspondsToCurrentRelease': False, 'file': 'historical-source/v1.1/'+OUT.name, 'bytes': OUT.stat().st_size, 'sha256': hashlib.sha256(OUT.read_bytes()).hexdigest(), 'files': len(entries), 'builds': {'gr4': 'v23 / v23-H', 'gr3': 'R14 / R14-H', 'gr3x': 'R14 / R14-H'}}
(SITE / 'src/historical-source.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps(manifest, indent=2))
