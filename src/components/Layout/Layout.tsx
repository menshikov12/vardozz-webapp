import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useScrollToTop, scrollToTop } from '../../hooks/useScrollToTop'
import s from './Layout.module.scss'

export const Layout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [isOverflowHidden, setIsOverflowHidden] = useState(false)
    
    useScrollToTop()

    // Список страниц, где нужно скрыть хедер
    const hideHeaderPaths = ['/tariff', '/inside', '/roadmap', '/ncng']
    const shouldHideHeader = hideHeaderPaths.includes(location.pathname)

    // Дополнительная прокрутка при изменении роута для iOS
    useEffect(() => {
        // Дополнительная задержка для iOS чтобы убедиться что компонент отрендерился
        const timer = setTimeout(() => {
            scrollToTop(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [location.pathname])

    useEffect(() => {
        const handleOverflowChange = (event: CustomEvent) => {
            setIsOverflowHidden(event.detail.hidden)
        }

        window.addEventListener('overflowChange', handleOverflowChange as EventListener)
        
        return () => {
            window.removeEventListener('overflowChange', handleOverflowChange as EventListener)
        }
    }, [])

    const handleTitleClick = () => {
        navigate('/')
    }

    return (
        <div className={s.layout}>
            {!shouldHideHeader && (
                <header className={s.header}>
                    <div className={s.titleContainer}>
                        <h1 
                            className={s.title}
                            onClick={handleTitleClick}
                            style={{ cursor: 'pointer' }}
                        >
                            NO CUT NO GLORY
                        </h1>
                        <div className={s.logoOverlay}>
                            <img 
                                src="https://i.postimg.cc/J7YW7szC/Comp-9-2025-08-23-03-08-37.png" 
                                alt="Logo" 
                                className={s.logo}
                            />
                        </div>
                    </div>
                </header>
            )}
            <main 
                className={s.main}
                style={{ overflow: isOverflowHidden ? 'hidden' : 'auto' }}
            >
                <Outlet />
            </main>
        </div>
    )
}