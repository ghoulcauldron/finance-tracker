'use client'

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  persistent?: boolean;
}

const ErrorAlert = ({ 
  message, 
  onDismiss,
  persistent = false
}: ErrorAlertProps): React.ReactElement | null => {  // Changed return type here
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (!persistent) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [persistent, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={() => {
              setIsVisible(false);
              onDismiss();
            }}
            className="ml-auto pl-3"
          >
            <X className="h-5 w-5 text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;