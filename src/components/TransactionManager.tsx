'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Edit, Filter, ChevronDown, AlertCircle } from 'lucide-react';
import type { Transaction, Account } from '@/types/finance';
import TransactionEditModal from './TransactionEditModal';  // Add this import

interface TransactionManagerProps {
  transactions: Transaction[];
  accounts: Account[];
  onTransactionEdit: (updatedTransactions: Transaction[]) => void;
  onTransactionDelete: (id: string) => void;
  onBulkEdit: (updates: Partial<Transaction>[]) => void;
}

const TransactionManager = ({
  transactions,
  accounts,
  onTransactionEdit,
  onTransactionDelete,
  onBulkEdit
}: TransactionManagerProps): React.ReactElement => {
  const [viewLimit, setViewLimit] = useState<number>(10);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([]);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    sourceAccount: '',
    destinationAccount: ''
  });

  // Get unique categories and accounts for filters
  const categories = [...new Set(transactions.map(t => t.category))];
  const types = ['Income', 'Expense', 'Reimbursement', 'Transfer'];

  const filteredTransactions = transactions.filter(transaction => {
    return (
      (!filters.category || transaction.category === filters.category) &&
      (!filters.type || transaction.type === filters.type) &&
      (!filters.sourceAccount || transaction.sourceAccount === filters.sourceAccount) &&
      (!filters.destinationAccount || 
        transaction.destinationAccount === filters.destinationAccount)
    );
  });

  const displayedTransactions = filteredTransactions.slice(0, viewLimit);

  const handleSingleTransactionEdit = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setSelectedTransactions([transaction]);
      setIsBulkEdit(false);
      setShowEditModal(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Transactions</CardTitle>
          <div className="flex gap-2">
            <select
              className="p-2 border rounded"
              value={viewLimit}
              onChange={(e) => setViewLimit(Number(e.target.value))}
            >
              <option value={10}>10 entries</option>
              <option value={25}>25 entries</option>
              <option value={50}>50 entries</option>
              <option value={100}>100 entries</option>
            </select>
            <button
              className="flex items-center gap-1 p-2 border rounded"
              onClick={() => {
                setSelectedTransactions(displayedTransactions);
                setIsBulkEdit(true);
                setShowEditModal(true);
              }}
            >
              <Edit size={16} />
              Bulk Edit
            </button>
            <button
              className="flex items-center gap-1 p-2 border rounded"
              onClick={() => {/* Toggle filter panel */}}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Panel */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          <select
            className="p-2 border rounded"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            className="p-2 border rounded"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            className="p-2 border rounded"
            value={filters.sourceAccount}
            onChange={(e) => setFilters({ ...filters, sourceAccount: e.target.value })}
          >
            <option value="">All Source Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
          <select
            className="p-2 border rounded"
            value={filters.destinationAccount}
            onChange={(e) => 
              setFilters({ ...filters, destinationAccount: e.target.value })}
          >
            <option value="">All Destination Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </div>

        {/* Transactions Table */}
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
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedTransactions.map(transaction => (
                <tr key={transaction.id} className="border-b">
                  <td className="p-2">{transaction.date}</td>
                  <td className="p-2">{transaction.type}</td>
                  <td className="p-2">{transaction.description}</td>
                  <td className="p-2">{transaction.category}</td>
                  <td className="p-2 text-right font-mono">
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="p-2">
                    {accounts.find(a => a.id === transaction.sourceAccount)?.name}
                  </td>
                  <td className="p-2">
                    {accounts.find(a => a.id === transaction.destinationAccount)?.name}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleSingleTransactionEdit(transaction.id)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showEditModal && (
          <TransactionEditModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedTransactions([]);
              setIsBulkEdit(false);
            }}
            transactions={selectedTransactions}
            accounts={accounts}
            onSave={onTransactionEdit}
            isBulkEdit={isBulkEdit}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionManager;