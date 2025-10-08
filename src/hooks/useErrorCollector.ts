import { useState, useCallback } from 'react';

interface ErrorInfo {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  debugInfo?: any;
}

export const useErrorCollector = () => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const addError = useCallback((
    id: string, 
    title: string, 
    message: string, 
    debugInfo?: any
  ) => {
    const newError: ErrorInfo = {
      id,
      title,
      message,
      timestamp: new Date().toISOString(),
      debugInfo
    };
    
    setErrors(prev => [...prev, newError]);
    
    // Логируем в консоль для разработчиков
    console.error(`[${title}] ${message}`, debugInfo);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    addError,
    removeError,
    clearAllErrors
  };
};
