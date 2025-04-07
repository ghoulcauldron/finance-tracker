// src/utils/transactionProcessing.ts

import { parse } from 'date-fns';
import { isValid } from 'date-fns';
import { format } from 'date-fns';
import type { Transaction } from '@/types/finance';

interface CategoryRule {
  pattern: RegExp | string;
  category: string;
  type: 'income' | 'expense' | 'transfer';
}

export const categoryRules: CategoryRule[] = [
  // Income patterns
  { pattern: /salary|payroll|deposit/i, category: 'Salary', type: 'income' },
  { pattern: /dividend|interest/i, category: 'Investment Income', type: 'income' },
  
  // Common expense patterns
  { pattern: /grocery|whole foods|trader|safeway/i, category: 'Groceries', type: 'expense' },
  { pattern: /restaurant|doordash|uber eats|grubhub/i, category: 'Dining', type: 'expense' },
  { pattern: /amazon|target|walmart/i, category: 'Shopping', type: 'expense' },
  { pattern: /uber|lyft|taxi|transit/i, category: 'Transportation', type: 'expense' },
  { pattern: /netflix|spotify|hulu|disney\+/i, category: 'Subscriptions', type: 'expense' },
  { pattern: /rent|mortgage/i, category: 'Housing', type: 'expense' },
  { pattern: /electric|gas|water|utility/i, category: 'Utilities', type: 'expense' },
  
  // Transfer patterns
  { pattern: /transfer|xfer|zelle|venmo/i, category: 'Transfer', type: 'transfer' },
];

// Date format patterns to try
const datePatterns = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'MM-dd-yyyy',
  'dd/MM/yyyy',
  'MM/dd/yy',
  'yyyy/MM/dd',
  'MM.dd.yyyy',
];

export const transactionProcessor = {
  // Categorize transaction based on description
  categorize(description: string): { category: string; type: string } {
    const rule = categoryRules.find(rule => 
      typeof rule.pattern === 'string' 
        ? description.toLowerCase().includes(rule.pattern.toLowerCase())
        : rule.pattern.test(description)
    );

    return rule || { category: 'Uncategorized', type: 'expense' };
  },

  // Clean and validate amount
  cleanAmount(amount: string | number): number {
    const cleanedAmount = typeof amount === 'string' 
      ? amount.replace(/[^0-9.-]/g, '')
      : amount.toString();
    
    const parsedAmount = parseFloat(cleanedAmount);
    
    if (isNaN(parsedAmount)) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    return parsedAmount;
  },

  // Parse and validate date
  parseDate(dateStr: string): string {
    for (const pattern of datePatterns) {
      const parsedDate = parse(dateStr, pattern, new Date());
      if (isValid(parsedDate)) {
        return format(parsedDate, 'yyyy-MM-dd');
      }
    }

    throw new Error(`Invalid date format: ${dateStr}`);
  },

  // Clean description
  cleanDescription(description: string): string {
    return description
      .trim()
      .replace(/\s+/g, ' ') // Remove extra spaces
      .replace(/[^\w\s-.,&]/g, '') // Remove special characters except some common ones
      .slice(0, 100); // Limit length
  },

  // Validate and clean transaction data
  validateTransaction(rawTransaction: Record<string, any>): Partial<Transaction> {
    try {
      const description = this.cleanDescription(rawTransaction.description || '');
      const { category, type } = this.categorize(description);
      
      return {
        date: this.parseDate(rawTransaction.date),
        amount: this.cleanAmount(rawTransaction.amount),
        description,
        category: rawTransaction.category || category,
        type: rawTransaction.type || type,
      };
    } catch (error) {
      // Type-safe error handling
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : 'Unknown validation error';
      
      throw new Error(`Transaction validation failed: ${errorMessage}`);
    }
  }
};