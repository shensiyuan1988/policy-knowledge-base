import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, BookOpen, Link2 } from 'lucide-react';
import { useData } from '../store/DataContext';
import { ClauseTypeTag } from '../components/Tag';

interface ResolvedRef {
  clauseId: string;
  regId: string;
  regName: string;
  regLevel: string;
  clauseNo: string;
  clauseTitle: string;
  clauseType: ReactNode;
}

export default function Matters() {
  const { matters, regulations } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusCode = searchParams.get('code') ?? '';
  const [openCode, setOpenCode] = useState<string>(focusCode);
  const [keyword, setKeyword] = useState('');

  const regMap = useMemo(
    () => new Map(regulations.map(r => [r.id, r])),
    [regulations],
  );

  const resolveRefs = (code: string): ResolvedRef[] => {
    const matter = matters.find(m => m.code === code);
    if (!matter) return [];
    return matter.references
      .map(ref => {
        const reg = regMap.get(ref.regId);
        const clause = reg?.clauses.find(c => c.id === ref.clauseId);
        if (!reg || !clause) return null;
        return {
          clauseId: ref.clauseId,
          regId: ref.regId,
          regName: reg.name,
          regLevel: reg.level,
          clauseNo: clause.no,
          clauseTitle: clause.title,
          clauseType: <ClauseTypeTag type={clause.type} />,
        } as ResolvedRef;
      })
      .filter((x): x is ResolvedRef => x !== null);
  };

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return matters.filter(
      m =>
        !kw ||
        m.name.toLowerCase().includes(kw) ||
        m.code.toLowerCase().includes(kw) ||
        m.department.toLowerCase().includes(kw),
    );
  }, [matters, keyword]);

  const toggle = (code: string): void => {
    if (openCode === code) {
      setOpenCode('');
      if (focusCode) setSearchParams({});
    } else {
      setOpenCode(code);
      if (focusCode) setSearchParams({});
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">事项引用视图</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          以政务事项为维度，查看每个办事事项所引用的法规条文依据，共 {matters.length} 个演示事项
        </p>
      </div>

      <div className="gov-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索事项名称 / 编码 / 实施部门"
            className="w-full rounded-md border border-gov-border bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-gov-primary focus:ring-2 focus:ring-gov-primary/15"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(matter => {
          const open = openCode === matter.code;
          const refs = resolveRefs(matter.code);
          const regSet = new Set(matter.references.map(r => r.regId));
          return (
            <div key={matter.code} className="gov-card overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(matter.code)}
                className="flex w-full items-center gap-4 bg-white px-4 md:px-5 py-4 text-left hover:bg-blue-50/40 transition-colors duration-150"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    open ? 'bg-gov-primary text-white' : 'bg-gov-primary/10 text-gov-primary'
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular text-[13px] text-slate-400">{matter.code}</span>
                    <span className="text-sm font-medium text-slate-900">{matter.name}</span>
                    <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-500">
                      {matter.category}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 truncate">{matter.department}</div>
                </div>
                <div className="hidden md:flex items-center gap-4 shrink-0 text-[13px]">
                  <div className="text-center">
                    <div className="tabular text-lg font-semibold text-slate-800">{regSet.size}</div>
                    <div className="text-xs text-slate-400">引用法规</div>
                  </div>
                  <div className="text-center">
                    <div className="tabular text-lg font-semibold text-gov-primary">{refs.length}</div>
                    <div className="text-xs text-slate-400">引用条文</div>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
              </button>

              {open && (
                <div className="expand-panel border-t border-gov-border bg-[#F8FAFD] px-4 md:px-5 py-4">
                  <div className="md:hidden flex gap-6 pb-3 text-[13px]">
                    <span className="text-slate-600">引用法规 <b className="text-slate-800">{regSet.size}</b> 部</span>
                    <span className="text-slate-600">引用条文 <b className="text-gov-primary">{refs.length}</b> 条</span>
                  </div>
                  <div className="space-y-2.5">
                    {refs.map(ref => (
                      <Link
                        key={ref.clauseId}
                        to={`/regulations/${ref.regId}`}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-gov-border bg-white px-3.5 py-2.5 hover:border-gov-primary/40 hover:shadow-cardHover transition-all duration-150"
                      >
                        <BookOpen className="h-4 w-4 shrink-0 text-gov-primary" />
                        <span className="text-[13px] text-slate-800">
                          <span className="font-medium">{ref.regName}</span>
                          <span className="mx-1.5 text-slate-300">/</span>
                          <span className="tabular font-medium text-gov-primary">{ref.clauseNo}</span>
                          <span className="mx-1.5 text-slate-300">·</span>
                          {ref.clauseTitle}
                        </span>
                        <span className="ml-auto">{ref.clauseType}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="gov-card py-14 text-center text-slate-400">未找到符合条件的事项</div>
        )}
      </div>
    </div>
  );
}
