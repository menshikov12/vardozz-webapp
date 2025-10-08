// Кэш для ролей пользователей
interface UserRoleCache {
  [telegramId: string]: {
    role: string;
    timestamp: number;
    expiresAt: number;
  };
}

class UserRoleCacheManager {
  private cache: UserRoleCache = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 минут

  // Получить роль из кэша
  getRole(telegramId: string): string | null {
    const cached = this.cache[telegramId];
    
    if (!cached) {
      return null;
    }

    // Проверить, не истек ли кэш
    if (Date.now() > cached.expiresAt) {
      delete this.cache[telegramId];
      return null;
    }

    return cached.role;
  }

  // Сохранить роль в кэш
  setRole(telegramId: string, role: string): void {
    this.cache[telegramId] = {
      role,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    };
  }

  // Очистить кэш для конкретного пользователя
  clearRole(telegramId: string): void {
    delete this.cache[telegramId];
  }

  // Очистить весь кэш
  clearAll(): void {
    this.cache = {};
  }

  // Проверить, есть ли роль в кэше
  hasRole(telegramId: string): boolean {
    return this.getRole(telegramId) !== null;
  }
}

// Экспортируем единственный экземпляр
export const userRoleCache = new UserRoleCacheManager();
