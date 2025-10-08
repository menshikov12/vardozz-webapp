import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export interface TariffPrice {
  id: string;
  tariff_key: string;
  tariff_index: number;
  title: string;
  price: string;
  original_price: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TariffPricesResponse {
  prices: TariffPrice[];
}

export const useTariffPrices = () => {
  const [prices, setPrices] = useState<TariffPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Запрашиваю цены тарифов...');
      const result = await api.get<TariffPricesResponse>('/tariff-prices');
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data) {
        console.log('✅ Цены тарифов загружены:', result.data.prices);
        setPrices(result.data.prices);
      } else {
        console.log('⚠️ Нет данных в ответе');
      }
    } catch (err) {
      console.error('❌ Ошибка при загрузке цен тарифов:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tariff prices');
    } finally {
      setLoading(false);
    }
  };

  const updatePrices = async (updatedPrices: TariffPrice[], telegramId: number): Promise<boolean> => {
    try {
      console.log('💾 Обновляю цены тарифов:', updatedPrices);
      
      const result = await api.put<{ success: boolean; prices: TariffPrice[] }>('/admin/tariff-prices', 
        { prices: updatedPrices }, 
        {
          'x-telegram-id': telegramId.toString(),
        }
      );
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Обновляем локальное состояние
      if (result.data?.prices) {
        setPrices(result.data.prices);
      }
      
      console.log('✅ Цены тарифов успешно обновлены');
      return true;
    } catch (err) {
      console.error('❌ Ошибка при обновлении цен тарифов:', err);
      setError(err instanceof Error ? err.message : 'Failed to update tariff prices');
      return false;
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return {
    prices,
    loading,
    error,
    fetchPrices,
    updatePrices,
  };
};
