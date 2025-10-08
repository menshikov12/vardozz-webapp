import s from './About.module.scss'
import { useState, useEffect } from 'react'
import { Button } from '../Button/Button'
import { useTelegramBackButton } from '../../hooks/useTelegramBackButton'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'

interface AboutProps {
  onVisit: () => void
}

// Компонент для блока с основной информацией
const MainInfoBlock = () => {
    const { elementRef, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    })

    return (
        <div 
            ref={elementRef}
            className={`${s.mainInfo} ${isVisible ? s.visible : ''}`}
        >
            <div className={s.photoContainer}>
                <img src="https://s3.iimg.su/s/14/g6cYFchxgKL31U8AgnJ3acvOlkbTmEsL9pzDa8rj.jpg" alt="VARDOZZ" className={s.photo} />
                <div className={s.nameText} style={{color: 'white'}}>ВЛАДИСЛАВ <br /> VARDOZZ</div>
            </div>
            <div className={s.stats}>
                <div className={s.stat}>
                    <span className={s.number}>17</span>
                    <span className={s.label}>лет</span>
                </div>
                <div className={s.stat}>
                    <span className={s.number}>$4К+</span>
                    <span className={s.label}>в месяц</span>
                </div>
            </div>
            <div className={s.artistsInfo}>
                <p className={s.workText}>Режиссер</p>
                <p className={s.artistsText}>монтажа, моушн-дизайна</p>
            </div>
            <div className={s.artistsInfo}>
                <p className={s.workText}>Работал с</p>
                <p className={s.artistsText}>LOVV66, Heronwater, LovSosa, <br /> Casher Collection и другие</p>
            </div>
        </div>
    )
}

// Компонент для первой кнопки "ПОДРОБНЕЕ"
const FirstDetailsButtonBlock = () => {
    const { elementRef, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '0px 0px 100px 0px' // Увеличили область срабатывания
    })

    return (
        <div 
            ref={elementRef}
            className={`${s.buttonContainer} ${isVisible ? s.visible : ''}`}
        >
            <Button href="https://teletype.in/@panteleev_product/no_cut_no_glory" target="_blank" style={{ marginBottom: '2rem' }}>
                <p>ПОДРОБНЕЕ</p>
            </Button>
        </div>
    )
}

// Компонент для второй кнопки "ПОДРОБНЕЕ"
const SecondDetailsButtonBlock = () => {
    const { elementRef, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '0px 0px 200px 0px' // Увеличили область срабатывания снизу
    })

    return (
        <div 
            ref={elementRef}
            className={`${s.buttonContainer} ${isVisible ? s.visible : ''}`}
        >
            <Button href="https://teletype.in/@panteleev_product/no_cut_no_glory" target="_blank" style={{marginBottom: '1rem'}}>
                <p>ПОДРОБНЕЕ</p>
            </Button>
            <Button next href="/inside" style={{ marginBottom: '1rem', background: 'linear-gradient(45deg, rgb(10, 194, 1), rgb(2 2 2))' }}>
                        <p>ЧТО ВНУТРИ</p>
            </Button>
        </div>
    )
}



// Компонент для блока с информацией о Михаиле Пантелееве
const PanteleevInfoBlock = () => {
    const { elementRef, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    })

    return (
        <div 
            ref={elementRef}
            className={`${s.mainInfo} ${isVisible ? s.visible : ''}`}
        >
            <div className={s.photoContainer}>
                <img src="https://i.postimg.cc/XYHF0VYm/2025-08-16-173137978.png" alt="МИХАИЛ ПАНТЕЛЕЕВ" className={s.photo} />
                <div className={s.nameText} style={{color: 'white'}}>МИХАИЛ <br /> ПАНТЕЛЕЕВ</div>
            </div>
            <div className={s.stats}>
                <div className={s.stat}>
                    <span className={s.number}>20</span>
                    <span className={s.label}>лет</span>
                </div>
                <div className={s.stat}>
                    <span className={s.number}>$5K+</span>
                    <span className={s.label}>в месяц</span>
                </div>
            </div>
            <div className={s.artistsInfo}>
                
                <p className={s.artistsText}><span style={{color: 'white', fontWeight: 'initial', fontSize: '1.1rem'}}>Директор</span> <br /> крупнейшего <br /> видеопродакшена СПб</p>
                <p className={s.artistsText} style={{marginTop: '0.8rem'}}><span style={{color: 'white', fontWeight: 'initial', fontSize: '1.1rem'}}>Руководитель</span> <br /> масштабных медиа проектов</p>
            </div>
        </div>
    )
}

export const About = ({ onVisit }: AboutProps) => {
    const [showContent, setShowContent] = useState(false)
    const [hideTitle, setHideTitle] = useState(false)
    const [titleFadeOut, setTitleFadeOut] = useState(false)

    useEffect(() => {
        // Отмечаем раздел как посещенный
        onVisit()
    }, [onVisit])

    // Используем хук для безопасной работы с кнопкой "назад"
    useTelegramBackButton('/')

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
        <div className={s.simonContent}>
            {!hideTitle && (
                <h2 className={titleFadeOut ? s.fadeOut : ''} style={{height: '58vh'}}>ПРЕПОДАВАТЕЛИ NCNG</h2>
            )}
            {showContent && (
                <>
                    <div className={`${s.content} ${s.fadeIn}`}>
                        <MainInfoBlock />
                        <img src="https://i.postimg.cc/SRW5wYS6/2025-08-16-172158328.png" alt="VARDOZZ" style={{width: '100%', maxWidth: '400px', height: 'auto', display: 'block', margin: '1rem auto', borderRadius: '8px'}} />
                        <img src="https://i.postimg.cc/nL0WxtfW/2025-08-16-171947484.png" alt="VARDOZZ" style={{width: '100%', maxWidth: '400px', height: 'auto', display: 'block', margin: '1rem auto', borderRadius: '8px'}} />
                    </div>
                    <FirstDetailsButtonBlock />

                    <div className={`${s.content} ${s.fadeIn}`}>
                        <PanteleevInfoBlock />
                        <img src="https://i.postimg.cc/pLThCgJZ/2025-08-16-173247965.png" alt="МИХАИЛ ПАНТЕЛЕЕВ" style={{width: '100%', maxWidth: '400px', height: 'auto', display: 'block', margin: '1rem auto', borderRadius: '8px'}} />
                        <img src="https://i.postimg.cc/zG6Bj3Bz/2025-08-16-173303111.png" alt="МИХАИЛ ПАНТЕЛЕЕВ" style={{width: '100%', maxWidth: '400px', height: 'auto', display: 'block', margin: '1rem auto', borderRadius: '8px'}} />
                    </div>
                    <SecondDetailsButtonBlock />
                    {/* Дополнительный отступ для корректной работы intersection observer */}
                    <div style={{ height: '100px' }}></div>
                </>
            )}
        </div>
    )
} 