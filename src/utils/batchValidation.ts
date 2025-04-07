import type { Transaction, Account } from '@/types/finance';
import { validateTransaction } from '@/utils/validation';
import { checkForDuplicates } from './deduplication';

interface BatchValidationResult {
  valid: Transaction[];
  invalid: {
    transaction: Partial<Transaction>;
    errors: string[];
  }[];
  duplicates: {
    newTransaction: Partial<Transaction>;
    existingTransaction: Transaction;
  }[];
}

export async function validateTransactionBatch(
    transactions: Partial<Transaction>[],
    accounts: Account[],
    existingTransactions: Transaction[]
  ): Promise<BatchValidationResult> {
    const result: BatchValidationResult = {
      valid: [],
      invalid: [],
      duplicates: []
    };
  
    // Sanitize transactions with type-safe defaults
    const sanitizedTransactions = transactions.map(transaction => ({
      ...transaction,
      description: transaction.description || 'Unnamed Transaction',
      amount: transaction.amount || 0,
      type: transaction.type || 'Expense',
      category: transaction.category || 'Uncategorized',
      sourceAccount: transaction.sourceAccount || undefined,
      destinationAccount: transaction.destinationAccount || undefined,
      isEdited: transaction.isEdited || false,
      editHistory: transaction.editHistory || [],
    }));
  
    // Keep track of running balances during batch processing
    const accountBalances = new Map(accounts.map(account => [account.id, account.balance]));
  
    for (const transaction of sanitizedTransactions) {
      // Check for duplicates
      const dupeCheck = checkForDuplicates(transaction, existingTransactions);
      if (dupeCheck.isDuplicate && dupeCheck.existingTransaction) {
        result.duplicates.push({
          newTransaction: transaction,
          existingTransaction: dupeCheck.existingTransaction
        });
        continue;
      }
  
      // Validate transaction
      const validation = validateTransaction(transaction as Transaction, accounts);
      if (!validation.isValid) {
        result.invalid.push({
          transaction,
          errors: validation.errors
        });
        continue;
      }
  
      // Update running balances for validation
      try {
        if ((transaction.type === 'Expense' || transaction.type === 'Transfer') && transaction.sourceAccount) {
          const sourceBalance = accountBalances.get(transaction.sourceAccount) || 0;
          accountBalances.set(
            transaction.sourceAccount,
            sourceBalance - (transaction.amount || 0)
          );
        }
  
        if ((transaction.type === 'Income' || transaction.type === 'Transfer') && transaction.destinationAccount) {
          const destBalance = accountBalances.get(transaction.destinationAccount) || 0;
          accountBalances.set(
            transaction.destinationAccount,
            destBalance + (transaction.amount || 0)
          );
        }
  
        result.valid.push(transaction as Transaction);
      } catch (balanceError) {
        console.error('Balance update error:', balanceError);
        result.invalid.push({
          transaction,
          errors: ['Failed to update account balance']
        });
      }
    }
  
    return result;
  }