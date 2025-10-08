import s from './Main.module.scss'
import { Link } from 'react-router-dom'
import { useAdminCheck } from '../../hooks/useAdminCheck'

import { useEffect, useState } from 'react'
import { finalUser as telegramUser } from '../../shared/lib/telegram'
import { userRoleCache } from '../../shared/lib/userRoleCache'
import { scrollToTop } from '../../hooks/useScrollToTop'

interface MainProps {
  visitedSections: Set<string>
  onReviewsClick?: () => void
}   

/**
 * Главный компонент с автоматическим скроллом при нехватке места
 * Скролл появляется автоматически когда контент не помещается в контейнер
 */
export const Main = ({ visitedSections }: MainProps) => {
    const { isAdmin, hasContentAccess, loading } = useAdminCheck();
    const [showAdminButton, setShowAdminButton] = useState(false);
    const [showEducationButton, setShowEducationButton] = useState(false);

    // Константы для админских Telegram ID (для обратной совместимости)
    const ADMIN_TELEGRAM_IDS = [748516935, 1750233627];

    useEffect(() => {
        if (!telegramUser?.id) return;

        const telegramId = String(telegramUser.id);
        
        // Проверяем кэш для немедленного отображения
        const cachedRole = userRoleCache.getRole(telegramId);
        
        // Проверяем админские права
        const userId = telegramUser.id;
        const isUserAdmin = ADMIN_TELEGRAM_IDS.includes(userId) || 
                           ADMIN_TELEGRAM_IDS.includes(Number(userId)) ||
                           ADMIN_TELEGRAM_IDS.includes(parseInt(String(userId)));
        
        const hasAdminRole = cachedRole === 'ADMIN' || cachedRole === 'admin';
        const shouldShowAdmin = isUserAdmin || hasAdminRole;
        
        // Проверяем доступ к контенту
        const shouldShowEducation = cachedRole && cachedRole.trim() !== '' || hasAdminRole;
        
        setShowAdminButton(shouldShowAdmin);
        setShowEducationButton(shouldShowEducation);
        
        // Если данные загружены из API, обновляем состояние
        if (!loading) {
            setShowAdminButton(isAdmin);
            setShowEducationButton(hasContentAccess);
        }
    }, [isAdmin, hasContentAccess, loading]);

    const handleExternalLink = (url: string) => {
        if (window.Telegram?.WebApp?.platform === 'tdesktop') {
            if (window.Telegram?.WebApp?.openLink) {
                window.Telegram.WebApp.openLink(url);
            } else {
                // Fallback если API недоступен
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        } else {
            // Используем улучшенную функцию прокрутки с поддержкой iOS
            scrollToTop(true);
            // На других платформах открываем в том же окне
            window.location.href = url;
            
        }
    };

    return (
        <div className={s.mainContent} role="main" aria-label="Главное меню">
            <div className={s.contentWrapper}>
                <Link to="/ncng" className={s.navLink}>
                    <h2 className={`${s.pulseTitle} ${visitedSections.has('ncng') ? s.visitedTitle : ''}`}>
                        ЧТО ТАКОЕ NCNG?
                    </h2>
                </Link>
                <Link to="/about" className={s.navLink}>
                    <h2 className={`${s.pulseTitle} ${visitedSections.has('about') ? s.visitedTitle : ''}`}>
                        ПРЕПОДАВАТЕЛИ
                    </h2>
                </Link>
                <Link to="/inside" className={s.navLink}>
                    <h2 className={`${s.pulseTitle} ${visitedSections.has('inside') ? s.visitedTitle : ''}`}>
                        ЧТО ВНУТРИ?
                    </h2>
                </Link>
                <Link to="/roadmap" className={s.navLink}>
                    <h2 className={`${s.pulseTitle} ${visitedSections.has('roadmap') ? s.visitedTitle : ''}`}>
                        РОАДМАП
                    </h2>
                </Link>
                <Link to="/tariff" className={s.navLink}>
                    <h2 className={`${s.pulseTitle} ${visitedSections.has('tariff') ? s.visitedTitle : ''}`}>
                        ТАРИФЫ
                    </h2>
                </Link>
                <div 
                    className={s.navLink} 
                    onClick={() => handleExternalLink('https://t.me/ncngfeedback')}
                    style={{ cursor: 'pointer' }}
                >
                    <h2 className={`${s.pulseTitle} ${visitedSections.has('reviews') ? s.visitedTitle : ''}`}>
                        ОТЗЫВЫ
                    </h2>
                </div>
                {showAdminButton && (
                    <Link to="/admin" className={s.navLink}>
                        <h2 className={s.pulseTitle}>
                            АДМИНКА
                        </h2>
                    </Link>
                )}
                {showEducationButton && (
                    <Link to="/for-you" className={s.navLink}>
                        <h2 className={`${s.pulseTitle} ${s.educationTitle}`}>
                            ОБУЧЕНИЕ
                        </h2>
                    </Link>
                )}
            </div>
        </div>
    )
}