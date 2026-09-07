import { useMemo, useState } from 'react';
import { History, PlusCircle, PencilLine, Trash2, RefreshCw, User } from 'lucide-react';
import { useData } from '../store/DataContext';
import type { ChangeAction } from '../types';

const ACTION_STYLE: Record<ChangeAction, { chip: string; icon: typeof PlusCircle; color: string }> = {
  新增: { chip: 'bg-green-50 text-green-700 border-green-200', icon: PlusCircle, color: '#16A34A' },
  修改: { chip: 'bg-blue-50 text-blue-700 border-blue-200', icon: PencilLine, color: '#1A73E8' },
  删除: { chip: 'bg-red-50 text-red-700 border-red-200', icon: Trash2, color: '#DC2626' },
  同步: { chip: 'bg-slate-100 text-slate-600 border-slate-200', icon: RefreshCw, color: '#64748B' },
};

const FILTER_OPTIONS: (ChangeAction | '全部')[] = ['全部', '新增', '修改', '删除', '同步'];

export default function ChangeLog() {
  const { changeLogs } = useData();
  const [filter, setFilter] = useState<ChangeAction | '全部'>('全部');

  const filtered = useMemo(
    () => (filter === '全部' ? changeLogs : changeLogs.filter(l => l.action === filter)),
    [changeLogs, filter],
  );

  // 按日期分组（time 格式 YYYY-MM-DD HH:mm）
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const log of filtered) {
      const day = log.time.slice(0, 10);
      const list = map.get(day) ?? [];
      list.push(log);
      map.set(day, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">变更日志</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          记录知识库所有法规、条文、事项与数据同步操作，共 {changeLogs.length} 条
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => setFilter(opt)}
            className={`rounded-md border px-3 py-1.5 text-[13px] transition-colors duration-150 ${
              filter === opt
                ? 'border-gov-primary bg-gov-primary text-white'
                : 'border-gov-border bg-white text-slate-600 hover:border-gov-primary/40 hover:text-gov-primary'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="gov-card p-5 md:p-7">
        {groups.length === 0 && (
          <div className="py-12 text-center text-slate-400">暂无该类型的变更记录</div>
        )}
        {groups.map(([day, logs]) => (
          <div key={day} className="relative">
            {/* 日期分组标题 */}
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-gov-primary" />
              <span className="tabular text-sm font-semibold text-slate-800">{day}</span>
              <span className="text-xs text-slate-400">{logs.length} 条记录</span>
            </div>

            <div className="relative ml-2 pb-6 border-l-2 border-slate-100 pl-6 last:pb-0">
              {logs.map(log => {
                const style = ACTION_STYLE[log.action];
                return (
                  <div key={log.id} className="relative pb-6 last:pb-0">
                    {/* 时间线节点 */}
                    <span
                      className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: style.color }}
                    >
                      <style.icon className="h-3 w-3 text-white" />
                    </span>

                    <div className="rounded-lg border border-gov-border bg-white p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded border px-2 py-0.5 text-xs font-medium ${style.chip}`}
                        >
                          {log.action}
                        </span>
                        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                          {log.targetType}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{log.targetName}</span>
                        <span className="tabular ml-auto text-xs text-slate-400">{log.time.slice(11)}</span>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-slate-600">{log.summary}</p>
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
                        <User className="h-3.5 w-3.5" />
                        操作人：{log.operator}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
