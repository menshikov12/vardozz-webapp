import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Admin.module.scss';
import { useApi } from '../../hooks/useApi';
import { useAdminCheck } from '../../hooks/useAdminCheck';
import type { User, Role } from '../../types/api';
import { finalUser as telegramUser, showBackButton, hideBackButton } from '../../shared/lib/telegram';
import { Loading } from '../Loading/Loading';
import { Button } from '../Button/Button';
import { UserActivityStats } from './UserActivityStats';

// Функция для форматирования даты и времени
const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Не указано';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Некорректная дата';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    // Форматируем дату и время
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Добавляем относительное время
    let relativeTime = '';
    if (diffMinutes < 1) {
      relativeTime = 'только что';
    } else if (diffMinutes < 60) {
      relativeTime = `${diffMinutes} мин назад`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours} ч назад`;
    } else if (diffDays < 7) {
      relativeTime = `${diffDays} дн назад`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      relativeTime = `${weeks} нед назад`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      relativeTime = `${months} мес назад`;
    } else {
      const years = Math.floor(diffDays / 365);
      relativeTime = `${years} г назад`;
    }
    
    return `${dateStr} ${timeStr} (${relativeTime})`;
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return 'Ошибка даты';
  }
};


const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Состояние для бесконечной прокрутки
  const [currentOffset, setCurrentOffset] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [cachedUsers, setCachedUsers] = useState<Map<number, User[]>>(new Map());
  const usersPerPage = 3;
  const api = useApi();
  const { isAdmin, loading } = useAdminCheck();
  const navigate = useNavigate();
  
  // Intersection Observer для бесконечной прокрутки
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoadMoreVisible, setIsLoadMoreVisible] = useState(false);

  // Функции для работы с кешем
  const getCacheKey = () => `admin_users_cache_${telegramUser?.id || 'anonymous'}`;
  
  const loadFromCache = () => {
    try {
      const cacheKey = getCacheKey();
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { pages, users, timestamp } = JSON.parse(cached);
        
        // Проверяем, не устарел ли кеш (1 час = 3600000 мс)
        const cacheAge = Date.now() - timestamp;
        const maxCacheAge = 60 * 60 * 1000; // 1 час
        
        if (cacheAge > maxCacheAge) {
          localStorage.removeItem(cacheKey);
          return false;
        }
        
        // Восстанавливаем состояние кеша
        const restoredPages = new Set(pages as number[]);
        const restoredUsers = new Map(users as [number, User[]][]);
        setLoadedPages(restoredPages);
        setCachedUsers(restoredUsers);
        
        // Сразу восстанавливаем пользователей в состояние
        const allUsers: User[] = [];
        restoredUsers.forEach((pageUsers) => {
          allUsers.push(...pageUsers);
        });
        setUsers(allUsers);
        setCurrentOffset(allUsers.length);
        // Если загружено меньше пользователей чем в странице, значит это последняя страница
        setHasMoreUsers(allUsers.length >= usersPerPage && allUsers.length % usersPerPage === 0);
        
        return true;
      }
    } catch (error) {
      console.error('Ошибка при загрузке кеша:', error);
    }
    return false;
  };

  const saveToCache = (pages: Set<number>, users: Map<number, User[]>) => {
    try {
      const cacheKey = getCacheKey();
      const cacheData = {
        pages: Array.from(pages),
        users: Array.from(users.entries()),
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Ошибка при сохранении кеша:', error);
    }
  };

  useEffect(() => {
    // Запускаем загрузку только после завершения проверки прав доступа
    if (!loading && isAdmin) {
      // Пытаемся загрузить из кеша
      if (loadFromCache()) {
        // Если кеш загружен, состояние уже восстановлено в loadFromCache
        setInitialLoading(false);
      } else {
        // Если кеша нет, загружаем с сервера
        fetchInitialUsers();
      }
      fetchRoles();
    }
  }, [loading, isAdmin]);

  // Настраиваем Intersection Observer для бесконечной прокрутки
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoadMoreVisible(true);
        } else {
          setIsLoadMoreVisible(false);
        }
      },
      {
        threshold: 0.01, // Срабатывает при 1% видимости
        rootMargin: '300px 0px 300px 0px' // Еще больше увеличиваем зону срабатывания
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasMoreUsers]);


  // Автоматически обновляем список пользователей каждые 5 минут
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !usersLoading && isAdmin) {
        refreshUsers();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loading, usersLoading, isAdmin]);

  useEffect(() => {
    showBackButton(() => {
      navigate('/admin');
      hideBackButton();
    });
    
    return () => {
      hideBackButton();
    };
  }, [navigate]);

  // Функция для начальной загрузки пользователей
  const fetchInitialUsers = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      setAccessDenied(false);
      setSuccessMessage(null);

      // Проверяем права доступа
      if (!isAdmin) {
        setAccessDenied(true);
        setInitialLoading(false);
        return;
      }

      // Проверяем, что у нас есть telegram user ID
      if (!telegramUser?.id) {
        setError('Telegram user ID не найден');
        return;
      }

      // Проверяем кеш для первой страницы
      const pageNumber = 0;
      if (loadedPages.has(pageNumber)) {
        setInitialLoading(false);
        return;
      }

      // Отправляем запрос с Telegram ID в заголовках и параметрами пагинации
      const endpoint = `/admin/users?limit=${usersPerPage}&offset=0`;
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
        setUsers(newUsers);
        setCurrentOffset(usersPerPage);
        setHasMoreUsers(newUsers.length === usersPerPage);
        
        // Обновляем кеш
        const newLoadedPages = new Set([pageNumber]);
        const newCachedUsers = new Map([[pageNumber, newUsers]]);
        setLoadedPages(newLoadedPages);
        setCachedUsers(newCachedUsers);
        saveToCache(newLoadedPages, newCachedUsers);
      }
    } catch (err) {
      console.error('Ошибка при получении пользователей:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setSuccessMessage(null);
    } finally {
      setInitialLoading(false);
    }
  };

  // Функция для загрузки дополнительных пользователей
  const loadMoreUsers = useCallback(async () => {
    // Предотвращаем множественные вызовы
    if (isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      setUsersLoading(true);
      setError(null);

      // Проверяем, что у нас есть telegram user ID
      if (!telegramUser?.id) {
        setError('Telegram user ID не найден');
        return;
      }

      // Вычисляем номер страницы для кеширования
      const pageNumber = Math.floor(currentOffset / usersPerPage);
      
      // Проверяем кеш
      if (loadedPages.has(pageNumber) && cachedUsers.has(pageNumber)) {
        const cachedPageUsers = cachedUsers.get(pageNumber) || [];
        setUsers(prev => [...prev, ...cachedPageUsers]);
        setCurrentOffset(prev => prev + usersPerPage);
        setUsersLoading(false);
        setIsLoadingMore(false);
        return;
      }

      // Отправляем запрос с Telegram ID в заголовках и параметрами пагинации
      const endpoint = `/admin/users?limit=${usersPerPage}&offset=${currentOffset}`;
      
      const result = await api.get<{ users: User[], total: number }>(endpoint, {
        'x-telegram-id': telegramUser.id.toString(),
      });

      if (result.error) {
        setError(result.error);
        setSuccessMessage(null);
      } else if (result.data) {
        const newUsers = result.data.users || [];
        setUsers(prev => [...prev, ...newUsers]);
        setCurrentOffset(prev => prev + usersPerPage);
        setHasMoreUsers(newUsers.length === usersPerPage);
        
        // Обновляем кеш
        const newLoadedPages = new Set([...loadedPages, pageNumber]);
        const newCachedUsers = new Map([...cachedUsers, [pageNumber, newUsers]]);
        setLoadedPages(newLoadedPages);
        setCachedUsers(newCachedUsers);
        saveToCache(newLoadedPages, newCachedUsers);
      }
    } catch (err) {
      console.error('Ошибка при получении пользователей:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setSuccessMessage(null);
    } finally {
      setUsersLoading(false);
      setIsLoadingMore(false);
    }
  }, [currentOffset, usersPerPage, telegramUser?.id, api, isLoadingMore, loadedPages, cachedUsers]);

  // Отслеживаем видимость элемента загрузки для бесконечной прокрутки
  useEffect(() => {
    if (isLoadMoreVisible && hasMoreUsers && !usersLoading && !initialLoading && !isLoadingMore) {
      loadMoreUsers();
    }
  }, [isLoadMoreVisible, hasMoreUsers, usersLoading, initialLoading, loadMoreUsers]);

  // Альтернативный способ - загрузка при прокрутке до конца страницы
  useEffect(() => {
    const handleScroll = () => {
      if (hasMoreUsers && !usersLoading && !initialLoading && !isLoadingMore) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Если прокрутили до 90% от конца страницы
        if (scrollTop + windowHeight >= documentHeight * 0.9) {
          loadMoreUsers();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMoreUsers, usersLoading, initialLoading, loadMoreUsers]);

  // Функция для обновления списка пользователей
  const refreshUsers = async () => {
    setUsers([]);
    setCurrentOffset(0);
    setHasMoreUsers(true);
    setLoadedPages(new Set()); // Очищаем кеш
    setCachedUsers(new Map()); // Очищаем кеш пользователей
    
    // Очищаем localStorage кеш
    try {
      const cacheKey = getCacheKey();
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Ошибка при очистке кеша:', error);
    }
    
    await fetchInitialUsers();
  };

  const fetchRoles = async () => {
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
  };

  const handleRoleUpdate = async (userId: string, newRoleId: string) => {
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
        console.log('✅ Роль успешно обновлена:', result.data);
        
        // Показываем сообщение об успехе
        setSuccessMessage(`✅ Роль пользователя успешно обновлена!`);
        setTimeout(() => setSuccessMessage(null), 5000);
        
        // Обновляем пользователя в локальном состоянии с новыми данными
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                role_id: newRoleId,
                role: (result.data as any)?.user?.roles?.name || '',
                updated_at: new Date().toISOString()
              }
            : user
        ));
        setSelectedUserId(null);
        
        // Обновляем список пользователей для синхронизации с сервером
        setTimeout(() => {
          refreshUsers();
        }, 1000);
      }
    } catch (err) {
      console.error('Ошибка при обновлении роли:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setSuccessMessage(null);
    } finally {
      setRoleUpdateLoading(null);
    }
  };

  // Функция для обновления списка пользователей
  const handleRefresh = () => {
    refreshUsers();
  };

  if (loading || initialLoading) {
    return (
      <div className={styles.admin}>
        <Loading />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className={styles.admin}>
        <div className={styles.accessDenied}>
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав для доступа к админ-панели.</p>
          <p>Только администраторы могут просматривать эту страницу.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.admin}>
        <div className={styles.error}>
          <h2>Ошибка</h2>
          <p>{error}</p>
          <button onClick={handleRefresh} className={styles.retryButton}>
            Попробовать снова
          </button> 
        </div>
      </div>
    );
  }

  return (
    <div className={styles.admin}>
      <div className={styles.header}>
        <h1>Все пользователи</h1>
        <div className={styles.headerActions}>
          <Button 
            onClick={handleRefresh}
            disabled={usersLoading}
            style={{
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              minWidth: '150px',
              opacity: usersLoading ? 0.6 : 1,
              cursor: usersLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {usersLoading ? '🔄 Обновление...' : '🔄 Обновить список'}
          </Button>
        </div>
      </div>
      
      {/* Компонент статистики активности пользователей */}
      <UserActivityStats onRefresh={handleRefresh} />
      
      {successMessage && (
        <div className={styles.successMessage}>
          <p>{successMessage}</p>
        </div>
      )}
      
      <div className={styles.usersList}>
        {users.length === 0 && !initialLoading ? (
          <div className={styles.emptyState}>
            <p>📋 Пользователи не найдены</p>
          </div>
        ) : (
          <>
            <div className={styles.usersGrid}>
              {users.map((user) => (
              <div key={user.id} className={styles.userCard}>
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    {user.first_name?.charAt(0)?.toUpperCase() || '👤'}{user.last_name?.charAt(0)?.toUpperCase() || ''}
                  </div>
                  <h3 className={styles.userName}>
                    {user.first_name} {user.last_name}
                  </h3>
                  <div className={styles.userDetails}>
                    <div className={styles.userField}>
                      <span className={styles.fieldLabel}>@</span>
                      <span>{user.username || 'Не указан'}</span>
                    </div>
                    <div className={`${styles.userField} ${styles.roleField}`}>
                      <span className={styles.fieldLabel}>Роль:</span>
                      <span className={user.role && user.role.trim() !== '' ? styles.roleActive : styles.roleEmpty}>
                        {user.role && user.role.trim() !== '' ? user.role : 'отсутствует'}
                      </span>
                    </div>
                    <div className={`${styles.userField} ${styles.dateFieldContainer}`}>
                      <span className={`${styles.fieldLabel} ${styles.firstLoginLabel}`}>🚪 Первый вход:</span>
                      <span className={styles.dateField}>
                        {formatDateTime(user.first_login_at)}
                      </span>
                    </div>
                    <div className={`${styles.userField} ${styles.dateFieldContainer}`}>
                      <span className={`${styles.fieldLabel} ${styles.lastLoginLabel}`}>👋 Последний вход:</span>
                      <span className={styles.dateField}>
                        {formatDateTime(user.last_login_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.userActions}>
                    {selectedUserId === user.id ? (
                      <div className={styles.roleSelector}>
                        <select 
                          onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                          disabled={roleUpdateLoading === user.id}
                          className={styles.roleSelect}
                          defaultValue={user.role_id || ""}
                        >
                          <option value="">Выберите роль...</option>
                          <option value="">Убрать роль</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <Button 
                          onClick={() => setSelectedUserId(null)}
                          style={styles.cancelButton}
                          disabled={roleUpdateLoading === user.id}
                        >
                          Отмена
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setSelectedUserId(user.id)}
                        style={styles.editRoleButton}
                        disabled={roleUpdateLoading === user.id}
                      >
                        {roleUpdateLoading === user.id ? (
                          <>
                            <span className={styles.spinner}></span>
                            Обновление...
                          </>
                        ) : (
                          'Изменить роль'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
            
            
            {/* Элемент для бесконечной прокрутки */}
            {hasMoreUsers && (
              <div ref={loadMoreRef} className={styles.loadMoreTrigger}>
                {usersLoading && (
                  <div className={styles.loadingContainer}>
                    <div className={styles.customLoader}>
                      <div className={styles.spinner}></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
