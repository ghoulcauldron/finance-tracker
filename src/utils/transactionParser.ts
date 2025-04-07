// src/utils/transactionParser.ts
import type { Transaction, Account } from '@/types/finance';
import { parseISO, parse } from 'date-fns';
import { validateTransaction } from './validation';

interface ParseResult {
  transactions: Partial<Transaction>[];
  errors: string[];
}

export function parseTransactionText(
    text: string, 
    accounts: Account[]
  ): ParseResult {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const errors: string[] = [];
    const transactions: Partial<Transaction>[] = [];
  
    let currentDate: string | null = null;
    let currentDescription = '';
    let currentAmount: number | null = null;
    let currentType: Transaction['type'] = 'Expense';
  
    const processTransaction = () => {
      if (currentDate && currentAmount !== null) {
        const transaction: Partial<Transaction> = {
          date: currentDate,
          description: currentDescription || 'Unnamed Transaction',
          amount: Math.abs(currentAmount), // Ensure this is a number
          type: currentAmount > 0 ? 'Income' : 'Expense',
          category: 'Uncategorized',
          sourceAccount: '', // To be selected by user
          destinationAccount: '', // To be selected by user
          isEdited: false,
          editHistory: []
        };
  
        try {
          const validation = validateTransaction(transaction as Transaction, accounts);
          if (!validation.isValid) {
            errors.push(validation.errors.join(', '));
          } else {
            transactions.push(transaction);
          }
        } catch (error) {
          errors.push(error instanceof Error ? error.message : 'Transaction validation failed');
        }
      }
  
      // Reset for next transaction
      currentDescription = '';
      currentAmount = null;
      currentType = 'Expense';
    };
  
    lines.forEach((line, index) => {
      // Check if the line is a date
      const dateMatch = line.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{1,2}$/i);
      if (dateMatch) {
        // Process previous transaction before starting a new one
        if (currentDate && currentAmount !== null) {
          processTransaction();
        }
        
        // Parse the new date
        try {
          const date = new Date(`${line} ${new Date().getFullYear()}`);
          currentDate = date.toISOString().split('T')[0];
        } catch (error) {
          errors.push(`Line ${index + 1}: Invalid date format`);
          currentDate = null;
        }
        return;
      }
  
      // Check if the line is 'Credit'
      if (line.toLowerCase() === 'credit') {
        currentType = 'Income';
        return;
      }
  
      // Check if the line is an amount
      const amountMatch = line.match(/^([-+]?\$?(\d{1,3}(,\d{3})*(\.\d{1,2})?))$/);
      if (amountMatch) {
        // Remove $ and , characters, then convert to number
        const cleanAmount = line.replace(/[$,]/g, '');
        const parsedAmount = parseFloat(cleanAmount);
        
        // Ensure it's a valid number
        if (!isNaN(parsedAmount)) {
          currentAmount = currentType === 'Expense' && parsedAmount > 0 
            ? -parsedAmount 
            : parsedAmount;
        }
        return;
      }
  
      // If not a date, amount, or type, assume it's a description
      if (line && !amountMatch) {
        currentDescription += (currentDescription ? ' ' : '') + line;
      }
    });
  
    // Process the last transaction
    processTransaction();
  
    return { transactions, errors };

  // Validate transactions
  const validTransactions = transactions.filter(t => {
    if (!t.date) {
      errors.push('Transaction missing date');
      return false;
    }
    if (!t.amount) {
      errors.push('Transaction missing amount');
      return false;
    }
    return true;
  });

  return {
    transactions: validTransactions,
    errors
  };
}