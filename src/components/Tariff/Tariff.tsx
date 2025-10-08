import s from './Tariff.module.scss'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useTelegramBackButton } from '../../hooks/useTelegramBackButton'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { scrollToTop as scrollToTopFunction, forceScrollToTop } from '../../hooks/useScrollToTop'
import { Button } from '../Button/Button'
import { useSettings } from '../../hooks/useSettings'
import { useTariffPrices, type TariffPrice } from '../../hooks/useTariffPrices'

interface TariffProps {
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
const ProgressBar = ({ currentTariffIndex, totalTariffs }: { currentTariffIndex: number, totalTariffs: number }) => {
    const progress = ((currentTariffIndex + 1) / totalTariffs) * 100
    
    // Определяем цвет в зависимости от тарифа
    let progressColor = ''
    if (currentTariffIndex === 0) {
        progressColor = '#4CAF50' // Зеленый для первого тарифа
    } else if (currentTariffIndex === 1) {
        progressColor = '#FFC107' // Желтый для второго тарифа
    } else if (currentTariffIndex === 2) {
        progressColor = '#F44336' // Красный для третьего тарифа
    }
    
    return (
        <div className={s.progressBar}>
            <div 
                className={s.progressFill}
                style={{ 
                    width: `${progress}%`,
                    background: progressColor
                }}
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



// Компонент для тарифного плана
const TariffPlan = ({ 
    title, 
    description,
    price, 
    originalPrice, 
    features, 
    index,
    tariffKey,
    disableAnimation = false
}: { 
    title: string
    description: string
    price: string
    originalPrice?: string
    features: Array<{ text: string; included: boolean }>
    index: number 
    tariffKey: string
    disableAnimation?: boolean
}) => {
    const { elementRef, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    })
    
    const textRefs = useRef<(HTMLSpanElement | null)[]>([])

    // Если анимация отключена, сразу показываем карточку как видимую
    const shouldShowAnimation = !disableAnimation
    const cardVisible = disableAnimation ? true : isVisible

    useEffect(() => {
        // Применяем зачеркивание сразу для исключенных пунктов
        const excludedIndexes = features
            .map((feature, idx) => !feature.included ? idx : null)
            .filter(idx => idx !== null) as number[]
        
        excludedIndexes.forEach(idx => {
            const textElement = textRefs.current[idx]
            if (textElement) {
                applyWordStrike(textElement)
            }
        })
    }, [tariffKey, features])

    const applyWordStrike = (textElement: HTMLElement) => {
        const originalText = textElement.textContent || ''
        const words = originalText.split(' ')
        
        // Очищаем текущий контент
        textElement.innerHTML = ''
        
        // Создаем span для каждого слова
        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span')
            wordSpan.textContent = word
            wordSpan.className = s.wordStrike
            textElement.appendChild(wordSpan)
            
            // Добавляем пробел после слова (кроме последнего)
            if (wordIndex < words.length - 1) {
                textElement.appendChild(document.createTextNode(' '))
            }
        })
    }



    return (
        <div 
            ref={shouldShowAnimation ? elementRef : undefined}
            className={`${s.tariffPlan} ${cardVisible ? s.visible : ''} ${disableAnimation ? s.noAnimation : ''}`}
            style={{ 
                animationDelay: shouldShowAnimation ? `${index * 0.2}s` : '0s' 
            }}
        >
            <div className={s.tariffHeader}>
                <h3 className={s.tariffTitle}>{title}</h3>
            </div>
            
            <div className={s.featuresList}>
                {features.map((feature, idx) => (
                    <div 
                        key={`${tariffKey}-${idx}`} 
                        className={`${s.feature} ${feature.included ? s.included : s.excluded}`}
                    >
                        <span className={s.featureIcon}>
                            {feature.included ? '✓' : '✗'}
                        </span>
                        <span 
                            ref={(el) => { textRefs.current[idx] = el }}
                            className={s.featureText}
                        >
                            {feature.text}
                        </span>
                    </div>
                ))}
            </div>
            
            <div className={s.priceContainer}>
                {originalPrice && (
                    <span className={s.originalPrice}>{originalPrice}</span>
                )}
                <span className={s.price}>{price}</span>
            </div>
            
            <p className={s.tariffDescription}>{description}</p>
            
            <div className={s.buttonContainer}>
                {/* Стрелка-указатель над кнопкой */}
                <GuideArrow />
                <Button href="https://t.me/vardozz" target="_blank" style={{background: 'linear-gradient(45deg, rgb(204, 40, 85), rgb(0, 0, 0))'}}>ПРИОБРЕСТИ ДОСТУП</Button>
            </div>
        </div>
    )
}


// Компонент для дополнительной информации с условной анимацией
const AdditionalInfoBlock = ({ 
    currentTariffIndex, 
    getSettingValue 
}: { 
    currentTariffIndex: number, 
    getSettingValue: (key: string) => string | null 
}) => {
    const { elementRef, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    })

    // Анимация только для первого тарифа
    const shouldAnimate = currentTariffIndex === 0

    return (
        <div 
            ref={shouldAnimate ? elementRef : undefined}
            className={`${s.section} ${shouldAnimate ? (isVisible ? s.visible : '') : s.visible}`}
            style={{ animationDelay: shouldAnimate ? '0.6s' : '0s' }}
        >
            <h3>ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ</h3>
            <ul>
                <li><strong>Срок полного обучения:</strong><br /> 90 дней</li>
                {currentTariffIndex === 0 && (
                    <li><strong>Бонус при покупке до {getSettingValue('bonus_deadline') || '29.09'}: <br /></strong> 
                           <>
                               {(() => {
                                   const bonusText = getSettingValue('bonus_text') || 'Уроки по таймменджменту, написанию промтов и продюсированию общей ценой 50 ТЫСЯЧ в ПОДАРОК';
                                   // Ищем паттерн "X ТЫСЯЧ в ПОДАРОК" и выделяем его
                                   const parts = bonusText.split(/(\d+\s*ТЫСЯЧ\s*в\s*ПОДАРОК)/i);
                                   return parts.map((part, index) => {
                                       if (/\d+\s*ТЫСЯЧ\s*в\s*ПОДАРОК/i.test(part)) {
                                           return <span key={index} className={s.highlightPrice}>{part}</span>;
                                       }
                                       return part;
                                   });
                               })()}
                           </>
                   </li>
                )}
            </ul>
        </div>
    )
}

export const Tariff = ({ onVisit }: TariffProps) => {
    const { getSettingValue } = useSettings()
    const { prices, error: pricesError } = useTariffPrices()
    const [showContent, setShowContent] = useState(false)
    const [hideTitle, setHideTitle] = useState(false)
    const [titleFadeOut, setTitleFadeOut] = useState(false)
    const [currentTariffIndex, setCurrentTariffIndex] = useState(0)
    
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
    const [currentSlide, setCurrentSlide] = useState(currentTariffIndex)
    const [nextSlide, setNextSlide] = useState<number | null>(null)
    const [isFirstRender, setIsFirstRender] = useState(true)
    
    // Рефы для свайпа
    const swipeContainerRef = useRef<HTMLDivElement | null>(null)
    const touchStartYRef = useRef<number | null>(null)

    // Синхронизируем currentSlide с currentTariffIndex
    useEffect(() => {
        setCurrentSlide(currentTariffIndex)
    }, [currentTariffIndex])
    
    // Отслеживаем первый рендер для анимации
    useEffect(() => {
        if (showContent && isFirstRender) {
            const timer = setTimeout(() => {
                setIsFirstRender(false)
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [showContent, isFirstRender])

    // Отмечаем раздел как посещенный
    useEffect(() => {
        onVisit()
    }, [onVisit])

    useEffect(() => {
        const timer = setTimeout(() => {
            setTitleFadeOut(true)
            
            const contentTimer = setTimeout(() => {
                setShowContent(true)
                setHideTitle(true)
            }, 500)

            return () => clearTimeout(contentTimer)
        }, 900)

        return () => clearTimeout(timer)
    }, [])

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

    // Защита от закрытия приложения при свайпе сверху (только для верхней части экрана)
    useEffect(() => {
        const preventAppClose = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0]
                const currentY = touch.clientY
                const startY = touchStartYRef.current
                
                // Блокируем только быстрые свайпы вниз из самой верхней части экрана (первые 50px)
                if (currentY < 50 && startY && currentY > startY + 50) {
                    e.preventDefault()
                    e.stopPropagation()
                    return false
                }
                
                // Блокируем только быстрые свайпы вверх из самой верхней части экрана
                if (currentY < 50 && startY && currentY < startY - 50) {
                    e.preventDefault()
                    e.stopPropagation()
                    return false
                }
            }
        }
        
        const preventAppCloseStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0]
                // Записываем начальную позицию касания только если начали в верхней части
                if (touch.clientY < 100) {
                    touchStartYRef.current = touch.clientY
                }
            }
        }
        
        // Добавляем обработчики только для верхней части экрана
        document.addEventListener('touchstart', preventAppCloseStart, { passive: true })
        document.addEventListener('touchmove', preventAppClose, { passive: false })
        
        return () => {
            document.removeEventListener('touchstart', preventAppCloseStart)
            document.removeEventListener('touchmove', preventAppClose)
        }
    }, [])

    const individualFeatures = [
        { text: "Освоение инструментов монтажа и анимации Adobe Premiere Pro и After Effects", included: true },
        { text: "Создание личного бренда и сильного портфолио", included: true },
        { text: "Обучение продажам на высокий чек", included: true },
        { text: "Практика на реальных заказах под руководством кураторов", included: true },
        { text: "Поддержка при первых заказах\nи переговорах", included: true },
        { text: "Обучение генерации видео и липсинга с помощью нейросетей", included: true },
        { text: "Разработка системы делегирования и формирования команды", included: true },
        { text: "Получение доступа к закрытым бонус-урокам", included: true },
        // В этом тарифе все функции включены, поэтому красных блоков нет
    ]

    const supportFeatures = [
        { text: "Освоение инструментов монтажа и анимации Adobe Premiere Pro и After Effects", included: true },
        { text: "Создание личного бренда и сильного портфолио", included: true },
        { text: "Обучение продажам на высокий чек", included: true },
        { text: "Практика на реальных заказах под руководством кураторов", included: false },
        { text: "Поддержка при первых заказах\nи переговорах", included: true },
        { text: "Обучение генерации видео и липсинга с помощью нейросетей", included: true },
        // Потом все красные блоки (included: false)
        { text: "Разработка системы делегирования и формирования команды", included: false },
        { text: "Получение доступа к закрытым бонус-урокам", included: false },
    ]

    const groupFeatures = [
        { text: "Освоение инструментов монтажа и анимации Adobe Premiere Pro и After Effects", included: true },
        { text: "Создание личного бренда и сильного портфолио", included: true },
        { text: "Обучение продажам на высокий чек", included: true },
        { text: "Практика на реальных заказах под руководством кураторов", included: false },
        { text: "Поддержка при первых заказах\nи переговорах", included: false },
        { text: "Обучение генерации видео и липсинга с помощью нейросетей", included: true },
        // Потом все красные блоки (included: false)
        { text: "Разработка системы делегирования и формирования команды", included: false },
        { text: "Получение доступа к закрытым бонус-урокам", included: false },
    ]

    // Создаем массив тарифов из данных бекенда или используем захардкоженные данные как fallback
    const tariffs = prices.length > 0 ? prices.map((price: TariffPrice, index: number) => {
        // Определяем features в зависимости от индекса тарифа
        let features = individualFeatures; // по умолчанию
        if (index === 1) features = supportFeatures;
        if (index === 2) features = groupFeatures;
        
        return {
            title: price.title,
            price: price.price,
            originalPrice: price.original_price,
            features: features,
            description: price.description || ''
        };
    }) : [
        // Fallback данные если бекенд недоступен
        {
            title: "ИНДИВИДУАЛЬНОЕ НАСТАВНИЧЕСТВО",
            price: "57 т.р/мес",
            originalPrice: "68 000₽/мес",
            features: individualFeatures,
            description: 'Для тех, кто не хочет "разбираться сам",\nа хочет выстрелить быстро,\nс поддержкой и помощью\nна каждом этапе'
        },
        {
            title: "ОБУЧЕНИЕ С ПОДДЕРЖКОЙ",
            price: "37 т.р/мес",
            originalPrice: "46 000₽/мес",
            features: supportFeatures,
            description: 'Для тех, кому нужна персональная обратная связь и быстрый рост'
        },
        {
            title: "ГРУППОВОЕ ОБУЧЕНИЕ",
            price: "15 т.р/мес",
            originalPrice: "19 000₽/мес",
            features: groupFeatures,
            description: 'Отличный выбор, если хочешь войти в профессию без риска\nи убедиться, что это твое'
        }
    ]

    // Функция для плавной прокрутки к началу страницы
    const scrollToTop = useCallback(() => {
        // Используем улучшенную функцию из хука
        setTimeout(() => {
            scrollToTopFunction(true)
        }, 100)
    }, [])

    // Функция для проверки, нужно ли прокручивать к началу
    const shouldScrollToTop = useCallback(() => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop
        return currentScroll > 100
    }, [])

    const nextTariff = useCallback(() => {
        if (isAnimating) return
        
        setCurrentTariffIndex((prevIndex) => {
            const newIndex = (prevIndex + 1) % tariffs.length
            setIsAnimating(true)
            setSlideDirection('right')
            setNextSlide(newIndex)
            
            setTimeout(() => {
                setCurrentSlide(newIndex)
                setNextSlide(null)
                setSlideDirection(null)
        setIsAnimating(false)
                
                // Всегда прокручиваем к началу при переходе
                forceScrollToTop()
            }, 400)
            
            return newIndex
        })
    }, [isAnimating, tariffs.length, scrollToTop])

    const prevTariff = useCallback(() => {
        if (isAnimating) return
        
        setCurrentTariffIndex((prevIndex) => {
            const newIndex = (prevIndex - 1 + tariffs.length) % tariffs.length
            setIsAnimating(true)
            setSlideDirection('left')
            setNextSlide(newIndex)
            
            setTimeout(() => {
                setCurrentSlide(newIndex)
                setNextSlide(null)
                setSlideDirection(null)
                setIsAnimating(false)
                
                // Всегда прокручиваем к началу при переходе
                forceScrollToTop()
            }, 400)
            
            return newIndex
        })
    }, [isAnimating, tariffs.length, scrollToTop])

    // Клавиатурная навигация
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isAnimating) return
            
            if (e.key === 'ArrowLeft' && currentTariffIndex > 0) {
                e.preventDefault()
                prevTariff()
            } else if (e.key === 'ArrowRight' && currentTariffIndex < tariffs.length - 1) {
                e.preventDefault()
                nextTariff()
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [currentTariffIndex, tariffs.length, isAnimating, prevTariff, nextTariff])

    // Обработчики свайпа
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (isAnimating) return
        
        const touch = e.touches[0]
        setSwipeStartX(touch.clientX)
        setSwipeStartY(touch.clientY)
        touchStartYRef.current = touch.clientY
        setIsSwipeActive(true)
        setSwipeOffset(0)
        setIsHorizontalSwipe(false)
    }, [isAnimating])

        const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isSwipeActive || isAnimating) return
        
        const touch = e.touches[0]
        const diffX = touch.clientX - swipeStartX
        const diffY = touch.clientY - swipeStartY
        
        const isHorizontal = Math.abs(diffX) > Math.abs(diffY) * 1.5
        const isVertical = Math.abs(diffY) > Math.abs(diffX) * 1.5
        
        if (isHorizontal && Math.abs(diffX) > 20) {
            setIsHorizontalSwipe(true)
        }
        
        if (isHorizontalSwipe || (isHorizontal && Math.abs(diffX) > 20)) {
            const maxOffset = window.innerWidth * 0.3
            const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, diffX))
            setSwipeOffset(limitedOffset)
            e.preventDefault()
            e.stopPropagation()
        } else if (isVertical && Math.abs(diffY) > 30) {
            // Блокируем только быстрые вертикальные свайпы из верхней части экрана
            const touch = e.touches[0]
            if (touch.clientY < 100) {
                e.preventDefault()
                e.stopPropagation()
            }
            // Для остальной части экрана разрешаем обычный скролл
        }
    }, [isSwipeActive, swipeStartX, swipeStartY, isAnimating, isHorizontalSwipe])

    const handleTouchEnd = useCallback(() => {
        if (!isSwipeActive || isAnimating) return
        
        const threshold = 50
        const velocityThreshold = 20
        const screenWidth = window.innerWidth
        const relativeThreshold = screenWidth * 0.15
        
        const velocity = Math.abs(swipeOffset)
        const shouldTrigger = Math.abs(swipeOffset) > Math.max(threshold, relativeThreshold) || velocity > velocityThreshold
        
            setIsAnimating(true)
        
        if (shouldTrigger) {
            if (swipeOffset > 0 && currentTariffIndex > 0) {
                // Свайп вправо - предыдущий тариф
                const newIndex = currentTariffIndex - 1
                setSlideDirection('left')
                setNextSlide(newIndex)
                setTimeout(() => {
                    setCurrentTariffIndex(newIndex)
                    setCurrentSlide(newIndex)
                    setNextSlide(null)
                    setSlideDirection(null)
                    
                    // Всегда прокручиваем к началу при свайпе
                    forceScrollToTop()
                }, 300)
            } else if (swipeOffset < 0 && currentTariffIndex < tariffs.length - 1) {
                // Свайп влево - следующий тариф
                const newIndex = currentTariffIndex + 1
                setSlideDirection('right')
                setNextSlide(newIndex)
                setTimeout(() => {
                    setCurrentTariffIndex(newIndex)
                    setCurrentSlide(newIndex)
                    setNextSlide(null)
                    setSlideDirection(null)
                    
                    // Всегда прокручиваем к началу при свайпе
                    forceScrollToTop()
                }, 300)
            }
        }
        
        setIsSwipeActive(false)
        setIsHorizontalSwipe(false)
        
        if (!shouldTrigger) {
            setSwipeOffset(0)
            setTimeout(() => {
                setIsAnimating(false)
            }, 200)
        } else {
            setSwipeOffset(0)
            setTimeout(() => {
                setIsAnimating(false)
            }, 300)
        }
    }, [isSwipeActive, swipeOffset, currentTariffIndex, tariffs.length, isAnimating, shouldScrollToTop, scrollToTop])

    // Показываем ошибку если не удалось загрузить данные
    if (pricesError && prices.length === 0) {
        return (
            <div className={s.tariffContent}>
                <div className={s.error}>
                    <h3>Ошибка загрузки тарифов</h3>
                    <p>{pricesError}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className={s.retryButton}
                    >
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={s.tariffContent}>
            {!hideTitle && (
                <h2 className={titleFadeOut ? s.fadeOut : ''}>ТАРИФНАЯ СЕТКА</h2>
            )}
            {showContent && (
                <div className={`${s.content} ${s.fadeIn}`}>
                    <ProgressBar currentTariffIndex={currentTariffIndex} totalTariffs={tariffs.length} />
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
                            className={`${s.slide} ${s.currentSlide} ${slideDirection === 'left' ? s.slideOutRight : ''} ${slideDirection === 'right' ? s.slideOutLeft : ''}`}
                        >
                            <div className={s.tariffContainer}>
                                <TariffPlan
                                    title={tariffs[currentSlide].title}
                                    description={tariffs[currentSlide].description}
                                    price={tariffs[currentSlide].price}
                                    originalPrice={tariffs[currentSlide].originalPrice}
                                    features={tariffs[currentSlide].features}
                                    index={0}
                                    tariffKey={`tariff-${currentSlide}`}
                                    disableAnimation={!isFirstRender}
                                />
                            </div>
                            
                            {/* Дополнительная информация для текущего слайда */}
                            <AdditionalInfoBlock 
                                currentTariffIndex={currentSlide} 
                                getSettingValue={getSettingValue} 
                            />
                        </div>

                        {/* Следующий слайд (появляется во время анимации) */}
                        {nextSlide !== null && (
                            <div 
                                className={`${s.slide} ${s.nextSlide} ${slideDirection === 'left' ? s.slideInLeft : ''} ${slideDirection === 'right' ? s.slideInRight : ''}`}
                            >
                                <div className={s.tariffContainer}>
                        <TariffPlan
                                        title={tariffs[nextSlide].title}
                                        description={tariffs[nextSlide].description}
                                        price={tariffs[nextSlide].price}
                                        originalPrice={tariffs[nextSlide].originalPrice}
                                        features={tariffs[nextSlide].features}
                            index={0}
                                        tariffKey={`tariff-${nextSlide}`}
                                        disableAnimation={true}
                        />
                                </div>
                                
                                {/* Дополнительная информация для следующего слайда */}
                                <AdditionalInfoBlock 
                                    currentTariffIndex={nextSlide} 
                                    getSettingValue={getSettingValue} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {showContent && (
                <>
                    {/* Кнопка влево - скрываем на самом дорогом тарифе (индекс 0) */}
                    {currentTariffIndex > 0 && (
                        <button 
                            className={`${s.navButton} ${s.navButtonLeft}`}
                            onClick={prevTariff}
                            aria-label="Предыдущий тариф"
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
                    
                    {/* Кнопка вправо - скрываем на самом дешевом тарифе (последний индекс) */}
                    {currentTariffIndex < tariffs.length - 1 && (
                        <button 
                            className={`${s.navButton} ${s.navButtonRight}`}
                            onClick={nextTariff}
                            aria-label="Следующий тариф"
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