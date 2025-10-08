import type { ApiResponse } from '../types/api';

export const useApi = () => {
  const baseUrl = '/api';

  const get = async <T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      let responseData: any = null;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          // Если ответ не JSON, получаем как текст для отладки
          const textResponse = await response.text();
          console.error('Non-JSON response:', {
            status: response.status,
            contentType,
            url: response.url,
            text: textResponse.substring(0, 500) // Первые 500 символов для отладки
          });
          responseData = { 
            error: `Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 100)}...` 
          };
        }
      } catch (parseError) {
        console.error('Response parse error:', parseError);
        responseData = { 
          error: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` 
        };
      }

      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.details || `HTTP error! status: ${response.status}`;
        const fullErrorInfo = `${errorMessage}${responseData?.debug ? '\n\nDebug: ' + JSON.stringify(responseData.debug, null, 2) : ''}`;
        throw new Error(fullErrorInfo);
      }

      return { data: responseData };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error instanceof Error ? error.message : 'Произошла ошибка' };
    }
  };

  const post = async <T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
      });

      let responseData: any = null;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          // Если ответ не JSON, получаем как текст для отладки
          const textResponse = await response.text();
          console.error('Non-JSON response:', {
            status: response.status,
            contentType,
            url: response.url,
            text: textResponse.substring(0, 500) // Первые 500 символов для отладки
          });
          responseData = { 
            error: `Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 100)}...` 
          };
        }
      } catch (parseError) {
        console.error('Response parse error:', parseError);
        responseData = { 
          error: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` 
        };
      }

      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.details || `HTTP error! status: ${response.status}`;
        const fullErrorInfo = `${errorMessage}${responseData?.debug ? '\n\nDebug: ' + JSON.stringify(responseData.debug, null, 2) : ''}`;
        throw new Error(fullErrorInfo);
      }

      return { data: responseData };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error instanceof Error ? error.message : 'Произошла ошибка' };
    }
  };

  const del = async <T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      let responseData: any = null;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          // Если ответ не JSON, получаем как текст для отладки
          const textResponse = await response.text();
          console.error('Non-JSON response:', {
            status: response.status,
            contentType,
            url: response.url,
            text: textResponse.substring(0, 500) // Первые 500 символов для отладки
          });
          responseData = { 
            error: `Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 100)}...` 
          };
        }
      } catch (parseError) {
        console.error('Response parse error:', parseError);
        responseData = { 
          error: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` 
        };
      }

      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.details || `HTTP error! status: ${response.status}`;
        const fullErrorInfo = `${errorMessage}${responseData?.debug ? '\n\nDebug: ' + JSON.stringify(responseData.debug, null, 2) : ''}`;
        throw new Error(fullErrorInfo);
      }

      return { data: responseData };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error instanceof Error ? error.message : 'Произошла ошибка' };
    }
  };

  const patch = async <T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
      });

      let responseData: any = null;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          // Если ответ не JSON, получаем как текст для отладки
          const textResponse = await response.text();
          console.error('Non-JSON response:', {
            status: response.status,
            contentType,
            url: response.url,
            text: textResponse.substring(0, 500) // Первые 500 символов для отладки
          });
          responseData = { 
            error: `Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 100)}...` 
          };
        }
      } catch (parseError) {
        console.error('Response parse error:', parseError);
        responseData = { 
          error: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` 
        };
      }

      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.details || `HTTP error! status: ${response.status}`;
        const fullErrorInfo = `${errorMessage}${responseData?.debug ? '\n\nDebug: ' + JSON.stringify(responseData.debug, null, 2) : ''}`;
        throw new Error(fullErrorInfo);
      }

      return { data: responseData };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error instanceof Error ? error.message : 'Произошла ошибка' };
    }
  };

  const put = async <T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
      });

      let responseData: any = null;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          // Если ответ не JSON, получаем как текст для отладки
          const textResponse = await response.text();
          console.error('Non-JSON response:', {
            status: response.status,
            contentType,
            url: response.url,
            text: textResponse.substring(0, 500) // Первые 500 символов для отладки
          });
          responseData = { 
            error: `Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 100)}...` 
          };
        }
      } catch (parseError) {
        console.error('Response parse error:', parseError);
        responseData = { 
          error: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` 
        };
      }

      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.details || `HTTP error! status: ${response.status}`;
        const fullErrorInfo = `${errorMessage}${responseData?.debug ? '\n\nDebug: ' + JSON.stringify(responseData.debug, null, 2) : ''}`;
        throw new Error(fullErrorInfo);
      }

      return { data: responseData };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error instanceof Error ? error.message : 'Произошла ошибка' };
    }
  };

  return { get, post, delete: del, patch, put };
};
