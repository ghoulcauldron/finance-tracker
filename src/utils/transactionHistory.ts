// src/utils/transactionHistory.ts
import type { Transaction, TransactionEdit } from '@/types/finance';

export const addTransactionEdit = (
  transaction: Transaction,
  field: keyof Transaction,
  oldValue: any,
  newValue: any,
  editor: string
): Transaction => {
  const edit: TransactionEdit = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    field,
    oldValue,
    newValue,
    editor
  };

  return {
    ...transaction,
    isEdited: true,
    editHistory: [...transaction.editHistory, edit]
  };
};

export const getTransactionHistory = (
  transaction: Transaction
): TransactionEdit[] => {
  return [...transaction.editHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};  