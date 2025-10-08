import s from './Inside.module.scss'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useTelegramBackButton } from '../../hooks/useTelegramBackButton'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { scrollToTop as scrollToTopFunction } from '../../hooks/useScrollToTop'
import { Button } from '../Button/Button'

interface InsideProps {
  onVisit: () => void
}

// Компонент стрелки-указателя
const GuideArrow = () => {
    return (
        <div className={s.guideArrow}>
            <svg 
                className={s.arrowImage}
                width="70" 
                height="100" 
                viewBox="0 0 107.99 98.33" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <path 
                    fill="#cc2855" 
                    stroke="none" 
                    fillOpacity="1" 
                    strokeWidth="1" 
                    strokeOpacity="1" 
                    cursor="default" 
                    d="M9.2338 76.6013C9.4461 77.1624 9.4071 77.3987 9.5407 77.5973C21.9171 88.801 37.3334 94.8646 56.1964 94.3329C60.9593 94.2087 65.6742 93.0321 70.1137 91.0042C79.6673 86.726 85.0426 78.1932 83.7715 69.4348C83.1398 64.865 81.5902 60.6465 77.8053 57.3692C75.2396 57.6232 72.6897 57.9498 70.265 58.0212C66.3103 58.1216 62.8412 57.1295 60.2966 54.5697C58.3569 52.7136 57.8842 50.5387 59.0128 49.0786C60.4941 47.1624 62.9105 46.6372 65.1001 47.1481C68.1453 47.8529 71.0809 48.8852 73.8596 50.0274C75.6494 50.7772 77.2589 51.9457 78.8372 52.9693C88.3208 49.6173 90.777 40.9598 84.7041 32.5618C83.2604 32.5719 81.7303 32.6007 80.2707 32.5385C74.864 32.1952 70.3976 30.3568 67.6399 26.401C66.587 24.8836 65.9343 23.1274 67.4313 21.2835C68.5756 19.8961 70.9919 19.3707 73.6604 20.0056C77.8673 21.0651 81.1571 23.3111 84.1488 25.8496C85.1619 26.7681 86.1749 27.6869 87.1018 28.6242C101.8886 23.8918 110.1157 10.1838 101.6481 0.3323C102.7857 0.161 103.7192 -0.1179 104.3001 0.0596C104.9829 0.2908 105.5015 1.0132 105.816 1.6282C108.5362 7.4903 108.9179 13.4051 104.5918 19.2803C101.3941 23.6956 97.0814 27.1384 91.9051 29.9337C91.1757 30.3201 90.4462 30.7064 89.7326 31.1651C89.6464 31.184 89.5916 31.3477 89.3957 31.6938C89.6239 32.3277 89.7972 33.1252 90.1431 33.8851C94.0668 43.2058 92.0631 48.9559 82.2529 55.7952C82.7873 56.5901 83.353 57.53 83.9893 58.3788C87.4464 63.4734 88.8323 69.0182 87.8176 75.1605C86.1943 85.1555 78.08 93.1447 66.3127 96.3858C59.9193 98.1549 53.501 98.5631 47.0347 97.9186C31.4104 96.3038 18.231 90.9689 8.1704 80.8561C7.6128 80.3699 7.1258 79.7925 6.5682 79.3063C6.4662 79.2526 6.2778 79.2177 5.7128 79.1127C5.5582 81.7276 6.3213 83.9913 6.9981 86.2738C7.5729 88.5024 8.336 90.766 9.0444 93.1932C6.7534 93.4635 5.6698 92.6361 4.8841 91.5162C4.0512 90.1788 3.0457 88.8789 2.6442 87.4478C1.6207 83.5704 0.6678 79.6018 0.06 75.5583C-0.3587 72.3846 1.4371 71.0832 4.7569 71.8042C11.789 73.3886 18.8368 75.0453 25.8846 76.7022C27.0305 76.9847 28.0353 77.4495 29.4168 77.9844C27.8176 79.7744 26.3108 79.4946 24.906 79.2685C19.8048 78.2515 14.7508 77.4519 9.2338 76.6013ZM70.493 22.8957C72.3568 27.7293 76.8316 30.0212 82.2292 29.0759ZM62.4429 50.3071C64.5807 54.3218 68.4739 55.6014 73.6434 54.0224Z"
                />
            </svg>
        </div>
    )
}

// Компонент прогресс-бара
const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
    // Показываем прогресс для всех шагов
    const totalItems = totalSteps
    const progress = ((currentStep + 1) / totalItems) * 100
    const isCompleted = progress >= 100
    
    return (
        <div className={s.progressBar}>
            <div 
                className={`${s.progressFill} ${isCompleted ? s.completed : ''}`}
                style={{ width: `${progress}%` }}
            />
            <div 
                className={s.progressUnfilled}
                style={{ 
                    width: `${100 - progress}%`,
                    left: `${progress}%`
                }}
            />
        </div>
    )
}

// Функция для выделения текста красным цветом
const highlightText = (text: string) => {
    const parts = text.split(/(ОТВАЛИВАЛАСЬ ЧЕЛЮСТЬ|С НУЛЯ И БЕЗ ОПЫТА|с 0 на 50\.000\+ руб\/мес|где 50 косарей\s*[–-]\s*НОРМА|100\.000\+ руб\/мес|150\.000\+ руб\/мес|РЕАЛЬНЫХ|ПРЯМО СЕЙЧАС|КАЖДЫЙ|КЕЙС|САМИ|НЕЙРОСЕТИ|БОЛЬШЕ|НАШЕЙ|ВЫСОКИЕ|РЕЗУЛЬТАТ)/g)
    return parts.map((part, index) => {
        if (part === 'ОТВАЛИВАЛАСЬ ЧЕЛЮСТЬ' || 
            part === 'С НУЛЯ И БЕЗ ОПЫТА' || 
            part === 'с 0 на 50.000+ руб/мес' ||
            part.includes('где 50 косарей') && part.includes('НОРМА') ||
            part === '100.000+ руб/мес' ||
            part === '150.000+ руб/мес' ||
            part === 'РЕАЛЬНЫХ' ||
            part === 'ПРЯМО СЕЙЧАС' ||
            part === 'КАЖДЫЙ' ||
            part === 'КЕЙС' ||
            part === 'САМИ' ||
            part === 'НЕЙРОСЕТИ' ||
            part === 'БОЛЬШЕ' ||
            part === 'НАШЕЙ' ||
            part === 'ВЫСОКИЕ' ||
            part === 'РЕЗУЛЬТАТ') {
            return <span key={index} style={{ color: '#cc2855' }}>{part}</span>
        }
        return part
    })
}

// Компонент для отдельной карточки месяца
const MonthCard = ({ month, title, description, points, firstOrders, result, index, disableAnimation = false }: {
    month: string
    title: string
    description: string
    points: string[]
    firstOrders?: string
    result: string
    index: number
    disableAnimation?: boolean
}) => {
    const { elementRef, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    })

    // Если анимация отключена, сразу показываем карточку как видимую
    const shouldShowAnimation = !disableAnimation
    const cardVisible = disableAnimation ? true : isVisible

    return (
        <div 
            ref={shouldShowAnimation ? elementRef : undefined}
            className={`${s.monthCard} ${cardVisible ? s.visible : ''} ${disableAnimation ? s.noAnimation : ''}`}
            style={{ 
                animationDelay: shouldShowAnimation ? `${index * 0.2}s` : '0s', 
                marginBottom: '2rem' 
            }}
        >
            <div className={s.monthHeader}>
                <div className={s.monthNumber}>{month}</div>
                <h3 className={s.monthTitle}>{title}</h3>
            </div>
            
            <div className={s.descriptionBlock}>
                <div className={s.blockTitle}>ОПИСАНИЕ:</div>
                <div className={s.blockContent}>{highlightText(description)}</div>
            </div>
            
            <div className={s.pointsBlock}>
                <div className={s.blockTitle}>ЧТО ПОЛУЧИШЬ:</div>
                <div className={s.pointsList}>
                    {points.map((point, idx) => (
                        <div key={idx} className={s.point}>
                            <span>{highlightText(point)}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            {firstOrders && (
                <div className={s.firstOrdersBlock}>
                    <div className={s.blockTitle}>ЗАКРОЕШЬ ПЕРВЫЕ ЗАКАЗЫ:</div>
                    <div className={s.blockContent}>{highlightText(firstOrders)}</div>
                </div>
            )}
            
            <div className={s.result}>
                <div className={s.resultTitle}>ТВОЙ ИТОГ:</div>
                <div className={s.resultContent}>{highlightText(result)}</div>
            </div>
        </div>
    )
}

// Компонент для финального шага
const FinalStepCard = ({ index, disableAnimation = false }: { index: number, disableAnimation?: boolean }) => {
    const { elementRef, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    })

    // Если анимация отключена, сразу показываем карточку как видимую
    const shouldShowAnimation = !disableAnimation
    const cardVisible = disableAnimation ? true : isVisible

    return (
        <div 
            ref={shouldShowAnimation ? elementRef : undefined}
            className={`${s.finalStep} ${cardVisible ? s.visible : ''} ${disableAnimation ? s.noAnimation : ''}`}
            style={{ animationDelay: shouldShowAnimation ? `${index * 0.2}s` : '0s' }}
        >
            <div className={s.finalContent}>
                <p className={s.finalTitle}>Это не «курсы монтажа». Это твой билет в ПРОФЕССИЮ, которая КОРМИТ:</p>
                
                <div className={s.realProjectsBlock}>
                    <div className={s.blockTitle}>РЕАЛЬНЫЕ ПРОЕКТЫ:</div>
                    <div className={s.blockContent}>
                        С фидбеком, а не абстрактные задания, как у многих..
                    </div>
                </div>

                <div className={s.supportBlock}>
                    <div className={s.blockTitle}>ПОДДЕРЖКА 24/7:</div>
                    <div className={s.blockContent}>
                         {highlightText("От команды, которая заточена под твой РЕЗУЛЬТАТ (первый поток – максимум внимания!)")}
                    </div>
                </div>

                <div className={s.lastChanceBlock}>
                    <div className={s.blockTitle}>СЕЙЧАС ПОСЛЕДНИЙ ШАНС:</div>
                    <div className={s.blockContent} style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        ЗАЙТИ ПО СТАРТОВЫМ УСЛОВИЯМ
                    </div>
                </div>

                <div className={s.cta}>
                    <p className={s.ctaText}>Готов перестать<br />мечтать и начать<br />зарабатывать?</p>
                    <div className={s.buttonContainer}>
                        {/* Стрелка-указатель над кнопкой */}
                        <GuideArrow />
                        <Button 
                            href="https://t.me/vardozz"
                            target="_blank"
                            style={{
                                padding: '1rem 2rem',
                                width: '100%',
                                marginBottom: '1rem',
                                
                            background: 'linear-gradient(45deg, rgb(204, 40, 85), rgb(0 0 0))',
                            }}
                        >
                            Я ГОТОВ
                        </Button>
                    </div>
                    <Button 
                        href="/tariff"
                        style={{
                            padding: '1rem 2rem',
                            width: '100%',
                            marginBottom: '1rem'
                        }}
                    >
                        ТАРИФЫ
                    </Button>
                    <Button next href="/roadmap" style={{ marginBottom: '1rem', background: 'linear-gradient(45deg, rgb(10, 194, 1), rgb(2 2 2))' }}>
                        <p>РОАДМАП</p>
                    </Button>
                </div>
            </div>
        </div>
    )
}

export const Inside = ({ onVisit }: InsideProps) => {
    const [showContent, setShowContent] = useState(false)
    const [hideTitle, setHideTitle] = useState(false)
    const [titleFadeOut, setTitleFadeOut] = useState(false)
    const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
    
    // Используем хук для управления BackButton
    useTelegramBackButton('/')
    
    // Состояние для свайпа
    const [isSwipeActive, setIsSwipeActive] = useState(false)
    const [swipeStartX, setSwipeStartX] = useState(0)
    const [swipeStartY, setSwipeStartY] = useState(0)
    const [swipeOffset, setSwipeOffset] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isHorizontalSwipe, setIsHorizontalSwipe] = useState(false)
    
    // Состояние для карусельного эффекта
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
    const [currentSlide, setCurrentSlide] = useState(currentMonthIndex)
    const [nextSlide, setNextSlide] = useState<number | null>(null)
    const [isFirstRender, setIsFirstRender] = useState(true)
    
    // Синхронизируем currentSlide с currentMonthIndex
    useEffect(() => {
        setCurrentSlide(currentMonthIndex)
    }, [currentMonthIndex])
    
    // Отслеживаем первый рендер для анимации
    useEffect(() => {
        if (showContent && isFirstRender) {
            // Даем время на первоначальную анимацию, затем отключаем fadeIn эффект
        const timer = setTimeout(() => {
                setIsFirstRender(false)
            }, 1500) // Время больше чем анимация появления контента

        return () => clearTimeout(timer)
        }
    }, [showContent, isFirstRender])
    
    const containerRef = useRef<HTMLDivElement | null>(null)
    const swipeContainerRef = useRef<HTMLDivElement | null>(null)
    const touchStartYRef = useRef<number | null>(null)

    // Данные месяцев и общее количество шагов
    const months = [
        {
            month: "1 МЕСЯЦ",
            title: "ВРЫВАЕШЬСЯ\nВ ИНДУСТРИЮ С ПОРТФОЛИО И ЗАКАЗАМИ",
            description: "Освоишь Adobe Premiere Pro и After Effects на РЕАЛЬНЫХ проектах, за которые платят ПРЯМО СЕЙЧАС",
            points: [
                "Соберешь портфель побед: КАЖДЫЙ смонтированный ролик – не учебка,\nа КЕЙС для твоего портфолио"
            ],
            firstOrders: "Научишься вести переписку как профи, вызывать доверие и брать деньги за работу –\nС НУЛЯ И БЕЗ ОПЫТА",
            result: "Вышел с 0 на 50.000+ руб/мес — сильное портфолио, первые клиенты\nи навык продавать себя без\nдрожи в коленках"
        },
        {
            month: "2 МЕСЯЦ",
            title: "ПОДНИМАЕШЬ ЦЕННИК И СТАНОВИШЬСЯ НЕЗАМЕНИМЫМ",
            description: "Прокачаешь скилл\nи скорость: Научишься выдавать огонь под YouTube, Reels\nи бизнес-запросы – так, чтобы у клиента\nОТВАЛИВАЛАСЬ ЧЕЛЮСТЬ",
            points: [
                "Поймешь свою ценность: Начнешь спокойно называть чеки, которые ТЫ ЗАСЛУЖИВАЕШЬ\nи перейдешь с \n«новичка за 1000₽» на уровень, где 50 косарей – НОРМА"
            ],
            result: "100.000+ руб/мес — клиенты, которые ценят тебя и платят без торга"
        },
        {
            month: "3 МЕСЯЦ",
            title: "ЗАПУСКАЕШЬ СИСТЕМУ СТАБИЛЬНОГО ДОХОДА",
            description: "Забудешь про поиск заказов: Построишь воронку, где клиенты идут к тебе САМИ",
            points: [
                "Убьешь рутину: Автоматизируешь процессы\nи внедришь НЕЙРОСЕТИ, чтобы работать меньше,\nа зарабатывать БОЛЬШЕ",
                "Соберешь «чемодан дорогого монтажера»: Готовые скрипты, шаблоны\nи фишки из НАШЕЙ практики для закрытия клиентов\nна ВЫСОКИЕ чеки"
            ],
            result: "150.000+ руб/мес — жизнь, где монтаж не хобби, а стабильный доход с уверенностью в завтрашнем дне"
        }
    ]

    // Функции навигации (включая финальный шаг)
    const totalSteps = months.length + 1 // +1 для финального шага

    // Функция для плавной прокрутки к началу страницы
    const scrollToTop = useCallback(() => {
        // Проверяем, является ли устройство iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        
        if (isIOS) {
            // Для iOS используем специальную функцию из хука
            setTimeout(() => {
                scrollToTopFunction(false) // Используем мгновенную прокрутку для iOS
            }, 100)
        } else {
            // Для других устройств используем стандартную прокрутку
            setTimeout(() => {
                scrollToTopFunction(true)
            }, 100)
        }
    }, [])

    // Функция для проверки, нужно ли прокручивать к началу
    const shouldScrollToTop = useCallback(() => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop
        return currentScroll > 100 // Прокручиваем, если пользователь проскроллил больше 100px
    }, [])

    const nextMonth = useCallback(() => {
        if (isAnimating) return
        
        setCurrentMonthIndex((prevIndex) => {
            const newIndex = (prevIndex + 1) % totalSteps
            setIsAnimating(true)
            setSlideDirection('right') // Новый слайд появляется справа (откуда ушел старый влево)
            setNextSlide(newIndex)
            
            setTimeout(() => {
                setCurrentSlide(newIndex)
                setNextSlide(null)
                setSlideDirection(null)
                setIsAnimating(false)
                
                // Всегда прокручиваем к началу при переходе
                scrollToTop()
            }, 400)
            
            return newIndex
        })
    }, [isAnimating, totalSteps, scrollToTop])

    const prevMonth = useCallback(() => {
        if (isAnimating) return
        
        setCurrentMonthIndex((prevIndex) => {
            const newIndex = (prevIndex - 1 + totalSteps) % totalSteps
            setIsAnimating(true)
            setSlideDirection('left') // Новый слайд появляется слева (откуда ушел старый вправо)
            setNextSlide(newIndex)
            
            setTimeout(() => {
                setCurrentSlide(newIndex)
                setNextSlide(null)
                setSlideDirection(null)
                setIsAnimating(false)
                
                // Всегда прокручиваем к началу при переходе
                scrollToTop()
            }, 400)
            
            return newIndex
        })
    }, [isAnimating, totalSteps, scrollToTop])

    // Отмечаем раздел как посещенный
    useEffect(() => {
        onVisit()
    }, [onVisit])

    // Отдельный useEffect для клавиатурной навигации
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isAnimating) return
            
            if (e.key === 'ArrowLeft' && currentMonthIndex > 0) {
                e.preventDefault()
                prevMonth()
            } else if (e.key === 'ArrowRight' && currentMonthIndex < totalSteps - 1) {
                e.preventDefault()
                nextMonth()
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        };
    }, [currentMonthIndex, totalSteps, isAnimating, prevMonth, nextMonth])

    // Отдельный useEffect для защиты от закрытия приложения
    useEffect(() => {
        const preventAppClose = (e: TouchEvent) => {
            // Если это свайп вверх в верхней части экрана, блокируем его
            if (e.touches.length === 1) {
                const touch = e.touches[0]
                if (touch.clientY < 100 && touch.clientY < (touchStartYRef.current || 0) - 50) {
                    e.preventDefault()
                    e.stopPropagation()
                }
            }
        }
        
        document.addEventListener('touchstart', preventAppClose, { passive: false })
        document.addEventListener('touchmove', preventAppClose, { passive: false })
        
        return () => {
            document.removeEventListener('touchstart', preventAppClose)
            document.removeEventListener('touchmove', preventAppClose)
        };
    }, []) // Выполняется только при монтировании

    useEffect(() => {
        const timer = setTimeout(() => {
            setTitleFadeOut(true)
            
            const contentTimer = setTimeout(() => {
                setShowContent(true)
                setHideTitle(true)
            }, 500)

            return () => clearTimeout(contentTimer)
        }, 700)

        return () => clearTimeout(timer)
    }, [])

    // Управление overflow через события
    useEffect(() => {
        const event = new CustomEvent('overflowChange', {
            detail: { hidden: !hideTitle }
        })
        window.dispatchEvent(event)

        return () => {
            const cleanupEvent = new CustomEvent('overflowChange', {
                detail: { hidden: false }
            })
            window.dispatchEvent(cleanupEvent)
        }
    }, [hideTitle])



    // Обработчики свайпа
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (isAnimating) return
        
        const touch = e.touches[0]
        setSwipeStartX(touch.clientX)
        setSwipeStartY(touch.clientY)
        touchStartYRef.current = touch.clientY // Записываем для глобальной защиты
        setIsSwipeActive(true)
        setSwipeOffset(0)
        setIsHorizontalSwipe(false)
    }, [isAnimating])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isSwipeActive || isAnimating) return
        
        const touch = e.touches[0]
        const diffX = touch.clientX - swipeStartX
        const diffY = touch.clientY - swipeStartY
        
        // Определяем направление свайпа с более строгими критериями
        const isHorizontal = Math.abs(diffX) > Math.abs(diffY) * 1.5 // Увеличиваем порог для горизонтального свайпа
        const isVertical = Math.abs(diffY) > Math.abs(diffX) * 1.5 // Увеличиваем порог для вертикального свайпа
        
        // Если это горизонтальный свайп, устанавливаем флаг
        if (isHorizontal && Math.abs(diffX) > 20) { // Увеличиваем порог с 15 до 20
            setIsHorizontalSwipe(true)
        }
        
        // Если это горизонтальный свайп, обрабатываем его
        if (isHorizontalSwipe || (isHorizontal && Math.abs(diffX) > 20)) {
            const maxOffset = window.innerWidth * 0.3 // Максимальное смещение 30% от ширины экрана
            
            // Ограничиваем смещение
            const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, diffX))
            
            setSwipeOffset(limitedOffset)
            
            // Предотвращаем скролл страницы и закрытие приложения
            e.preventDefault()
            e.stopPropagation()
        }
        // Если это вертикальный свайп вверх (может закрыть приложение), блокируем его
        else if (isVertical && diffY < -30) { // Свайп вверх более чем на 30px
            // Блокируем свайп вверх для предотвращения закрытия приложения
            e.preventDefault()
            e.stopPropagation()
        }
        // Если это вертикальный свайп вниз, разрешаем его (скролл вниз)
        else if (isVertical && diffY > 30) {
            // Разрешаем скролл вниз, не блокируем
        }
    }, [isSwipeActive, swipeStartX, swipeStartY, isAnimating, isHorizontalSwipe])

    const handleTouchEnd = useCallback(() => {
        if (!isSwipeActive || isAnimating) return
        
        const threshold = 50 // Минимальное расстояние для срабатывания свайпа
        const velocityThreshold = 20 // Минимальная скорость для срабатывания
        const screenWidth = window.innerWidth
        const relativeThreshold = screenWidth * 0.15 // 15% от ширины экрана
        
        // Вычисляем скорость свайпа
        const velocity = Math.abs(swipeOffset)
        const shouldTrigger = Math.abs(swipeOffset) > Math.max(threshold, relativeThreshold) || velocity > velocityThreshold
        
        setIsAnimating(true)
        
        if (shouldTrigger) {
            if (swipeOffset > 0 && currentMonthIndex > 0) {
                // Свайп вправо - предыдущий слайд (старый уходит вправо, новый приходит слева)
                const newIndex = currentMonthIndex - 1
                setSlideDirection('left')
                setNextSlide(newIndex)
                setTimeout(() => {
                    setCurrentMonthIndex(newIndex)
                    setCurrentSlide(newIndex)
                    setNextSlide(null)
                    setSlideDirection(null)
                    
                    // Всегда прокручиваем к началу при свайпе
                    scrollToTop()
                }, 300)
            } else if (swipeOffset < 0 && currentMonthIndex < totalSteps - 1) {
                // Свайп влево - следующий слайд (старый уходит влево, новый приходит справа)
                const newIndex = currentMonthIndex + 1
                setSlideDirection('right')
                setNextSlide(newIndex)
                setTimeout(() => {
                    setCurrentMonthIndex(newIndex)
                    setCurrentSlide(newIndex)
                    setNextSlide(null)
                    setSlideDirection(null)
                    
                    // Всегда прокручиваем к началу при свайпе
                    scrollToTop()
                }, 300)
            }
        }
        
        // Сброс состояния свайпа с плавной анимацией возврата
        setIsSwipeActive(false)
        setIsHorizontalSwipe(false)
        
        // Плавное возвращение к исходной позиции если свайп не сработал
        if (!shouldTrigger) {
            setSwipeOffset(0)
            setTimeout(() => {
                setIsAnimating(false)
            }, 200)
        } else {
            setSwipeOffset(0)
            setTimeout(() => {
                setIsAnimating(false)
                scrollToTop()
            }, 300)
        }
    }, [isSwipeActive, swipeOffset, currentMonthIndex, totalSteps, isAnimating, shouldScrollToTop, scrollToTop])

    return (
        <div className={s.ncnContainer}>
            {!hideTitle && (
                <div className={`${s.titleContainer} ${titleFadeOut ? s.fadeOut : ''}`}>
                    <h1 className={s.mainTitle}>ЧТО ВНУТРИ NCNG?</h1>
                </div>
            )}
            
            {showContent && (
                <div className={`${s.content} ${s.fadeIn}`}>
                    <ProgressBar currentStep={currentMonthIndex} totalSteps={totalSteps} />
                    <div 
                        ref={swipeContainerRef}
                        className={`${s.swipeContainer} ${isSwipeActive ? s.swipeActive : ''} ${slideDirection ? s.sliding : ''}`}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            transform: `translateX(${swipeOffset}px)`,
                            transition: isSwipeActive ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        {/* Текущий слайд */}
                    <div 
                        ref={containerRef}
                            className={`${s.slide} ${s.currentSlide} ${slideDirection === 'left' ? s.slideOutRight : ''} ${slideDirection === 'right' ? s.slideOutLeft : ''}`}
                        >
                            {/* Показываем месяцы */}
                            {currentSlide < months.length && (
                                <MonthCard 
                                    key={`current-month-${currentSlide}`}
                                    {...months[currentSlide]} 
                                    index={0}
                                    disableAnimation={!isFirstRender}
                                />
                            )}
                            
                            {/* Показываем финальный шаг */}
                            {currentSlide === months.length && (
                                <FinalStepCard 
                                    index={0} 
                                    disableAnimation={!isFirstRender}
                                />
                            )}
                        </div>

                        {/* Следующий слайд (появляется во время анимации) */}
                        {nextSlide !== null && (
                            <div 
                                className={`${s.slide} ${s.nextSlide} ${slideDirection === 'left' ? s.slideInLeft : ''} ${slideDirection === 'right' ? s.slideInRight : ''}`}
                    >
                        {/* Показываем месяцы */}
                                {nextSlide < months.length && (
                            <MonthCard 
                                        key={`next-month-${nextSlide}`}
                                        {...months[nextSlide]} 
                                index={0}
                                        disableAnimation={true}
                            />
                        )}
                        
                        {/* Показываем финальный шаг */}
                                {nextSlide === months.length && (
                                    <FinalStepCard 
                                        index={0} 
                                        disableAnimation={true}
                                    />
                                )}
                            </div>
                        )}
                    </div>


                </div>
            )}
            
            {showContent && (
                <>
                    {/* Кнопка влево - скрываем на первом слайде */}
                    {currentMonthIndex > 0 && (
                        <button 
                            className={`${s.navButton} ${s.navButtonLeft}`}
                            onClick={prevMonth}
                            aria-label="Предыдущий шаг"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path 
                                    d="M15 18L9 12L15 6" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}
                    
                    {/* Кнопка вправо - скрываем на последнем слайде */}
                    {currentMonthIndex < totalSteps - 1 && (
                        <button 
                            className={`${s.navButton} ${s.navButtonRight}`}
                            onClick={nextMonth}
                            aria-label="Следующий шаг"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path 
                                    d="M9 18L15 12L9 6" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}
                </>
            )}
        </div>
    )
} 