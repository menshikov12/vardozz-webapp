import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { finalUser as telegramUser } from '../shared/lib/telegram';
import { userRoleCache } from '../shared/lib/userRoleCache';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const api = useApi();

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!telegramUser?.id) {
        setLoading(false);
        return;
      }

      const telegramId = String(telegramUser.id);
      
      // Сначала проверяем кэш
      const cachedRole = userRoleCache.getRole(telegramId);
      if (cachedRole !== null) {
        console.log('✅ useUserRole - Role loaded from cache:', cachedRole);
        setUserRole(cachedRole);
        setLoading(false);
        return;
      }

      // Если в кэше нет, делаем API запрос
      console.log('🔍 useUserRole - Fetching role from API...');
      const result = await api.get<{ user: { role_id: string, roles: { name: string } } }>(`/users/check/${telegramId}`);

      if (result.error) {
        setError(result.error);
      } else if (result.data?.user) {
        console.log('🔍 useUserRole - User data received:', result.data.user);
        // Проверяем, есть ли role_id и связанная роль
        if (result.data.user.role_id && result.data.user.roles) {
          const roleName = result.data.user.roles.name || '';
          console.log('✅ useUserRole - User has role:', roleName);
          
          // Сохраняем в кэш
          userRoleCache.setRole(telegramId, roleName);
          setUserRole(roleName);
        } else {
          console.log('❌ useUserRole - User has no role or role data is incomplete');
          setUserRole('');
        }
      }
    } catch (err) {
      console.error('Ошибка при получении роли пользователя:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Пользователь имеет роль, если у него есть любая роль ИЛИ роль ADMIN
  const hasRole = !loading && (userRole && userRole.trim() !== '') || (userRole === 'ADMIN' || userRole === 'admin');
  
  console.log('🔍 useUserRole - hasRole calculation:', { userRole, hasRole, loading });

  // Функция для принудительного обновления роли
  const refreshRole = async () => {
    if (!telegramUser?.id) return;
    
    const telegramId = String(telegramUser.id);
    userRoleCache.clearRole(telegramId); // Очищаем кэш
    
    // Перезапускаем загрузку
    await fetchUserRole();
  };

  return { userRole, hasRole, loading, error, refetch: fetchUserRole, refreshRole };
};
