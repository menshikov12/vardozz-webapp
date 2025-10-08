import { useMemo, useState, useEffect } from 'react';
import { finalUser as telegramUser } from '../shared/lib/telegram';
import { useApi } from './useApi';
import { userRoleCache } from '../shared/lib/userRoleCache';

export const useAdminCheck = () => {
  const [dbRole, setDbRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const api = useApi();

  // Константы для админских Telegram ID (для обратной совместимости)
  const ADMIN_TELEGRAM_IDS = [748516935, 1750233627];

  const isAdmin = useMemo(() => {
    if (!telegramUser?.id) {
      return false;
    }
    
    // Проверяем, является ли пользователь админом по Telegram ID
    const userId = telegramUser.id;
    const isUserAdmin = ADMIN_TELEGRAM_IDS.includes(userId) || 
                       ADMIN_TELEGRAM_IDS.includes(Number(userId)) ||
                       ADMIN_TELEGRAM_IDS.includes(parseInt(String(userId)));
    
    // Также проверяем роль из базы данных (с учетом регистра)
    const hasAdminRole = dbRole === 'ADMIN' || dbRole === 'admin';
    
    console.log('🔍 Admin check:', {
      userId,
      isUserAdmin,
      dbRole,
      hasAdminRole,
      finalResult: isUserAdmin || hasAdminRole
    });
    
    return isUserAdmin || hasAdminRole;
  }, [dbRole]);

  // Дополнительно проверяем, имеет ли пользователь роль для доступа к контенту
  const hasContentAccess = useMemo(() => {
    if (!telegramUser?.id) {
      return false;
    }
    
    // Пользователь имеет доступ к контенту, если у него есть любая роль ИЛИ роль ADMIN
    return dbRole && dbRole.trim() !== '' || dbRole === 'ADMIN' || dbRole === 'admin';
  }, [dbRole]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (!telegramUser?.id) {
          setLoading(false);
          return;
        }

        const telegramId = String(telegramUser.id);
        
        // Сначала проверяем кэш
        const cachedRole = userRoleCache.getRole(telegramId);
        if (cachedRole !== null) {
          console.log('✅ Role loaded from cache:', cachedRole);
          setDbRole(cachedRole);
          // Добавляем задержку в 2 секунды даже для кэшированной роли
          setTimeout(() => {
            setLoading(false);
          }, 1000);
          return;
        }

        // Если в кэше нет, делаем API запрос
        console.log('🔍 Fetching role from API...');
        const result = await api.get<{ user: { role_id: string, roles: { name: string } } }>(`/users/check/${telegramId}`);
        
        if (result.data?.user) {
          console.log('🔍 User data received:', result.data.user);
          // Проверяем, есть ли role_id и связанная роль
          if (result.data.user.role_id && result.data.user.roles) {
            const roleName = result.data.user.roles.name || '';
            console.log('✅ User has role:', roleName);
            
            // Сохраняем в кэш
            userRoleCache.setRole(telegramId, roleName);
            setDbRole(roleName);
          } else {
            console.log('❌ User has no role or role data is incomplete');
            setDbRole('');
          }
        }
      } catch (err) {
        console.error('Ошибка при получении роли пользователя:', err);
      } finally {
        // Добавляем задержку в 2 секунды перед завершением загрузки
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    };

    fetchUserRole();
  }, [api]);

  const currentUserId = telegramUser?.id || null;

  // Функция для принудительного обновления роли (например, после изменения в админке)
  const refreshRole = async () => {
    if (!telegramUser?.id) return;
    
    const telegramId = String(telegramUser.id);
    userRoleCache.clearRole(telegramId); // Очищаем кэш
    
    // Перезапускаем загрузку
    setLoading(true);
    try {
      const result = await api.get<{ user: { role_id: string, roles: { name: string } } }>(`/users/check/${telegramId}`);
      
      if (result.data?.user) {
        if (result.data.user.role_id && result.data.user.roles) {
          const roleName = result.data.user.roles.name || '';
          userRoleCache.setRole(telegramId, roleName);
          setDbRole(roleName);
        } else {
          setDbRole('');
        }
      }
    } catch (err) {
      console.error('Ошибка при обновлении роли:', err);
    } finally {
      // Добавляем задержку в 2 секунды перед завершением загрузки
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  return {
    isAdmin,
    currentUserId,
    adminIds: ADMIN_TELEGRAM_IDS,
    dbRole,
    loading,
    refreshRole,
    hasContentAccess
  };
};
