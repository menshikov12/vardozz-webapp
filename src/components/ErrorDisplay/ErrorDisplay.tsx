import React from 'react';

interface ErrorDisplayProps {
  title: string;
  errors: string[];
  debugInfo?: any;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  title, 
  errors, 
  debugInfo, 
  onRetry 
}) => {
  return (
    <div style={{
      backgroundColor: '#ffe6e6',
      border: '1px solid #ff9999',
      borderRadius: '8px',
      padding: '15px',
      margin: '10px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h3 style={{ 
        color: '#cc0000', 
        margin: '0 0 10px 0',
        fontSize: '14px'
      }}>
        🚨 {title}
      </h3>
      
      {errors.map((error, index) => (
        <div key={index} style={{
          backgroundColor: '#ffcccc',
          padding: '8px',
          margin: '5px 0',
          borderRadius: '4px',
          borderLeft: '4px solid #cc0000'
        }}>
          {error}
        </div>
      ))}
      
      {debugInfo && (
        <details style={{ marginTop: '10px' }}>
          <summary style={{ 
            cursor: 'pointer', 
            color: '#666',
            fontSize: '11px'
          }}>
            🔍 Debug Info (click to expand)
          </summary>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            margin: '5px 0',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '200px',
            fontSize: '10px'
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      )}
      
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            backgroundColor: '#cc0000',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          🔄 Retry
        </button>
      )}
    </div>
  );
};
