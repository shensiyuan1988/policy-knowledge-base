import { useRef, useState } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  Database,
  BookOpen,
  ListChecks,
  History,
  Link2,
  Bot,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  FileDown,
  ScrollText,
  Landmark,
  Loader2,
  FileText,
} from 'lucide-react';
import { useData } from '../store/DataContext';
import type { CollectionStatus, KnowledgeData } from '../types';
import { COLLECTION_EXPECTED_FIELDS } from '../data/collectionTasks';
import {
  exportRegulationsCsv,
  exportRegulationClausesCsv,
  exportMattersCsv,
  exportJsonBackup,
} from '../utils/exporter';

interface Tip {
  type: 'success' | 'error';
  text: string;
}

function isKnowledgeData(obj: unknown): obj is KnowledgeData {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    Array.isArray(o.regulations) &&
    Array.isArray(o.matters) &&
    Array.isArray(o.changeLogs)
  );
}

function dateStamp(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** 从 URL 粗提取来源站点标题 */
function hostOf(url: string): string {
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** 采集任务状态配色与图标 */
const TASK_STATUS_STYLE: Record<CollectionStatus, { dot: string; text: string; label: string }> = {
  待采集: { dot: 'bg-slate-400', text: 'text-slate-600', label: '待采集' },
  采集中: { dot: 'bg-amber-500 animate-pulse', text: 'text-amber-700', label: '采集中' },
  已完成: { dot: 'bg-green-500', text: 'text-green-700', label: '已完成' },
  失败: { dot: 'bg-red-500', text: 'text-red-700', label: '失败' },
};

export default function DataManage() {
  const {
    regulations,
    matters,
    changeLogs,
    collectionTasks,
    replaceData,
    addLog,
    addCollectionTask,
    resetData,
    refreshTasks,
  } = useData();

  const [tip, setTip] = useState<Tip | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // URL 采集
  const [urlInput, setUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 单部法规导出
  const [selectedRegId, setSelectedRegId] = useState<string>('');

  const totalClauses = regulations.reduce((s, r) => s + r.clauses.length, 0);

  const flash = (type: Tip['type'], text: string): void => {
    setTip({ type, text });
    window.setTimeout(() => setTip(null), 4000);
  };

  // ---------- URL 采集 ----------
  const handlePreview = (): void => {
    const url = urlInput.trim();
    if (!url) {
      flash('error', '请先粘贴法规网页链接。');
      return;
    }
    if (!isValidUrl(url)) {
      flash('error', '链接格式不正确，请粘贴以 http:// 或 https:// 开头的法规网页地址。');
      return;
    }
    setPreviewUrl(url);
  };

  const handleConfirmCollect = async (): Promise<void> => {
    if (!previewUrl) return;
    setSubmitting(true);
    const url = previewUrl;
    try {
      // 1. 登记结构化采集任务单（写入 ingestion_tasks，status=pending）
      const task = await addCollectionTask({
        url,
        sourceTitle: `${hostOf(url)} · 待 AI 解析的法规网页`,
        status: '待采集',
        submittedBy: '数据管理员',
        expectedFields: COLLECTION_EXPECTED_FIELDS,
        note: '任务已登记在数据库，等待 AI Agent 调度采集。',
      });
      addLog({
        action: '新增',
        targetType: '采集任务',
        targetName: task.id,
        summary: `提交法规链接采集任务：${hostOf(url)}，已写入采集任务表，将由 AI Agent 抓取正文并结构化解析为法规信息与条文。`,
      });
      // 2. 刷新数据库中的任务记录列表
      await refreshTasks();
      setSubmitting(false);
      setPreviewUrl(null);
      setUrlInput('');
      flash('success', `采集任务 ${task.id} 已入库（待采集），AI Agent 将在后端完成实际采集解析。`);
    } catch (err) {
      setSubmitting(false);
      flash('error', `采集任务入库失败：${err instanceof Error ? err.message : '请稍后重试'}`);
    }
  };

  // ---------- 导出 ----------
  const handleExportRegulations = (): void => {
    exportRegulationsCsv(regulations);
    addLog({
      action: '同步',
      targetType: '数据导出',
      targetName: '法规清单（Excel/CSV）',
      summary: `导出全部法规清单 ${regulations.length} 部，含名称、文号、发文机关、层级、日期、条文数、业务领域、来源链接。`,
    });
    flash('success', `已导出法规清单 ${regulations.length} 部（CSV，可用 Excel 打开）。`);
  };

  const handleExportClauses = (): void => {
    const reg = regulations.find(r => r.id === selectedRegId);
    if (!reg) {
      flash('error', '请先选择要导出条文明细的法规。');
      return;
    }
    exportRegulationClausesCsv(reg);
    addLog({
      action: '同步',
      targetType: '数据导出',
      targetName: `条文明细 · ${reg.name}`,
      summary: `导出《${reg.name}》条文明细 ${reg.clauses.length} 条（示例条文），含编号、标题、类型、摘要、全文、阈值、解读。`,
    });
    flash('success', `已导出《${reg.name}》条文明细（CSV）。`);
  };

  const handleExportMatters = (): void => {
    exportMattersCsv(matters, regulations);
    addLog({
      action: '同步',
      targetType: '数据导出',
      targetName: '事项引用关系表（Excel/CSV）',
      summary: `导出事项引用关系表 ${matters.length} 个事项，含引用法规与条文明细。`,
    });
    flash('success', `已导出事项引用关系表 ${matters.length} 个事项（CSV）。`);
  };

  const handleExportJson = (): void => {
    const payload: KnowledgeData = {
      regulations,
      matters,
      changeLogs,
      collectionTasks,
    };
    exportJsonBackup(`政策知识库数据_${dateStamp()}.json`, payload);
    addLog({
      action: '同步',
      targetType: '数据导出',
      targetName: '知识库全量数据（JSON 备份）',
      summary: `导出全量数据备份：${regulations.length} 部法规、${matters.length} 个事项、${collectionTasks.length} 个采集任务。`,
    });
    flash('success', '已导出 JSON 全量备份文件。');
  };

  // ---------- JSON 手动导入 ----------
  const handleImportFile = (file: File): void => {
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!isKnowledgeData(parsed)) {
          throw new Error('文件结构不符合政策知识库数据格式');
        }
        replaceData(parsed);
        addLog({
          action: '新增',
          targetType: '数据导入',
          targetName: file.name,
          summary: `导入 JSON 数据文件：${parsed.regulations.length} 部法规、${parsed.matters.length} 个事项，覆盖当前演示数据。`,
        });
        flash(
          'success',
          `导入成功：法规 ${parsed.regulations.length} 部、事项 ${parsed.matters.length} 个。`,
        );
      } catch (err) {
        flash(
          'error',
          `导入失败：${err instanceof Error ? err.message : 'JSON 文件解析错误，请检查文件内容'}`,
        );
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowAdvanced(false);
      }
    };
    reader.onerror = () => {
      setImporting(false);
      flash('error', '文件读取失败，请重试。');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleSync = (): void => {
    setSyncing(true);
    window.setTimeout(() => {
      resetData();
      addLog({
        action: '同步',
        targetType: '数据同步',
        targetName: '现有政策数据源',
        summary: '执行"同步现有数据"：已恢复并校准内置基准数据集（19 部法规台账），引用关系重新校对完成。',
      });
      setSyncing(false);
      setSelectedRegId(regulations[0]?.id ?? '');
      flash('success', '同步完成：知识库数据已与现有数据源校准。');
    }, 1200);
  };

  const overviewItems = [
    { label: '法规（部）', value: regulations.length, icon: BookOpen },
    { label: '已结构化条文（条）', value: totalClauses, icon: FileText },
    { label: '政务事项（个）', value: matters.length, icon: ListChecks },
    { label: '采集任务（个）', value: collectionTasks.length, icon: Bot },
  ];

  const exportCards = [
    {
      icon: FileSpreadsheet,
      iconCls: 'bg-green-600/10 text-green-600',
      title: '导出法规清单（Excel）',
      desc: '全部法规的名称、文号、发文机关、层级、发布/实施日期、状态、条文数、业务领域、来源链接。',
      action: handleExportRegulations,
      btn: '导出法规清单 CSV',
    },
    {
      icon: ScrollText,
      iconCls: 'bg-gov-primary/10 text-gov-primary',
      title: '导出单部法规条文明细（Excel）',
      desc: '选择一部法规，导出其全部条文明细：编号、标题、类型、摘要、全文、量化阈值、通俗解读。',
      action: handleExportClauses,
      btn: '导出条文明细 CSV',
      select: true,
    },
    {
      icon: Landmark,
      iconCls: 'bg-indigo-500/10 text-indigo-600',
      title: '导出事项引用关系表（Excel）',
      desc: '每个政务事项引用了哪些法规、哪些条文，含引用法规数与条文数汇总。',
      action: handleExportMatters,
      btn: '导出引用关系表 CSV',
    },
    {
      icon: FileJson,
      iconCls: 'bg-amber-500/10 text-amber-600',
      title: '导出 JSON 备份',
      desc: '全量知识库数据（法规、条文、事项、日志、采集任务）导出为标准 JSON，用于备份或迁移。',
      action: handleExportJson,
      btn: '导出 JSON 备份',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">数据导入 / 导出</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          通过法规网页链接由 AI 采集入库，或导出 Excel/CSV 报表与 JSON 备份
        </p>
      </div>

      {tip && (
        <div
          className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm ${
            tip.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {tip.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {tip.text}
        </div>
      )}

      {/* 当前数据概览 */}
      <div className="gov-card p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Database className="h-4 w-4 text-gov-primary" /> 当前数据概览
        </h2>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {overviewItems.map(item => (
            <div key={item.label} className="rounded-lg border border-gov-border bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <item.icon className="h-4 w-4 text-gov-primary" />
                {item.label}
              </div>
              <div className="tabular mt-2 text-2xl font-semibold text-slate-900">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 导入（左） / 导出（右） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* ===== 左：URL 采集入库 ===== */}
        <div className="space-y-4">
          <div className="gov-card p-5 border-gov-primary/30">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gov-primary/10 text-gov-primary">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">链接采集入库</h2>
                <p className="text-xs text-slate-500">粘贴法规网页链接，由 AI 自动采集并结构化解析</p>
              </div>
            </div>

            {/* URL 输入 */}
            <div className="mt-4">
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
                法规网页链接
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handlePreview();
                  }}
                  placeholder="例如 https://www.gov.cn/.../content_xxxx.htm"
                  className="flex-1 rounded-md border border-gov-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-gov-primary focus:ring-2 focus:ring-gov-primary/15"
                />
                <button type="button" onClick={handlePreview} className="btn-primary shrink-0">
                  <Bot className="h-4 w-4" /> 采集入库
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                支持中国政府网、广东省/深圳市政府门户、残联官网等公开发布的法规页面链接。
              </p>
            </div>

            {/* 采集预览面板 */}
            {previewUrl && (
              <div className="mt-4 rounded-lg border border-gov-primary/30 bg-gov-primary/[0.04] p-4">
                <div className="flex items-start gap-2">
                  <ClipboardPaste className="mt-0.5 h-4 w-4 shrink-0 text-gov-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">采集预览 · 待提交 AI 解析</p>
                    <p className="mt-1 break-all rounded bg-white px-2.5 py-1.5 text-[13px] text-gov-deep border border-gov-border">
                      {previewUrl}
                    </p>
                    <div className="mt-3 flex items-start gap-2 rounded-md bg-white/70 p-2.5 text-xs leading-5 text-slate-600 border border-gov-border">
                      <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gov-primary" />
                      <span>
                        确认后将生成结构化<b className="text-slate-800">采集任务单</b>，提交给 AI
                        Agent 抓取法规全文，自动解析法规名称、文号、发文机关、层级、日期、状态、业务领域，并拆分条文（编号 / 标题 / 类型 /
                        摘要 / 全文），解析结果经人工复核后入库。
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmCollect}
                        disabled={submitting}
                        className="btn-primary"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> 正在提交…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> 确认提交采集
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(null)}
                        disabled={submitting}
                        className="btn-secondary"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 采集任务记录（表格：编号 / URL / 状态 / 创建时间） */}
          <div className="gov-card p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <History className="h-4 w-4 text-gov-primary" /> 采集任务记录
              <span className="rounded-full bg-gov-primary/10 px-2 py-0.5 text-xs font-medium text-gov-primary">
                {collectionTasks.length}
              </span>
            </h2>
            {collectionTasks.length === 0 ? (
              <p className="mt-6 rounded-lg border border-dashed border-gov-border bg-slate-50/60 py-8 text-center text-[13px] text-slate-400">
                暂无采集任务，请在上方粘贴法规网页链接并「采集入库」
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-lg border border-gov-border">
                <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500">
                      <th className="whitespace-nowrap px-3 py-2.5 font-medium">任务编号</th>
                      <th className="px-3 py-2.5 font-medium">法规网页链接（URL）</th>
                      <th className="whitespace-nowrap px-3 py-2.5 font-medium">状态</th>
                      <th className="whitespace-nowrap px-3 py-2.5 font-medium">创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionTasks.map(task => {
                      const st = TASK_STATUS_STYLE[task.status];
                      return (
                        <tr
                          key={task.id}
                          className="border-t border-gov-border align-top transition hover:bg-gov-primary/[0.03]"
                        >
                          <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-800">
                            {task.id}
                          </td>
                          <td className="max-w-[320px] px-3 py-3">
                            <a
                              href={task.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block break-all text-xs text-gov-primary hover:underline"
                              title={task.url}
                            >
                              {task.url}
                            </a>
                            {task.sourceTitle && (
                              <span className="mt-1 block truncate text-[12px] text-slate-400">
                                {task.sourceTitle}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${st.text}`}>
                              {task.status === '采集中' ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                              )}
                              {st.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                            {task.createdAt}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 rounded-md border border-gov-border bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
              说明：任务单已写入数据库（ingestion_tasks，状态 pending），状态在此列表展示；实际网页抓取与条文结构化解析由
              AI Agent 在后端完成，复核后自动写入知识库。
            </p>
          </div>

          {/* 高级：手动 JSON 导入 + 同步 */}
          <div className="gov-card p-5">
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                <Upload className="h-4 w-4 text-gov-primary" /> 高级选项
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-gov-border p-4">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <FileJson className="h-4 w-4 text-amber-600" /> 手动导入 JSON
                  </h3>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">
                    已有结构化 JSON 文件时可直接导入（覆盖当前演示数据）。也可将 JSON
                    文本粘贴后上传，文件需包含 regulations / matters / changeLogs 字段。
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleImportFile(f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="btn-secondary mt-3"
                  >
                    <Upload className="h-4 w-4" /> {importing ? '正在导入…' : '选择 JSON 文件导入'}
                  </button>
                </div>

                <div className="rounded-lg border border-gov-border p-4">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <RefreshCw className={`h-4 w-4 text-green-600 ${syncing ? 'animate-spin' : ''}`} /> 同步现有数据
                  </h3>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">
                    与现有政策数据源进行同步校准（演示环境将恢复内置基准数据集），同步完成后自动写入日志。
                  </p>
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="btn-secondary mt-3"
                    style={{ color: '#16A34A', borderColor: '#16A34A40' }}
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? '同步中…' : '同步现有数据'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== 右：导出 ===== */}
        <div className="space-y-4">
          <div className="gov-card p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <FileDown className="h-4 w-4 text-gov-primary" /> 数据导出
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              报表导出为 CSV（Excel 可直接打开，中文无乱码），JSON 用于全量备份。
            </p>
            <div className="mt-4 space-y-3">
              {exportCards.map(card => (
                <div
                  key={card.title}
                  className="rounded-lg border border-gov-border p-4 transition hover:border-gov-primary/40 hover:shadow-card-strong"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconCls}`}
                    >
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
                      <p className="mt-1 text-[13px] leading-6 text-slate-500">{card.desc}</p>
                      {card.select && (
                        <select
                          value={selectedRegId}
                          onChange={e => setSelectedRegId(e.target.value)}
                          className="mt-2.5 w-full rounded-md border border-gov-border bg-white px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-gov-primary focus:ring-2 focus:ring-gov-primary/15"
                        >
                          {regulations.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.id} · {r.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <button type="button" onClick={card.action} className="btn-secondary mt-3">
                        <Download className="h-4 w-4" /> {card.btn}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 格式说明 */}
          <div className="gov-card p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <FileJson className="h-4 w-4 text-gov-primary" /> 数据文件格式说明
            </h2>
            <div className="mt-3 overflow-x-auto rounded-lg border border-gov-border">
              <pre className="p-4 text-[13px] leading-6 text-slate-600 bg-slate-50/70">
{`{
  "regulations": [          // 法规：id / name / docNo / issuer / level /
                            //   publishDate / implementDate / status / articleCount /
                            //   category / sourceUrl / clauses[]（条文：id / no /
                            //   title / type / summary / fullText / threshold / plainExplain）
  ],
  "matters": [              // 事项：code / name / department / category /
                            //   references[]（regId + clauseId 引用关系）
  ],
  "collectionTasks": [      // 采集任务：id / url / status / createdAt / expectedFields
  ],
  "changeLogs": [           // 变更日志：id / time / action / targetType / targetName
  ]
}`}
              </pre>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              说明：CSV 报表带 UTF-8 BOM，可直接用 Excel/WPS 打开；当前为前端模拟数据演示，后续将对接政策法规真实 API。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
