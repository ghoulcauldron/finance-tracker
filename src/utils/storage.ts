import type { UserProfile, Account, Transaction, TransactionEdit, AccountAdjustment } from '@/types/finance';

interface StorageResult<T> {
  data: T | null;
  error: string | null;
}

// Type guard functions
const isTransactionEdit = (obj: any): obj is TransactionEdit => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.field === 'string' &&
    'oldValue' in obj &&
    'newValue' in obj &&
    typeof obj.editor === 'string'
  );
};

const isAccountAdjustment = (obj: any): obj is AccountAdjustment => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.reason === 'string' &&
    typeof obj.previousBalance === 'number' &&
    typeof obj.newBalance === 'number'
  );
};

const isTransaction = (obj: any): obj is Transaction => {
  const hasRequiredFields = (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.type === 'string' &&
    ['Income', 'Expense', 'Reimbursement', 'Transfer'].includes(obj.type) &&
    typeof obj.category === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.sourceAccount === 'string' &&
    typeof obj.destinationAccount === 'string' &&
    typeof obj.isEdited === 'boolean' &&
    Array.isArray(obj.editHistory)
  );

  if (!hasRequiredFields) return false;

  // Validate editHistory array
  const validEditHistory = obj.editHistory.every(isTransactionEdit);
  if (!validEditHistory) return false;

  // Check optional linkedTransactionId
  if ('linkedTransactionId' in obj && typeof obj.linkedTransactionId !== 'string') {
    return false;
  }

  return true;
};

const isAccount = (obj: any): obj is Account => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    ['checking', 'savings', 'credit', 'investment', 'custom'].includes(obj.type) &&
    typeof obj.balance === 'number' &&
    typeof obj.owner === 'string' &&
    Array.isArray(obj.transactions) &&
    obj.transactions.every(isTransaction) &&
    Array.isArray(obj.adjustmentHistory) &&
    obj.adjustmentHistory.every(isAccountAdjustment) &&
    ('isshared' in obj ? typeof obj.isshared === 'boolean' : true) &&
    ('purpose' in obj ? typeof obj.purpose === 'string' : true)
  );
};

const isUserProfile = (obj: any): obj is UserProfile => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.accounts) &&
    obj.accounts.every(isAccount) &&
    (!obj.sharedExpensePartner || typeof obj.sharedExpensePartner === 'string')
  );
};

const storage = {
  keys: {
    profiles: 'financeProfiles',
    accounts: 'financeAccounts',
    transactions: 'financeTransactions'
  },

  saveProfiles: (profiles: UserProfile[]): string | null => {
    try {
      localStorage.setItem(storage.keys.profiles, JSON.stringify(profiles));
      return null;
    } catch (error) {
      console.error('Error saving profiles:', error);
      return error instanceof Error ? error.message : 'Failed to save profiles';
    }
  },

  loadProfiles: (): StorageResult<UserProfile[]> => {
    try {
      const data = localStorage.getItem(storage.keys.profiles);
      if (!data) return { data: null, error: null };

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || !parsed.every(isUserProfile)) {
        throw new Error('Invalid profiles data structure');
      }

      return { data: parsed, error: null };
    } catch (error) {
      console.error('Error loading profiles:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to load profiles'
      };
    }
  },

  saveAccounts: (accounts: Account[]): string | null => {
    try {
      localStorage.setItem(storage.keys.accounts, JSON.stringify(accounts));
      return null;
    } catch (error) {
      console.error('Error saving accounts:', error);
      return error instanceof Error ? error.message : 'Failed to save accounts';
    }
  },

  loadAccounts: (): StorageResult<Account[]> => {
    try {
      const data = localStorage.getItem(storage.keys.accounts);
      if (!data) return { data: null, error: null };

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || !parsed.every(isAccount)) {
        throw new Error('Invalid accounts data structure');
      }

      return { data: parsed, error: null };
    } catch (error) {
      console.error('Error loading accounts:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to load accounts'
      };
    }
  },

  saveTransactions: (transactions: Transaction[]): string | null => {
    try {
      console.log('Saving transactions:', transactions);
      localStorage.setItem(storage.keys.transactions, JSON.stringify(transactions));
      return null;
    } catch (error) {
      console.error('Error saving transactions:', error);
      return error instanceof Error ? error.message : 'Failed to save transactions';
    }
  },

  loadTransactions: (): StorageResult<Transaction[]> => {
    try {
      const data = localStorage.getItem(storage.keys.transactions);
      if (!data) return { data: null, error: null };

      const parsed = JSON.parse(data);
      console.log('Loaded transactions:', parsed);

      if (!Array.isArray(parsed)) {
        throw new Error('Transactions data is not an array');
      }

      // Validate each transaction and provide specific error messages
      const validationErrors = parsed.map((transaction, index) => {
        if (!isTransaction(transaction)) {
          const missingFields = [
            'id', 'date', 'amount', 'type', 'category', 
            'description', 'sourceAccount', 'destinationAccount', 
            'isEdited', 'editHistory'
          ].filter(field => !(field in transaction));
          
          return `Transaction ${index}: Invalid or missing fields: ${missingFields.join(', ')}`;
        }
        return null;
      }).filter(error => error !== null);

      if (validationErrors.length > 0) {
        throw new Error(`Invalid transactions: ${validationErrors.join('; ')}`);
      }

      return { data: parsed, error: null };
    } catch (error) {
      console.error('Error loading transactions:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to load transactions'
      };
    }
  },

  clear: (): void => {
    localStorage.removeItem(storage.keys.profiles);
    localStorage.removeItem(storage.keys.accounts);
    localStorage.removeItem(storage.keys.transactions);
  }
};

export { storage };