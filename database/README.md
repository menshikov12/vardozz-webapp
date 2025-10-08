# Миграции базы данных

## Добавление отслеживания входов пользователей

### Описание
Миграция `add_user_login_tracking.sql` добавляет функциональность отслеживания первого входа и последнего захода пользователей в приложение.

### Что добавляется:

1. **Новые поля в таблице `users`:**
   - `first_login_at` - дата и время первой авторизации пользователя
   - `last_login_at` - дата и время последнего захода пользователя

2. **Функции:**
   - `update_user_last_login(user_telegram_id)` - обновляет время последнего входа
   - `initialize_existing_users_login_times()` - инициализирует даты для существующих пользователей
   - `set_first_login_on_insert()` - триггерная функция для новых пользователей

3. **Представления:**
   - `user_activity_stats` - удобное представление для просмотра статистики активности
   - `get_user_activity_summary()` - функция для получения сводной статистики

4. **Триггеры:**
   - Автоматическая установка `first_login_at` и `last_login_at` при создании пользователя

### Применение миграции:

#### Для Supabase:
1. Откройте SQL Editor в панели Supabase
2. Скопируйте содержимое файла `add_user_login_tracking.sql`
3. Выполните SQL запрос
4. Проверьте, что миграция выполнилась успешно

#### Для PostgreSQL:
```bash
psql -d your_database -f database/add_user_login_tracking.sql
```

### Проверка миграции:

После применения миграции выполните следующие запросы для проверки:

```sql
-- Проверяем, что поля добавлены
\d users

-- Проверяем функции
\df update_user_last_login
\df get_user_activity_summary

-- Проверяем представление
\d user_activity_stats

-- Тестируем статистику
SELECT * FROM get_user_activity_summary();

-- Проверяем данные пользователей
SELECT id, telegram_id, first_name, first_login_at, last_login_at 
FROM users 
ORDER BY last_login_at DESC NULLS LAST 
LIMIT 5;
```

### Откат миграции:

Если нужно откатить изменения:

```sql
-- Удаляем новые поля
ALTER TABLE users 
DROP COLUMN IF EXISTS first_login_at,
DROP COLUMN IF EXISTS last_login_at;

-- Удаляем функции
DROP FUNCTION IF EXISTS update_user_last_login(BIGINT);
DROP FUNCTION IF EXISTS initialize_existing_users_login_times();
DROP FUNCTION IF EXISTS set_first_login_on_insert();
DROP FUNCTION IF EXISTS get_user_activity_summary();

-- Удаляем представление
DROP VIEW IF EXISTS user_activity_stats;

-- Удаляем триггер
DROP TRIGGER IF EXISTS trigger_set_first_login_on_insert ON users;
```

### Использование в приложении:

После применения миграции серверная часть автоматически:
1. Обновляет `last_login_at` при каждом API запросе пользователя
2. Устанавливает `first_login_at` при первой регистрации
3. Возвращает эти поля в API ответах
4. Предоставляет статистику активности в админке

### Индексы:

Миграция создает индексы для оптимизации запросов:
- `idx_users_first_login_at` - для сортировки по дате первого входа
- `idx_users_last_login_at` - для сортировки по дате последнего входа

### Безопасность:

- Все новые функции используют существующие политики RLS
- Данные о входах доступны только администраторам через API
- Обычные пользователи видят только свои данные (если настроены соответствующие политики)