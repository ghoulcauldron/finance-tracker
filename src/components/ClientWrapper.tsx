'use client'

import React from 'react';
import FinanceTracker from './FinanceTracker';
import { AuthProvider } from '@/contexts/AuthContext';

export default function ClientWrapper() {
  return (
    <AuthProvider>
      <FinanceTracker />
    </AuthProvider>
  );
}