import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'

// Инициализируем полифилл для плавной прокрутки на iOS
try {
  const smoothscroll = require('smoothscroll-polyfill')
  smoothscroll.polyfill()
} catch (error) {
  console.log('Smoothscroll polyfill not available, using custom implementation')
}

createRoot(document.getElementById('root')!).render(
    <App />
)
