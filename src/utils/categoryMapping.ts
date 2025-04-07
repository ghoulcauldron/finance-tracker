interface CategoryRule {
  pattern: RegExp;
  category: string;
  type: 'income' | 'expense' | 'transfer' | 'reimbursement';
}

export const categoryRules: CategoryRule[] = [
  // Income patterns
  { 
    pattern: /payroll|salary|direct deposit/i,
    category: 'Salary',
    type: 'income'
  },
  { 
    pattern: /dividend|interest/i,
    category: 'Investment Income',
    type: 'income'
  },

  // Food & Dining
  {
    pattern: /restaurant|grubhub|doordash|uber eats|seamless/i,
    category: 'Dining Out',
    type: 'expense'
  },
  {
    pattern: /grocery|trader|whole foods|safeway|food/i,
    category: 'Groceries',
    type: 'expense'
  },

  // Transportation
  {
    pattern: /uber|lyft|taxi|transit|metro|subway/i,
    category: 'Transportation',
    type: 'expense'
  },
  {
    pattern: /gas|shell|chevron|exxon/i,
    category: 'Gas',
    type: 'expense'
  },

  // Utilities & Bills
  {
    pattern: /electric|water|gas bill|utility/i,
    category: 'Utilities',
    type: 'expense'
  },
  {
    pattern: /netflix|spotify|hulu|disney\+|apple|subscription/i,
    category: 'Subscriptions',
    type: 'expense'
  },
  {
    pattern: /internet|wifi|broadband|comcast|verizon|at&t/i,
    category: 'Internet',
    type: 'expense'
  },

  // Shopping
  {
    pattern: /amazon|target|walmart|costco/i,
    category: 'Shopping',
    type: 'expense'
  },

  // Transfers & Reimbursements
  {
    pattern: /(?:(?:zelle|venmo|paypal).+(?:transfer|payment|send))|(?:(?:transfer|payment|send).+(?:zelle|venmo|paypal))/i,
    category: 'Transfer',
    type: 'transfer'
  },
  {
    pattern: /reimbursement|rebate|refund/i,
    category: 'Reimbursement',
    type: 'reimbursement'
  }
];

export function categorizeTransaction(description: string): { category: string; type: string } {
  for (const rule of categoryRules) {
    if (rule.pattern.test(description)) {
      return { category: rule.category, type: rule.type };
    }
  }
  
  return { category: 'Uncategorized', type: 'expense' };
}