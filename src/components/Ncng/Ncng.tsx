import s from './Ncng.module.scss'
import { useState, useEffect } from 'react'
import { useTelegramBackButton } from '../../hooks/useTelegramBackButton'
import { useNavigate } from 'react-router-dom'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { Button } from '../Button/Button'

interface NcngProps {
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

// Компонент для отдельной секции
const Section = ({ children, index, className = '' }: {
    children: React.ReactNode
    index: number
    className?: string
}) => {
    const { elementRef, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    })

    return (
        <div 
            ref={elementRef}
            className={`${s.section} ${className} ${isVisible ? s.visible : ''}`}
            style={{ animationDelay: `${index * 0.2}s` }}
        >
            {children}
        </div>
    )
}

export const Ncng = ({ onVisit }: NcngProps) => {
    const navigate = useNavigate()
    const [showContent, setShowContent] = useState(false)
    const [hideTitle, setHideTitle] = useState(false)
    const [titleFadeOut, setTitleFadeOut] = useState(false)
    const [currentTextIndex, setCurrentTextIndex] = useState(0)
    const [isTextChanging, setIsTextChanging] = useState(false)
    const [isFirstTextVisible, setIsFirstTextVisible] = useState(false)
    
    // Используем хук для управления BackButton
    useTelegramBackButton('/')

    const readyTexts = [
        'ГОТОВ К РОСТУ?',
        'ГОТОВ К УСПЕХУ?',
        'ГОТОВ К ПОБЕДЕ?',
        'ГОТОВ К ВЫЗОВУ?'
    ]

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
                
                // Показываем первый текст с небольшой задержкой
                setTimeout(() => {
                    setIsFirstTextVisible(true)
                }, 300)
            }, 500)

            return () => clearTimeout(contentTimer)
        }, 1000)

        return () => clearTimeout(timer)
    }, [])

    // Анимация поочередного появления текста с плавным переходом
    useEffect(() => {
        if (!showContent || !isFirstTextVisible) return

        const textInterval = setInterval(() => {
            setIsTextChanging(true)
            
            // Ждем завершения fade-out анимации
            setTimeout(() => {
                setCurrentTextIndex((prevIndex) => 
                    prevIndex === readyTexts.length - 1 ? 0 : prevIndex + 1
                )
                setIsTextChanging(false)
            }, 250) // Уменьшаем с 500ms до 250ms для более быстрой анимации
            
        }, 1500) // Уменьшаем с 2500ms до 1500ms для более частой смены текста

        return () => clearInterval(textInterval)
    }, [showContent, isFirstTextVisible])

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

    return (
        <div className={s.prodContent}>
            {!hideTitle && (
                <div className={s.titleContainer}>
                    <div className={`${s.mainTitle} ${titleFadeOut ? s.fadeOut : ''}`}>НАУЧИМ ЗАРАБАТЫВАТЬ</div>
                    <div className={`${s.subtitle} ${titleFadeOut ? s.fadeOut : ''}`}>150-200К НА ВИДЕОМОНТАЖЕ</div>
                </div>
            )}
            {showContent && (
                <div className={`${s.content} ${s.fadeIn}`}>
                    <img 
                        src='https://i.postimg.cc/qRGkfMp3/Comp-3-2025-08-10-01-08-42-4.png' 
                        alt="ncng" 
                        onClick={() => navigate('/')} 
                        style={{
                            width: '100%', 
                            maxWidth: '400px', 
                            height: 'auto', 
                            display: 'block', 
                            margin: '0 auto 1rem auto',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }} 
                    />
                    <Section index={0}>
                        <h3>МЫ — КОМАНДА ПРАКТИКОВ</h3>
                        <p>Которые дают инструменты для выхода <span className={s.highlightPrice}>с 0 на 150-200К+ руб</span> благодаря видеомонтажу и моушн-дизайну</p>
                    </Section>

                    <Section index={1}>
                        <h3 style={{ textAlign: 'center' }}>ТЫ В ПРАВИЛЬНОМ МЕСТЕ, ЕСЛИ:</h3>
                        <ul>
                            <li>Новичок, и не знаешь с чего начать</li>
                            <li>Уже учился, но всё ещё топчешься на месте</li>
                            <li>Работаешь, но не понимаешь, как выйти на высокий чек</li>
                            <li>Боишься брать заказы или не знаешь, где искать клиентов</li>
                            <li>Устал от курсов, где много воды и ноль реальных результатов</li>
                        </ul>
                    </Section>
                    <div className={s.readySection}>
                        <h1 className={s.readyTitle}>
                            <span className={`${s.readyText1} ${
                                !isFirstTextVisible ? '' : 
                                isTextChanging ? s.textFadeOut : s.textFadeIn
                            }`}>
                                {readyTexts[currentTextIndex]}
                            </span>
                        </h1>
                                            <div className={s.readySubtitle}>
                        <p>Время настало!</p>
                    </div>
                </div>
                <div style={{ position: 'relative' }}>
                    <Button href="https://t.me/vardozz" style={{ marginBottom: '1rem', background: 'linear-gradient(45deg, rgb(204, 40, 85), rgb(0, 0, 0))' }}>
                        <p>ПОПАСТЬ В NCNG</p>
                    </Button>
                    <GuideArrow />  
                </div>
                    <Button next href="/about" style={{ marginBottom: '1rem', background: 'linear-gradient(45deg, rgb(10, 194, 1), rgb(2 2 2))' }}>
                        <p>ПРЕПОДАВАТЕЛИ</p>
                    </Button>
                    <Button href="https://teletype.in/@panteleev_product/no_cut_no_glory" target="_blank" style={{ marginBottom: '3rem' }}>
                        <p>ПОДРОБНЕЕ</p>
                    </Button>
                </div>
            )}
        </div>
    )
} 