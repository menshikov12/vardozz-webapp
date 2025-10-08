import './App.scss'
import { useState, useEffect, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Loading } from './components/Loading/Loading'
import { Layout } from './components/Layout/Layout'
import { Main } from './components/Main/Main'
import { About } from './components/About/About'
import { Ncng } from './components/Ncng/Ncng'
import { Inside } from './components/Inside/Inside'
import { Roadmap } from './components/Roadmap/Roadmap'
import { Tariff } from './components/Tariff/Tariff'
import Admin from './components/Admin/Admin'
import AdminMain from './components/AdminMain/AdminMain'
import Roles from './components/Roles/Roles'
import Content from './components/Content/Content'
import UserContent from './components/UserContent/UserContent'
import DateSettings from './components/Admin/DateSettings'
import PriceSettings from './components/Admin/PriceSettings'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import { useUserRegistration } from './hooks/useUserRegistration'
import { useAdminCheck } from './hooks/useAdminCheck'
import { finalUser as telegramUser, tg } from './shared/lib/telegram'
import { ErrorDisplay } from './components/ErrorDisplay/ErrorDisplay'
import { useErrorCollector } from './hooks/useErrorCollector'
import { useTelegramNavigation } from './hooks/useTelegramNavigation'

// Компонент для управления навигацией внутри Router
const AppRouter = () => {
  // Инициализируем навигацию Telegram
  useTelegramNavigation()
  
  return null
}

function App() {
  const [isRegistered, setIsRegistered] = useState(false)
  const visitedSectionsRef = useRef<Set<string>>(new Set())
  const { registerUser } = useUserRegistration()
  const { errors, addError, clearAllErrors } = useErrorCollector()
  const { loading: adminCheckLoading } = useAdminCheck()

  // Функция для отметки раздела как посещенного
  const markSectionAsVisited = useCallback((section: string) => {
    visitedSectionsRef.current.add(section)
  }, [])

  // Функция для обработки клика по отзывам
  const handleReviewsClick = useCallback(() => {
    markSectionAsVisited('reviews')
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink('https://t.me/ncngfeedback')
    } else {
      window.open('https://t.me/ncngfeedback', '_blank', 'noopener,noreferrer')
    }
  }, [markSectionAsVisited])

  // Стабильные callback функции для каждого маршрута
  const handleAboutVisit = useCallback(() => markSectionAsVisited('about'), [markSectionAsVisited])
  const handleNcngVisit = useCallback(() => markSectionAsVisited('ncng'), [markSectionAsVisited])
  const handleInsideVisit = useCallback(() => markSectionAsVisited('inside'), [markSectionAsVisited])
  const handleRoadmapVisit = useCallback(() => markSectionAsVisited('roadmap'), [markSectionAsVisited])
  const handleTariffVisit = useCallback(() => markSectionAsVisited('tariff'), [markSectionAsVisited])

  // Функция для предзагрузки изображений
  const preloadImages = useCallback(() => {
    const imageUrls = [
      'https://i.postimg.cc/QCBQ7nLH/2025-09-08-184209399.png', // VARDOZZ фото
      'https://i.postimg.cc/J7YW7szC/Comp-9-2025-08-23-03-08-37.png' // Logo для Loading
    ]
    
    imageUrls.forEach(url => {
      const img = new Image()
      img.src = url
      // Не нужно ждать загрузки, просто запускаем процесс
    })
  }, [])

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Предзагрузка изображений сразу при запуске
        preloadImages()
        
        // Проверка Telegram WebApp (отключена для разработки)
        if (window.Telegram?.WebApp) {
          // Инициализация Telegram Web App
          const webApp = window.Telegram.WebApp;
          webApp.ready();
          
          // Настройка темы
          document.documentElement.style.setProperty('--tg-theme-bg-color', webApp.themeParams.bg_color || '#ffffff');
          document.documentElement.style.setProperty('--tg-theme-text-color', webApp.themeParams.text_color || '#000000');
          
          // Инициализация кнопки "Назад" - теперь управляется через хук useTelegramNavigation
          const backButton = webApp.BackButton;
          backButton.hide(); // По умолчанию скрыта, показывается через хук
        }

        // Проверка данных пользователя
        if (!telegramUser) {
          addError(
            'user-data-missing',
            'Данные пользователя недоступны',
            'Не удалось получить данные пользователя из Telegram WebApp',
            {
              telegramWebApp: !!tg,
              initDataUnsafe: tg?.initDataUnsafe || 'missing',
              user: tg?.initDataUnsafe?.user || 'missing'
            }
          );
        } else if (!isRegistered) {
          // Автоматическая регистрация пользователя (только один раз)


          
          const registrationResult = await registerUser();
          
          if (registrationResult.error) {
            addError(
              'registration-failed',
              'Ошибка регистрации',
              registrationResult.error,
              {
                telegramUser,
                timestamp: new Date().toISOString()
              }
            );
          } else {

          }
          

          setIsRegistered(true); // Помечаем, что регистрация выполнена
        }

      } catch (error) {
        addError(
          'initialization-error',
          'Ошибка инициализации',
          error instanceof Error ? error.message : 'Неизвестная ошибка',
          {
            error: error,
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          }
        );
      }

    };

    initializeApp();
  }, [addError, isRegistered, preloadImages]);

  if (adminCheckLoading) {
    return <Loading />
  }

  return (
    <div>
      {/* Отображение ошибок */}
      {errors.length > 0 && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 9999,
          maxHeight: '50vh',
          overflow: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }}>
          {errors.map(error => (
            <ErrorDisplay
              key={error.id}
              title={error.title}
              errors={[error.message]}
              debugInfo={error.debugInfo}
              onRetry={() => window.location.reload()}
            />
          ))}
          <div style={{ padding: '10px', textAlign: 'center' }}>
            <button 
              onClick={clearAllErrors}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✖ Закрыть все ошибки
            </button>
          </div>
        </div>
      )}

      <BrowserRouter>
        <AppRouter />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Main visitedSections={visitedSectionsRef.current} onReviewsClick={handleReviewsClick} />} />
            <Route path="/about" element={<About onVisit={handleAboutVisit} />} />
            <Route path="/ncng" element={<Ncng onVisit={handleNcngVisit} />} />
            <Route path="/inside" element={<Inside onVisit={handleInsideVisit} />} />
            <Route path="/roadmap" element={<Roadmap onVisit={handleRoadmapVisit} />} />
            <Route path="/tariff" element={<Tariff onVisit={handleTariffVisit} />} />
            <Route path="/for-you" element={<UserContent />} />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminMain />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/admin/roles" element={
              <ProtectedRoute adminOnly={true}>
                <Roles />
              </ProtectedRoute>
            } />
            <Route path="/admin/content" element={
              <ProtectedRoute adminOnly={true}>
                <Content />
              </ProtectedRoute>
            } />
            <Route path="/admin/dates" element={
              <ProtectedRoute adminOnly={true}>
                <DateSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/prices" element={
              <ProtectedRoute adminOnly={true}>
                <PriceSettings />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
        
      </BrowserRouter>
    </div>
  ) 
}

export default App