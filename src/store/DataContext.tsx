import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  ChangeAction,
  ChangeLogEntry,
  CollectionStatus,
  CollectionTask,
  KnowledgeData,
  Matter,
  Regulation,
} from '../types';
import {
  getChangeLogs,
  getIngestionTasks,
  getMatters,
  getRegulations,
  insertIngestionTask,
  type IngestionTaskRow,
} from '../services/api';

interface DataContextValue {
  /** 是否正在从数据库加载 */
  loading: boolean;
  /** 加载出错信息（成功/空则为 null） */
  error: string | null;
  regulations: Regulation[];
  matters: Matter[];
  changeLogs: ChangeLogEntry[];
  collectionTasks: CollectionTask[];
  /** 全量替换知识库数据（导入，仅作用于当前会话展示态，不落库） */
  replaceData: (data: KnowledgeData) => void;
  /** 追加一条变更日志（仅当前会话展示态） */
  addLog: (entry: Omit<ChangeLogEntry, 'id' | 'time' | 'operator'> & { operator?: string }) => void;
  /** 登记一条采集任务（写入 ingestion_tasks，status=pending） */
  addCollectionTask: (task: Omit<CollectionTask, 'id' | 'createdAt'>) => Promise<CollectionTask>;
  /** 更新采集任务状态（当前会话） */
  updateCollectionTask: (id: string, patch: Partial<CollectionTask>) => void;
  /** 重新从数据库加载（同步现有数据） */
  resetData: () => Promise<void>;
  /** 重新拉取采集任务列表（采集入库后刷新） */
  refreshTasks: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function nowString(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** 数据库采集任务状态（英文）到前端展示状态的归一化 */
function toStatus(raw: string | undefined | null, pendingGuess = false): CollectionStatus {
  const s = (raw ?? '').trim();
  // 兼容已入库的中文历史状态
  if (s === '待采集' || s === 'pending' || s === 'submitted') return '待采集';
  if (s === '采集中' || s === 'processing' || s === 'processing_pending') return '采集中';
  if (s === '已完成' || s === 'done' || s === 'completed') return '已完成';
  if (s === '失败' || s === 'failed' || s === 'error') return '失败';
  if (s == null && pendingGuess) return '待采集';
  if (!s) return '待采集';
  return s as CollectionStatus;
}

function toCollectionTask(row: IngestionTaskRow): CollectionTask {
  return {
    id: String(row.id),
    url: row.url,
    sourceTitle: row.regulation_name ?? '待 AI 解析的法规网页',
    status: toStatus(row.status, true),
    createdAt: row.created_at
      ? row.created_at.replace('T', ' ').replace(/\.\d+Z$/, '').replace(/Z$/, '')
      : nowString(),
    submittedBy: '数据管理员',
    expectedFields: [],
    note: '',
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [collectionTasks, setCollectionTasks] = useState<CollectionTask[]>([]);

  // 会话级"展示态"数据（导入 JSON 时覆盖展示，不写库）
  const sessionData = useRef<{ regulations: Regulation[]; matters: Matter[] } | null>(null);

  const loadAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [regs, ms, logs, tasks] = await Promise.all([
        getRegulations(),
        getMatters(),
        getChangeLogs(),
        getIngestionTasks(),
      ]);
      sessionData.current = null;
      setRegulations(regs);
      setMatters(ms);
      setChangeLogs(logs);
      setCollectionTasks(tasks.map(toCollectionTask));
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败，请检查数据库连接配置');
      setRegulations([]);
      setMatters([]);
      setChangeLogs([]);
      setCollectionTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTasks = useCallback(async (): Promise<void> => {
    try {
      const tasks = await getIngestionTasks();
      setCollectionTasks(tasks.map(toCollectionTask));
    } catch {
      /* 刷新失败静默保留现有列表 */
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  /** 取当前展示的 regulations/matters（会话导入覆盖优先） */
  const effectiveRegs = sessionData.current?.regulations ?? regulations;
  const effectiveMatters = sessionData.current?.matters ?? matters;

  const addLog = useCallback<DataContextValue['addLog']>(
    entry => {
      setChangeLogs(prev => {
        const newEntry: ChangeLogEntry = {
          id: `LOG_${Date.now()}`,
          time: nowString(),
          action: entry.action as ChangeAction,
          targetType: entry.targetType,
          targetName: entry.targetName,
          summary: entry.summary,
          operator: entry.operator ?? '数据管理员',
        };
        return [newEntry, ...prev];
      });
    },
    [],
  );

  const replaceData = useCallback(
    (next: KnowledgeData) => {
      sessionData.current = {
        regulations: next.regulations,
        matters: next.matters,
      };
      setRegulations(next.regulations);
      setMatters(next.matters);
      setChangeLogs(next.changeLogs);
    },
    [],
  );

  const addCollectionTask = useCallback<DataContextValue['addCollectionTask']>(
    async task => {
      const tempId = `TASK_${Date.now().toString().slice(-6)}`;
      const optimistic: CollectionTask = {
        ...task,
        id: tempId,
        createdAt: nowString(),
      };
      // 先展示（乐观更新）
      setCollectionTasks(prev => [optimistic, ...prev]);
      // 写入 ingestion_tasks（status=pending）
      try {
        const inserted = await insertIngestionTask({
          url: task.url,
          status: 'pending',
        });
        // 用数据库返回的 id 修正
        if (inserted) {
          setCollectionTasks(prev =>
            prev.map(t =>
              t.id === tempId
                ? { ...t, id: String(inserted.id), status: task.status as CollectionStatus }
                : t,
            ),
          );
          return { ...optimistic, id: String(inserted.id) };
        }
      } catch (err) {
        setCollectionTasks(prev => prev.filter(t => t.id !== tempId));
        throw err instanceof Error ? err : new Error('采集任务登记失败');
      }
      return optimistic;
    },
    [],
  );

  const updateCollectionTask = useCallback<DataContextValue['updateCollectionTask']>(
    (id, patch) => {
      setCollectionTasks(prev =>
        prev.map(t => (t.id === id ? { ...t, ...patch } : t)),
      );
    },
    [],
  );

  const resetData = useCallback(async (): Promise<void> => {
    await loadAll();
  }, [loadAll]);

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      error,
      regulations: effectiveRegs,
      matters: effectiveMatters,
      changeLogs,
      collectionTasks,
      replaceData,
      addLog,
      addCollectionTask,
      updateCollectionTask,
      resetData,
      refreshTasks,
    }),
    [
      loading,
      error,
      effectiveRegs,
      effectiveMatters,
      changeLogs,
      collectionTasks,
      replaceData,
      addLog,
      addCollectionTask,
      updateCollectionTask,
      resetData,
      refreshTasks,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData 必须在 DataProvider 内使用');
  return ctx;
}