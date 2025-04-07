'use client'

import React, { useState } from 'react';  // Add useState import
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Account, UserProfile } from '@/types/finance';
import ErrorAlert from './ErrorAlert';

interface AccountEditFormProps {
  account: Account;
  profiles: UserProfile[];
  onSubmit: (accountId: string, updates: Partial<Account>) => void;
  onCancel: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

const AccountEditForm = ({ 
  account, 
  profiles, 
  onSubmit, 
  onCancel 
}: AccountEditFormProps): React.ReactElement => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateAccount = (updates: Partial<Account>): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (updates.name && updates.name.trim().length < 2) {
      errors.name = 'Account name must be at least 2 characters';
    }

    if (updates.balance !== undefined && isNaN(updates.balance)) {
      errors.balance = 'Balance must be a valid number';
    }

    if (updates.type && !['checking', 'savings', 'credit', 'investment', 'custom'].includes(updates.type)) {
      errors.type = 'Invalid account type';
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const updates: Partial<Account> = {
      name: formData.get('name') as string,  // Type assertion
      type: formData.get('type') as Account['type'],
      purpose: formData.get('purpose') as string,
      isshared: Boolean(formData.get('isshared')),
      owner: formData.get('owner') as string
    };

    const validationErrors = validateAccount(updates);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(account.id, updates);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Account: {account.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(errors).map(([field, errorMessage]) => (
          <ErrorAlert
            key={field}
            message={errorMessage}
            onDismiss={() => setErrors((prev: ValidationErrors) => {
              const { [field]: _, ...rest } = prev;
              return rest;
            })}
          />
        ))}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                name="name"
                type="text"
                defaultValue={account.name}
                className="p-2 border rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                name="type"
                defaultValue={account.type}
                className="p-2 border rounded w-full"
                required
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit</option>
                <option value="investment">Investment</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Purpose</label>
              <input
                name="purpose"
                type="text"
                defaultValue={account.purpose}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Owner</label>
              <select
                name="owner"
                defaultValue={account.owner}
                className="p-2 border rounded w-full"
                required
              >
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  name="isshared"
                  type="checkbox"
                  defaultChecked={account.isshared}
                />
                Shared Account
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AccountEditForm;