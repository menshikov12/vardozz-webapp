import React, { useState, useEffect } from 'react';
import styles from './Content.module.scss';
import { useApi } from '../../hooks/useApi';
import { useAdminCheck } from '../../hooks/useAdminCheck';
import { useTelegramBackButton } from '../../hooks/useTelegramBackButton';
import type { Role, Content, CreateContentRequest, UpdateContentRequest, ContentLink } from '../../types/api';
import { finalUser as telegramUser } from '../../shared/lib/telegram';
import { Loading } from '../Loading/Loading';
import { Button } from '../Button/Button';

const ContentManager: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [content, setContent] = useState<Content[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newContent, setNewContent] = useState<CreateContentRequest>({
    role_name: '',
    title: '',
    description: '',
    links: [],
    is_scheduled: false,
    scheduled_at: ''
  });

  const api = useApi();
  const { isAdmin, loading } = useAdminCheck();

  useEffect(() => {
    // Запускаем загрузку только после завершения проверки прав доступа
    if (!loading && isAdmin) {
      fetchRoles();
    }
  }, [loading, isAdmin]);

  // Используем хук для безопасной работы с кнопкой "назад"
  useTelegramBackButton('/admin');

  useEffect(() => {
    if (selectedRole && !loading && isAdmin) {
      fetchContent(selectedRole);
      setNewContent(prev => ({ ...prev, role_name: selectedRole }));
    } else {
      setContent([]);
    }
  }, [selectedRole, loading, isAdmin]);

  // Периодически обновляем список постов для отображения актуального статуса
  useEffect(() => {
    if (!selectedRole || loading || !isAdmin) return;

    const refreshContent = () => {
      fetchContent(selectedRole);
    };

    // Обновляем каждые 30 минут для оптимального баланса между актуальностью и производительностью
    const interval = setInterval(refreshContent, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedRole, loading, isAdmin]);

  const fetchRoles = async () => {
    try {
      setError(null);
      setAccessDenied(false);

      // Проверяем права доступа
      if (!isAdmin) {
        setAccessDenied(true);
        return;
      }

      if (!telegramUser?.id) {
        setError('Telegram user ID не найден');
        return;
      }

      const result = await api.get<{ roles: Role[] }>('/admin/roles', {
        'x-telegram-id': telegramUser.id.toString(),
      });

      if (result.error) {
        if (result.error.includes('Access denied') || result.error.includes('403')) {
          setAccessDenied(true);
        } else {
          setError(result.error);
        }
      } else if (result.data) {
        setRoles(result.data.roles || []);
      }
    } catch (err) {
      console.error('Ошибка при получении ролей:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      // Не изменяем loading здесь, так как он управляется useAdminCheck
    }
  };

  const fetchContent = async (roleName: string) => {
    try {
      setContentLoading(true);
      setError(null);

      const result = await api.get<{ content: Content[] }>(`/admin/content/${roleName}`, {
        'x-telegram-id': telegramUser?.id?.toString() || '',
      });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setContent(result.data.content || []);
      }
    } catch (err) {
      console.error('Ошибка при получении контента:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setContentLoading(false);
    }
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newContent.title.trim()) {
      setError('Заголовок обязателен');
      return;
    }

    if (!newContent.links || newContent.links.length === 0) {
      setError('Хотя бы одна ссылка должна быть добавлена');
      return;
    }

    if (newContent.is_scheduled && !newContent.scheduled_at) {
      setError('Для запланированного поста необходимо указать дату публикации');
      return;
    }

    // Валидация времени планирования
    if (newContent.is_scheduled && newContent.scheduled_at) {
      const scheduledTime = new Date(newContent.scheduled_at);
      const now = new Date();
      
      if (scheduledTime <= now) {
        setError('Время публикации должно быть в будущем');
        return;
      }
    }

    try {
      setCreateLoading(true);
      setError(null);

      // Подготавливаем данные для отправки
      const postData: any = {
        role_name: newContent.role_name,
        title: newContent.title,
        description: newContent.description,
        links: newContent.links
      };

      // Добавляем поля планирования только если пост запланирован
      if (newContent.is_scheduled) {
        postData.is_scheduled = true;
        postData.scheduled_at = newContent.scheduled_at;
        postData.status = 'scheduled';
      } else {
        // Для обычного поста устанавливаем статус 'published'
        postData.status = 'published';
      }

      const result = await api.post<{ content: Content }>('/admin/content', postData, {
        'x-telegram-id': telegramUser?.id?.toString() || '',
      });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setContent(prev => [result.data!.content, ...prev]);
        setNewContent({ 
          role_name: selectedRole, 
          title: '', 
          description: '', 
          links: [],
          is_scheduled: false,
          scheduled_at: ''
        });
        setShowCreateForm(false);

        const schedulingInfo = newContent.is_scheduled && newContent.scheduled_at
          && `\nПост запланирован на: ${formatDateTime(newContent.scheduled_at)}`
        
        setSuccessMessage(`Пост успешно создан!${schedulingInfo}`);
        setTimeout(() => setSuccessMessage(null), 8000);
      }
    } catch (err) {
      console.error('Ошибка при создании контента:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateContent = async (contentId: string, updates: UpdateContentRequest) => {
    try {
      setError(null);
      
      const result = await api.patch<{ content: Content }>(`/admin/content/${contentId}`, updates, {
        'x-telegram-id': telegramUser?.id?.toString() || '',
      });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setContent(prev => prev.map(item => 
          item.id === contentId ? result.data!.content : item
        ));
        setEditingContent(null);
      }
    } catch (err) {
      console.error('Ошибка при обновлении контента:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот пост?')) {
      return;
    }

    try {
      setError(null);
      
      const result = await api.delete(`/admin/content/${contentId}`, {
        'x-telegram-id': telegramUser?.id?.toString() || '',
      });

      if (result.error) {
        setError(result.error);
      } else {
        setContent(prev => prev.filter(item => item.id !== contentId));
      }
    } catch (err) {
      console.error('Ошибка при удалении контента:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

  const addLink = () => {
    setNewContent(prev => ({
      ...prev,
      links: [...prev.links, { link_type: 'article', link_title: '', link_url: '' }]
    }));
  };

  const removeLink = (index: number) => {
    setNewContent(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const updateLink = (index: number, field: keyof ContentLink, value: string) => {
    setNewContent(prev => ({
      ...prev,
      links: prev.links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const monthIndex = date.getMonth();
    
    // Массив месяцев в родительном падеже (для "17 августа")
    const monthsGenitive = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const month = monthsGenitive[monthIndex];
    
    return `${day} ${month}`;
  };

  const formatDateTime = (dateString: string) => {
    // Создаем дату в UTC и конвертируем в московское время (UTC+3)
    const utcDate = new Date(dateString);
    const moscowDate = new Date(utcDate.getTime() + (3 * 60 * 60 * 1000)); // +3 часа
    
    const day = moscowDate.getUTCDate();
    const monthIndex = moscowDate.getUTCMonth();
    const hours = moscowDate.getUTCHours().toString().padStart(2, '0');
    const minutes = moscowDate.getUTCMinutes().toString().padStart(2, '0');
    
    // Массив месяцев в родительном падеже
    const monthsGenitive = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const month = monthsGenitive[monthIndex];
    
    return `${day} ${month} в ${hours}:${minutes} (МСК)`;
  };

  const getTimeRemaining = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diff = scheduled.getTime() - now.getTime();
    
    if (diff <= 0) {
      return '⏰ Публикуется автоматически...';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `⏳ Осталось: ${days} дн. ${hours} ч.`;
    } else if (hours > 0) {
      return `⏳ Осталось: ${hours} ч. ${minutes} мин.`;
    } else {
      return `⏳ Осталось: ${minutes} мин.`;
    }
  };

  if (loading) {
    return (
      <div className={styles.content}>
        <Loading />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className={styles.content}>
        <div className={styles.accessDenied}>
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав для управления контентом.</p>
        </div>
      </div>
    );
  }

  if (error && !selectedRole) {
    return (
      <div className={styles.content}>
        <div className={styles.error}>
          <h2>Ошибка</h2>
          <p>{error}</p>
          <Button onClick={fetchRoles} style={styles.retryButton}>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.content}>
             <div className={styles.header}>
         <h1>Управление контентом</h1>
         <div className={styles.headerActions}>
           {selectedRole && (
             <Button 
               onClick={() => setShowCreateForm(!showCreateForm)}
               style={styles.createButton}
             >
               {showCreateForm ? 'Отмена' : '+ Создать пост'}
             </Button>
           )}
         </div>
       </div>

      <div className={styles.roleSelector}>
        <label>Выберите роль:</label>
        <select 
          value={selectedRole} 
          onChange={(e) => setSelectedRole(e.target.value)}
          className={styles.roleSelect}
        >
          <option value="">-- Выберите роль --</option>
          {roles.map(role => (
            <option key={role.id} value={role.name}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {selectedRole && showCreateForm && (
        <div className={styles.createForm}>
          <h3>
            Новый пост
            {newContent.is_scheduled && newContent.scheduled_at && (
              <span className={styles.formScheduledInfo}>
                📅 Запланирован на {formatDateTime(newContent.scheduled_at)}
              </span>
            )}
          </h3>
          <form onSubmit={handleCreateContent}>
            <div className={styles.formGroup}>
              <label>Заголовок *</label>
              <input
                type="text"
                value={newContent.title}
                onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Название поста"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Описание</label>
              <textarea
                value={newContent.description}
                onChange={(e) => setNewContent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Описание поста"
                rows={3}
              />
            </div>
            
            <div className={styles.schedulingSection}>
              <div className={styles.schedulingHeader}>
                <label className={styles.schedulingLabel}>
                  <input
                    type="checkbox"
                    checked={newContent.is_scheduled}
                    onChange={(e) => setNewContent(prev => ({ 
                      ...prev, 
                      is_scheduled: e.target.checked,
                      scheduled_at: e.target.checked ? prev.scheduled_at : ''
                    }))}
                  />
                  Запланировать
                </label>
              </div>
              
              {newContent.is_scheduled && (
                <div className={styles.schedulingFields}>
                  <div className={styles.formGroup}>
                    <label>Дата публикации *</label>
                    <input
                      type="date"
                      value={newContent.scheduled_at ? newContent.scheduled_at.split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value;
                        const time = newContent.scheduled_at ? newContent.scheduled_at.split('T')[1] || '12:00' : '12:00';
                        setNewContent(prev => ({ 
                          ...prev, 
                          scheduled_at: `${date}T${time}` 
                        }));
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Время публикации (МСК)</label>
                    <input
                      type="time"
                      value={newContent.scheduled_at ? newContent.scheduled_at.split('T')[1] || '12:00' : '12:00'}
                      onChange={(e) => {
                        const date = newContent.scheduled_at ? newContent.scheduled_at.split('T')[0] : new Date().toISOString().split('T')[0];
                        const time = e.target.value;
                        setNewContent(prev => ({ 
                          ...prev, 
                          scheduled_at: `${date}T${time}` 
                        }));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.linksSection}>
              <div className={styles.linksHeader}>
                <Button 
                  type="button" 
                  onClick={addLink}
                  style={styles.addLinkButton}
                >
                  + Добавить ссылку
                </Button>
              </div>
              
              {newContent.links.map((link, index) => (
                <div key={index} className={styles.linkRow}>
                  <div className={styles.linkType}>
                    <select
                      value={link.link_type}
                      onChange={(e) => updateLink(index, 'link_type', e.target.value as 'article' | 'stream')}
                      required
                    >
                      <option value="article">Статья</option>
                      <option value="stream">Запись</option>
                    </select>
                  </div>
                  
                  <div className={styles.linkTitle}>
                    <input
                      type="text"
                      value={link.link_title}
                      onChange={(e) => updateLink(index, 'link_title', e.target.value)}
                      placeholder="Название ссылки"
                      required
                    />
                  </div>
                  
                  <div className={styles.linkUrl}>
                    <input
                      type="url"
                      value={link.link_url}
                      onChange={(e) => updateLink(index, 'link_url', e.target.value)}
                      placeholder="URL ссылки"
                      required
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className={styles.removeLinkButton}
                    title="Удалить ссылку"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
            
            <div className={styles.formActions}>
              <Button 
                type="submit" 
                disabled={createLoading}
                style={styles.submitButton}
              >
                {createLoading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Создание...
                  </>
                ) : (
                  'Создать пост'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {successMessage && (
        <div className={styles.successMessage}>
          <p>{successMessage}</p>
        </div>
      )}

      {error && selectedRole && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <Button onClick={() => setError(null)}>✖</Button>
        </div>
      )}

      {selectedRole && !contentLoading && (
        <div className={styles.contentList}>
          {content.length === 0 ? (
            <div className={styles.emptyState}>
              <p>📝 Постов пока нет</p>
            </div>
          ) : (
            <div className={styles.contentGrid}>
              {content.map((item) => (
                <div key={item.id} className={styles.contentCard}>
                  {editingContent?.id === item.id ? (
                    <ContentEditForm 
                      content={editingContent}
                      onSave={(updates) => handleUpdateContent(item.id, updates)}
                      onCancel={() => setEditingContent(null)}
                    />
                  ) : (
                    <>
                      <div className={styles.contentHeader}>
                        <div className={styles.titleRow}>
                          <h3 className={styles.contentTitle}>{item.title}</h3>
                          {item.is_scheduled && item.scheduled_at && (
                            <span className={styles.scheduledBadge}>
                              📅 {formatDateTime(item.scheduled_at)}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className={styles.contentDescription}>{item.description}</p>
                        )}
                      </div>
                      
                      <div className={styles.contentLinks}>
                        {item.links && item.links.length > 0 ? (
                          item.links.map((link) => (
                            <Button 
                              key={link.id}
                              href={link.link_url} 
                              target="_blank" 
                              style={`${styles.link} ${styles[link.link_type]}`}
                            >
                              {link.link_type === 'article' ? 'Статья: ' : 'Запись: '}{link.link_title}
                            </Button>
                          ))
                        ) : (
                          // Fallback для старых постов
                          <>
                            {item.article_link && (
                              <Button 
                                href={item.article_link} 
                                target="_blank" 
                                style={`${styles.link} ${styles.article}`}
                              >
                                Статья
                              </Button>
                            )}
                            {item.stream_link && (
                              <Button 
                                href={item.stream_link} 
                                target="_blank" 
                                style={`${styles.link} ${styles.stream}`}
                              >
                                Запись
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className={styles.contentMeta}>
                        <div className={styles.metaRow}>
                          <span>Создан: {formatDate(item.created_at)}</span>
                          {item.updated_at !== item.created_at && (
                            <span>Обновлен: {formatDate(item.updated_at)}</span>
                          )}
                        </div>
                        {item.is_scheduled && item.scheduled_at && (
                          <div className={styles.schedulingRow}>
                                                         <span className={styles.timeRemaining}>
                               {getTimeRemaining(item.scheduled_at)}
                             </span>
                          </div>
                        )}
                                                 {item.status && (
                           <span className={`${styles.status} ${styles[item.status]}`}>
                             {item.status === 'draft' ? 'Черновик' : 
                              item.status === 'scheduled' ? 'Запланирован' : 
                              item.status === 'published' ? 'Опубликован' : 
                              item.status}
                           </span>
                         )}
                      </div>
                      
                                             <div className={styles.contentActions}>
                         <button 
                           onClick={() => setEditingContent(item)}
                           className={styles.editButton}
                           title="Редактировать"
                         >
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                             <path d="m18.5 2.5 3 3L10 17l-4 1 1-4z"/>
                           </svg>
                         </button>
                         <button 
                           onClick={() => handleDeleteContent(item.id)}
                           className={styles.deleteButton}
                           title="Удалить"
                         >
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M3 6h18"/>
                             <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                             <path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2"/>
                             <line x1="10" y1="11" x2="10" y2="17"/>
                             <line x1="14" y1="11" x2="14" y2="17"/>
                           </svg>
                         </button>
                       </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {contentLoading && (
        <Loading />
      )}
    </div>
  );
};

const ContentEditForm: React.FC<{
  content: Content;
  onSave: (updates: UpdateContentRequest) => void;
  onCancel: () => void;
}> = ({ content, onSave, onCancel }) => {
  const [title, setTitle] = useState(content.title);
  const [description, setDescription] = useState(content.description || '');
  const [links, setLinks] = useState<Array<{
    id?: string;
    link_type: 'article' | 'stream';
    link_title: string;
    link_url: string;
  }>>(content.links || []);

  const addLink = () => {
    setLinks(prev => [...prev, { link_type: 'article', link_title: '', link_url: '' }]);
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: string, value: string) => {
    setLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, links });
  };

  return (
    <div className={styles.editFormContainer}>
      <form onSubmit={handleSubmit} className={styles.editForm}>
        <div className={styles.formGroup}>
          <label>Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className={styles.linksSection}>
          <div className={styles.linksHeader}>
            <Button 
              type="button" 
              onClick={addLink}
              style={styles.addLinkButton}
            >
              + Добавить ссылку
            </Button>
          </div>
          
          {links.map((link, index) => (
            <div key={index} className={styles.linkRow}>
              <div className={styles.linkType}>
                <select
                  value={link.link_type}
                  onChange={(e) => updateLink(index, 'link_type', e.target.value)}
                  required
                >
                  <option value="article">Статья</option>
                  <option value="stream">Запись</option>
                </select>
              </div>
              
              <div className={styles.linkTitle}>
                <input
                  type="text"
                  value={link.link_title}
                  onChange={(e) => updateLink(index, 'link_title', e.target.value)}
                  placeholder="Название ссылки"
                  required
                />
              </div>
              
              <div className={styles.linkUrl}>
                <input
                  type="url"
                  value={link.link_url}
                  onChange={(e) => updateLink(index, 'link_url', e.target.value)}
                  placeholder="URL ссылки"
                  required
                />
              </div>
              
              <button
                type="button"
                onClick={() => removeLink(index)}
                className={styles.removeLinkButton}
                title="Удалить ссылку"
              >
                ✖
              </button>
            </div>
          ))}
        </div>
        
        <Button type="submit" style={styles.saveButton}>Сохранить</Button>
        <Button type="button" onClick={onCancel} style={styles.cancelButton}>Отмена</Button>
      </form>
    </div>
  );
};

export default ContentManager;
