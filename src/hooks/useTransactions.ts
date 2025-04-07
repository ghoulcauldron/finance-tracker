// src/hooks/useTransactions.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Transaction } from '@/types/finance';

interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  category?: string;
  isJoint?: boolean;
}

export function useTransactions(initialFilters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});

  const loadTransactions = async () => {
    try {
      const data = await api.transactions.list(filters);
      setTransactions(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      const newTransaction = await api.transactions.create(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create transaction');
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const updatedTransaction = await api.transactions.update(id, updates);
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        )
      );
      return updatedTransaction;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update transaction');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await api.transactions.delete(id);
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete transaction');
      throw error;
    }
  };

  const reconcileTransaction = async (id: string, isVerified: boolean, notes?: string) => {
    try {
      await api.transactions.reconcile(id, isVerified, notes);
      // Optionally update local state if needed
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reconcile transaction');
      throw error;
    }
  };

  return {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    reconcileTransaction,
    refresh: loadTransactions,
  };
}