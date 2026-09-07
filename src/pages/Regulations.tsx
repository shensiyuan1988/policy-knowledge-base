import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { useData } from '../store/DataContext';
import { LevelBadge, StatusBadge } from '../components/Tag';
import type { RegulationLevel, RegulationStatus } from '../types';

const LEVEL_OPTIONS: (RegulationLevel | '全部')[] = ['全部', '国家级', '省级', '市级', '区级'];
const STATUS_OPTIONS: (RegulationStatus | '全部')[] = ['全部', '现行有效', '即将实施', '已废止'];

export default function Regulations() {
  const { regulations } = useData();
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState<RegulationLevel | '全部'>('全部');
  const [status, setStatus] = useState<RegulationStatus | '全部'>('全部');

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return regulations.filter(reg => {
      if (level !== '全部' && reg.level !== level) return false;
      if (status !== '全部' && reg.status !== status) return false;
      if (!kw) return true;
      return (
        reg.name.toLowerCase().includes(kw) ||
        reg.docNo.toLowerCase().includes(kw) ||
        reg.issuer.toLowerCase().includes(kw) ||
        reg.id.toLowerCase().includes(kw)
      );
    });
  }, [regulations, keyword, level, status]);

  const resetFilters = (): void => {
    setKeyword('');
    setLevel('全部');
    setStatus('全部');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">法规管理</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            共收录法规 {regulations.length} 部，点击法规名称可查看条文详情与事项引用关系
          </p>
        </div>
        <Link to="/data" className="btn-secondary">
          <BookOpen className="h-4 w-4" />
          导入/导出数据
        </Link>
      </div>

      {/* 筛选栏 */}
      <div className="gov-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜索法规名称 / 文号 / 发文机关 / ID"
              className="w-full rounded-md border border-gov-border bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-gov-primary focus:ring-2 focus:ring-gov-primary/15"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[13px] text-slate-500 whitespace-nowrap">层级</label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value as RegulationLevel | '全部')}
              className="rounded-md border border-gov-border bg-white px-3 py-2 text-sm outline-none focus:border-gov-primary"
            >
              {LEVEL_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[13px] text-slate-500 whitespace-nowrap">状态</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as RegulationStatus | '全部')}
              className="rounded-md border border-gov-border bg-white px-3 py-2 text-sm outline-none focus:border-gov-primary"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {(keyword || level !== '全部' || status !== '全部') && (
            <button onClick={resetFilters} className="text-[13px] text-gov-primary hover:underline">
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 法规表格 */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="gov-table min-w-[960px]">
            <thead>
              <tr>
                <th>法规ID</th>
                <th className="min-w-[260px]">法规名称</th>
                <th>文号</th>
                <th className="min-w-[200px]">发文机关</th>
                <th>层级</th>
                <th>实施日期</th>
                <th>状态</th>
                <th className="text-right">条文数</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(reg => (
                <tr key={reg.id}>
                  <td className="tabular text-[13px] text-slate-500">{reg.id}</td>
                  <td>
                    <Link
                      to={`/regulations/${reg.id}`}
                      className="text-[14px] font-medium text-gov-primary hover:underline"
                    >
                      {reg.name}
                    </Link>
                  </td>
                  <td className="text-[13px] text-slate-600 whitespace-nowrap">{reg.docNo}</td>
                  <td className="text-[13px] text-slate-600">{reg.issuer}</td>
                  <td>
                    <LevelBadge level={reg.level} />
                  </td>
                  <td className="tabular text-[13px] text-slate-600 whitespace-nowrap">{reg.implementDate}</td>
                  <td>
                    <StatusBadge status={reg.status} />
                  </td>
                  <td className="tabular text-right text-[13px] text-slate-700">
                    {reg.articleCount} 条
                  </td>
                  <td>
                    <Link to={`/regulations/${reg.id}`} className="text-slate-400 hover:text-gov-primary">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    未找到符合条件的法规，请调整筛选条件
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gov-border bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500">
          <span>
            筛选结果 {filtered.length} 部 / 全部 {regulations.length} 部
          </span>
          <span className="hidden sm:inline">演示数据 · 后续对接政策法规真实接口</span>
        </div>
      </div>
    </div>
  );
}
