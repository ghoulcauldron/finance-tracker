import type { Account, Transaction } from '@/types/finance';

export const validateTransfer = (
  sourceAccount: Account,
  amount: number
): { valid: boolean; message?: string } => {
  if (sourceAccount.type === 'credit') {
    // Add credit limit logic here if needed
    return { valid: true };
  }

  if (sourceAccount.balance < amount) {
    return {
      valid: false,
      message: `Insufficient funds in ${sourceAccount.name}. Available: $${sourceAccount.balance.toFixed(2)}`
    };
  }

  return { valid: true };
};

export const processTransaction = (
  accounts: Account[],
  transaction: Transaction
): { success: boolean; message?: string; updatedAccounts: Account[] } => {
  const sourceAccount = accounts.find(a => a.id === transaction.sourceAccount);
  const destAccount = accounts.find(a => a.id === transaction.destinationAccount);

  if (!sourceAccount || !destAccount) {
    return {
      success: false,
      message: 'Invalid account selection',
      updatedAccounts: accounts
    };
  }

  switch (transaction.type) {
    case 'Transfer': {
      const validation = validateTransfer(sourceAccount, transaction.amount);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message,
          updatedAccounts: accounts
        };
      }

      return {
        success: true,
        updatedAccounts: accounts.map(account => {
          if (account.id === sourceAccount.id) {
            return {
              ...account,
              balance: account.balance - transaction.amount,
              transactions: [...account.transactions, transaction]
            };
          }
          if (account.id === destAccount.id) {
            return {
              ...account,
              balance: account.balance + transaction.amount,
              transactions: [...account.transactions, transaction]
            };
          }
          return account;
        })
      };
    }
    
    case 'Income': {
      return {
        success: true,
        updatedAccounts: accounts.map(account => {
          if (account.id === destAccount.id) {
            return {
              ...account,
              balance: account.balance + transaction.amount,
              transactions: [...account.transactions, transaction]
            };
          }
          return account;
        })
      };
    }

    case 'Expense': {
      const validation = validateTransfer(sourceAccount, transaction.amount);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message,
          updatedAccounts: accounts
        };
      }

      return {
        success: true,
        updatedAccounts: accounts.map(account => {
          if (account.id === sourceAccount.id) {
            return {
              ...account,
              balance: account.balance - transaction.amount,
              transactions: [...account.transactions, transaction]
            };
          }
          return account;
        })
      };
    }

    case 'Reimbursement': {
      return {
        success: true,
        updatedAccounts: accounts.map(account => {
          if (account.id === destAccount.id) {
            return {
              ...account,
              balance: account.balance + transaction.amount,
              transactions: [...account.transactions, transaction]
            };
          }
          return account;
        })
      };
    }

    default:
      return {
        success: false,
        message: 'Invalid transaction type',
        updatedAccounts: accounts
      };
  }
};