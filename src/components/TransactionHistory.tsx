'use client'

import React from 'react';
import { Clock, ArrowUpDown } from 'lucide-react';
import type { Transaction } from '@/types/finance';

interface TransactionHistoryProps {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transaction,
  onClose
}): React.ReactElement => {
  const sortedHistory = [...transaction.editHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatValue = (value: any): string => {
    if (typeof value === 'number') return value.toFixed(2);
    if (value === null || value === undefined) return 'N/A';
    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock size={20} />
            Transaction History
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">Current Values</h3>
          <div className="grid grid-cols-2 gap-2">
            <p>Amount: ${transaction.amount.toFixed(2)}</p>
            <p>Type: {transaction.type}</p>
            <p>Category: {transaction.category}</p>
            <p>Description: {transaction.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          {sortedHistory.map((edit) => (
            <div 
              key={edit.id} 
              className="border-l-4 border-blue-500 pl-4 py-2"
            >
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Clock size={14} />
                {new Date(edit.date).toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{edit.field}:</span>
                <span className="text-red-500">
                  {formatValue(edit.oldValue)}
                </span>
                <ArrowUpDown size={14} className="text-gray-400" />
                <span className="text-green-500">
                  {formatValue(edit.newValue)}
                </span>
              </div>
            </div>
          ))}

          {sortedHistory.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No edit history available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;