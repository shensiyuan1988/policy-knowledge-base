import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Database,
  History,
  LayoutDashboard,
  ListChecks,
  Menu,
  X,
  Landmark,
  Bell,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '数据看板', icon: LayoutDashboard },
  { to: '/regulations', label: '法规管理', icon: BookOpen },
  { to: '/matters', label: '事项引用', icon: ListChecks },
  { to: '/changelog', label: '变更日志', icon: History },
  { to: '/data', label: '数据管理', icon: Database },
];

function pageTitle(pathname: string): string {
  if (pathname === '/') return '数据看板';
  if (pathname.startsWith('/regulations')) return '法规管理';
  if (pathname.startsWith('/matters')) return '事项引用';
  if (pathname.startsWith('/changelog')) return '变更日志';
  if (pathname.startsWith('/data')) return '数据管理';
  return '';
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-gov-sidebar text-slate-300">
      {/* 系统标识 */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gov-primary/20 border border-gov-primary/40">
          <Landmark className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-white leading-tight">政策知识库</div>
          <div className="text-xs text-slate-400 leading-tight mt-0.5">管理系统</div>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-gov-primary/25 text-white font-medium'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-gov-primary" />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 底部信息 */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="text-xs text-slate-400 leading-relaxed">
          残联政务事项数据后台
        </div>
        <div className="text-xs text-slate-500 mt-1">数据版本 v2.4 · 演示环境</div>
      </div>
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = pageTitle(location.pathname);
  const isDetail = location.pathname.match(/^\/regulations\/[^/]+$/);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:block w-[232px] shrink-0 h-full">
        <SidebarContent />
      </aside>

      {/* 移动端/平板抽屉 */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-gov-navy/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[248px] shadow-xl">
            <button
              className="absolute -right-9 top-3 flex h-8 w-8 items-center justify-center rounded bg-white text-slate-600 shadow"
              onClick={() => setMobileOpen(false)}
              aria-label="关闭导航"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* 右侧主区域 */}
      <div className="flex min-w-0 flex-1 flex-col h-full">
        {/* 顶部状态栏 */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gov-border bg-white px-4 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileOpen(true)}
              aria-label="打开导航"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline">首页</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden sm:inline" />
              <span className="font-medium text-slate-800 truncate">{title}</span>
              {isDetail && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  <span className="text-slate-500 truncate">法规详情</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-xs text-slate-400">
              数据更新于 2026-02-10
            </span>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="通知">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2.5 border-l border-gov-border pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gov-primary text-white text-sm font-medium">
                陈
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-[13px] font-medium text-slate-800">陈晓琳</div>
                <div className="text-xs text-slate-400">政策法规部</div>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
