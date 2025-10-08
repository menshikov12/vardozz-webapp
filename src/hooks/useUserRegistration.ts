import { useCallback } from 'react';
import { useApi } from './useApi';
import { finalUser as telegramUser } from '../shared/lib/telegram';
import type { CreateUserRequest, CreateUserResponse } from '../types/api';

export const useUserRegistration = () => {
  const api = useApi();

  const registerUser = useCallback(async () => {
    if (!telegramUser?.id) {
      return { error: 'No Telegram user data available' };
    }

    try {
      const registrationData: CreateUserRequest = {
        telegram_id: telegramUser.id,
        username: telegramUser.username || undefined,
        first_name: telegramUser.first_name || undefined,
        last_name: telegramUser.last_name || undefined,
        language_code: telegramUser.language_code || undefined,
      };

      // Регистрируем пользователя (сервер сам проверит, существует ли он)
      const result = await api.post<CreateUserResponse>('/users/register', registrationData);

      if (result.error) {
        console.error('❌ Registration failed:', result.error);
        return { error: result.error };
      }

      if (result.data?.isNew) {
        console.log('✅ New user registered');
      } else {
        console.log('👤 User already exists');
      }
      
      return { data: result.data };
    } catch (error) {
      console.error('💥 Registration error:', error);
      return { error: error instanceof Error ? error.message : 'Registration failed' };
    }
  }, [api]);

  return { registerUser };
};
