// src/types/finance.ts
export type TransactionType = 'Income' | 'Expense' | 'Reimbursement' | 'Transfer';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  sourceAccount: string;
  destinationAccount: string;
  isEdited: boolean;
  editHistory: TransactionEdit[];
  created_at?: string;
  owner_id?: string;
  isJoint?: boolean;
}
  
  export interface TransactionEdit {
    id: string;
    date: string;
    field: string;
    oldValue: any;
    newValue: any;
    editor: string;
  }
  
  export interface Account {
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'investment' | 'custom';
    balance: number;
    purpose?: string;
    isshared?: boolean;
    owner: string;
    transactions: Transaction[];
    adjustmentHistory: AccountAdjustment[];
  }
  
  export interface AccountAdjustment {
    id: string;
    date: string;
    amount: number;
    reason: string;
    previousBalance: number;
    newBalance: number;
  }
  
  export interface UserProfile {
    id: string;
    name: string;
    accounts: Account[];
    sharedExpensePartner?: string;
  }
  
  export interface WizardProps {
    onComplete: (userData: {
      profiles: UserProfile[];
      accounts: Account[];
    }) => void;
  }