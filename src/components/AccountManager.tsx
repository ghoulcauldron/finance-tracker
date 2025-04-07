'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Edit, Calculator } from 'lucide-react';
import type { Account, AccountAdjustment } from '@/types/finance';

interface AccountManagerProps {
  accounts: Account[];
  onAccountAdd: (account: Omit<Account, 'id'>) => void;
  onAccountEdit: (id: string, updates: Partial<Account>) => void;
  onBalanceAdjust: (id: string, adjustment: Omit<AccountAdjustment, 'id'>) => void;
}

const AccountManager = ({
  accounts,
  onAccountAdd,
  onAccountEdit,
  onBalanceAdjust
}: AccountManagerProps): React.ReactElement => {
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [adjustmentMode, setAdjustmentMode] = useState(false);

  const handleAdjustment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAccount) return;

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const reason = String(formData.get('reason'));
    const account = accounts.find(a => a.id === selectedAccount);

    if (account) {
      onBalanceAdjust(selectedAccount, {
        date: new Date().toISOString(),
        amount,
        reason,
        previousBalance: account.balance,
        newBalance: account.balance + amount
      });
      setAdjustmentMode(false);
      setSelectedAccount(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Account Management</h2>
        <button
          onClick={() => setIsAddingAccount(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          <Plus size={20} />
          Add Account
        </button>
      </div>

      {isAddingAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                onAccountAdd({
                  name: String(formData.get('name')),
                  type: formData.get('type') as Account['type'],
                  balance: Number(formData.get('balance')),
                  owner: String(formData.get('owner')),
                  purpose: String(formData.get('purpose')),
                  isshared: Boolean(formData.get('isshared')),
                  transactions: [],
                  adjustmentHistory: []
                });
                setIsAddingAccount(false);
              }}
              className="space-y-4"
            >
              <input
                name="name"
                type="text"
                placeholder="Account Name"
                className="w-full p-2 border rounded"
                required
              />
              <select
                name="type"
                className="w-full p-2 border rounded"
                required
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit</option>
                <option value="investment">Investment</option>
                <option value="custom">Custom</option>
              </select>
              <input
                name="balance"
                type="number"
                step="0.01"
                placeholder="Initial Balance"
                className="w-full p-2 border rounded"
                required
              />
              <input
                name="purpose"
                type="text"
                placeholder="Purpose (optional)"
                className="w-full p-2 border rounded"
              />
              <label className="flex items-center gap-2">
                <input
                  name="isshared"
                  type="checkbox"
                />
                Shared Account
              </label>
              <button
                type="submit"
                className="w-full bg-green-500 text-white p-2 rounded"
              >
                Add Account
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {adjustmentMode && selectedAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Adjust Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdjustment} className="space-y-4">
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="Adjustment Amount"
                className="w-full p-2 border rounded"
                required
              />
              <input
                name="reason"
                type="text"
                placeholder="Reason for Adjustment"
                className="w-full p-2 border rounded"
                required
              />
              <button
                type="submit"
                className="w-full bg-green-500 text-white p-2 rounded"
              >
                Apply Adjustment
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{account.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAccount(account.id);
                      setAdjustmentMode(true);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-500"
                  >
                    <Calculator size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAccount(account.id);
                      setIsAddingAccount(false);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-500"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-black">
                ${account.balance.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                {account.type} {account.isshared ? '(Shared)' : ''}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AccountManager;