import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { usersCache } from '../shared/lib/usersCache';
import { finalUser as telegramUser } from '../shared/lib/telegram';
import type { User, Role } from '../types/api';

export const useAdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading] = useState(false); // Убираем setLoading так как не используется
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);

  const api = useApi();

  // Функция для загрузки пользователей с пагинацией
  const fetchUsers = useCallback(async (reset = false, forceRefresh = false) => {
    try {
      const isInitial = reset || users.length === 0;
      
      if (isInitial) {
        setInitialLoading(true);
        setUsers([]);
        setCurrentOffset(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      setAccessDenied(false);
      setSuccessMessage(null);

      // Проверяем, что у нас есть telegram user ID
      if (!telegramUser?.id) {
        setError('Telegram user ID не найден');
        return;
      }

      const offset = reset ? 0 : currentOffset;
      const limit = 10; // Загружаем по 10 пользователей

      // Если не принудительное обновление и это первая загрузка, проверяем кэш
      if (!forceRefresh && isInitial) {
        const cachedUsers = usersCache.getUsers();
        if (cachedUsers && cachedUsers.length > 0) {
          console.log('✅ Пользователи загружены из кэша:', cachedUsers.length);
          setUsers(cachedUsers.slice(0, limit));
          setTotalUsers(cachedUsers.length);
          setCurrentOffset(limit);
          setHasMore(cachedUsers.length > limit);
          setInitialLoading(false);
          return;
        }
      }

      const endpoint = `/admin/users?limit=${limit}&offset=${offset}`;
      const result = await api.get<{ users: User[], total: number }>(endpoint, {
        'x-telegram-id': telegramUser.id.toString(),
      });

      if (result.error) {
        if (result.error.includes('Access denied') || result.error.includes('403')) {
          setAccessDenied(true);
        } else {
          setError(result.error);
        }
        setSuccessMessage(null);
      } else if (result.data) {
        const newUsers = result.data.users || [];
        const total = result.data.total || 0;
        
        setTotalUsers(total);
        
        if (reset || isInitial) {
          setUsers(newUsers);
          setCurrentOffset(newUsers.length);
        } else {
          setUsers(prev => [...prev, ...newUsers]);
          setCurrentOffset(prev => prev + newUsers.length);
        }
        
        setHasMore(offset + newUsers.length < total);
        
        // Если это первая загрузка, сохраняем в кэш только первые 10
        if (isInitial && !forceRefresh) {
          usersCache.setUsers(newUsers);
        }
      }
    } catch (err) {
      console.error('Ошибка при получении пользователей:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setSuccessMessage(null);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  }, [api, users.length, currentOffset]);

  // Функция для загрузки следующей порции пользователей
  const loadMoreUsers = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchUsers(false, false);
    }
  }, [fetchUsers, loadingMore, hasMore]);

  // Функция для загрузки ролей
  const fetchRoles = useCallback(async () => {
    try {
      if (!telegramUser?.id) return;
      setSuccessMessage(null);

      const result = await api.get<{ roles: Role[] }>('/admin/roles', {
        'x-telegram-id': telegramUser.id.toString(),
      });

      if (result.data) {
        setRoles(result.data.roles || []);
      } else if (result.error) {
        setSuccessMessage(null);
      }
    } catch (err) {
      console.error('Ошибка при получении ролей:', err);
      setSuccessMessage(null);
    }
  }, [api]);

  // Функция для обновления роли пользователя
  const updateUserRole = useCallback(async (userId: string, newRoleId: string) => {
    try {
      setRoleUpdateLoading(userId);
      setError(null);
      setSuccessMessage(null);

      const result = await api.patch(`/admin/users/${userId}/role`,
        { roleId: newRoleId },
        { 'x-telegram-id': telegramUser?.id?.toString() || '' }
      );

      if (result.error) {
        setError(result.error);
        setSuccessMessage(null);
      } else {
        // Показываем сообщение об успехе
        setSuccessMessage(`✅ Роль пользователя успешно обновлена!`);
        setTimeout(() => setSuccessMessage(null), 5000);

        // Обновляем пользователя в локальном состоянии с новыми данными
        const updatedUser: User = {
          ...users.find(user => user.id === userId)!,
          role_id: newRoleId,
          role: (result.data as any)?.user?.roles?.name || '',
          updated_at: new Date().toISOString()
        };

        setUsers(prev => prev.map(user =>
          user.id === userId ? updatedUser : user
        ));

        // Обновляем пользователя в кэше
        usersCache.updateUser(updatedUser);

        // Обновляем список пользователей для синхронизации с сервером через 1 секунду
        setTimeout(() => {
          fetchUsers(true, true);
        }, 1000);
      }
    } catch (err) {
      console.error('Ошибка при обновлении роли:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setSuccessMessage(null);
    } finally {
      setRoleUpdateLoading(null);
    }
  }, [api, users, fetchUsers]);

  // Функция для принудительного обновления
  const refreshUsers = useCallback(() => {
    fetchUsers(true, true);
  }, [fetchUsers]);

  // Функция для получения информации о кэше
  const getCacheInfo = useCallback(() => {
    const hasCache = usersCache.hasUsers();
    const lastUpdate = usersCache.getLastUpdateTime();
    const timeToExpire = usersCache.getTimeToExpire();
    
    return {
      hasCache,
      lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
      timeToExpire
    };
  }, []);

  return {
    users,
    roles,
    loading,
    initialLoading,
    loadingMore,
    error,
    accessDenied,
    successMessage,
    roleUpdateLoading,
    hasMore,
    totalUsers,
    fetchUsers,
    fetchRoles,
    updateUserRole,
    refreshUsers,
    loadMoreUsers,
    getCacheInfo
  };
};