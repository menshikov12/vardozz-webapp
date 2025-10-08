import s from './Button.module.scss'
import { useTelegramNavigation } from '../../hooks/useTelegramNavigation'
import { useDeviceDetection } from '../../hooks/useDeviceDetection'

import { scrollToTop } from '../../hooks/useScrollToTop'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const Button = ({ 
    children, 
    style,
    href,
    target,
    type,
    disabled,
    next,
    onClick
}: { 
    children: React.ReactNode, 
    style?: string | React.CSSProperties,
    href?: string,
    target?: string,
    type?: 'button' | 'submit' | 'reset',
    disabled?: boolean,
    next?: boolean,
    onClick?: () => void
}) => {
    const { safeNavigate, openExternalLink } = useTelegramNavigation();
    const { isMobile } = useDeviceDetection();
    const className = typeof style === 'string' ? `${s.button} ${style}` : s.button;
    const inlineStyle = typeof style === 'object' ? style : undefined;

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (href) {
            // Специальная проверка для конкретной ссылки
            if (href === 'https://t.me/vardozz') {
                if (window.Telegram?.WebApp?.platform === 'tdesktop') {
                    if (window.Telegram?.WebApp?.openLink) {
                        window.Telegram.WebApp.openLink(href);
                    } else {
                        // Fallback если API недоступен
                        window.open(href, '_blank', 'noopener,noreferrer');
                    }
                } else {
                    // Используем улучшенную функцию прокрутки с поддержкой iOS
                    scrollToTop(true);
                    // На других платформах открываем в том же окне
                    window.location.href = href;
                    
                }
                return;
            }
            
            // Teletype ссылки всегда в новом окне
            if (href.includes('teletype.in')) {
                window.open(href, '_blank', 'noopener,noreferrer');
                return;
            }
            
            // Остальные ссылки обрабатываем как раньше
            if (target === '_blank' && !isMobile) {
                openExternalLink(href);
            } else if (href.startsWith('http')) {
                openExternalLink(href);
            } else {
                safeNavigate(href);
            }
        }
    };

    return (
        <button 
            className={className}
            style={inlineStyle}
            onClick={handleClick}
            type={type}
            disabled={disabled}
        >
            {next && (
                <>
                    <ChevronRight className={s.icon} size={20} />
                </>
            )}   
            {children}
            {next && (
                <>
                    <ChevronLeft className={s.icon} size={20} />
                </>
            )}
        </button>
    )
}