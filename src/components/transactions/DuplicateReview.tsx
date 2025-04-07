'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { styles } from '@/styles/guide';
import type { Transaction } from '@/types/finance';

interface DuplicateReviewProps {
  duplicates: {
    newTransaction: Partial<Transaction>;
    existingTransaction: Transaction;
  }[];
  onImportAnyway: (transactions: Partial<Transaction>[]) => void;
  onSkip: (transactions: Partial<Transaction>[]) => void;
  onClose: () => void;
}

export function DuplicateReview({
  duplicates,
  onImportAnyway,
  onSkip,
  onClose
}: DuplicateReviewProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());

  const toggleTransaction = (index: number) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTransactions(newSelected);
  };

  const handleImportSelected = () => {
    const transactionsToImport = Array.from(selectedTransactions).map(
      index => duplicates[index].newTransaction
    );
    onImportAnyway(transactionsToImport);
  };

  const handleSkipSelected = () => {
    const transactionsToSkip = Array.from(selectedTransactions).map(
      index => duplicates[index].newTransaction
    );
    onSkip(transactionsToSkip);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <Card className="w-full max-w-4xl m-4">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Review Duplicate Transactions</CardTitle>
          <button onClick={onClose} className={styles.button.iconButton}>×</button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-yellow-600">
              {duplicates.length} potential duplicate transaction(s) found.
              Please review before importing.
            </p>

            <div className="max-h-96 overflow-auto">
              {duplicates.map((dupe, index) => (
                <div 
                  key={index}
                  className="border-b p-4 flex items-start space-x-4"
                >
                  <input
                    type="checkbox"
                    checked={selectedTransactions.has(index)}
                    onChange={() => toggleTransaction(index)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className={styles.typography.h4}>New Transaction</h4>
                        <div className="bg-blue-50 p-3 rounded">
                          <p>Date: {dupe.newTransaction.date}</p>
                          <p>Amount: ${dupe.newTransaction.amount?.toFixed(2)}</p>
                          <p>Description: {dupe.newTransaction.description}</p>
                          <p>Category: {dupe.newTransaction.category}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className={styles.typography.h4}>Existing Transaction</h4>
                        <div className="bg-gray-50 p-3 rounded">
                          <p>Date: {dupe.existingTransaction.date}</p>
                          <p>Amount: ${dupe.existingTransaction.amount.toFixed(2)}</p>
                          <p>Description: {dupe.existingTransaction.description}</p>
                          <p>Category: {dupe.existingTransaction.category}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={handleSkipSelected}
                disabled={selectedTransactions.size === 0}
                className={styles.button.secondary}
              >
                Skip Selected
              </button>
              <button
                onClick={handleImportSelected}
                disabled={selectedTransactions.size === 0}
                className={styles.button.primary}
              >
                Import Selected Anyway
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}