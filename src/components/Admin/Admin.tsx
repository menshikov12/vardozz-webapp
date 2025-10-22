import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Admin.module.scss';
import { useAdminCheck } from '../../hooks/useAdminCheck';
import { showBackButton, hideBackButton } from '../../shared/lib/telegram';
import { Loading } from '../Loading/Loading';
import { Button } from '../Button/Button';
import { UserActivityStats } from './UserActivityStats';
import { useAdminUsers } from '../../hooks/useAdminUsers';

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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { isAdmin, loading } = useAdminCheck();
  const {
    users,
    roles,
    loading: usersLoading,
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
    loadMoreUsers
  } = useAdminUsers();
  const navigate = useNavigate();





  useEffect(() => {
    // Запускаем загрузку после завершения проверки прав доступа
    if (!loading && isAdmin) {
      fetchUsers(true);
      fetchRoles();
    }
  }, [loading, isAdmin]); // Убираем fetchUsers и fetchRoles из зависимостей






  useEffect(() => {
    showBackButton(() => {
      navigate('/admin');
      hideBackButton();
    });

    return () => {
      hideBackButton();
    };
  }, [navigate]);

  // Обработчик прокрутки для бесконечной загрузки
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.offsetHeight;
      const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
      
      if (distanceFromBottom <= 1000) { // Загружаем за 1000px до конца
        if (hasMore && !loadingMore && !initialLoading) {
          loadMoreUsers();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, initialLoading, loadMoreUsers]);

  const handleRoleUpdate = async (userId: string, newRoleId: string) => {
    await updateUserRole(userId, newRoleId);
    setSelectedUserId(null);
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
        <div className={styles.headerTitle}>
          <h1>Все пользователи</h1>
        </div>
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
      <UserActivityStats />

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
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className={`${styles.userCard} ${styles.fadeInCard}`}
                  style={{
                    animationDelay: `${(index % 5) * 0.08}s`
                  }}
                >
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

            {/* Индикатор загрузки дополнительных пользователей */}
            {loadingMore && (
              <div className={styles.loadingMore}>
                <div className={styles.spinner}></div>
                <p>Загружаем еще пользователей...</p>
              </div>
            )}

            {/* Кнопка для ручной загрузки дополнительных пользователей */}
            {hasMore && (
              <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                <button 
                  onClick={() => loadMoreUsers()} 
                  disabled={loadingMore}
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    opacity: loadingMore ? 0.6 : 1
                  }}
                >
                  {loadingMore ? '⏳ Загружается...' : '📥 Загрузить еще пользователей'}
                </button>
              </div>
            )}

            {/* Сообщение о том, что все пользователи загружены */}
            {!hasMore && users.length > 0 && (
              <div className={styles.allLoaded}>
                <p>✅ Все пользователи загружены ({users.length} из {totalUsers})</p>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
