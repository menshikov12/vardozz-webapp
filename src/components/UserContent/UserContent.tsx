import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserContent.module.scss';
import { useApi } from '../../hooks/useApi';
import type { Content } from '../../types/api';
import { finalUser as telegramUser, showBackButton, hideBackButton } from '../../shared/lib/telegram';
import { Loading } from '../Loading/Loading';
import { Button } from '../Button/Button';

const UserContent: React.FC = () => {
  const [content, setContent] = useState<Content[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserContent();
    
    // Автоматически проверяем и публикуем просроченные посты каждые 2 минуты
    const checkAndPublishOverduePosts = async () => {
      try {
        const result = await api.post<{ message: string; published: number; posts: Content[] }>('/admin/content/auto-publish', {}, {
          'x-telegram-id': telegramUser?.id?.toString() || '',
        });

        if (result.data && result.data.published > 0) {
          // Обновляем локальное состояние
          setContent(prev => {
            const updatedContent = [...prev];
            result.data!.posts.forEach(publishedPost => {
              const index = updatedContent.findIndex(item => item.id === publishedPost.id);
              if (index !== -1) {
                updatedContent[index] = publishedPost;
              }
            });
            return updatedContent;
          });
        }
      } catch (err) {
        console.error('Ошибка при автоматической проверке постов:', err);
      }
    };
    
    // Проверяем сразу при загрузке
    checkAndPublishOverduePosts();
    
    // Устанавливаем интервал проверки каждые 30 минут для оптимального баланса между актуальностью и производительностью
    const interval = setInterval(checkAndPublishOverduePosts, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    showBackButton(() => {
      navigate('/');
      hideBackButton();
    });
    
    return () => {
      hideBackButton();
    };
  }, [navigate]);

  const fetchUserContent = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!telegramUser?.id) {
        setError('Telegram user ID не найден');
        setLoading(false);
        return;
      }

      // Запрашиваем только опубликованные посты
      const result = await api.get<{ content: Content[], userRole: string }>(`/user/content/${telegramUser.id}?status=published`, {
        'x-telegram-id': telegramUser.id.toString(),
      });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setContent(result.data.content || []);
        setUserRole(result.data.userRole || '');
      }
    } catch (err) {
      console.error('Ошибка при получении контента:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className={styles.userContent}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.userContent}>
        <div className={styles.error}>
          <h2>Ошибка</h2>
          <p>{error}</p>
          <Button onClick={fetchUserContent} style={styles.retryButton}>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className={styles.userContent}>
        <div className={styles.noRole}>
          <h2>🔒 Доступ ограничен</h2>
          <p>У вас нет назначенной роли для просмотра контента.</p>
          <p>Обратитесь к администратору для получения доступа.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.userContent}>
      <div className={styles.header}>
        <h1>ОБУЧЕНИЕ</h1>
        <div className={styles.roleInfo}>
          <span className={styles.roleName}>{userRole}</span>
        </div>
      </div>

      {content.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>Ничего нет</h3>
        </div>
      ) : (
        <div className={styles.contentGrid}>
          {content
            .filter(item => {
              // Дополнительная проверка на frontend для надежности
              // Основная фильтрация происходит на backend
              
              // Если статус не установлен (старые посты), считаем их опубликованными
              if (!item.status) return true;
              
              // Показываем только опубликованные посты
              if (item.status === 'published') return true;
              
              // НЕ показываем черновики и запланированные посты
              return false;
            })
            .map((item) => (
            <article key={item.id} className={styles.contentCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.contentTitle}>{item.title}</h2>
                <time className={styles.contentDate}>
                  {formatDate(item.created_at)}
                </time>
              </div>
              
              {item.description && (
                <div className={styles.contentDescription}>
                  <p>{item.description}</p>
                </div>
              )}
              
              <div className={styles.contentLinks}>
                {item.links && item.links.length > 0 ? (
                  // Новая структура с массивом links
                  (() => {
                    const articles = item.links.filter(link => link.link_type === 'article');
                    const streams = item.links.filter(link => link.link_type === 'stream');
                    
                    return (
                      <>
                        {/* Статьи */}
                        {articles.map((link) => (
                          <div key={link.id} className={styles.linkContainer}>
                            <div className={styles.linkType}>
                              СТАТЬЯ
                            </div>
                            <Button 
                              href={link.link_url} 
                              target="_blank" 
                              style={`${styles.link} ${styles[link.link_type]}`}
                            >
                              <span className={styles.linkText}>
                                {link.link_title}
                              </span>
                              <span className={styles.linkArrow}>→</span>
                            </Button>
                          </div>
                        ))}
                        
                        {/* Разделитель между статьями и эфирами */}
                        {articles.length > 0 && streams.length > 0 && (
                          <div className={styles.divider}></div>
                        )}
                        
                        {/* Эфиры */}
                        {streams.map((link) => (
                          <div key={link.id} className={styles.linkContainer}>
                            <div className={styles.linkType}>
                              Запись
                            </div>
                            <Button 
                              href={link.link_url} 
                              target="_blank" 
                              style={`${styles.link} ${styles[link.link_type]}`}
                            >
                              <span className={styles.linkText}>
                                {link.link_title}
                              </span>
                              <span className={styles.linkArrow}>→</span>
                            </Button>
                          </div>
                        ))}
                      </>
                    );
                  })()
                ) : (
                  // Fallback для старых постов
                  <>
                    {item.article_link && (
                      <div className={styles.linkContainer}>
                        <div className={styles.linkType}>СТАТЬЯ</div>
                        <Button 
                          href={item.article_link} 
                          target="_blank" 
                          style={`${styles.link} ${styles.articleLink}`}
                        >
                          <span className={styles.linkText}>Читать статью</span>
                          <span className={styles.linkArrow}>→</span>
                        </Button>
                      </div>
                    )}
                    
                    {/* Разделитель между статьями и эфирами для старых постов */}
                    {item.article_link && item.stream_link && (
                      <div className={styles.divider}></div>
                    )}
                    
                    {item.stream_link && (
                      <div className={styles.linkContainer}>
                        <div className={styles.linkType}>Запись занятия</div>
                        <Button 
                          href={item.stream_link} 
                          target="_blank" 
                          style={`${styles.link} ${styles.streamLink}`}
                        >
                          <span className={styles.linkText}>Смотреть запись занятия</span>
                          <span className={styles.linkArrow}>→</span>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {item.updated_at !== item.created_at && (
                <div className={styles.updateInfo}>
                  <span>Обновлено: {formatDate(item.updated_at)}</span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <p>Материалы обновляются регулярно. Заходите почаще! 😊</p>
      </div>
    </div>
  );
};

export default UserContent;
