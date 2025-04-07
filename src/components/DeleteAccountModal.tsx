'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, X } from 'lucide-react';
import type { Account } from '@/types/finance';

interface DeleteAccountModalProps {
  account: Account;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteAccountModal = ({
  account,
  onConfirm,
  onCancel
}: DeleteAccountModalProps): React.ReactElement => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle />
            Delete Account
          </CardTitle>
          <button onClick={onCancel}>
            <X size={24} />
          </button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Are you sure you want to delete the account: <strong>{account.name}</strong>?</p>
            <p className="text-gray-600">
              This action cannot be undone. All associated transactions and adjustment history will be permanently deleted.
            </p>
            {account.balance !== 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-yellow-700">
                  Warning: This account has a balance of ${account.balance.toFixed(2)}. 
                  Please ensure all funds are properly accounted for before deletion.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-4 pt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Delete Account
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeleteAccountModal;