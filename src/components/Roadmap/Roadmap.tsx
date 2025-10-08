import s from './Roadmap.module.scss'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTelegramBackButton } from '../../hooks/useTelegramBackButton'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { useSettings } from '../../hooks/useSettings'
import { forceScrollToTop } from '../../hooks/useScrollToTop'
import { Button } from '../Button/Button'

interface RoadmapProps {
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

// Функция для выделения текста красным цветом
const highlightText = (text: string) => {
    const parts = text.split(/(пути, ниши, форматы|фриланс, студия, найм, личный бренд|Adobe Premiere Pro и After Effects|Ритм, звук, графика, цвет, динамика, hook, CTA, описания, хэштеги\.\.\.|реальные, тестовые и учебные заказы|обратную связь от наставников и потенциальных клиентов|не теряться и не демпинговать|портфолио, Telegram, воронки продаж|вести переговоры и продавать свои услуги|генерация графики, субтитры, озвучка, шаблоны|инструмент для заработка|в 2–3 раза|горячие заказчики|получают ответ|РЕЗУЛЬТАТ|МИЛЛИОННИК|ВЫСОКИЙ ЧЕК)/g)
    return parts.map((part, index) => {
        if (part === 'пути, ниши, форматы' || 
            part === 'фриланс, студия, найм, личный бренд' || 
            part === 'Adobe Premiere Pro и After Effects' ||
            part === 'Ритм, звук, графика, цвет, динамика, hook, CTA, описания, хэштеги...' ||
            part === 'реальные, тестовые и учебные заказы' ||
            part === 'обратную связь от наставников и потенциальных клиентов' ||
            part === 'не теряться и не демпинговать' ||
            part === 'портфолио, Telegram, воронки продаж' ||
            part === 'вести переговоры и продавать свои услуги' ||
            part === 'генерация графики, субтитры, озвучка, шаблоны' ||
            part === 'инструмент для заработка' ||
            part === 'в 2–3 раза' ||
            part === 'горячие заказчики' ||
            part === 'получают ответ' ||
            part === 'РЕЗУЛЬТАТ' || 
            part === 'МИЛЛИОННИК' || 
            part === 'ВЫСОКИЙ ЧЕК') {
            return <span key={index} style={{ color: '#cc2855', fontWeight: 'bold' }}>{part}</span>
        }
        return part
    })
}

// Компонент прогресс-бара
const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
    // Показываем прогресс для всех шагов + финальный результат
    const totalItems = totalSteps + 1
    const progress = ((currentStep + 1) / totalItems) * 100
    const isCompleted = progress >= 100
    
    return (
        <div className={s.progressBar}>
            <div 
                className={`${s.progressFill} ${isCompleted ? s.completed : ''}`}
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}

// Компонент для отдельного шага
const StepCard = ({ step, subtitle, points, index }: {
    step: number
    subtitle: string
    points: string[]
    index: number
}) => {
    const { elementRef, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    })

    // Специальные классы для шагов
    const isStep5 = step === 5
    const isFirstStep = step === 1
    let stepClass = s.step
    
    if (isStep5) {
        stepClass = `${s.step} ${s.step5}`
    } else if (isFirstStep) {
        stepClass = `${s.step} ${s.step1}`
    }
    
    // Плавный эффект появления только для первого шага
    const shouldAnimate = isFirstStep && isVisible

    return (
        <div 
            ref={isFirstStep ? elementRef : undefined}
            className={`${stepClass} ${shouldAnimate ? s.visible : ''} ${!isFirstStep ? s.noAnimation : ''}`}
            style={{ animationDelay: isFirstStep ? `${index * 0.2}s` : '0s' }}
        >
            <div className={s.stepHeader}>
                <div className={s.stepNumber}>{step}</div>
                <div className={s.stepInfo}>
                    <h4 className={s.stepSubtitle}>{subtitle}</h4>
                </div>
            </div>
            <ul className={s.stepPoints}>
                {points.map((point, pointIndex) => (
                    <li key={pointIndex} className={s.stepPoint}>
                        {highlightText(point)}
                    </li>
                ))}
            </ul>
            {/* Стрелка-указатель только для последнего шага */}
            {step === 5 && <GuideArrow />}
        </div>
    )
}

// Компонент для финального результата с тарифной сеткой
const FinalResultCard = ({ finalResult }: { finalResult: any }) => {
    return (
        <div 
            className={`${s.finalResult} ${s.finalResultSpecial} ${s.noAnimation}`}
        >
            <h2 className={s.resultTitle}>{finalResult.title}</h2>
            <h3 className={s.resultSubtitle}>{finalResult.subtitle}</h3>
            <p className={s.resultDescription}>{finalResult.description}</p>
            
            <div className={s.priceSection}>
                <h4 className={s.priceTitle}>{finalResult.price}</h4>
                <ul className={s.benefitsList}>
                    {finalResult.benefits.map((benefit: string, index: number) => (
                        <li key={index} className={s.benefit}>
                            {benefit}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Стрелка-указатель для финального результата */}
            <GuideArrow />
        </div>
    )
}

export const Roadmap = ({ onVisit }: RoadmapProps) => {
    const { getSettingValue } = useSettings()
    const [showContent, setShowContent] = useState(false)
    const [hideTitle, setHideTitle] = useState(false)
    const [titleFadeOut, setTitleFadeOut] = useState(false)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    
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
    const [currentSlide, setCurrentSlide] = useState(currentStepIndex)
    const [nextSlide, setNextSlide] = useState<number | null>(null)
    
    // Состояние для анимации кнопки "ПОПАСТЬ В NCNG"
    const [buttonKey, setButtonKey] = useState(0)
    
    
    const containerRef = useRef<HTMLDivElement | null>(null)
    const swipeContainerRef = useRef<HTMLDivElement | null>(null)
    const touchStartYRef = useRef<number | null>(null)
    
    // Синхронизируем currentSlide с currentStepIndex
    useEffect(() => {
        setCurrentSlide(currentStepIndex)
    }, [currentStepIndex])
    
    useEffect(() => {
        // Отмечаем раздел как посещенный
        onVisit()
        
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

    // Отмечаем раздел как посещенный
    useEffect(() => {
        onVisit()
    }, [onVisit])

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

    // Обновленный роадмап с 5 шагами
    const roadmapSteps = [
        {
            step: 1,
            subtitle: 'Ты входишь в профессию и понимаешь, куда двигаться',
            points: [
                'Понимаешь, как зарабатывать на монтаже: пути, ниши, форматы',
                'Строишь свою стратегию роста: фриланс, студия, найм, личный бренд',
                'Вливаешься в сильное комьюнити, где все работают на РЕЗУЛЬТАТ'
            ]
        },
        {
            step: 2,
            subtitle: 'Ты уверенно работаешь в сфере монтажа и моушн-дизайна',
            points: [
                'Осваиваешь Adobe Premiere Pro и After Effects',
                'Понимаешь, как превратить видео в МИЛЛИОННИК',
                'Собираешь проект под задачи клиента: Ритм, звук, графика, цвет, динамика, hook, CTA, описания, хэштеги...'
            ]
        },
        {
            step: 3,
            subtitle: 'Ты собираешь портфолио и работаешь с реальными проектами',
            points: [
                'Создаешь работы, которые продают тебя за ВЫСОКИЙ ЧЕК',
                'Выполняешь реальные, тестовые и учебные заказы',
                'Получаешь обратную связь от наставников и потенциальных клиентов'
            ]
        },
        {
            step: 4,
            subtitle: 'Ты учишься продавать себя и свои навыки',
            points: [
                'Понимаешь, как общаться с заказчиком — не теряться и не демпинговать',
                'Создаешь упаковку: портфолио, Telegram, воронки продаж',
                'Научишься вести переговоры и продавать свои услуги'
            ]
        },
        {
            step: 5,
            subtitle: 'Ты используешь нейросети как суперсилу и находишь клиентов',
            points: [
                'Автоматизируешь рутину: генерация графики, субтитры, озвучка, шаблоны',
                'Используешь AI не как модную игрушку, а как инструмент для заработка',
                'Ускоряешь процесс монтажа и моушн-дизайна в 2–3 раза',
                'Осваиваешь платформы фриланса и найма, где сидят горячие заказчики',
                'Пишешь сообщения, КП, отклики и резюме, которые получают ответ'
            ]
        }
    ]

    // Получаем цену из настроек или используем значение по умолчанию
    const priceNumber = getSettingValue('tariff_price') || '15.970'
    const tariffPrice = `ТЫ МОЖЕШЬ НАЧАТЬ СВОЙ ПУТЬ ВСЕГО С ${priceNumber} В МЕСЯЦ:`

    const finalResult = {
        title: 'КОНЕЧНЫЙ РЕЗУЛЬТАТ:',
        subtitle: 'Ты — монтажер, который умеет зарабатывать',
        description: 'У тебя есть кейсы, клиенты, понимание своей ниши и путь на 150–200К+ руб',
        price: tariffPrice,
        benefits: [
            'Полный доступ ко всем техникам',
            'Настоящие проекты и первые кейсы',
            'Комьюнити единомышленников',
            'Возможность допродлить и перейти на следующий тариф со скидкой',
            'И главное — старт в карьере, с доходом 150–200К+ руб уже во время обучения'
        ]
    }

    // Функция для плавной прокрутки к началу страницы
    const scrollToTopCallback = useCallback(() => {
        // Используем улучшенную функцию из хука
        setTimeout(() => {
            forceScrollToTop()
        }, 100)
    }, [])

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
        
        // Определяем направление свайпа
        const isHorizontal = Math.abs(diffX) > Math.abs(diffY) * 1.5
        
        // Если это горизонтальный свайп, устанавливаем флаг
        if (isHorizontal && Math.abs(diffX) > 20) {
            setIsHorizontalSwipe(true)
        }
        
        // Если это горизонтальный свайп, обрабатываем его
        if (isHorizontalSwipe || (isHorizontal && Math.abs(diffX) > 20)) {
            const maxOffset = window.innerWidth * 0.3
            
            // Ограничиваем смещение
            const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, diffX))
            
            setSwipeOffset(limitedOffset)
            
            // Предотвращаем скролл страницы только для горизонтальных свайпов
            e.preventDefault()
            e.stopPropagation()
        }
        // Для iOS: НЕ блокируем вертикальные свайпы вверх, чтобы избежать закрытия приложения
        // Позволяем браузеру обрабатывать вертикальные свайпы естественным образом
    }, [isSwipeActive, swipeStartX, swipeStartY, isAnimating, isHorizontalSwipe])

    const handleTouchEnd = useCallback(() => {
        if (!isSwipeActive || isAnimating) return
        
        const threshold = 50
        const velocityThreshold = 20
        const screenWidth = window.innerWidth
        const relativeThreshold = screenWidth * 0.15
        
        // Вычисляем скорость свайпа
        const velocity = Math.abs(swipeOffset)
        const shouldTrigger = Math.abs(swipeOffset) > Math.max(threshold, relativeThreshold) || velocity > velocityThreshold
        
        setIsAnimating(true)
        
        if (shouldTrigger) {
            if (swipeOffset > 0 && currentStepIndex > 0) {
                // Свайп вправо - предыдущий шаг
                const newIndex = currentStepIndex - 1
                setSlideDirection('left')
                setNextSlide(newIndex)
                setTimeout(() => {
                    setCurrentStepIndex(newIndex)
                    setCurrentSlide(newIndex)
                    setNextSlide(null)
                    setSlideDirection(null)
                    // Используем функцию из хука как в Button компоненте с небольшой задержкой
                    setTimeout(() => forceScrollToTop(), 100)
                }, 300)
            } else if (swipeOffset < 0 && currentStepIndex < roadmapSteps.length) {
                // Свайп влево - следующий шаг
                const newIndex = currentStepIndex + 1
                setSlideDirection('right')
                setNextSlide(newIndex)
                setTimeout(() => {
                    setCurrentStepIndex(newIndex)
                    setCurrentSlide(newIndex)
                    setNextSlide(null)
                    setSlideDirection(null)
                    // Используем функцию из хука как в Button компоненте с небольшой задержкой
                    setTimeout(() => forceScrollToTop(), 100)
                }, 300)
            }
        }
        
        // Сброс состояния свайпа
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
                // Небольшая задержка для синхронизации с анимацией
                setTimeout(() => forceScrollToTop(), 50)
            }, 300)
        }
    }, [isSwipeActive, swipeOffset, currentStepIndex, roadmapSteps.length, isAnimating, scrollToTopCallback])

    // Функции навигации с анимациями
    const nextStep = useCallback(() => {
        if (isAnimating) return
        
        setCurrentStepIndex((prev) => {
            const newIndex = (prev + 1) % (roadmapSteps.length + 1)
            setIsAnimating(true)
            setSlideDirection('right')
            setNextSlide(newIndex)
            
            setTimeout(() => {
                setCurrentSlide(newIndex)
                setNextSlide(null)
                setSlideDirection(null)
                setIsAnimating(false)
                // Небольшая задержка для синхронизации с анимацией
                setTimeout(() => forceScrollToTop(), 50)
                setButtonKey(prev => prev + 1)
            }, 400)
            
            return newIndex
        })
    }, [roadmapSteps.length, isAnimating, scrollToTopCallback])

    const prevStep = useCallback(() => {
        if (isAnimating) return
        
        setCurrentStepIndex((prev) => {
            const newIndex = (prev - 1 + roadmapSteps.length + 1) % (roadmapSteps.length + 1)
            setIsAnimating(true)
            setSlideDirection('left')
            setNextSlide(newIndex)
            
            setTimeout(() => {
                setCurrentSlide(newIndex)
                setNextSlide(null)
                setSlideDirection(null)
                setIsAnimating(false)
                // Небольшая задержка для синхронизации с анимацией
                setTimeout(() => forceScrollToTop(), 50)
                setButtonKey(prev => prev + 1)
            }, 400)
            
            return newIndex
        })
    }, [roadmapSteps.length, isAnimating, scrollToTopCallback])

    // Клавиатурная навигация
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isAnimating) return
            
            if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
                e.preventDefault()
                prevStep()
            } else if (e.key === 'ArrowRight' && currentStepIndex < roadmapSteps.length) {
                e.preventDefault()
                nextStep()
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        };
    }, [currentStepIndex, roadmapSteps.length, isAnimating, prevStep, nextStep])

    return (
        <div className={s.roadmapWrapper}>
            {!hideTitle && (
                <div>
                    <h1 className={titleFadeOut ? s.fadeOut : ''}>ПУТЬ К УСПЕХУ В NCNG</h1>
                    <p className={`${s.subtitle} ${titleFadeOut ? s.fadeOut : ''}`}>5 шагов к доходу <br /> 150–200К+ в месяц</p>
                </div>
            )}
            
            {showContent && (
                <div className={s.content}>
                    <ProgressBar currentStep={currentStepIndex} totalSteps={roadmapSteps.length} />
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
                            <div className={s.stepsContainer}>
                                {/* Показываем текущий шаг */}
                                {currentSlide < roadmapSteps.length && (
                                    <StepCard 
                                        key={`current-step-${currentSlide}`}
                                        {...roadmapSteps[currentSlide]} 
                                        index={0}
                                    />
                                )}
                                
                                {/* Показываем финальный результат */}
                                {currentSlide === roadmapSteps.length && (
                                    <FinalResultCard finalResult={finalResult} />
                                )}

                                {/* Перемещаем кнопки внутрь контейнера для свайпа */}
                                <div className={s.buttonContainer}>
                                    <div 
                                        key={buttonKey} 
                                        className={`${s.mainButtonWrapper} ${
                                            currentSlide === 0 ? s.mainButtonVisible : s.mainButtonStatic
                                        }`}
                                    >
                                        <Button 
                                            href="https://t.me/vardozz" 
                                            target="_blank" 
                                            style={{ 
                                                marginBottom: '1rem',
                                                background: 'linear-gradient(45deg, rgb(204, 40, 85), rgb(0 0 0))',
                                            }}
                                        >
                                            <p>ПОПАСТЬ В NCNG</p>
                                        </Button>
                                    </div>
                                    {currentSlide === roadmapSteps.length && (
                                        <Button next href="/tariff" style={{ marginBottom: '2rem', background: 'linear-gradient(45deg, rgb(10, 194, 1), rgb(2 2 2))' }}>
                                            <p>ТАРИФЫ</p>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Следующий слайд (появляется во время анимации) */}
                        {nextSlide !== null && (
                            <div 
                                className={`${s.slide} ${s.nextSlide} ${slideDirection === 'left' ? s.slideInLeft : ''} ${slideDirection === 'right' ? s.slideInRight : ''}`}
                            >
                                <div className={s.stepsContainer}>
                                    {/* Показываем следующий шаг */}
                                    {nextSlide < roadmapSteps.length && (
                                        <StepCard 
                                            key={`next-step-${nextSlide}`}
                                            {...roadmapSteps[nextSlide]} 
                                            index={0}
                                        />
                                    )}
                                    
                                    {/* Показываем финальный результат */}
                                    {nextSlide === roadmapSteps.length && (
                                        <FinalResultCard finalResult={finalResult} />
                                    )}

                                    {/* Кнопки для следующего слайда */}
                                    <div className={s.buttonContainer}>
                                        <div 
                                            className={`${s.mainButtonWrapper} ${
                                                nextSlide === 0 ? s.mainButtonVisible : s.mainButtonStatic
                                            }`}
                                        >
                                            <Button 
                                                href="https://t.me/vardozz" 
                                                target="_blank" 
                                                style={{ 
                                                    marginBottom: '1rem',
                                                    background: 'linear-gradient(45deg, rgb(204, 40, 85), rgb(0 0 0))',
                                                }}
                                            >
                                                <p>ПОПАСТЬ В NCNG</p>
                                            </Button>
                                        </div>
                                        {nextSlide === roadmapSteps.length && (
                                            <Button next href="/tariff" style={{ marginBottom: '2rem', background: 'linear-gradient(45deg, rgb(10, 194, 1), rgb(2 2 2))' }}>
                                                <p>ТАРИФЫ</p>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
                {showContent && (
                    <>
                        {currentStepIndex > 0 && (
                            <button 
                                className={`${s.navButton} ${s.navButtonLeft}`}
                                onClick={prevStep}
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
                        
                        {currentStepIndex < roadmapSteps.length && (
                            <button 
                                className={`${s.navButton} ${s.navButtonRight}`}
                                onClick={nextStep}
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