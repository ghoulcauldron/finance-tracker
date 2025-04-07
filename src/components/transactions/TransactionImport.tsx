'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { styles } from '@/styles/guide';
import Papa from 'papaparse';
import { api } from '@/lib/api';
import type { Transaction, TransactionType } from '@/types/finance';
import { transactionProcessor } from '@/utils/transactionProcessing';
import { categoryRules } from '@/utils/transactionProcessing'; // Import categoryRules

interface FieldMapping {
  date: string;
  amount: string;
  description: string;
  category: string;
  type: string;
}

interface ImportPreview {
  data: Record<string, any>[];
  headers: string[];
  mappedData: Partial<Transaction>[];
  errors: string[];
}

export function TransactionImport({ onClose }: { onClose: () => void }) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        
        // Try to auto-map fields
        const mapping: FieldMapping = {
          date: headers.find(h => /date/i.test(h)) || '',
          amount: headers.find(h => /amount|sum|total/i.test(h)) || '',
          description: headers.find(h => /description|memo|note/i.test(h)) || '',
          category: headers.find(h => /category|type/i.test(h)) || '',
          type: headers.find(h => /type|transaction.*type/i.test(h)) || '',
        };

        setFieldMapping(mapping);
        setPreview({
          data: results.data as Record<string, any>[],
          headers,
          mappedData: [],
          errors: results.errors.map(err => err.message),
        });
        setLoading(false);
      },
      error: (error) => {
        setPreview({
          data: [],
          headers: [],
          mappedData: [],
          errors: [error.message],
        });
        setLoading(false);
      },
    });
  };

  const handleMapFields = () => {
    if (!preview || !fieldMapping) return;
  
    const mappedData = preview.data
      .map((row, index) => {
        try {
          const rawTransaction = {
            date: row[fieldMapping.date],
            amount: row[fieldMapping.amount],
            description: row[fieldMapping.description],
            category: row[fieldMapping.category],
            type: row[fieldMapping.type],
          };
  
          return transactionProcessor.validateTransaction(rawTransaction);
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Unknown validation error';
          
          setPreview(prev => {
            if (!prev) return null;
            return {
              ...prev,
              errors: [...prev.errors, `Row ${index + 1}: ${errorMessage}`]
            };
          });
          return null;
        }
      })
      .filter((transaction): transaction is Partial<Transaction> => transaction !== null);
  
    setPreview(prev => prev ? { ...prev, mappedData } : null);
  };

  const handleBulkImport = async () => {
    if (!preview?.mappedData?.length) return;

    setImporting(true);
    try {
      const batchSize = 50;
      for (let i = 0; i < preview.mappedData.length; i += batchSize) {
        const batch = preview.mappedData.slice(i, i + batchSize);
        await Promise.all(
          batch.map(transaction => 
            api.transactions.create(transaction as Omit<Transaction, 'id' | 'created_at'>)
          )
        );
      }
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      // Handle error
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <Card className="w-full max-w-4xl m-4">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Import Transactions</CardTitle>
          <button onClick={onClose} className={styles.button.iconButton}>×</button>
        </CardHeader>
        <CardContent>
          <div className={styles.form.formSection}>
            {/* File Upload */}
            <div>
              <label className={styles.form.label}>Upload CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className={styles.form.input}
                disabled={loading || importing}
              />
            </div>

            {/* Field Mapping */}
            {preview && fieldMapping && (
              <div className="mt-4">
                <h3 className={styles.typography.h3}>Map Fields</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {Object.entries(fieldMapping).map(([field, value]) => (
                    <div key={field}>
                      <label className={styles.form.label}>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <select
                        value={value}
                        onChange={(e) => setFieldMapping(prev => 
                          prev ? { ...prev, [field]: e.target.value } : null
                        )}
                        className={styles.form.select}
                      >
                        <option value="">Select field</option>
                        {preview.headers.map(header => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleMapFields}
                  className={`${styles.button.secondary} mt-4`}
                >
                  Preview Mapping
                </button>
              </div>
            )}

            {/* Data Preview */}
            {preview && preview.mappedData && preview.mappedData.length > 0 && (
              <div className="mt-4">
                <h3 className={styles.typography.h3}>Preview</h3>
                <div className="max-h-60 overflow-auto mt-2">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.mappedData.map((row, i) => (
                        <tr key={i} className={editingRow === i ? 'bg-blue-50' : ''}>
                          <td>{row.date}</td>
                          <td>{row.amount}</td>
                          <td>{row.description}</td>
                          <td>
                            {editingRow === i ? (
                              <select
                                value={row.category || ''}
                                onChange={(e) => {
                                  // Explicit null check
                                  if (preview) {
                                    const updatedData = [...preview.mappedData];
                                    updatedData[i] = { ...row, category: e.target.value };
                                    setPreview(prev => prev ? { ...prev, mappedData: updatedData } : null);
                                  }
                                }}
                                className={styles.form.select}
                              >
                                <option value="Uncategorized">Uncategorized</option>
                                {Array.from(new Set(categoryRules.map(rule => rule.category))).map(category => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                            ) : (
                              <div onClick={() => setEditingRow(i)} className="cursor-pointer">
                                {row.category || 'Uncategorized'}
                              </div>
                            )}
                          </td>
                          <td>{row.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={handleBulkImport}
                  disabled={importing}
                  className={`${styles.button.primary} w-full mt-4`}
                >
                  {importing ? 'Importing...' : `Import ${preview.mappedData.length} Transactions`}
                </button>
              </div>
            )}

            {/* Errors */}
            {preview && preview.errors && preview.errors.length > 0 && (
              <div className={styles.patterns.errorContainer}>
                {preview.errors.map((error, i) => (
                  <div key={i}>{error}</div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}