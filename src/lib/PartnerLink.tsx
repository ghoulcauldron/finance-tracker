'use client';

import { useState } from 'react';
import { usePartnerLink } from '@/hooks/usePartnerLink';
import { styles } from '@/styles/guide';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function PartnerLink() {
  const [email, setEmail] = useState('');
  const { linkPartner, loading, error } = usePartnerLink();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await linkPartner(email);
      setEmail('');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link Partner Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form.formSection}>
          <div>
            <label className={styles.form.label}>
              Partner's Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.form.input}
              placeholder="Enter your partner's email"
              required
            />
          </div>
          {error && (
            <div className={styles.patterns.errorContainer}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`${styles.button.primary} w-full`}
          >
            {loading ? 'Linking...' : 'Link Partner'}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}