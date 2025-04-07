'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PartnerLink } from './profile/PartnerLink';
import { TransactionImport } from './transactions/TransactionImport';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { styles } from '@/styles/guide';

export function Dashboard() {
  const [showImport, setShowImport] = useState(false);
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, loading: transactionsLoading } = useTransactions();

  return (
    <div className={styles.layout.pageContainer}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => setShowImport(true)}
            className={`${styles.button.primary} ${styles.button.withIcon}`}
          >
            Import Transactions
          </button>
        </div>

        {/* Partner Link Section (show only if no partner linked) */}
        <PartnerLink />

        {/* Transaction Import Modal */}
        {showImport && (
          <TransactionImport onClose={() => setShowImport(false)} />
        )}
      </div>
    </div>
  );
}