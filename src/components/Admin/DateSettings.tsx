import React, { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { showBackButton, hideBackButton, finalUser as telegramUser } from '../../shared/lib/telegram';
import type { AppSetting } from '../../types/api';
import styles from './Admin.module.scss';
import { useNavigate } from 'react-router-dom';

const DateSettings: React.FC = () => {
  const { settings, loading, error, updateSetting } = useSettings();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const handleEdit = (setting: AppSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setting: AppSetting) => {
    let value = e.target.value;
    
    // Специальная обработка для поля даты
    if (setting.key === 'bonus_deadline') {
      // Убираем все символы кроме цифр и точек
      value = value.replace(/[^\d.]/g, '');
      
      // Ограничиваем длину до 5 символов (ДД.ММ)
      if (value.length > 5) {
        value = value.slice(0, 5);
      }
      
      // Автоматически добавляем точку после двух цифр
      if (value.length === 2 && !value.includes('.')) {
        value = value + '.';
      }
      
      // Проверяем формат ДД.ММ
      const datePattern = /^(\d{1,2})\.(\d{1,2})$/;
      if (value.length === 5 && !datePattern.test(value)) {
        // Если формат неправильный, не обновляем значение
        return;
      }
    }
    
    setEditValue(value);
  };

  const validateDateInput = (value: string): boolean => {
    if (value.length !== 5) return false;
    
    const datePattern = /^(\d{1,2})\.(\d{1,2})$/;
    const match = value.match(datePattern);
    
    if (!match) return false;
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    
    // Проверяем корректность дня и месяца
    if (day < 1 || day > 31 || month < 1 || month > 12) {
      return false;
    }
    
    return true;
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
    
    // Валидация для поля даты
    if (key === 'bonus_deadline' && editValue.length > 0 && !validateDateInput(editValue)) {
      alert('Пожалуйста, введите корректную дату в формате ДД.ММ (например: 02.09) или оставьте поле пустым');
      return;
    }
    
    // Валидация для текста бонуса
    if (key === 'bonus_text' && editValue.trim().length === 0) {
      alert('Текст бонуса не может быть пустым');
      return;
    }
    
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

  if (loading) {
    return <div className={styles.loading}>Загрузка настроек...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h4>Ошибка загрузки настроек:</h4>
        <p>{error}</p>
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
             <h3 className={styles.sectionTitle}>НАСТРОЙКИ БОНУСА</h3>
      

      
             <div className={styles.settingsList}>
         {settings.filter(setting => setting.key === 'bonus_deadline' || setting.key === 'bonus_text').map((setting) => (
           <div key={setting.key} className={`${styles.settingItem} ${setting.key === 'bonus_deadline' ? styles.dateSetting : styles.textSetting} ${editingKey === setting.key ? styles.editing : ''}`}>
                         <div className={styles.settingInfo}>
               <div className={`${styles.settingKey} ${setting.key === 'bonus_deadline' ? styles.dateKey : styles.textKey}`}>
                 {setting.key === 'bonus_deadline' ? 'Дата окончания бонуса' : 'Текст бонуса'}
               </div>
               <div className={styles.settingValue}>
                                                  {editingKey === setting.key ? (
                   setting.key === 'bonus_deadline' ? (
                     <input
                       type="text"
                       value={editValue}
                       onChange={(e) => handleInputChange(e, setting)}
                       className={styles.editInput}
                       placeholder="ДД.ММ (например: 02.09)"
                       maxLength={5}
                     />
                   ) : (
                     <textarea
                       value={editValue}
                       onChange={(e) => setEditValue(e.target.value)}
                       className={styles.editTextarea}
                       placeholder="Введите текст бонуса..."
                       rows={3}
                     />
                   )
                  ) : (
                   <span className={`${styles.valueText} ${setting.key === 'bonus_deadline' ? styles.dateValue : styles.textValue}`}>
                     {setting.value}
                   </span>
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
      
      {settings.length === 0 && (
        <div className={styles.noSettings}>
          Настройки не найдены
        </div>
      )}
    </div>
  );
};

export default DateSettings;
