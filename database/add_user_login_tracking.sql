-- Миграция для добавления отслеживания входов пользователей
-- Добавляем поля для отслеживания первого входа и последнего захода

-- Добавляем новые колонки в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Создаем индексы для оптимизации запросов по датам
CREATE INDEX IF NOT EXISTS idx_users_first_login_at ON users(first_login_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- Создаем функцию для обновления времени последнего входа
CREATE OR REPLACE FUNCTION update_user_last_login(user_telegram_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET 
        last_login_at = NOW(),
        -- Устанавливаем first_login_at только если он еще не установлен
        first_login_at = COALESCE(first_login_at, NOW()),
        updated_at = NOW()
    WHERE telegram_id = user_telegram_id;
END;
$$ LANGUAGE plpgsql;

-- Создаем функцию для инициализации времени первого входа для существующих пользователей
CREATE OR REPLACE FUNCTION initialize_existing_users_login_times()
RETURNS VOID AS $$
BEGIN
    -- Для существующих пользователей устанавливаем first_login_at равным created_at
    -- и last_login_at равным updated_at (или created_at если updated_at не установлен)
    UPDATE users 
    SET 
        first_login_at = COALESCE(first_login_at, created_at),
        last_login_at = COALESCE(last_login_at, GREATEST(updated_at, created_at))
    WHERE first_login_at IS NULL OR last_login_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Выполняем инициализацию для существующих пользователей
SELECT initialize_existing_users_login_times();

-- Создаем триггер для автоматического обновления first_login_at при создании нового пользователя
CREATE OR REPLACE FUNCTION set_first_login_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- При создании нового пользователя устанавливаем first_login_at и last_login_at
    NEW.first_login_at = COALESCE(NEW.first_login_at, NOW());
    NEW.last_login_at = COALESCE(NEW.last_login_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер на INSERT для таблицы users
DROP TRIGGER IF EXISTS trigger_set_first_login_on_insert ON users;
CREATE TRIGGER trigger_set_first_login_on_insert
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_first_login_on_insert();

-- Комментарии к новым полям
COMMENT ON COLUMN users.first_login_at IS 'Дата и время первой авторизации пользователя в приложении';
COMMENT ON COLUMN users.last_login_at IS 'Дата и время последнего захода пользователя в приложение';

-- Создаем представление для удобного просмотра статистики пользователей
CREATE OR REPLACE VIEW user_activity_stats AS
SELECT 
    u.id,
    u.telegram_id,
    u.username,
    u.first_name,
    u.last_name,
    u.first_login_at,
    u.last_login_at,
    u.created_at,
    u.updated_at,
    r.name as role_name,
    -- Вычисляем количество дней с первого входа
    CASE 
        WHEN u.first_login_at IS NOT NULL 
        THEN EXTRACT(DAY FROM (NOW() - u.first_login_at))::INTEGER 
        ELSE NULL 
    END as days_since_first_login,
    -- Вычисляем количество дней с последнего входа
    CASE 
        WHEN u.last_login_at IS NOT NULL 
        THEN EXTRACT(DAY FROM (NOW() - u.last_login_at))::INTEGER 
        ELSE NULL 
    END as days_since_last_login,
    -- Определяем активность пользователя
    CASE 
        WHEN u.last_login_at IS NULL THEN 'never_logged_in'
        WHEN u.last_login_at >= NOW() - INTERVAL '1 day' THEN 'active_today'
        WHEN u.last_login_at >= NOW() - INTERVAL '7 days' THEN 'active_week'
        WHEN u.last_login_at >= NOW() - INTERVAL '30 days' THEN 'active_month'
        ELSE 'inactive'
    END as activity_status
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY u.last_login_at DESC NULLS LAST;

-- Комментарий к представлению
COMMENT ON VIEW user_activity_stats IS 'Представление для просмотра статистики активности пользователей';

-- Создаем функцию для получения статистики активности
CREATE OR REPLACE FUNCTION get_user_activity_summary()
RETURNS TABLE(
    total_users BIGINT,
    users_with_first_login BIGINT,
    active_today BIGINT,
    active_week BIGINT,
    active_month BIGINT,
    inactive_users BIGINT,
    never_logged_in BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_users,
        COUNT(u.first_login_at)::BIGINT as users_with_first_login,
        COUNT(CASE WHEN u.last_login_at >= NOW() - INTERVAL '1 day' THEN 1 END)::BIGINT as active_today,
        COUNT(CASE WHEN u.last_login_at >= NOW() - INTERVAL '7 days' THEN 1 END)::BIGINT as active_week,
        COUNT(CASE WHEN u.last_login_at >= NOW() - INTERVAL '30 days' THEN 1 END)::BIGINT as active_month,
        COUNT(CASE WHEN u.last_login_at < NOW() - INTERVAL '30 days' THEN 1 END)::BIGINT as inactive_users,
        COUNT(CASE WHEN u.last_login_at IS NULL THEN 1 END)::BIGINT as never_logged_in
    FROM users u;
END;
$$ LANGUAGE plpgsql;

-- Создаем политики RLS для новых полей (если RLS включен)
-- Разрешаем всем пользователям читать свои данные о входах
-- Разрешаем админам читать данные всех пользователей

-- Примечание: Политики RLS будут работать только если они уже настроены для таблицы users
-- Если RLS не используется, эти команды можно пропустить

-- Обновляем существующие политики или создаем новые для поддержки новых полей
-- (Конкретные политики зависят от текущей настройки RLS в проекте)

-- Выводим информацию о выполненной миграции
DO $$
BEGIN
    RAISE NOTICE 'Миграция завершена успешно!';
    RAISE NOTICE 'Добавлены поля: first_login_at, last_login_at';
    RAISE NOTICE 'Созданы функции: update_user_last_login, initialize_existing_users_login_times';
    RAISE NOTICE 'Создано представление: user_activity_stats';
    RAISE NOTICE 'Создана функция статистики: get_user_activity_summary';
END $$;