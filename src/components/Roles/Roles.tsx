import React, { useState, useEffect } from 'react';
import styles from './Roles.module.scss';
import { useApi } from '../../hooks/useApi';
import { useAdminCheck } from '../../hooks/useAdminCheck';
import { useTelegramBackButton } from '../../hooks/useTelegramBackButton';
import type { Role, CreateRoleRequest } from '../../types/api';
import { finalUser as telegramUser } from '../../shared/lib/telegram';
import { Loading } from '../Loading/Loading';
import { Button } from '../Button/Button';

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newRole, setNewRole] = useState<CreateRoleRequest>({
    name: '',
    description: '',
    color: '#28a745'
  });

  // Состояние для загрузки
  const [rolesLoading, setRolesLoading] = useState(false);

  const api = useApi();
  const { isAdmin, loading } = useAdminCheck();



  useEffect(() => {
    // Запускаем загрузку только после завершения проверки прав доступа
    if (!loading && isAdmin) {
      fetchAllRoles();
    }
  }, [loading, isAdmin]);

  // Используем хук для безопасной работы с кнопкой "назад"
  useTelegramBackButton('/admin');


  // Функция для загрузки всех ролей
  const fetchAllRoles = async () => {
    try {
      setRolesLoading(true);
      setError(null);
      setAccessDenied(false);

      // Проверяем права доступа
      if (!isAdmin) {
        setAccessDenied(true);
        setRolesLoading(false);
        return;
      }

      if (!telegramUser?.id) {
        setError('Telegram user ID не найден');
        setRolesLoading(false);
        return;
      }

      // Загружаем все роли сразу (без пагинации)
      const endpoint = `/admin/roles?limit=1000&offset=0`; // Большой лимит для получения всех ролей
      const result = await api.get<{ roles: Role[], total: number }>(endpoint, {
        'x-telegram-id': telegramUser.id.toString(),
      });

      if (result.error) {
        if (result.error.includes('Access denied') || result.error.includes('403')) {
          setAccessDenied(true);
        } else {
          setError(result.error);
        }
      } else if (result.data) {
        const allRoles = result.data.roles || [];
        setRoles(allRoles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setRolesLoading(false);
    }
  };


  // Функция для обновления списка ролей
  const refreshRoles = async () => {
    setRoles([]);
    await fetchAllRoles();
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRole.name.trim()) {
      setError('Название роли обязательно');
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);

      const result = await api.post<{ role: Role }>('/admin/roles', newRole, {
        'x-telegram-id': telegramUser?.id?.toString() || '',
      });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        // Проверяем, что роль еще не добавлена
        setRoles(prev => {
          const existingIds = new Set(prev.map(role => role.id));
          if (existingIds.has(result.data!.role.id)) {
            return prev;
          }
          return [...prev, result.data!.role];
        });
        setNewRole({ name: '', description: '', color: '#28a745' });
        setShowCreateForm(false);
        
        // Обновляем список ролей
        await fetchAllRoles();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту роль?')) {
      return;
    }

    try {
      setError(null);
      
      const result = await api.delete(`/admin/roles/${roleId}`, {
        'x-telegram-id': telegramUser?.id?.toString() || '',
      });

      if (result.error) {
        setError(result.error);
      } else {
        // Обновляем список ролей
        await fetchAllRoles();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };



  if (loading || rolesLoading) {
    return (
      <div className={styles.roles}>
        <Loading />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className={styles.roles}>
        <div className={styles.accessDenied}>
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав для управления ролями.</p>
        </div>
      </div>
      );
    }

  if (error) {
    return (
      <div className={styles.roles}>
        <div className={styles.error}>
          <h2>Ошибка</h2>
          <p>{error}</p>
          <Button 
            onClick={refreshRoles}
            style={{
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              marginTop: '1rem'
            }}
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.roles}>
      <div className={styles.header}>
        <h1>Управление ролями</h1>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            background: showCreateForm 
              ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' 
              : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            minWidth: '150px',
            boxShadow: showCreateForm 
              ? '0 4px 12px rgba(220, 53, 69, 0.3)'
              : '0 4px 12px rgba(40, 167, 69, 0.3)'
          }}
        >
          {showCreateForm ? 'Отмена' : '+ Создать роль'}
        </Button>
      </div>

      {showCreateForm && (
        <div className={styles.createForm}>
          <h3>Создать новую роль</h3>
          <form onSubmit={handleCreateRole}>
            <div className={styles.formGroup}>
              <label>Название роли *</label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Например: moderator"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Описание</label>
              <textarea
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Описание роли..."
                rows={3}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Цвет</label>
              <div className={styles.colorPicker}>
                {[
                  { color: '#28a745', name: 'Зеленый' },
                  { color: '#007bff', name: 'Синий' },
                  { color: '#dc3545', name: 'Красный' },
                  { color: '#ffc107', name: 'Желтый' },
                  { color: '#6f42c1', name: 'Фиолетовый' },
                  { color: '#fd7e14', name: 'Оранжевый' },
                  { color: '#20c997', name: 'Бирюзовый' },
                  { color: '#e83e8c', name: 'Розовый' }
                ].map((colorOption) => (
                  <div
                    key={colorOption.color}
                    className={`${styles.colorOption} ${newRole.color === colorOption.color ? styles.colorOptionSelected : ''}`}
                    style={{ backgroundColor: colorOption.color }}
                    onClick={() => setNewRole(prev => ({ ...prev, color: colorOption.color }))}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>
            
            <div className={styles.formActions}>
              <Button 
                type="submit" 
                disabled={createLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '150px',
                  opacity: createLoading ? 0.6 : 1,
                  cursor: createLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {createLoading ? 'Создание...' : 'Создать роль'}
              </Button>
            </div>
          </form>
        </div>
      )}



      <div className={styles.rolesList}>
        {roles.length === 0 && !rolesLoading ? (
          <div className={styles.emptyState}>
            <p>📋 Ролей нет</p>
          </div>
        ) : (
          <div className={styles.rolesGrid}>
            {roles.map((role) => (
              <div key={role.id} className={styles.roleCard}>
                <div className={styles.roleHeader}>
                  <div 
                    className={styles.roleColor}
                    style={{ backgroundColor: role.color }}
                  />
                  <h3 className={styles.roleName}>{role.name}</h3>
                  <Button 
                    onClick={() => handleDeleteRole(role.id)}
                    style={{
                      background: 'rgba(220, 53, 69, 0.1)',
                      color: '#dc3545',
                      border: '1px solid rgba(220, 53, 69, 0.3)',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      minWidth: 'auto',
                      padding: '0'
                    }}
                  >
                    ✖
                  </Button>
                </div>
                
                {role.description && (
                  <p className={styles.roleDescription}>{role.description}</p>
                )}
                
                <div className={styles.roleInfo}>
                  <span className={styles.roleDate}>
                    Создана: {new Date(role.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;
