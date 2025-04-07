'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Upload, 
  RefreshCcw, 
  Edit, 
  Trash2, 
  Calculator, 
  AlertTriangle 
} from 'lucide-react';
import InitializationWizard from './InitializationWizard';
import ErrorAlert from '@/components/ErrorAlert';
import AccountForm from './AccountForm';
import AccountEditForm from './AccountEditForm';
import AccountAdjustmentModal from './AccountAdjustmentModal';
import DeleteAccountModal from './DeleteAccountModal';
import { storage } from '@/utils/storage';
import { styles } from '@/styles/guide';
import type { 
  UserProfile, 
  Account, 
  Transaction, 
  AccountAdjustment 
} from '@/types/finance';
import Modal from './common/Modal';
import { PasteImport } from './transactions/PasteImport';
import { DuplicateReview } from './transactions/DuplicateReview';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

// Type definitions for internal state management
interface AppError {
  id: string;
  message: string;
  timestamp: number;
}

interface StateUpdate<T> {
  data: T;
  error?: string;
}

// Main component
const FinanceTracker = (): React.ReactElement => {
  // Core state
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // UI state
  const [quickEntryMode, setQuickEntryMode] = useState<boolean>(false);
  const [showAccountForm, setShowAccountForm] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [adjustingAccount, setAdjustingAccount] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<string | null>(null);
  const [errors, setErrors] = useState<AppError[]>([]);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [duplicateTransactions, setDuplicateTransactions] = useState<{
    newTransaction: Partial<Transaction>;
    existingTransaction: Transaction;
  }[]>([]);

  // Debug logging wrapper
  const logDebug = useCallback((message: string, data?: any) => {
    console.log(`[FinanceTracker] ${message}`, data || '');
  }, []);

  // Error handling
  const handleError = useCallback((error: string) => {
    logDebug('Error occurred:', error);
    const newError: AppError = {
      id: crypto.randomUUID(),
      message: error,
      timestamp: Date.now()
    };
    setErrors(prev => [...prev, newError]);

    // Auto-remove errors after 5 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== newError.id));
    }, 5000);
  }, [logDebug]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      logDebug('Loading initial data');

      try {

        const { data: { session } } = await supabase.auth.getSession();
        logDebug('Auth status:', { 
          isAuthenticated: !!session, 
          userId: session?.user?.id 
        });

        const { data: profilesData, error: profilesError } = storage.loadProfiles();
        const { data: accountsData, error: accountsError } = storage.loadAccounts();
        const { data: transactionsData, error: transactionsError } = storage.loadTransactions();

        // Handle loading errors
        if (profilesError && localStorage.getItem(storage.keys.profiles)) {
          handleError(profilesError);
        }
        if (accountsError && localStorage.getItem(storage.keys.accounts)) {
          handleError(accountsError);
        }
        if (transactionsError && localStorage.getItem(storage.keys.transactions)) {
          handleError(transactionsError);
        }

        // Set initial data
        if (profilesData && accountsData) {
          setProfiles(profilesData);
          setAccounts(accountsData);
          setIsInitialized(true);
        }

        if (transactionsData) {
          setTransactions(transactionsData);
        }
      } catch (error) {
        handleError('Failed to load initial data');
        console.error('Data loading error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [handleError, logDebug]);

  // Add to FinanceTracker.tsx
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + R
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        resetApp();
      }
    };

    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, []);

  // Add refreshTransactions function
  const refreshTransactions = async () => {
    try {
      const transactions = await api.transactions.list();
      setTransactions(transactions);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  };

  // Temp app data reset function
  const resetApp = async () => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset all state
    setIsInitialized(false);
    setProfiles([]);
    setAccounts([]);
    setTransactions([]);
    
    // Reload the page to ensure clean state
    window.location.reload();
  };

  // Initialization handler
  const handleInitializationComplete = (userData: {
    profiles: UserProfile[];
    accounts: Account[];
  }): void => {
    logDebug('Completing initialization with data:', userData);

    try {
      const profilesError = storage.saveProfiles(userData.profiles);
      const accountsError = storage.saveAccounts(userData.accounts);

      if (profilesError) handleError(profilesError);
      if (accountsError) handleError(accountsError);

      setProfiles(userData.profiles);
      setAccounts(userData.accounts);
      setIsInitialized(true);
    } catch (error) {
      handleError('Failed to complete initialization');
      console.error('Initialization error:', error);
    }
  };

  // Account management handlers
  const handleAddAccount = async (accountData: Omit<Account, 'id' | 'transactions' | 'adjustmentHistory'>): Promise<void> => {
    logDebug('Adding new account:', accountData);

    try {
      const newAccount: Account = {
        ...accountData,
        id: crypto.randomUUID(),
        transactions: [],
        adjustmentHistory: []
      };

      const updatedAccounts = [...accounts, newAccount];
      const updatedProfiles = profiles.map(profile => {
        if (profile.id === accountData.owner) {
          return {
            ...profile,
            accounts: [...profile.accounts, newAccount]
          };
        }
        return profile;
      });

      const accountsError = storage.saveAccounts(updatedAccounts);
      const profilesError = storage.saveProfiles(updatedProfiles);

      if (accountsError) handleError(accountsError);
      if (profilesError) handleError(profilesError);

      setAccounts(updatedAccounts);
      setProfiles(updatedProfiles);
      setShowAccountForm(false);
    } catch (error) {
      handleError('Failed to add account');
      console.error('Account addition error:', error);
    }
  };

  const handleAccountEdit = async (accountId: string, updates: Partial<Account>): Promise<void> => {
    logDebug('Editing account:', { accountId, updates });

    try {
      const updatedAccounts = accounts.map(account => {
        if (account.id === accountId) {
          return { ...account, ...updates };
        }
        return account;
      });

      const updatedProfiles = profiles.map(profile => ({
        ...profile,
        accounts: profile.accounts.map(account => {
          if (account.id === accountId) {
            return { ...account, ...updates };
          }
          return account;
        })
      }));

      const accountsError = storage.saveAccounts(updatedAccounts);
      const profilesError = storage.saveProfiles(updatedProfiles);

      if (accountsError) handleError(accountsError);
      if (profilesError) handleError(profilesError);

      setAccounts(updatedAccounts);
      setProfiles(updatedProfiles);
      setEditingAccount(null);
    } catch (error) {
      handleError('Failed to edit account');
      console.error('Account edit error:', error);
    }
  };

  const handleBalanceAdjustment = async (accountId: string, adjustment: Omit<AccountAdjustment, 'id'>): Promise<void> => {
    logDebug('Adjusting account balance:', { accountId, adjustment });

    try {
      const newAdjustment: AccountAdjustment = {
        ...adjustment,
        id: crypto.randomUUID()
      };

      const updatedAccounts = accounts.map(account => {
        if (account.id === accountId) {
          return {
            ...account,
            balance: adjustment.newBalance,
            adjustmentHistory: [...account.adjustmentHistory, newAdjustment]
          };
        }
        return account;
      });

      const updatedProfiles = profiles.map(profile => ({
        ...profile,
        accounts: profile.accounts.map(account => {
          if (account.id === accountId) {
            return {
              ...account,
              balance: adjustment.newBalance,
              adjustmentHistory: [...account.adjustmentHistory, newAdjustment]
            };
          }
          return account;
        })
      }));

      const accountsError = storage.saveAccounts(updatedAccounts);
      const profilesError = storage.saveProfiles(updatedProfiles);

      if (accountsError) handleError(accountsError);
      if (profilesError) handleError(profilesError);

      setAccounts(updatedAccounts);
      setProfiles(updatedProfiles);
      setAdjustingAccount(null);
    } catch (error) {
      handleError('Failed to adjust balance');
      console.error('Balance adjustment error:', error);
    }
  };

  const handleImportComplete = () => {
    // Refresh transactions list
    refreshTransactions();
    setShowImport(false);
  };
  
  const handleDuplicatesFound = (dupes: {
    newTransaction: Partial<Transaction>;
    existingTransaction: Transaction;
  }[]) => {
    setDuplicateTransactions(dupes);
  };

  // Account Name Edit
  const handleNameUpdate = (accountId: string, newName: string) => {
    if (!newName.trim()) return;
    
    handleAccountEdit(accountId, { name: newName.trim() });
    setEditingName(null);
  };

  const handleAccountDelete = async (accountId: string): Promise<void> => {
    logDebug('Deleting account:', accountId);

    try {
      const accountToDelete = accounts.find(a => a.id === accountId);
      if (!accountToDelete) {
        handleError('Account not found');
        return;
      }

      const updatedAccounts = accounts.filter(a => a.id !== accountId);
      const updatedProfiles = profiles.map(profile => ({
        ...profile,
        accounts: profile.accounts.filter(a => a.id !== accountId)
      }));
      const updatedTransactions = transactions.filter(
        t => t.sourceAccount !== accountId && t.destinationAccount !== accountId
      );

      const accountsError = storage.saveAccounts(updatedAccounts);
      const profilesError = storage.saveProfiles(updatedProfiles);
      const transactionsError = storage.saveTransactions(updatedTransactions);

      if (accountsError) handleError(accountsError);
      if (profilesError) handleError(profilesError);
      if (transactionsError) handleError(transactionsError);

      setAccounts(updatedAccounts);
      setProfiles(updatedProfiles);
      setTransactions(updatedTransactions);
      setDeletingAccount(null);
    } catch (error) {
      handleError('Failed to delete account');
      console.error('Account deletion error:', error);
    }
  };

  // Transaction handlers
  const handleQuickEntry = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    logDebug('Processing quick entry');

    try {
      const formData = new FormData(e.currentTarget);
      
      const type = formData.get('type') as Transaction['type'];
      const sourceAccount = String(formData.get('sourceAccount'));
      const destinationAccount = String(formData.get('destinationAccount'));
      
      if (!type || !sourceAccount || !destinationAccount) {
        handleError('All fields are required');
        return;
      }

      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        amount: Number(formData.get('amount')),
        type,
        category: String(formData.get('category')),
        description: String(formData.get('description')),
        sourceAccount,
        destinationAccount,
        isEdited: false,
        editHistory: []
      };

      if (isNaN(newTransaction.amount) || newTransaction.amount <= 0) {
        handleError('Amount must be a positive number');
        return;
      }

      // Type-specific validation
      switch (type) {
        case 'Transfer':
          if (sourceAccount === destinationAccount) {
            handleError('Source and destination accounts must be different for transfers');
            return;
          }
          break;
      }

      const updatedTransactions = [...transactions, newTransaction];
      const transactionsError = storage.saveTransactions(updatedTransactions);

      if (transactionsError) {
        handleError(transactionsError);
      } else {
        setTransactions(updatedTransactions);
        e.currentTarget.reset();
      }
    } catch (error) {
      handleError('Failed to add transaction');
      console.error('Transaction creation error:', error);
    }
  };

  // Loading and initialization states
  if (isLoading) {
    return (
      <div className={styles.patterns.loadingContainer}>
        <div className="text-center">
          <div className={styles.patterns.loadingSpinner}></div>
          <p className={styles.typography.body}>Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return <InitializationWizard onComplete={handleInitializationComplete} />;
  }

  // Main dashboard render
  return (
    <div className={styles.layout.pageContainer}>
      {/* Error display */}
      {errors.map((error) => (
        <ErrorAlert
          key={error.id}
          message={error.message}
          onDismiss={() => setErrors(prev => prev.filter(e => e.id !== error.id))}
        />
      ))}

      {showImport && (
        <PasteImport
          onClose={() => setShowImport(false)}
          onImportComplete={handleImportComplete}
          accounts={accounts}
          onDuplicatesFound={handleDuplicatesFound}
        />
      )}

      {duplicateTransactions.length > 0 && (
        <DuplicateReview
          duplicates={duplicateTransactions}
          onImportAnyway={async (transactions) => {
            try {
              await Promise.all(
                transactions.map(transaction => 
                  api.transactions.create(transaction as Omit<Transaction, 'id' | 'created_at'>)
                )
              );
              refreshTransactions();
            } catch (error) {
              // Handle error
            }
            setDuplicateTransactions([]);
          }}
          onSkip={(transactions) => {
            setDuplicateTransactions([]);
          }}
          onClose={() => setDuplicateTransactions([])}
        />
      )}

      {/* Header */}
      <div className={styles.layout.flexRow + ' mb-6'}>
        <h1 className={styles.typography.h1}>Financial Dashboard</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setQuickEntryMode(!quickEntryMode)}
            className={`${styles.button.primary} ${styles.button.withIcon}`}
          >
            <Plus size={20} />
            Quick Entry
          </button>
          <button 
            className={`${styles.button.success} ${styles.button.withIcon}`}
          >
            <RefreshCcw size={20} />
            Reconcile
          </button>
        </div>
      </div>

      {/*} Add to JSX (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={resetApp}
          className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          Reset App
        </button>
      )}

      <button
        onClick={() => setShowImport(true)}
        className={`${styles.button.primary} ${styles.button.withIcon}`}
      >
        <Upload size={20} />
        Import Transactions
      </button>

      {/* Account management */}
      <button
        onClick={() => setShowAccountForm(true)}
        className={`${styles.button.success} ${styles.button.withIcon} mb-6`}
      >
        <Plus size={20} />
        Add Account
      </button>

      {/* Modals */}
      {showAccountForm && (
        <Modal
          isOpen={showAccountForm}
          onClose={() => setShowAccountForm(false)}
          title="Add New Account"
        >
          <AccountForm
            onSubmit={handleAddAccount}
            onCancel={() => setShowAccountForm(false)}
            profiles={profiles}
          />
        </Modal>
      )}

      {editingAccount && (
        <Modal
          isOpen={!!editingAccount}
          onClose={() => setEditingAccount(null)}
          title="Edit Account"
        >
          <AccountEditForm
            account={accounts.find(a => a.id === editingAccount)!}
            profiles={profiles}
            onSubmit={handleAccountEdit}
            onCancel={() => setEditingAccount(null)}
          />
        </Modal>
      )}

      {adjustingAccount && (
        <Modal
          isOpen={!!adjustingAccount}
          onClose={() => setAdjustingAccount(null)}
          title={`Adjust Balance: ${accounts.find(a => a.id === adjustingAccount)?.name}`}
        >
          <AccountAdjustmentModal
            account={accounts.find(a => a.id === adjustingAccount)!}
            onAdjust={(adjustment) => handleBalanceAdjustment(adjustingAccount, adjustment)}
            onClose={() => setAdjustingAccount(null)}
          />
        </Modal>
      )}                      

      {deletingAccount && (
        <Modal
          isOpen={!!deletingAccount}
          onClose={() => setDeletingAccount(null)}
          title="Delete Account"
        >
          <DeleteAccountModal
            account={accounts.find(a => a.id === deletingAccount)!}
            onConfirm={() => handleAccountDelete(deletingAccount)}
            onCancel={() => setDeletingAccount(null)}
          />
        </Modal>
      )}

      {/* Quick Entry Form */}
      {quickEntryMode && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQuickEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select 
                  name="type" 
                  className="p-2 border rounded text-black"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                  <option value="Reimbursement">Reimbursement</option>
                  <option value="Transfer">Transfer</option>
                </select>
                <input 
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  className={styles.form.select}
                  required
                />
                <input 
                  name="description"
                  type="text"
                  placeholder="Description"
                  className={styles.form.select}
                  required
                />
                <select 
                  name="category" 
                  className="p-2 border rounded text-black"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="groceries">Groceries</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent</option>
                  <option value="salary">Salary</option>
                  <option value="other">Other</option>
                  </select>
                  <select 
                    name="account" 
                    className={styles.form.select}
                    required
                >
                  <option value="">From Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                <select 
                  name="destinationAccount" 
                  className={styles.form.select}
                  required
                >
                  <option value="">To Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-green-500 text-white p-2 rounded"
                >
                  Add Transaction
                </button>
              </form>
            </CardContent>
          </Card>
        )}

      {/* Accounts Grid */}
      <div className={`${styles.layout.gridContainer} mb-6`}>
        {accounts.map(account => (
          <Card key={account.id} className={styles.card.hoverable}>
            <CardHeader>
              <div className={styles.layout.flexRow}>
                <CardTitle>{account.name}</CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustingAccount(account.id)}
                    className={styles.button.iconButtonPrimary}
                    title="Adjust Balance"
                  >
                    <Calculator size={16} />
                  </button>
                  <button
                    onClick={() => setEditingAccount(account.id)}
                    className={styles.button.iconButtonPrimary}
                    title="Edit Account"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setDeletingAccount(account.id)}
                    className={styles.button.iconButtonDanger}
                    title="Delete Account"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className={`${styles.typography.currency} text-2xl`}>
                ${account.balance.toFixed(2)}
              </p>
              <p className={styles.typography.bodySmall}>
                {account.type} {account.isshared ? '(Shared)' : ''}
              </p>
              {account.purpose && (
                <p className={styles.typography.bodySmall + ' mt-1'}>
                  Purpose: {account.purpose}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="p-2 border border-white rounded flex justify-between items-center bg-black"
                >
                  <div>
                    <span className="font-semibold text-white">{transaction.description}</span>
                    <span className="mx-2 text-white">·</span>
                    <span className="text-white">{transaction.category}</span>
                    <span className="mx-2 text-white">·</span>
                    <span className="text-white">{transaction.type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono ${
                      transaction.type === 'Expense' ? 'text-red-400' : 
                      transaction.type === 'Income' ? 'text-green-400' : 
                      'text-white'
                    }`}>
                      {transaction.type === 'Expense' ? '-' : ''}
                      ${transaction.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceTracker;