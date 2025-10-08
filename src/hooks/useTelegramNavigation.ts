import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDeviceDetection } from './useDeviceDetection';

export const useTelegramNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backButtonCallbackRef = useRef<(() => void) | null>(null);
  const { isMobile, isTelegramApp } = useDeviceDetection();

  // Показываем/скрываем кнопку "Назад" в зависимости от текущего маршрута
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const backButton = window.Telegram.WebApp.BackButton;
      
      if (location.pathname !== '/' && location.pathname !== '') {
        backButton.show();
        
        // Создаем новый callback для кнопки "Назад"
        const backButtonCallback = () => {
          navigate('/');
        };
        
        // Сохраняем ссылку на callback для последующего отключения
        backButtonCallbackRef.current = backButtonCallback;
        
        // Устанавливаем обработчик для кнопки "Назад"
        backButton.onClick(backButtonCallback);
      } else {
        backButton.hide();
        
        // Отключаем предыдущий обработчик, если он был установлен
        if (backButtonCallbackRef.current) {
          backButton.offClick(backButtonCallbackRef.current);
          backButtonCallbackRef.current = null;
        }
      }
    }
  }, [location.pathname, navigate]);

  // Функция для безопасной навигации по внутренним ссылкам
  const safeNavigate = useCallback((path: string) => {
    if (path.startsWith('/')) {
      navigate(path);
    } else if (path.startsWith('http')) {
      // Специальная логика для разных типов ссылок
      if (path.includes('teletype.in')) {
        // Teletype ссылки всегда открываем в новом окне
        window.open(path, '_blank', 'noopener,noreferrer');
      } else if (path.includes('t.me')) {
        // Telegram ссылки - простая проверка User Agent
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        if (isMobileDevice) {
          // На мобильных устройствах открываем как обычную ссылку
          window.location.href = path;
        } else {
          // На десктопе открываем в новом окне
          window.open(path, '_blank', 'noopener,noreferrer');
        }
      } else {
        // Остальные внешние ссылки
        if (isTelegramApp && !isMobile && window.Telegram?.WebApp) {
          // В Telegram WebApp на десктопе открываем через API
          window.Telegram.WebApp.openLink(path);
        } else if (isMobile) {
          // На мобильных устройствах открываем в том же окне
          window.location.href = path;
        } else {
          // На десктопе вне Telegram открываем в новом окне
          window.open(path, '_blank', 'noopener,noreferrer');
        }
      }
    }
  }, [navigate, isMobile, isTelegramApp]);

  // Функция для открытия внешних ссылок
  const openExternalLink = useCallback((url: string) => {
           // Специальная логика для разных типов ссылок
       if (url.includes('teletype.in')) {
         // Teletype ссылки всегда открываем в новом окне
         window.open(url, '_blank', 'noopener,noreferrer');
       } else if (url.includes('t.me')) {
         // Если это Telegram Desktop, открываем в новом окне, иначе в том же
         if (window.Telegram?.WebApp?.platform === 'tdesktop') {
           window.open(url, '_blank', 'noopener,noreferrer');
         } else {
           window.location.href = url;
         }
       } else {
      // Остальные внешние ссылки
      if (isTelegramApp && !isMobile && window.Telegram?.WebApp) {
        // В Telegram WebApp на десктопе открываем через API
        window.Telegram.WebApp.openLink(url);
      } else if (isMobile) {
        // На мобильных устройствах открываем в том же окне
        window.location.href = url;
      } else {
        // На десктопе вне Telegram открываем в новом окне
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  }, [isMobile, isTelegramApp]);

  return {
    safeNavigate,
    openExternalLink,
    currentPath: location.pathname
  };
};
