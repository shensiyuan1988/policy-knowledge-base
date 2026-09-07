import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Scale,
  MessageSquareText,
  ListChecks,
  CalendarDays,
  Building2,
  Hash,
} from 'lucide-react';
import { useData } from '../store/DataContext';
import { ClauseTypeTag, LevelBadge, StatusBadge } from '../components/Tag';
import { SafeExternalLink } from '../components/SafeExternalLink';
import type { Clause } from '../types';

function InfoItem({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="mt-0.5 text-sm text-slate-800 break-words">{value}</div>
      </div>
    </div>
  );
}

function ClauseRow({ clause, defaultExpanded }: { clause: Clause; defaultExpanded: boolean }) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <div className="border border-gov-border rounded-lg overflow-hidden">
      {/* 条文头部（可点击展开） */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-start gap-3 bg-white px-4 py-3.5 text-left hover:bg-blue-50/40 transition-colors duration-150"
      >
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gov-primary/10 text-gov-primary">
          <FileText className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tabular text-sm font-semibold text-slate-900">{clause.no}</span>
            <span className="text-sm text-slate-800">{clause.title}</span>
            <ClauseTypeTag type={clause.type} />
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 line-clamp-2">
            {clause.summary}
          </p>
          {clause.matters.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5" onClick={e => e.stopPropagation()}>
              <span className="text-xs text-slate-400">被引用事项：</span>
              {clause.matters.map(m => (
                <Link
                  key={m.matterCode}
                  to={`/matters?code=${encodeURIComponent(m.matterCode)}`}
                  className="inline-flex items-center rounded border border-gov-primary/20 bg-gov-primary/5 px-1.5 py-0.5 text-xs text-gov-primary hover:bg-gov-primary/10"
                >
                  {m.matterName}
                </Link>
              ))}
            </div>
          )}
        </div>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 展开内容 */}
      {open && (
        <div className="expand-panel border-l-[3px] border-gov-primary bg-[#F8FAFD] px-4 py-4 space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
              <FileText className="h-3.5 w-3.5" /> 条文全文
            </div>
            {clause.fullText ? (
              <p className="text-sm leading-7 text-slate-800">{clause.fullText}</p>
            ) : clause.summary ? (
              <p className="text-sm leading-7 text-slate-700">{clause.summary}</p>
            ) : (
              <p className="text-[13px] text-slate-400 italic">暂无全文内容</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 mb-1">
                <Scale className="h-3.5 w-3.5" /> 量化阈值 / 适用口径
              </div>
              <p className="text-[13px] leading-6 text-amber-900/90">{clause.threshold}</p>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50/70 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 mb-1">
                <MessageSquareText className="h-3.5 w-3.5" /> 通俗解读
              </div>
              <p className="text-[13px] leading-6 text-blue-900/90">{clause.plainExplain}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
              <ListChecks className="h-3.5 w-3.5" /> 被引用事项（{clause.matters.length}）
            </div>
            {clause.matters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {clause.matters.map(m => (
                  <Link
                    key={m.matterCode}
                    to={`/matters?code=${encodeURIComponent(m.matterCode)}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gov-border bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:border-gov-primary/40 hover:text-gov-primary"
                  >
                    <span className="tabular text-slate-400">{m.matterCode}</span>
                    {m.matterName}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-slate-400">暂无政务事项直接引用本条文</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegulationDetail() {
  const { id } = useParams<string>();
  const { regulations } = useData();
  const reg = regulations.find(r => r.id === id);

  if (!reg) {
    return (
      <div className="gov-card p-12 text-center">
        <p className="text-slate-500">未找到该法规（ID：{id}）</p>
        <Link to="/regulations" className="btn-secondary mt-4">
          <ArrowLeft className="h-4 w-4" /> 返回法规列表
        </Link>
      </div>
    );
  }

  const refMatterCount = new Set(reg.clauses.flatMap(c => c.matters.map(m => m.matterCode))).size;

  return (
    <div className="space-y-4">
      <Link to="/regulations" className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-gov-primary">
        <ArrowLeft className="h-4 w-4" /> 返回法规列表
      </Link>

      {/* 法规基本信息 */}
      <div className="gov-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gov-border pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <LevelBadge level={reg.level} />
              <StatusBadge status={reg.status} />
              <span className="tabular text-xs text-slate-400">{reg.id}</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold text-slate-900 leading-snug">{reg.name}</h1>
            <p className="mt-1.5 text-[13px] text-slate-500">
              {reg.docNo} · 台账共 {reg.articleCount} 条 · 已结构化收录 {reg.clauses.length} 条 · 关联事项 {refMatterCount} 项
            </p>
          </div>
          <SafeExternalLink href={reg.sourceUrl} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-4 pt-4">
          <InfoItem icon={Building2} label="发文机关" value={reg.issuer} />
          <InfoItem icon={Hash} label="文号" value={reg.docNo} />
          <InfoItem icon={CalendarDays} label="发布日期" value={<span className="tabular">{reg.publishDate}</span>} />
          <InfoItem icon={CalendarDays} label="实施日期" value={<span className="tabular">{reg.implementDate}</span>} />
        </div>
      </div>

      {/* 条文列表 */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          条文列表
          <span className="ml-2 text-xs font-normal text-slate-400">（点击条文可展开全文、量化阈值与通俗解读）</span>
        </h2>
        {reg.clauses.map(c => (
          <ClauseRow key={c.id} clause={c} defaultExpanded />
        ))}
      </div>
    </div>
  );
}
