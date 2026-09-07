import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Regulations from './pages/Regulations';
import RegulationDetail from './pages/RegulationDetail';
import Matters from './pages/Matters';
import ChangeLog from './pages/ChangeLog';
import DataManage from './pages/DataManage';
import { useData } from './store/DataContext';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

/** 数据加载门面：数据库数据就绪前显示加载/错误态 */
function DataGate({ children }: { children: React.ReactNode }) {
  const { loading, error, resetData } = useData();
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-gov-primary" />
          <p className="text-sm">正在从知识库数据库加载数据…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="mt-3 text-base font-semibold text-red-700">数据加载失败</h2>
          <p className="mt-2 break-all text-sm text-red-600">{error}</p>
          <p className="mt-2 text-xs text-red-400">
            请检查 .env 中的 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY 是否正确配置
          </p>
          <button
            type="button"
            onClick={() => void resetData()}
            className="btn-primary mt-4"
          >
            <RefreshCw className="h-4 w-4" /> 重新加载
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <DataGate>
              <Dashboard />
            </DataGate>
          }
        />
        <Route
          path="/regulations"
          element={
            <DataGate>
              <Regulations />
            </DataGate>
          }
        />
        <Route
          path="/regulations/:id"
          element={
            <DataGate>
              <RegulationDetail />
            </DataGate>
          }
        />
        <Route
          path="/matters"
          element={
            <DataGate>
              <Matters />
            </DataGate>
          }
        />
        <Route
          path="/changelog"
          element={
            <DataGate>
              <ChangeLog />
            </DataGate>
          }
        />
        <Route
          path="/data"
          element={
            <DataGate>
              <DataManage />
            </DataGate>
          }
        />
        <Route
          path="*"
          element={
            <DataGate>
              <Dashboard />
            </DataGate>
          }
        />
      </Route>
    </Routes>
  );
}
