import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { showBackButton, hideBackButton } from '../shared/lib/telegram';

/**
 * Хук для безопасной работы с кнопкой "назад" в Telegram WebApp
 * Предотвращает множественные клики и навигацию
 */
export const useTelegramBackButton = (targetPath: string) => {
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const handleBackClick = () => {
      // Предотвращаем множественные клики
      if (isNavigatingRef.current) {
        console.log('🚫 Back button click ignored - already navigating');
        return;
      }

      console.log('🔙 Back button clicked, navigating to:', targetPath);
      isNavigatingRef.current = true;
      
      // Выполняем навигацию
      navigate(targetPath);
      hideBackButton();
      
      // Сбрасываем флаг через задержку
      setTimeout(() => {
        isNavigatingRef.current = false;
        console.log('✅ Back button navigation lock released');
      }, 1000);
    };

    showBackButton(handleBackClick);

    return () => {
      hideBackButton();
    };
  }, [navigate, targetPath]);
};
