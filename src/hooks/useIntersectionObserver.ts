import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
    threshold?: number
    rootMargin?: string
}

export const useIntersectionObserver = (options: UseIntersectionObserverOptions = {}) => {
    const [isVisible, setIsVisible] = useState(false)
    const elementRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const element = elementRef.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    // Отключаем наблюдение после первого появления
                    observer.unobserve(element)
                }
            },
            {
                threshold: options.threshold || 0.1,
                rootMargin: options.rootMargin || '0px 0px -50px 0px'
            }
        )

        observer.observe(element)

        return () => {
            observer.unobserve(element)
        }
    }, [options.threshold, options.rootMargin])

    return { elementRef, isVisible }
} 