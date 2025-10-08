declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                ready(): void
                close(): void
                expand(): void
                openLink(url: string): void
                isExpanded: boolean
                viewportHeight: number
                viewportStableHeight: number
                headerColor: string
                backgroundColor: string
                platform: 'android' | 'ios' | 'web' | 'macos' | 'tdesktop' | 'weba' | 'unigram' | 'unknown'
                initDataUnsafe?: {
                    user?: {
                        id: number
                        is_bot?: boolean
                        first_name?: string
                        last_name?: string
                        username?: string
                        language_code?: string
                        // Примечание: Telegram Web App API НЕ предоставляет photo_url
                        // Для получения аватарки нужно использовать Telegram Bot API
                    }
                }
                BackButton: {
                    isVisible: boolean
                    show(): void
                    hide(): void
                    onClick(callback: () => void): void
                    offClick(callback: () => void): void
                }
                MainButton: {
                    text: string
                    color: string
                    textColor: string
                    isVisible: boolean
                    isProgressVisible: boolean
                    isActive: boolean
                    show(): void
                    hide(): void
                    enable(): void
                    disable(): void
                    showProgress(leaveActive?: boolean): void
                    hideProgress(): void
                    onClick(callback: () => void): void
                    offClick(callback: () => void): void
                }
                HapticFeedback: {
                    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
                    notificationOccurred(type: 'error' | 'success' | 'warning'): void
                    selectionChanged(): void
                }
                themeParams: {
                    bg_color?: string
                    text_color?: string
                    hint_color?: string
                    link_color?: string
                    button_color?: string
                    button_text_color?: string
                }
                colorScheme: 'light' | 'dark'
                themeParams: {
                    bg_color?: string
                    text_color?: string
                    hint_color?: string
                    link_color?: string
                    button_color?: string
                    button_text_color?: string
                }
            }
        }
    }
}

export {} 