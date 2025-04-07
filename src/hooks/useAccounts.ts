// src/hooks/useAccounts.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Account } from '@/types/finance';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      const data = await api.accounts.list();
      setAccounts(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const createAccount = async (account: Omit<Account, 'id' | 'created_at'>) => {
    try {
      const newAccount = await api.accounts.create(account);
      setAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create account');
      throw error;
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const updatedAccount = await api.accounts.update(id, updates);
      setAccounts(prev => 
        prev.map(account => 
          account.id === id ? updatedAccount : account
        )
      );
      return updatedAccount;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update account');
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await api.accounts.delete(id);
      setAccounts(prev => prev.filter(account => account.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete account');
      throw error;
    }
  };

  return {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    refresh: loadAccounts,
  };
}