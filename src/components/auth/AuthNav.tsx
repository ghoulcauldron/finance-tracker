// src/components/auth/AuthNav.tsx
'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { styles } from '@/styles/guide';

export function AuthNav() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex justify-end p-4">
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button
            onClick={() => signOut()}
            className={styles.button.secondary}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}