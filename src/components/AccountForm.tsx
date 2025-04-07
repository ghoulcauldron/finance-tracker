'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Account, UserProfile } from '@/types/finance';
import { api } from '@/lib/api';

interface AccountFormProps {
  onSubmit: (account: Omit<Account, 'id' | 'transactions' | 'adjustmentHistory'>) => void;
  onCancel: () => void;
  profiles: UserProfile[];
}

const AccountForm = ({ onSubmit, onCancel, profiles }: AccountFormProps): React.ReactElement => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError(null);
  setIsSubmitting(true);
  
  try {
    const formData = new FormData(e.currentTarget);
    const accountData = {
      name: String(formData.get('name')),
      type: formData.get('type') as Account['type'],
      balance: Number(formData.get('balance')),
      purpose: String(formData.get('purpose')),
      isshared: Boolean(formData.get('isshared')),
      owner: String(formData.get('owner'))
    };

    console.log('Submitting account data:', accountData);

    // Create in Supabase first
    await api.accounts.create(accountData);
    
    // Then update local state
    onSubmit(accountData);
  } catch (error) {
    console.error('Error creating account:', error);
    setError(error instanceof Error ? error.message : 'Failed to create account');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Account</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              name="name"
              type="text"
              placeholder="Account Name"
              className="p-2 border rounded"
              required
            />
            <select
              name="type"
              className="p-2 border rounded"
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
              className="p-2 border rounded"
              required
            />
            <input
              name="purpose"
              type="text"
              placeholder="Purpose (optional)"
              className="p-2 border rounded"
            />
            <select
              name="owner"
              className="p-2 border rounded"
              required
            >
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2">
              <input
                name="isshared"
                type="checkbox"
              />
              Shared Account
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Add Account'}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AccountForm;