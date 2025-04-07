// src/utils/validation.ts
import type { Transaction, Account } from '@/types/finance';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateTransaction = (
  transaction: Transaction,
  accounts: Account[]
): ValidationResult => {
  const errors: string[] = [];
  const sourceAccount = accounts.find(a => a.id === transaction.sourceAccount);
  const destAccount = accounts.find(a => a.id === transaction.destinationAccount);

  // Basic validation
  if (transaction.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!transaction.date) {
    errors.push('Date is required');
  }

  if (!transaction.type) {
    errors.push('Transaction type is required');
  }

  // Type-specific validation
  switch (transaction.type) {
    case 'Transfer':
      if (transaction.sourceAccount === transaction.destinationAccount) {
        errors.push('Source and destination accounts must be different');
      }
      if (sourceAccount && transaction.amount > sourceAccount.balance) {
        errors.push('Insufficient funds in source account');
      }
      break;

    case 'Expense':
      if (sourceAccount && transaction.amount > sourceAccount.balance) {
        errors.push('Insufficient funds in source account');
      }
      break;

    case 'Reimbursement':
      // Add any reimbursement-specific validation
      break;

    case 'Income':
      if (!destAccount) {
        errors.push('Destination account is required for income');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTransactionEdit = (
  original: Transaction,
  updated: Transaction,
  accounts: Account[]
): ValidationResult => {
  const basicValidation = validateTransaction(updated, accounts);
  
  // Additional edit-specific validation
  if (original.type !== updated.type) {
    // Validate type changes
    if (original.type === 'Transfer' && updated.type !== 'Transfer') {
      if (accounts.some(a => 
        a.transactions.some(t => t.linkedTransactionId === original.id)
      )) {
        basicValidation.errors.push('Cannot change type of linked transfer');
      }
    }
  }

  return basicValidation;
};