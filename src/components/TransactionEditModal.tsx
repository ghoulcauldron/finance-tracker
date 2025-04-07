'use client'

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Transaction, Account } from '@/types/finance';

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    accounts: Account[];
    onSave: (updatedTransactions: Transaction[]) => void;  // Keep this as is
    isBulkEdit?: boolean;
  }

const TransactionEditModal = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  onSave,
  isBulkEdit = false
}: EditModalProps): React.ReactElement | null => {
  const [editedTransactions, setEditedTransactions] = useState<Transaction[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [bulkValue, setBulkValue] = useState<string>('');

  useEffect(() => {
    setEditedTransactions(transactions);
  }, [transactions]);

  if (!isOpen) return null;

  const handleSingleTransactionEdit = (
    index: number,
    field: keyof Transaction,
    value: any
  ) => {
    const newTransactions = [...editedTransactions];
    newTransactions[index] = {
      ...newTransactions[index],
      [field]: value,
      isEdited: true,
      editHistory: [
        ...(newTransactions[index].editHistory || []),
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          field,
          oldValue: newTransactions[index][field],
          newValue: value,
          editor: 'current_user' // Replace with actual user ID in production
        }
      ]
    };
    setEditedTransactions(newTransactions);
  };

  const handleBulkEdit = () => {
    if (!selectedField || !bulkValue) return;

    const newTransactions = editedTransactions.map(transaction => ({
      ...transaction,
      [selectedField]: bulkValue,
      isEdited: true,
      editHistory: [
        ...(transaction.editHistory || []),
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          field: selectedField,
          oldValue: transaction[selectedField as keyof Transaction],
          newValue: bulkValue,
          editor: 'current_user'
        }
      ]
    }));
    setEditedTransactions(newTransactions);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isBulkEdit ? 'Bulk Edit Transactions' : 'Edit Transaction'}
          </h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {isBulkEdit && (
          <div className="mb-4 space-y-4">
            <div className="flex gap-4">
              <select
                className="p-2 border rounded flex-1"
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
              >
                <option value="">Select field to edit</option>
                <option value="category">Category</option>
                <option value="type">Type</option>
                <option value="sourceAccount">Source Account</option>
                <option value="destinationAccount">Destination Account</option>
              </select>
              {selectedField && (
                <>
                  {selectedField === 'type' ? (
                    <select
                      className="p-2 border rounded flex-1"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                    >
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                      <option value="Reimbursement">Reimbursement</option>
                      <option value="Transfer">Transfer</option>
                    </select>
                  ) : selectedField.includes('Account') ? (
                    <select
                      className="p-2 border rounded flex-1"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                    >
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="p-2 border rounded flex-1"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                    />
                  )}
                  <button
                    onClick={handleBulkEdit}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Apply to All
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-left">From</th>
                <th className="p-2 text-left">To</th>
              </tr>
            </thead>
            <tbody>
              {editedTransactions.map((transaction, index) => (
                <tr key={transaction.id} className="border-b">
                  <td className="p-2">
                    <input
                      type="date"
                      value={transaction.date.split('T')[0]}
                      onChange={(e) => handleSingleTransactionEdit(
                        index,
                        'date',
                        e.target.value
                      )}
                      className="p-1 border rounded w-full"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={transaction.type}
                      onChange={(e) => handleSingleTransactionEdit(
                        index,
                        'type',
                        e.target.value
                      )}
                      className="p-1 border rounded w-full"
                    >
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                      <option value="Reimbursement">Reimbursement</option>
                      <option value="Transfer">Transfer</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={transaction.description}
                      onChange={(e) => handleSingleTransactionEdit(
                        index,
                        'description',
                        e.target.value
                      )}
                      className="p-1 border rounded w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={transaction.category}
                      onChange={(e) => handleSingleTransactionEdit(
                        index,
                        'category',
                        e.target.value
                      )}
                      className="p-1 border rounded w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={transaction.amount}
                      onChange={(e) => handleSingleTransactionEdit(
                        index,
                        'amount',
                        Number(e.target.value)
                      )}
                      className="p-1 border rounded w-full text-right"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={transaction.sourceAccount}
                      onChange={(e) => handleSingleTransactionEdit(
                        index,
                        'sourceAccount',
                        e.target.value
                      )}
                      className="p-1 border rounded w-full"
                    >
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={transaction.destinationAccount}
                      onChange={(e) => handleSingleTransactionEdit(
                        index,
                        'destinationAccount',
                        e.target.value
                      )}
                      className="p-1 border rounded w-full"
                    >
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(editedTransactions);
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionEditModal;