import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Функция для определения iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Специальная функция для iOS Safari
const scrollToTopIOS = () => {
  // Сначала пробуем найти все возможные скроллируемые контейнеры
  const scrollableContainers = [
    document.getElementById('root'),
    document.querySelector('main'),
    document.querySelector('.tariffContent'),
    document.querySelector('.roadmapWrapper'),
    document.body,
    document.documentElement
  ].filter(Boolean)
  
  // Метод 1: Прямая установка scrollTop для всех контейнеров
  scrollableContainers.forEach(container => {
    if (container) {
      if (container === document.body || container === document.documentElement) {
        (container as Element).scrollTop = 0
      } else if (container instanceof HTMLElement) {
        container.scrollTop = 0
      }
    }
  })
  
  // Метод 2: Использование scrollIntoView для первого элемента
  const firstElement = document.querySelector('h1, h2, .tariffContent, .roadmapWrapper, main, body > *:first-child')
  if (firstElement) {
    firstElement.scrollIntoView({
      behavior: 'auto',
      block: 'start',
      inline: 'nearest'
    })
  }
  
  // Метод 3: Принудительная прокрутка через requestAnimationFrame с проверкой
  let attempts = 0
  const maxAttempts = 10
  
  const forceScroll = () => {
    attempts++
    
    // Проверяем все возможные источники прокрутки
    const windowScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
    const rootScroll = document.getElementById('root')?.scrollTop || 0
    const mainScroll = document.querySelector('main')?.scrollTop || 0
    
    if ((windowScroll > 0 || rootScroll > 0 || mainScroll > 0) && attempts < maxAttempts) {
      // Прокручиваем все контейнеры
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      
      const rootElement = document.getElementById('root')
      if (rootElement) {
        rootElement.scrollTop = 0
      }
      
      const mainElement = document.querySelector('main')
      if (mainElement) {
        mainElement.scrollTop = 0
      }
      
      // Дополнительная проверка для специфичных контейнеров
      const specificContainers = document.querySelectorAll('.tariffContent, .roadmapWrapper')
      specificContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.scrollTop = 0
        }
      })
      
      requestAnimationFrame(forceScroll)
    }
  }
  
  requestAnimationFrame(forceScroll)
}

// Функция для поиска скроллируемого контейнера
const getScrollableContainer = () => {
  // На iOS body имеет position: fixed, поэтому прокрутка происходит в #root
  if (isIOS()) {
    const rootElement = document.getElementById('root')
    if (rootElement) {
      // Проверяем, действительно ли root элемент скроллируется
      const computedStyle = window.getComputedStyle(rootElement)
      const isScrollable = rootElement.scrollHeight > rootElement.clientHeight ||
                          computedStyle.overflow === 'auto' ||
                          computedStyle.overflow === 'scroll' ||
                          computedStyle.overflowY === 'auto' ||
                          computedStyle.overflowY === 'scroll'
      
      if (isScrollable) {
        return rootElement
      }
    }
    
    // Если root не скроллируется, проверяем другие контейнеры
    const mainElement = document.querySelector('main')
    if (mainElement) {
      const computedStyle = window.getComputedStyle(mainElement)
      const isScrollable = mainElement.scrollHeight > mainElement.clientHeight ||
                          computedStyle.overflow === 'auto' ||
                          computedStyle.overflow === 'scroll' ||
                          computedStyle.overflowY === 'auto' ||
                          computedStyle.overflowY === 'scroll'
      
      if (isScrollable) {
        return mainElement
      }
    }
    
    // Fallback для iOS - всегда возвращаем root
    return rootElement || window
  }
  
  // Для других браузеров проверяем стандартные контейнеры
  const body = document.body
  const html = document.documentElement
  
  if (body.scrollHeight > body.clientHeight || html.scrollHeight > html.clientHeight) {
    return window
  }
  
  // Ищем main элемент как fallback
  const mainElement = document.querySelector('main')
  if (mainElement && mainElement.scrollHeight > mainElement.clientHeight) {
    return mainElement
  }
  
  return window
}


// Функция прокрутки с поддержкой iOS
export const scrollToTop = (smooth: boolean = true) => {
  if (isIOS()) {
    // Для iOS всегда используем специальную функцию
    scrollToTopIOS()
    
    // Дополнительная задержка для iOS Safari
    setTimeout(() => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
      if (currentScroll > 0) {
        // Если все еще не наверху, пробуем еще раз
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
        
        const rootElement = document.getElementById('root')
        if (rootElement) {
          rootElement.scrollTop = 0
        }
      }
    }, 100)
  } else {
    // Для других браузеров используем стандартный метод
    const scrollableContainer = getScrollableContainer()
    
    if (smooth) {
      if (scrollableContainer === window) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        })
      } else {
        (scrollableContainer as Element).scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        })
      }
    } else {
      // Мгновенная прокрутка
      if (scrollableContainer === window) {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      } else {
        (scrollableContainer as Element).scrollTo(0, 0)
      }
      
      // Дополнительно прокручиваем все контейнеры для надежности
      const rootElement = document.getElementById('root')
      if (rootElement) {
        rootElement.scrollTop = 0
      }
      
      const mainElement = document.querySelector('main')
      if (mainElement) {
        mainElement.scrollTop = 0
      }
    }
  }
}

// Дополнительная функция для принудительной прокрутки при переходах между блоками
export const forceScrollToTop = () => {
  if (isIOS()) {
    // Для iOS используем агрессивную прокрутку
    const forceScroll = () => {
      // Прокручиваем все возможные контейнеры
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      
      const rootElement = document.getElementById('root')
      if (rootElement) {
        rootElement.scrollTop = 0
      }
      
      const mainElement = document.querySelector('main')
      if (mainElement) {
        mainElement.scrollTop = 0
      }
      
      // Прокручиваем специфичные контейнеры
      const specificContainers = document.querySelectorAll('.tariffContent, .roadmapWrapper, .ncnContainer')
      specificContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.scrollTop = 0
        }
      })
      
      // Проверяем, нужно ли повторить
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
      if (currentScroll > 0) {
        requestAnimationFrame(forceScroll)
      }
    }
    
    // Запускаем принудительную прокрутку
    requestAnimationFrame(forceScroll)
    
    // Дополнительные попытки через интервалы
    setTimeout(forceScroll, 50)
    setTimeout(forceScroll, 150)
    setTimeout(forceScroll, 300)
  } else {
    // Для других браузеров используем стандартную функцию
    scrollToTop(false)
  }
}

export const useScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    // Увеличенная задержка для iOS для гарантии загрузки компонента и рендера
    const delay = isIOS() ? 300 : 100
    
    const timer = setTimeout(() => {
      scrollToTop(false) // Мгновенная прокрутка при смене роута
      
      // Дополнительная проверка через небольшую задержку для iOS
      if (isIOS()) {
        setTimeout(() => {
          // Проверяем все возможные источники прокрутки
          const windowScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
          const rootScroll = document.getElementById('root')?.scrollTop || 0
          const mainScroll = document.querySelector('main')?.scrollTop || 0
          
          if (windowScroll > 0 || rootScroll > 0 || mainScroll > 0) {
            // Принудительная прокрутка всех контейнеров
            window.scrollTo(0, 0)
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
            
            const rootElement = document.getElementById('root')
            if (rootElement) {
              rootElement.scrollTop = 0
            }
            
            const mainElement = document.querySelector('main')
            if (mainElement) {
              mainElement.scrollTop = 0
            }
            
            // Дополнительная проверка для специфичных контейнеров
            const specificContainers = document.querySelectorAll('.tariffContent, .roadmapWrapper')
            specificContainers.forEach(container => {
              if (container instanceof HTMLElement) {
                container.scrollTop = 0
              }
            })
          }
        }, 150)
        
        // Еще одна проверка через больший интервал
        setTimeout(() => {
          const finalCheck = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
          if (finalCheck > 0) {
            window.scrollTo(0, 0)
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
          }
        }, 300)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [pathname])
} 