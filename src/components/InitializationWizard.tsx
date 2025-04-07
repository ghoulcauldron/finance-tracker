'use client'

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, ArrowRight } from 'lucide-react';
import type { UserProfile, Account, WizardProps } from '@/types/finance';
import { api } from '@/lib/api';

const InitializationWizard = ({ onComplete }: WizardProps): React.ReactElement => {
  const [step, setStep] = React.useState<number>(1);
  const [profiles, setProfiles] = React.useState<UserProfile[]>([]);
  const [tempAccount, setTempAccount] = React.useState<Partial<Account>>({});

  const handleAddProfile = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProfile: UserProfile = {
      id: crypto.randomUUID(),
      name: String(formData.get('name')),
      accounts: []
    };
    setProfiles([...profiles, newProfile]);
    setStep(2);
  };

  const handleAddAccount = async (userId: string): Promise<void> => {
    if (!tempAccount.name) return;
    
    try {
      // Create account in Supabase
      const accountData = {
        name: tempAccount.name,
        type: tempAccount.type || 'checking',
        balance: tempAccount.balance || 0,
        purpose: tempAccount.purpose,
        isshared: tempAccount.isshared || false,
        owner: userId
      };

      const newAccount = await api.accounts.create(accountData);
      
      // Update local state
      setProfiles(profiles.map(profile => 
        profile.id === userId 
          ? { ...profile, accounts: [...profile.accounts, newAccount] }
          : profile
      ));
      setTempAccount({});
    } catch (error) {
      console.error('Error creating account:', error);
      // You might want to add error handling UI here
    }
  };

  const renderProfileSetup = (): React.ReactElement => (
    <form 
      onSubmit={handleAddProfile} 
      className="space-y-4"
    >
      <div className="space-y-2">
        <input
          name="name"
          type="text"
          placeholder="Your Name"
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <button 
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded"
      >
        Continue
      </button>
    </form>
  );

  const renderAccountSetup = (): React.ReactElement => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Account Setup</h3>
      {profiles.map(profile => (
        <div key={profile.id} className="space-y-4">
          <h4 className="font-medium">{profile.name}&apos;s Accounts</h4>
          <div className="grid gap-4">
            {profile.accounts.map(account => (
              <div key={account.id} className="p-2 border rounded">
                <p className="font-semibold">{account.name}</p>
                <p className="text-sm text-gray-600">
                  {account.type} - {account.purpose || 'No purpose set'}
                </p>
              </div>
            ))}
            <form 
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                handleAddAccount(profile.id);
              }}
              className="grid grid-cols-2 gap-2"
            >
              <input
                type="text"
                placeholder="Account Name"
                className="p-2 border rounded"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempAccount({
                  ...tempAccount,
                  name: e.target.value
                })}
                value={tempAccount.name || ''}
              />
              <select
                className="p-2 border rounded"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTempAccount({
                  ...tempAccount,
                  type: e.target.value as Account['type']
                })}
                value={tempAccount.type || 'checking'}
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit</option>
                <option value="investment">Investment</option>
                <option value="custom">Custom</option>
              </select>
              <input
                type="number"
                placeholder="Initial Balance"
                className="p-2 border rounded"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempAccount({
                  ...tempAccount,
                  balance: Number(e.target.value)
                })}
                value={tempAccount.balance || ''}
              />
              <input
                type="text"
                placeholder="Purpose (optional)"
                className="p-2 border rounded"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempAccount({
                  ...tempAccount,
                  purpose: e.target.value
                })}
                value={tempAccount.purpose || ''}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempAccount({
                    ...tempAccount,
                    isshared: e.target.checked
                  })}
                  checked={tempAccount.isshared || false}
                />
                Shared Account
              </label>
              <button 
                type="submit"
                className="bg-green-500 text-white p-2 rounded"
              >
                Add Account
              </button>
            </form>
          </div>
        </div>
      ))}
      <button
        onClick={() => {
          setStep(3);
          onComplete({ profiles, accounts: profiles.flatMap(p => p.accounts) });
        }}
        className="w-full bg-blue-500 text-white p-2 rounded mt-4"
      >
        Complete Setup
      </button>
    </div>
  );

  const renderStep = (): React.ReactElement | null => {
    switch(step) {
      case 1:
        return renderProfileSetup();
      case 2:
        return renderAccountSetup();
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Setup Your Finance Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        {renderStep()}
      </CardContent>
    </Card>
  );
};

export default InitializationWizard;