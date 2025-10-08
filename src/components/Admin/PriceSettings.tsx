import React, { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useTariffPrices, type TariffPrice } from '../../hooks/useTariffPrices';
import { showBackButton, hideBackButton, finalUser as telegramUser } from '../../shared/lib/telegram';
import type { AppSetting } from '../../types/api';
import styles from './Admin.module.scss';
import { useNavigate } from 'react-router-dom';

const PriceSettings: React.FC = () => {
  const { settings, loading, error, updateSetting } = useSettings();
  const { prices, loading: pricesLoading, error: pricesError, updatePrices } = useTariffPrices();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [editingPrice, setEditingPrice] = useState<TariffPrice | null>(null);
  const [editPriceData, setEditPriceData] = useState<Partial<TariffPrice>>({});
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const navigate = useNavigate();

  const handleEdit = (setting: AppSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setting: AppSetting) => {
    let value = e.target.value;
    
    // Специальная обработка для поля цены - только цифры, точки и запятые
    if (setting.key === 'tariff_price') {
      // Убираем все символы кроме цифр, точек и запятых
      value = value.replace(/[^\d.,]/g, '');
      
      // Ограничиваем длину до 20 символов
      if (value.length > 20) {
        value = value.slice(0, 20);
      }
    }
    
    setEditValue(value);
  };

  useEffect(() => {
    showBackButton(() => {
      navigate('/admin');
      hideBackButton();
    });
    
    return () => {
      hideBackButton();
    };
  }, [navigate]);

  const handleSave = async (key: string) => {
    if (!telegramUser?.id) return;
    
    setUpdating(true);
    const success = await updateSetting(key, editValue, telegramUser.id);
    setUpdating(false);
    
    if (success) {
      setEditingKey(null);
      setEditValue('');
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  // Функции для работы с ценами тарифов
  const handleEditPrice = (price: TariffPrice) => {
    setEditingPrice(price);
    setEditPriceData({
      title: price.title,
      price: price.price,
      original_price: price.original_price,
      description: price.description || ''
    });
  };

  const handlePriceInputChange = (field: keyof TariffPrice, value: string) => {
    setEditPriceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePrice = async () => {
    if (!telegramUser?.id || !editingPrice) return;
    
    // Валидация данных
    if (!editPriceData.title?.trim()) {
      alert('Название тарифа не может быть пустым');
      return;
    }
    
    if (!editPriceData.price?.trim()) {
      alert('Цена не может быть пустой');
      return;
    }
    
    if (!editPriceData.original_price?.trim()) {
      alert('Оригинальная цена не может быть пустой');
      return;
    }
    
    setUpdatingPrices(true);
    
    // Создаем обновленный массив цен
    const updatedPrices = prices.map(price => 
      price.id === editingPrice.id 
        ? { ...price, ...editPriceData }
        : price
    );
    
    const success = await updatePrices(updatedPrices, telegramUser.id);
    setUpdatingPrices(false);
    
    if (success) {
      setEditingPrice(null);
      setEditPriceData({});
    } else {
      alert('Ошибка при сохранении. Попробуйте еще раз.');
    }
  };

  const handleCancelPrice = () => {
    setEditingPrice(null);
    setEditPriceData({});
  };

  if (loading || pricesLoading) {
    return <div className={styles.loading}>Загрузка настроек...</div>;
  }

  if (error || pricesError) {
    return (
      <div className={styles.error}>
        <h4>Ошибка загрузки настроек:</h4>
        <p>{error || pricesError}</p>
        <button 
          onClick={() => window.location.reload()} 
          className={styles.actionButton}
          style={{ marginTop: '1rem' }}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>УПРАВЛЕНИЕ ЦЕНАМИ ТАРИФОВ</h3>
      
      {/* Секция для старых настроек (если есть) */}
      {settings.filter(setting => setting.key === 'tariff_price').length > 0 && (
        <>
          <div className={styles.settingsList}>
            {settings.filter(setting => setting.key === 'tariff_price').map((setting) => (
              <div key={setting.key} className={`${styles.settingItem} ${styles.dateSetting} ${editingKey === setting.key ? styles.editing : ''}`}>
                <div className={styles.settingInfo}>
                  <div className={`${styles.settingKey} ${styles.dateKey}`}>
                    Цена (только число)
                  </div>
                  <div className={styles.settingValue}>
                    {editingKey === setting.key ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => handleInputChange(e, setting)}
                        className={styles.editInput}
                        placeholder="Например: 15.970"
                        maxLength={20}
                      />
                    ) : (
                      <span className={`${styles.valueText} ${styles.dateValue}`}>{setting.value}</span>
                    )}
                  </div>
                </div>
                
                <div className={styles.settingActions}>
                  {editingKey === setting.key ? (
                    <>
                      <button
                        onClick={() => handleSave(setting.key)}
                        disabled={updating}
                        className={`${styles.actionButton} ${styles.saveButton}`}
                      >
                        {updating ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={updating}
                        className={`${styles.actionButton} ${styles.cancelButton}`}
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEdit(setting)}
                      className={`${styles.actionButton} ${styles.editButton}`}
                    >
                      Изменить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Секция для новых цен тарифов */}
      <h4 className={styles.subsectionTitle}>Цены тарифов</h4>
      <div className={styles.settingsList}>
        {prices.map((price) => (
          <div key={price.id} className={`${styles.settingItem} ${styles.dateSetting} ${editingPrice?.id === price.id ? styles.editing : ''}`}>
            <div className={styles.settingInfo}>
              <div className={`${styles.settingKey} ${styles.dateKey}`}>
                {price.title}
              </div>
              <div className={styles.settingValue}>
                {editingPrice?.id === price.id ? (
                  <div className={styles.priceEditForm}>
                    <input
                      type="text"
                      value={editPriceData.title || ''}
                      onChange={(e) => handlePriceInputChange('title', e.target.value)}
                      className={styles.editInput}
                      placeholder="Название тарифа"
                      style={{ marginBottom: '8px' }}
                    />
                    <input
                      type="text"
                      value={editPriceData.price || ''}
                      onChange={(e) => handlePriceInputChange('price', e.target.value)}
                      className={styles.editInput}
                      placeholder="Цена (например: 15 т.р/мес)"
                      style={{ marginBottom: '8px' }}
                    />
                    <input
                      type="text"
                      value={editPriceData.original_price || ''}
                      onChange={(e) => handlePriceInputChange('original_price', e.target.value)}
                      className={styles.editInput}
                      placeholder="Оригинальная цена (например: 19 000₽/мес)"
                      style={{ marginBottom: '8px' }}
                    />
                    <textarea
                      value={editPriceData.description || ''}
                      onChange={(e) => handlePriceInputChange('description', e.target.value)}
                      className={styles.editInput}
                      placeholder="Описание тарифа"
                      rows={3}
                    />
                  </div>
                ) : (
                  <div className={styles.priceDisplay}>
                    <div><strong>Цена:</strong> {price.price}</div>
                    <div><strong>Оригинальная цена:</strong> {price.original_price}</div>
                    {price.description && <div><strong>Описание:</strong> {price.description}</div>}
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.settingActions}>
              {editingPrice?.id === price.id ? (
                <>
                  <button
                    onClick={handleSavePrice}
                    disabled={updatingPrices}
                    className={`${styles.actionButton} ${styles.saveButton}`}
                  >
                    {updatingPrices ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={handleCancelPrice}
                    disabled={updatingPrices}
                    className={`${styles.actionButton} ${styles.cancelButton}`}
                  >
                    Отмена
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleEditPrice(price)}
                  className={`${styles.actionButton} ${styles.editButton}`}
                >
                  Изменить
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {prices.length === 0 && (
        <div className={styles.noSettings}>
          Цены тарифов не найдены. Обратитесь к администратору для создания цен.
        </div>
      )}
    </div>
  );
};

export default PriceSettings;
