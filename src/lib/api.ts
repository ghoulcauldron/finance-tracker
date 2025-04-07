import { supabase } from './supabase';
import type { Account, Transaction } from '@/types/finance';

// Interface to match database schema
interface DbTransaction {
  id: string;
  date: string;
  amount: number;
  type: Transaction['type'];
  description: string;
  category: string;
  source_account_id: string | null;
  destination_account_id: string | null;
  owner_id: string;
  is_joint: boolean;
  created_at?: string;
}

// Convert from our app interface to database schema
function toDbTransaction(transaction: Partial<Transaction>): Partial<DbTransaction> {
  return {
    date: transaction.date,
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
    category: transaction.category,
    source_account_id: transaction.sourceAccount,
    destination_account_id: transaction.destinationAccount,
    is_joint: transaction.isJoint,
    owner_id: transaction.owner_id
  };
}

// Convert from database schema to our app interface
function fromDbTransaction(dbTransaction: DbTransaction): Transaction {
  return {
    id: dbTransaction.id,
    date: dbTransaction.date,
    amount: dbTransaction.amount,
    type: dbTransaction.type,
    description: dbTransaction.description,
    category: dbTransaction.category,
    sourceAccount: dbTransaction.source_account_id || '',
    destinationAccount: dbTransaction.destination_account_id || '',
    isEdited: false,
    editHistory: [],
    created_at: dbTransaction.created_at,
    owner_id: dbTransaction.owner_id,
    isJoint: dbTransaction.is_joint
  };
}

export const api = {
  // Profile functions
  profiles: {
    async get() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },

    async update(profile: { name: string; partner_id?: string }) {
      const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .single();
      if (error) throw error;
      return data;
    },

    async linkPartner(partnerId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ partner_id: partnerId })
        .single();
      if (error) throw error;
      return data;
    },
  },

  // Account functions
// In api.ts - accounts object
accounts: {
  async list() {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }

    return data;
  },

  async create(account: Omit<Account, 'id' | 'transactions' | 'adjustmentHistory'>) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
  
      console.log('Creating account with data:', {
        name: account.name,
        type: account.type,
        balance: account.balance,
        purpose: account.purpose || null,
        isshared: account.isshared || false,  // Using "isshared" to match DB column
        owner_id: session.user.id
      });
  
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          name: account.name,
          type: account.type,
          balance: account.balance,
          purpose: account.purpose || null,
          isshared: account.isshared || false,  // Using "isshared" to match DB column
          owner_id: session.user.id
        }])
        .select()
        .single();
  
      if (error) {
        console.error('Account creation error:', error);
        throw error;
      }
  
      return {
        ...data,
        transactions: [],
        adjustmentHistory: []
      };
    } catch (error) {
      console.error('Account creation error:', error);
      throw error;
    }
    },

    async update(id: string, updates: Partial<Account>) {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  // Transaction functions
  transactions: {
    async list(filters?: {
      startDate?: string;
      endDate?: string;
      accountId?: string;
      category?: string;
      isJoint?: boolean;
    }) {
      try {
        let query = supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (filters?.startDate) {
          query = query.gte('date', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('date', filters.endDate);
        }
        if (filters?.accountId) {
          query = query.or(`source_account_id.eq.${filters.accountId},destination_account_id.eq.${filters.accountId}`);
        }
        if (filters?.category) {
          query = query.eq('category', filters.category);
        }
        if (filters?.isJoint !== undefined) {
          query = query.eq('is_joint', filters.isJoint);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Transactions list error:', error);
          throw error;
        }

        return (data || []).map(fromDbTransaction);
      } catch (error) {
        console.error('Transactions list error:', error);
        throw error;
      }
    },

    async create(transaction: Omit<Transaction, 'id' | 'created_at'>) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        // Check for existing transaction
        const { data: existingData } = await supabase
          .from('transactions')
          .select('*')
          .eq('date', transaction.date)
          .eq('amount', transaction.amount)
          .eq('description', transaction.description)
          .eq('owner_id', session.user.id)
          .maybeSingle();

        if (existingData) {
          const error = new Error('Duplicate transaction detected');
          error.name = 'DuplicateTransaction';
          throw error;
        }

        const dbTransaction = toDbTransaction({
          ...transaction,
          owner_id: session.user.id
        });

        const { data, error } = await supabase
          .from('transactions')
          .insert([dbTransaction])
          .select()
          .single();

        if (error) {
          console.error('Transaction creation error:', error);
          throw error;
        }

        return fromDbTransaction(data);
      } catch (error) {
        console.error('Transaction creation error:', error);
        throw error;
      }
    },

    async update(id: string, updates: Partial<Transaction>) {
      const dbUpdates = toDbTransaction(updates);
      const { data, error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return fromDbTransaction(data);
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    },

    async reconcile(id: string, isVerified: boolean, notes?: string) {
      const { data, error } = await supabase
        .from('reconciliation_entries')
        .upsert({
          transaction_id: id,
          is_verified: isVerified,
          notes,
          verification_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
  },
};