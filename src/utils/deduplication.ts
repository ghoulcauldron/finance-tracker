import type { Transaction } from '@/types/finance';

interface DuplicationCheck {
  isDuplicate: boolean;
  existingTransaction?: Transaction;
}

export function checkForDuplicates(
  newTransaction: Partial<Transaction>,
  existingTransactions: Transaction[],
  timeWindowDays: number = 5
): DuplicationCheck {
  if (!newTransaction.date || !newTransaction.amount) {
    return { isDuplicate: false };
  }

  const transactionDate = new Date(newTransaction.date);
  const timeWindow = timeWindowDays * 24 * 60 * 60 * 1000; // days in milliseconds

  const potentialDuplicates = existingTransactions.filter(existing => {
    const existingDate = new Date(existing.date);
    const timeDiff = Math.abs(existingDate.getTime() - transactionDate.getTime());

    return (
      // Within time window
      timeDiff <= timeWindow &&
      // Same amount
      existing.amount === newTransaction.amount &&
      // Similar description (if available)
      (newTransaction.description
        ? stringSimilarity(existing.description, newTransaction.description) > 0.8
        : false)
    );
  });

  if (potentialDuplicates.length > 0) {
    return {
      isDuplicate: true,
      existingTransaction: potentialDuplicates[0]
    };
  }

  return { isDuplicate: false };
}

// Levenshtein distance for string similarity
function stringSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len1][len2]) / maxLen;
}