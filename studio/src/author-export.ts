import {filmMonochrome} from './film-kind';
import { changedBuiltin, effectiveModel } from './control';
import { communityRecord as record } from './community';

export class AuthorExportIssue extends Error {
  constructor(public code: string, public kind: 1|2, public slot = 0, public child?: number) { super(code); }
}
export type AuthorJob = { kind: 1|2; slot: number; source: any; data: Uint8Array };

/** Export the selected workspace, not unrelated unfinished drafts. */
export async function prepareAuthorExport(mode: 'append'|'update', builtins: any[], baseline: any, families: any[]): Promise<AuthorJob[]> {
  if (!baseline || builtins.length !== 27) throw new AuthorExportIssue('template', 2);
  const jobs: AuthorJob[] = [];
  if (mode === 'update') {
    for (let i = 0; i < 27; i++) {
      const f = builtins[i];
      try {
        const previouslyExported = f.revision > (baseline.builtins[i].revision || 1);
        if (!f.forceUpdate && !previouslyExported && !changedBuiltin(f, baseline.builtins[i])) continue;
        const child = f.children[0];
        if (child.model?.unsupported?.length && !child.acceptApprox) throw new AuthorExportIssue('approx', 2, i, 0);
        const data = await record({...f, children: [{...child, monochrome:filmMonochrome(child,f), name: 'COLOR', model: effectiveModel(child)}]}, i, 2);
        jobs.push({kind: 2, slot: i, source: f, data});
      } catch (error) {
        if (error instanceof AuthorExportIssue) throw error;
        throw new AuthorExportIssue('colour', 2, i, 0);
      }
    }
  } else {
    for (let i = 0; i < families.length; i++) {
      const f = families[i]; if (f.empty) continue;
      if (!f.name?.trim()) throw new AuthorExportIssue('name', 1, i);
      if (!f.icon) throw new AuthorExportIssue('icon', 1, i);
      if (!f.children?.length) throw new AuthorExportIssue('children', 1, i);
      const children = [];
      for (let j = 0; j < f.children.length; j++) {
        const c = f.children[j];
        if (!c.name?.trim()) throw new AuthorExportIssue('name', 1, i, j);
        if (!c.model) throw new AuthorExportIssue('xmp', 1, i, j);
        if (c.model.unsupported?.length && !c.acceptApprox) throw new AuthorExportIssue('approx', 1, i, j);
        try { children.push({...c, model: effectiveModel(c)}); }
        catch { throw new AuthorExportIssue('colour', 1, i, j); }
      }
      try { jobs.push({kind: 1, slot: i, source: f, data: await record({...f, children}, i, 1)}); }
      catch { throw new AuthorExportIssue('format', 1, i); }
    }
  }
  if (!jobs.length) throw new AuthorExportIssue(mode === 'update' ? 'noUpdate' : 'noFamily', mode === 'update' ? 2 : 1);
  return jobs;
}

export function authorIssueText(issue: AuthorExportIssue, lang: 'zh'|'en'|'ja') {
  const texts = {
    zh: {template:'请先载入已有胶片控制文件。',noUpdate:'还没有修改内置胶片颜色。调整后再导出。',noFamily:'请先完成至少一个作者家族。',name:'请填写名称。',icon:'请上传家族图标。',children:'请添加子胶片。',xmp:'请选择并完成 XMP 转换。',approx:'请先确认无法完整应用的 XMP 设置。',colour:'颜色数据无效，请重新选择 XMP 或还原颜色后重试。',format:'请检查名称、图标和修订号。'},
    en: {template:'Load an installed-film control file first.',noUpdate:'No built-in colours have changed. Adjust a look before exporting.',noFamily:'Complete at least one author family first.',name:'Enter a name.',icon:'Upload a family icon.',children:'Add a film.',xmp:'Choose an XMP and finish conversion.',approx:'Review unsupported XMP adjustments first.',colour:'Invalid colour data. Reload the XMP or reset the colour and retry.',format:'Check names, artwork and revision.'},
    ja: {template:'既存フィルムの管理ファイルを読み込んでください。',noUpdate:'内蔵フィルムの色は未変更です。調整してから書き出してください。',noFamily:'作者ファミリーを1つ以上完成させてください。',name:'名前を入力してください。',icon:'ファミリーのアイコンを選択してください。',children:'フィルムを追加してください。',xmp:'XMPを選び、変換を完了してください。',approx:'未対応のXMP設定を確認してください。',colour:'色データが無効です。XMPを読み直すか色を戻して再試行してください。',format:'名前、アイコン、リビジョンを確認してください。'}
  };
  const message = (texts[lang] as Record<string,string>)[issue.code] || issue.message;
  if (['template','noUpdate','noFamily'].includes(issue.code)) return message;
  const group = lang === 'zh' ? (issue.kind === 2 ? '内置胶片' : '作者家族') : lang === 'ja' ? (issue.kind === 2 ? '内蔵フィルム' : '作者ファミリー') : (issue.kind === 2 ? 'Built-in look' : 'Author family');
  const child = issue.child === undefined ? '' : (lang === 'zh' ? ' / 子胶片 ' : lang === 'ja' ? ' / フィルム ' : ' / Film ') + (issue.child+1);
  return `${group} ${issue.slot+1}${child} · ${message}`;
}
