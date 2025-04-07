// src/components/AccountAdjustmentModal.tsx
'use client'

import React, { useState, useRef } from 'react';
import type { Account, AccountAdjustment } from '@/types/finance';
import { styles } from '@/styles/guide';

interface AccountAdjustmentModalProps {
  account: Account;
  onAdjust: (adjustment: Omit<AccountAdjustment, 'id'>) => void;
  onClose: () => void;
}

const AccountAdjustmentModal = ({
  account,
  onAdjust,
  onClose
}: AccountAdjustmentModalProps): React.ReactElement => {
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const adjustmentAmount = parseFloat(amount);

    if (isNaN(adjustmentAmount)) {
      return;
    }

    const adjustment: Omit<AccountAdjustment, 'id'> = {
      date: new Date().toISOString(),
      amount: adjustmentAmount,
      reason,
      previousBalance: account.balance,
      newBalance: account.balance + adjustmentAmount
    };

    onAdjust(adjustment);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Only auto-submit if not in the textarea
      if (e.target instanceof HTMLTextAreaElement) {
        return;
      }
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className={styles.form.formSection}
      onKeyDown={handleKeyDown}
    >
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Current Balance: ${account.balance.toFixed(2)}
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Adjustment Amount
        </label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${styles.form.input} text-black`}
          placeholder="Enter amount (negative for decrease)"
          required
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Reason for Adjustment
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={`${styles.form.input} text-black`}
          rows={3}
          placeholder="Explain the reason for this adjustment"
          required
        />
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className={`${styles.button.secondary} text-black`}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.button.primary}
        >
          Apply Adjustment
        </button>
      </div>
    </form>
  );
};

export default AccountAdjustmentModal;