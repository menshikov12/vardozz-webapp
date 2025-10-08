// Получаем объект Telegram WebApp с дополнительными проверками
const getTelegramWebApp = () => {
  // Проверяем базовый объект
  if (window.Telegram?.WebApp) {
    console.log('✅ Telegram WebApp найден через window.Telegram.WebApp');
    return window.Telegram.WebApp;
  }

  // Проверяем альтернативные пути (на случай, если прокси изменил структуру)
  if ((window as any).TelegramWebviewProxy?.postEvent) {
    console.log('🔄 Найден TelegramWebviewProxy, но не WebApp объект');
  }

  // Проверяем, есть ли скрипт в DOM
  const telegramScript = document.querySelector('script[src*="telegram-web-app.js"]');
  if (telegramScript) {
    console.log('📜 Скрипт Telegram WebApp найден в DOM, но объект недоступен');
    console.log('🔍 Возможно, CloudPub или прокси блокирует выполнение скрипта');
  } else {
    console.log('❌ Скрипт Telegram WebApp не найден в DOM');
  }

  return null;
};

// Получаем объект Telegram WebApp
export const tg = getTelegramWebApp();

// Функция для безопасного получения данных пользователя
const getTelegramUser = () => {
  console.log('🔍 Telegram WebApp диагностика:');
  console.log('- window.Telegram:', !!window.Telegram);
  console.log('- window.Telegram.WebApp:', !!window.Telegram?.WebApp);
  console.log('- User Agent:', navigator.userAgent);
  console.log('- URL:', window.location.href);
  console.log('- Referrer:', document.referrer);
  console.log('- Origin:', window.location.origin);
  console.log('- Host:', window.location.host);
  console.log('- Is HTTPS:', window.location.protocol === 'https:');
  
  // Проверяем CloudPub специфичные признаки
  const isCloudPub = window.location.host.includes('cloudpub.ru');
  console.log('- CloudPub detected:', isCloudPub);
  
  // Проверяем доступность Telegram скриптов
  const telegramScripts = Array.from(document.scripts).filter(s => 
    s.src.includes('telegram') || s.src.includes('web-app')
  );
  console.log('- Telegram scripts found:', telegramScripts.length);
  telegramScripts.forEach((script, i) => {
    console.log(`  Script ${i + 1}:`, script.src);
  });
  
  // Проверяем специфичные для Telegram признаки
  const isTelegramUA = navigator.userAgent.includes('Telegram');
  const hasTelegramParams = window.location.search.includes('tgWebApp') || 
                           window.location.hash.includes('tgWebApp') ||
                           document.referrer.includes('telegram');
  
  console.log('- Telegram User Agent:', isTelegramUA);
  console.log('- Telegram URL params:', hasTelegramParams);
  
  // Проверяем заголовки (если доступны)
  console.log('- Document domain:', document.domain);
  console.log('- Protocol:', window.location.protocol);

  // Проверяем, что мы в Telegram WebApp
  if (!tg) {
    console.log('❌ Telegram WebApp not available');
    console.log('💡 Возможные причины:');
    console.log('  - Приложение не запущено в Telegram');
    console.log('  - Прокси/CDN блокирует Telegram объекты');
    console.log('  - Неправильная настройка домена в BotFather');
    return null;
  }

  console.log('✅ Telegram WebApp object found');
  console.log('- WebApp version:', (tg as any).version || 'unknown');
  console.log('- Platform:', (tg as any).platform || 'unknown');
  console.log('- Color scheme:', tg.colorScheme);

  // Проверяем наличие initDataUnsafe
  if (!tg.initDataUnsafe) {
    console.log('❌ initDataUnsafe not available');
    console.log('💡 Это может означать:');
    console.log('  - Приложение не авторизовано как WebApp');
    console.log('  - Проблемы с доменом или HTTPS');
    console.log('  - Прокси удаляет данные авторизации');
    return null;
  }

  console.log('✅ initDataUnsafe found');

  // Получаем пользователя
  const user = tg.initDataUnsafe.user;
  
  if (!user) {
    console.log('❌ User data not available in initDataUnsafe');
    console.log('💡 initDataUnsafe содержит:', Object.keys(tg.initDataUnsafe));
    return null;
  }

  // Валидируем основные поля
  if (!user.id) {
    console.log('❌ User ID not available');
    console.log('💡 User object:', user);
    return null;
  }

  console.log('✅ Telegram user data received:', {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    language_code: user.language_code
  });

  return user;
};

// Экспортируем данные пользователя (только реальные!)
export const user = getTelegramUser();

// Функция для попытки восстановления данных через URL параметры (workaround для прокси)
export const tryGetDataFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  
  console.log('🔍 Поиск данных Telegram в URL:');
  console.log('- Search params:', window.location.search);
  console.log('- Hash:', hash);
  
  // Ищем tgWebAppData в параметрах
  const tgWebAppData = urlParams.get('tgWebAppData') || 
                      hash.match(/tgWebAppData=([^&]+)/)?.[1];
  
  if (tgWebAppData) {
    console.log('✅ Найдены данные tgWebAppData в URL');
    try {
      const decodedData = decodeURIComponent(tgWebAppData);
      console.log('📊 Декодированные данные:', decodedData);
      
      // Парсим данные (базовый парсинг)
      const params = new URLSearchParams(decodedData);
      const userParam = params.get('user');
      
      if (userParam) {
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('👤 Данные пользователя из URL:', userData);
        return userData;
      }
    } catch (error) {
      console.error('❌ Ошибка парсинга данных из URL:', error);
    }
  }
  
  return null;
};

// Если нет данных через WebApp, пытаемся получить из URL
export const fallbackUser = !user ? tryGetDataFromUrl() : null;
export const finalUser = user || fallbackUser;

// Информация для диагностики
export const diagnosticInfo = {
  hasWebApp: !!tg,
  hasUser: !!user,
  hasFallback: !!fallbackUser,
  isCloudPub: typeof window !== 'undefined' && window.location.host.includes('cloudpub.ru'),
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  url: typeof window !== 'undefined' ? window.location.href : '',
  telegramScripts: typeof document !== 'undefined' ? 
    Array.from(document.scripts).filter(s => s.src.includes('telegram')).length : 0
};

export const initTelegram = () => {
  if (tg) {
    tg.ready();
  }
};

// Безопасные функции для работы с BackButton
export const showBackButton = (onClickCallback: () => void) => {
  if (tg?.BackButton) {
    tg.BackButton.show();
    // Удаляем предыдущие обработчики перед добавлением нового
    tg.BackButton.offClick(onClickCallback);
    tg.BackButton.onClick(onClickCallback);
  }
};

export const hideBackButton = () => {
  if (tg?.BackButton) {
    tg.BackButton.hide();
  }
};