import { Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  ListChecks,
  FolderOpen,
  ClipboardList,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useData } from '../store/DataContext';
import {
  CLAUSE_TYPE_DISTRIBUTION,
  CLAUSE_TYPE_COLORS,
  LEVEL_DISTRIBUTION,
  OVERVIEW_STATS,
} from '../data';
import type { ClauseType } from '../types';

interface StatItem {
  label: string;
  value: number;
  unit: string;
  icon: typeof BookOpen;
  accent: string;
}

const STATS: StatItem[] = [
  { label: '法规总数', value: OVERVIEW_STATS.regulationCount, unit: '部', icon: BookOpen, accent: '#1A73E8' },
  { label: '条文总数', value: OVERVIEW_STATS.clauseCount, unit: '条', icon: FileText, accent: '#0B3D91' },
  { label: '事项引用数', value: OVERVIEW_STATS.matterRefCount, unit: '条次', icon: ListChecks, accent: '#0284C7' },
  { label: '材料总数', value: OVERVIEW_STATS.materialCount, unit: '份', icon: FolderOpen, accent: '#D97706' },
  { label: '表单数', value: OVERVIEW_STATS.formCount, unit: '套', icon: ClipboardList, accent: '#7C3AED' },
  { label: '证照数', value: OVERVIEW_STATS.licenseCount, unit: '类', icon: BadgeCheck, accent: '#16A34A' },
];

const ACTION_LABEL: Record<string, string> = {
  新增: 'text-green-700 bg-green-50',
  修改: 'text-blue-700 bg-blue-50',
  删除: 'text-red-700 bg-red-50',
  同步: 'text-slate-600 bg-slate-100',
};

export default function Dashboard() {
  const { changeLogs } = useData();
  const recentLogs = changeLogs.slice(0, 6);
  const totalClauses = CLAUSE_TYPE_DISTRIBUTION.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-5">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">数据看板</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          政策法规知识库整体运行情况一览，数据来源于法规台账与政务事项引用关系库
        </p>
      </div>

      {/* 指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATS.map(stat => (
          <div key={stat.label} className="gov-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-slate-500">{stat.label}</span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${stat.accent}12`, color: stat.accent }}
              >
                <stat.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="tabular text-[30px] leading-none font-semibold text-slate-900">
                {stat.value}
              </span>
              <span className="text-xs text-slate-400">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* 条文类型分布 环形图 */}
        <div className="gov-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">条文类型分布</h2>
              <p className="text-xs text-slate-400 mt-0.5">按条款功能分类统计（台账口径共 {totalClauses} 条结构化条文）</p>
            </div>
            <Link to="/regulations" className="flex items-center gap-1 text-[13px] text-gov-primary hover:underline">
              查看法规 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CLAUSE_TYPE_DISTRIBUTION}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={118}
                  paddingAngle={1.5}
                  strokeWidth={1}
                >
                  {CLAUSE_TYPE_DISTRIBUTION.map(entry => (
                    <Cell key={entry.type} fill={CLAUSE_TYPE_COLORS[entry.type as ClauseType]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} 条`, name]}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E4E9F2',
                    fontSize: 13,
                    boxShadow: '0 4px 14px rgba(15,42,74,0.1)',
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={10}
                  iconType="square"
                  formatter={(value: string) => (
                    <span className="text-[13px] text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 法规层级分布 柱状图 */}
        <div className="gov-card p-5">
          <h2 className="text-base font-semibold text-slate-900">法规层级分布</h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">按发文机关层级统计</p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...LEVEL_DISTRIBUTION]} margin={{ top: 10, right: 10, left: -18, bottom: 0 }} barSize={42}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F6" />
                <XAxis dataKey="level" tick={{ fontSize: 13, fill: '#6B7280' }} axisLine={{ stroke: '#E4E9F2' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={value => [`${value} 部`, '法规数量']}
                  cursor={{ fill: '#F0F6FF' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E4E9F2',
                    fontSize: 13,
                    boxShadow: '0 4px 14px rgba(15,42,74,0.1)',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#1A73E8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 最近变更 */}
      <div className="gov-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">最近变更动态</h2>
          <Link to="/changelog" className="flex items-center gap-1 text-[13px] text-gov-primary hover:underline">
            全部日志 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentLogs.map(log => (
            <div key={log.id} className="flex items-center gap-4 py-2.5">
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${ACTION_LABEL[log.action] ?? 'bg-slate-100 text-slate-600'}`}
              >
                {log.action}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-[13px] text-slate-800 mr-2">{log.targetName}</span>
                <span className="text-xs text-slate-400 line-clamp-1">{log.summary}</span>
              </div>
              <span className="tabular shrink-0 text-xs text-slate-400">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
