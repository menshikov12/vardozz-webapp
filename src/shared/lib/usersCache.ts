import type { User } from '../../types/api';

// Кэш для списка пользователей
interface UsersCache {
  users: User[];
  timestamp: number;
  expiresAt: number;
}

class UsersCacheManager {
  private cache: UsersCache | null = null;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 минут

  // Получить пользователей из кэша
  getUsers(): User[] | null {
    if (!this.cache) {
      return null;
    }

    // Проверить, не истек ли кэш
    if (Date.now() > this.cache.expiresAt) {
      this.cache = null;
      return null;
    }

    return this.cache.users;
  }

  // Сохранить пользователей в кэш
  setUsers(users: User[]): void {
    this.cache = {
      users: [...users], // Создаем копию массива
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    };
  }

  // Очистить кэш
  clear(): void {
    this.cache = null;
  }

  // Проверить, есть ли пользователи в кэше
  hasUsers(): boolean {
    return this.getUsers() !== null;
  }

  // Обновить конкретного пользователя в кэше
  updateUser(updatedUser: User): void {
    if (!this.cache) {
      return;
    }

    const userIndex = this.cache.users.findIndex(user => user.id === updatedUser.id);
    if (userIndex !== -1) {
      this.cache.users[userIndex] = { ...updatedUser };
    }
  }

  // Получить время последнего обновления кэша
  getLastUpdateTime(): number | null {
    return this.cache?.timestamp || null;
  }

  // Получить оставшееся время до истечения кэша в секундах
  getTimeToExpire(): number {
    if (!this.cache) {
      return 0;
    }
    
    const remaining = Math.max(0, this.cache.expiresAt - Date.now());
    return Math.floor(remaining / 1000);
  }
}

// Экспортируем единственный экземпляр
export const usersCache = new UsersCacheManager();