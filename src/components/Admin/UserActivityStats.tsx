import React, { useState, useEffect } from 'react';
import styles from './UserActivityStats.module.scss';
import { useApi } from '../../hooks/useApi';
import { finalUser as telegramUser } from '../../shared/lib/telegram';

interface ActivityStats {
  total_users: number;
  users_with_first_login: number;
  active_today: number;
  active_week: number;
  active_month: number;
  inactive_users: number;
  never_logged_in: number;
}

interface UserActivityStatsProps {
  // Убираем onRefresh prop, так как он вызывал бесконечную перезагрузку
}

export const UserActivityStats: React.FC<UserActivityStatsProps> = () => {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!telegramUser?.id) {
        setError('Telegram user ID не найден');
        return;
      }

      const result = await api.get<{ stats: ActivityStats }>('/admin/users/activity-stats', {
        'x-telegram-id': telegramUser.id.toString(),
      });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setStats(result.data.stats);
      }
    } catch (err) {
      console.error('Ошибка при получении статистики:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const calculatePercentage = (value: number, total: number): number => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className={styles.statsContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.statsContainer}>
        <div className={styles.error}>
          <h3>Ошибка загрузки статистики</h3>
          <p>{error}</p>
          <button onClick={fetchStats} className={styles.retryButton}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const totalUsers = stats.total_users;

  return (
    <div className={styles.statsContainer}>
      <h2 className={styles.title}>📊 Статистика активности пользователей</h2>
      
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.totalCard}`}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{totalUsers}</div>
            <div className={styles.statLabel}>Всего пользователей</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.activeCard}`}>
          <div className={styles.statIcon}>🟢</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats.active_today}</div>
            <div className={styles.statLabel}>Активны сегодня</div>
            <div className={styles.statPercentage}>
              {calculatePercentage(stats.active_today, totalUsers)}%
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.weekCard}`}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats.active_week}</div>
            <div className={styles.statLabel}>Активны за неделю</div>
            <div className={styles.statPercentage}>
              {calculatePercentage(stats.active_week, totalUsers)}%
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.monthCard}`}>
          <div className={styles.statIcon}>📆</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats.active_month}</div>
            <div className={styles.statLabel}>Активны за месяц</div>
            <div className={styles.statPercentage}>
              {calculatePercentage(stats.active_month, totalUsers)}%
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.inactiveCard}`}>
          <div className={styles.statIcon}>😴</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats.inactive_users}</div>
            <div className={styles.statLabel}>Неактивны &gt;30 дней</div>
            <div className={styles.statPercentage}>
              {calculatePercentage(stats.inactive_users, totalUsers)}%
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.neverCard}`}>
          <div className={styles.statIcon}>❓</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats.never_logged_in}</div>
            <div className={styles.statLabel}>Не активировались</div>
            <div className={styles.statSubLabel}>Зарегистрированы, но не заходили в приложение</div>
            <div className={styles.statPercentage}>
              {calculatePercentage(stats.never_logged_in, totalUsers)}%
            </div>
          </div>
        </div>
      </div>

      <div className={styles.refreshInfo}>
        <p>Последнее обновление: {new Date().toLocaleString('ru-RU')}</p>
        <button onClick={fetchStats} className={styles.refreshButton}>
          🔄 Обновить статистику
        </button>
      </div>
    </div>
  );
};