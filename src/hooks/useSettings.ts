import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import type { AppSetting, AppSettingsResponse } from '../types/api';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Запрашиваю настройки...');
      const result = await api.get<AppSettingsResponse>('/settings');
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data) {
        console.log('✅ Настройки загружены:', result.data.settings);
        setSettings(result.data.settings);
      } else {
        console.log('⚠️ Нет данных в ответе');
      }
    } catch (err) {
      console.error('❌ Ошибка при загрузке настроек:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string, telegramId: number): Promise<boolean> => {
    try {
      console.log('💾 Обновляю настройку:', key, '=', value);
      
      // Используем PUT метод для обновления настроек
      const result = await api.put<{ success: boolean }>(`/settings/${key}`, { value }, {
        'x-telegram-id': telegramId.toString(),
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Обновляем локальное состояние
      setSettings(prev => 
        prev.map(setting => 
          setting.key === key 
            ? { ...setting, value, updated_at: new Date().toISOString() }
            : setting
        )
      );
      
      console.log('✅ Настройка успешно обновлена');
      return true;
    } catch (err) {
      console.error('❌ Ошибка при обновлении настройки:', err);
      setError(err instanceof Error ? err.message : 'Failed to update setting');
      return false;
    }
  };

  const getSettingValue = (key: string): string | null => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : null;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSetting,
    getSettingValue,
  };
};
