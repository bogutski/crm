'use client';

import { useEffect, useState } from 'react';
import { Briefcase, CheckSquare, AlertTriangle } from 'lucide-react';

interface StageStats {
  id: string;
  name: string;
  color: string;
  count: number;
  amount: number;
}

interface PipelineStats {
  id: string;
  name: string;
  total: number;
  totalAmount: number;
  stages: StageStats[];
}

interface OpportunityStats {
  total: number;
  totalAmount: number;
  byPipeline: PipelineStats[];
}

interface TaskStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

interface UserStatsResponse {
  opportunities: OpportunityStats;
  tasks: TaskStats;
}

interface UserStatsProps {
  userId: string;
}

export function UserStats({ userId }: UserStatsProps) {
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="mt-8 animate-pulse">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-4"></div>
        <div className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { opportunities, tasks } = stats;

  return (
    <div className="mt-8 space-y-6">
      {/* Opportunities Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Сделки
          </h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {opportunities.total} · {formatAmount(opportunities.totalAmount)}
          </span>
        </div>

        {opportunities.byPipeline.length > 0 ? (
          <div className="space-y-4">
            {opportunities.byPipeline.map((pipeline) => (
              <div key={pipeline.id}>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  {pipeline.name}
                  <span className="ml-2 text-zinc-400 dark:text-zinc-500">
                    {pipeline.total} · {formatAmount(pipeline.totalAmount)}
                  </span>
                </div>
                <div className="space-y-2 max-w-lg">
                  {pipeline.stages.map((stage) => {
                    const countPercent = pipeline.total > 0 ? (stage.count / pipeline.total) * 100 : 0;
                    const amountPercent = pipeline.totalAmount > 0 ? (stage.amount / pipeline.totalAmount) * 100 : 0;
                    return (
                      <div key={stage.id} className="text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: stage.color }}
                            />
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {stage.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-zinc-500 dark:text-zinc-400">
                              {stage.count} шт
                            </span>
                            <span className="text-zinc-900 dark:text-zinc-100 w-20 text-right">
                              {formatAmount(stage.amount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 h-1.5">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${countPercent}%`,
                              backgroundColor: stage.color,
                              opacity: 0.4,
                            }}
                            title={`Количество: ${stage.count} (${countPercent.toFixed(0)}%)`}
                          />
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${amountPercent}%`,
                              backgroundColor: stage.color,
                            }}
                            title={`Сумма: ${formatAmount(stage.amount)} (${amountPercent.toFixed(0)}%)`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Нет сделок</p>
        )}
      </div>

      {/* Tasks Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckSquare className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Задачи
          </h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {tasks.total}
          </span>
          {tasks.overdue > 0 && (
            <span className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="w-3 h-3" />
              {tasks.overdue} просрочено
            </span>
          )}
        </div>

        {tasks.total > 0 ? (
          <table className="text-sm">
            <tbody>
              <tr className="h-7">
                <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle w-32">
                  Открытые
                </td>
                <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                  {tasks.open}
                </td>
              </tr>
              <tr className="h-7">
                <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                  В работе
                </td>
                <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                  {tasks.inProgress}
                </td>
              </tr>
              <tr className="h-7">
                <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                  Выполнено
                </td>
                <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                  {tasks.completed}
                </td>
              </tr>
              {tasks.cancelled > 0 && (
                <tr className="h-7">
                  <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                    Отменено
                  </td>
                  <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                    {tasks.cancelled}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-zinc-400">Нет задач</p>
        )}
      </div>
    </div>
  );
}
