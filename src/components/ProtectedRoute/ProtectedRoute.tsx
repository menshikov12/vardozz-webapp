import React from 'react';
import { useAdminCheck } from '../../hooks/useAdminCheck';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = true 
}) => {
  const { isAdmin, currentUserId, adminIds, loading } = useAdminCheck();

  // Если пользователь админ (по ID или по роли), показываем контент
  if (isAdmin) {
    return <>{children}</>;
  }
  
  // Если еще загружается, не показываем ничего (Loading показывается в App)
  if (loading) {
    return null;
  }
  
  // Если загрузка завершена и пользователь НЕ админ
  if (adminOnly && !isAdmin) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        padding: '20px',
        textAlign: 'center',
        color: '#fff',
        backgroundColor: '#1e1e1e',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2 style={{ color: '#ff4444', marginBottom: '16px' }}>
          🚫 Доступ запрещен
        </h2>
        <p style={{ marginBottom: '12px', fontSize: '16px' }}>
          У вас нет прав для доступа к этой странице.
        </p>
        <p style={{ marginBottom: '20px', color: '#aaa' }}>
          Только администраторы могут просматривать это содержимое.
        </p>
        {currentUserId && (
          <div style={{ 
            backgroundColor: '#2a2a2a', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>Ваш Telegram ID:</strong> {currentUserId}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Необходимые ID для доступа:</strong> {adminIds.join(', ')}
            </p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
