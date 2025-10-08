import { useState, useEffect } from 'react';

export const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  const [platform, setPlatform] = useState<string>('unknown');

  useEffect(() => {
    // Определяем, что это Telegram WebApp
    const isTelegram = !!window.Telegram?.WebApp;
    setIsTelegramApp(isTelegram);

    // Получаем информацию о платформе от Telegram
    if (isTelegram && window.Telegram?.WebApp?.platform) {
      setPlatform(window.Telegram.WebApp.platform);
    }

    // Простое определение мобильного устройства по User Agent
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Простая логика: если это мобильное устройство по User Agent, то считаем мобильным
      setIsMobile(prev => prev !== isMobileDevice ? isMobileDevice : prev);
    };

    checkMobile();
    
    // Добавляем слушатель изменения размера окна (опционально)
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return { isMobile, isTelegramApp, platform };
};
