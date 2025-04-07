'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { styles } from '@/styles/guide';
import { parseTransactionText } from '@/utils/transactionParser';
import type { Transaction, Account, TransactionType } from '@/types/finance';
import { api } from '@/lib/api';
import { validateTransactionBatch } from '@/utils/batchValidation';
import { categorizeTransaction } from '@/utils/categoryMapping';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface PasteImportProps {
  onClose: () => void;
  onImportComplete: () => void;
  accounts: Account[];
  onDuplicatesFound?: (dupes: { 
    newTransaction: Partial<Transaction>; 
    existingTransaction: Transaction; 
  }[]) => void;
}

export function PasteImport({ onClose, onImportComplete, accounts, onDuplicatesFound }: PasteImportProps) {
  const { session } = useAuth();
  const router = useRouter();
  const [pastedText, setPastedText] = useState('');
  const [parsedData, setParsedData] = useState<Partial<Transaction>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [duplicates, setDuplicates] = useState<{
    newTransaction: Partial<Transaction>;
    existingTransaction: Transaction;
  }[]>([]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    setPastedText(text);
    
    try {
      const { transactions, errors } = parseTransactionText(text, accounts);
      
      const categorizedTransactions = transactions.map(transaction => {
        if (!transaction.category || transaction.category === 'Uncategorized') {
          const { category, type } = categorizeTransaction(transaction.description || '');
          return {
            ...transaction,
            category,
            type: type as TransactionType,
          };
        }
        return transaction;
      });
  
      setParsedData(categorizedTransactions);
      setErrors(errors);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to parse transactions']);
    }
  };

// In PasteImport.tsx, update the import handling:

interface ImportResults {
  successful: Transaction[];
  duplicates: Partial<Transaction>[];
  failed: Array<{ transaction: Partial<Transaction>; error: string }>;
}

const handleImport = async () => {
  if (!parsedData.length) {
    return;
  }

  setImporting(true);
  const results: ImportResults = {
    successful: [],
    duplicates: [],
    failed: []
  };

  try {
    if (!session) {
      setErrors(['Please sign in to import transactions']);
      return;
    }

    // Process transactions in batches
    const batchSize = 50;
    for (let i = 0; i < parsedData.length; i += batchSize) {
      const batch = parsedData.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (transaction: Partial<Transaction>) => {
          const transactionToCreate: Omit<Transaction, 'id' | 'created_at'> = {
            date: transaction.date || new Date().toISOString(),
            description: transaction.description || 'Unnamed Transaction',
            amount: transaction.amount || 0,
            type: transaction.type as TransactionType,
            category: transaction.category || 'Uncategorized',
            sourceAccount: transaction.sourceAccount || accounts[0]?.id || '',
            destinationAccount: transaction.destinationAccount || accounts[0]?.id || '',
            isEdited: false,
            editHistory: [],
            isJoint: false,
            owner_id: session.user.id
          };

          return api.transactions.create(transactionToCreate);
        })
      );

      // Process batch results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.successful.push(result.value);
        } else {
          const transaction = batch[index];
          const error = result.reason;
          
          if (error.name === 'DuplicateTransaction') {
            results.duplicates.push(transaction);
          } else {
            results.failed.push({
              transaction,
              error: error.message || 'Unknown error'
            });
          }
        }
      });
    }

    // Update UI with results
    const messages: string[] = [];
    
    if (results.successful.length > 0) {
      messages.push(`Successfully imported ${results.successful.length} transactions`);
    }
    
    if (results.duplicates.length > 0) {
      messages.push(`Found ${results.duplicates.length} duplicate transactions`);
    }
    
    if (results.failed.length > 0) {
      messages.push(`Failed to import ${results.failed.length} transactions`);
    }

    setErrors(messages);

    if (results.successful.length > 0) {
      onImportComplete();
      
      // Only close if everything was successful
      if (results.duplicates.length === 0 && results.failed.length === 0) {
        onClose();
      }
    }

  } catch (error) {
    console.error('Import error:', error);
    setErrors([error instanceof Error ? error.message : 'Failed to import transactions']);
  } finally {
    setImporting(false);
  }
};

  // Show sign-in prompt if no session
  if (!session) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <Card className="w-full max-w-md m-4">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">Please sign in to import transactions</p>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/signin')}
                className={`${styles.button.primary} flex-1`}
              >
                Sign In
              </button>
              <button
                onClick={onClose}
                className={`${styles.button.secondary} flex-1`}
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAccountSelect = (
    transactionIndex: number,
    field: 'sourceAccount' | 'destinationAccount',
    accountId: string
  ) => {
    const updatedData = [...parsedData];
    updatedData[transactionIndex] = {
      ...updatedData[transactionIndex],
      [field]: accountId
    };
    setParsedData(updatedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <Card className="w-full max-w-4xl m-4 bg-neutral-50 bg-opacity-100">
        <CardHeader className="flex flex-row justify-between items-center text-black">
          <CardTitle>Import Transactions</CardTitle>
          <button onClick={onClose} className={styles.button.iconButton}>×</button>
        </CardHeader>
        <CardContent>
          <div className={styles.form.formSection}>
            <label className={styles.form.label}>
              Paste your transaction data here
            </label>
            <textarea
              className={`${styles.form.input} h-40 font-mono`}
              placeholder="Copy and paste your transaction data here..."
              onPaste={handlePaste}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />

            {errors.length > 0 && (
              <div className={styles.patterns.errorContainer}>
                {errors.map((error, i) => (
                  <div key={i}>{error}</div>
                ))}
              </div>
            )}

            {parsedData.length > 0 && (
              <>
                <h3 className={styles.typography.h3}>Preview</h3>
                <div className="max-h-60 overflow-auto mt-2">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Source Account</th>
                        <th className="text-left p-2">Destination Account</th>
                        <th className="text-right p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((transaction, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{transaction.date}</td>
                          <td className="p-2">{transaction.description}</td>
                          <td className="p-2">{transaction.category}</td>
                          <td className="p-2">
                            <select
                              value={transaction.sourceAccount || ''}
                              onChange={(e) => handleAccountSelect(i, 'sourceAccount', e.target.value)}
                              className={styles.form.select}
                            >
                              <option value="">Select Source Account</option>
                              {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              value={transaction.destinationAccount || ''}
                              onChange={(e) => handleAccountSelect(i, 'destinationAccount', e.target.value)}
                              className={styles.form.select}
                            >
                              <option value="">Select Destination Account</option>
                              {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-right font-mono">
                            ${transaction.amount?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleImport}
                  disabled={importing}
                  className={`${styles.button.primary} w-full mt-4`}
                >
                  {importing 
                    ? 'Importing...' 
                    : `Import ${parsedData.length} Transactions`}
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function setErrors(arg0: string[]) {
  throw new Error('Function not implemented.');
}
