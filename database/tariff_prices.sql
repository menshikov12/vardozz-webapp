-- Создание таблицы для хранения цен тарифов
CREATE TABLE IF NOT EXISTS tariff_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tariff_key VARCHAR(50) UNIQUE NOT NULL,
    tariff_index INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    price VARCHAR(100) NOT NULL,
    original_price VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_tariff_prices_tariff_key ON tariff_prices(tariff_key);
CREATE INDEX IF NOT EXISTS idx_tariff_prices_tariff_index ON tariff_prices(tariff_index);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для автоматического обновления updated_at
CREATE TRIGGER update_tariff_prices_updated_at 
    BEFORE UPDATE ON tariff_prices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Вставка начальных данных для тарифов
INSERT INTO tariff_prices (tariff_key, tariff_index, title, price, original_price, description) VALUES
('individual', 0, 'ИНДИВИДУАЛЬНОЕ НАСТАВНИЧЕСТВО', '57 т.р/мес', '68 000₽/мес', 'Для тех, кто не хочет "разбираться сам", а хочет выстрелить быстро, с поддержкой и помощью на каждом этапе'),
('support', 1, 'ОБУЧЕНИЕ С ПОДДЕРЖКОЙ', '37 т.р/мес', '46 000₽/мес', 'Для тех, кому нужна персональная обратная связь и быстрый рост'),
('group', 2, 'ГРУППОВОЕ ОБУЧЕНИЕ', '15 т.р/мес', '19 000₽/мес', 'Отличный выбор, если хочешь войти в профессию без риска и убедиться, что это твое')
ON CONFLICT (tariff_key) DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Настройка RLS (Row Level Security) - разрешаем всем читать, только админам изменять
ALTER TABLE tariff_prices ENABLE ROW LEVEL SECURITY;

-- Политика для чтения - разрешаем всем
CREATE POLICY "Allow read access to tariff_prices" ON tariff_prices
    FOR SELECT USING (true);

-- Политика для изменения - только для админов (будет проверяться на уровне приложения)
CREATE POLICY "Allow admin to modify tariff_prices" ON tariff_prices
    FOR ALL USING (true);

-- Комментарии к таблице и полям
COMMENT ON TABLE tariff_prices IS 'Таблица для хранения цен и информации о тарифных планах';
COMMENT ON COLUMN tariff_prices.tariff_key IS 'Уникальный ключ тарифа (individual, support, group)';
COMMENT ON COLUMN tariff_prices.tariff_index IS 'Индекс тарифа для сортировки (0 - самый дорогой)';
COMMENT ON COLUMN tariff_prices.title IS 'Название тарифа';
COMMENT ON COLUMN tariff_prices.price IS 'Текущая цена тарифа';
COMMENT ON COLUMN tariff_prices.original_price IS 'Оригинальная цена тарифа (зачеркнутая)';
COMMENT ON COLUMN tariff_prices.description IS 'Описание тарифа';
