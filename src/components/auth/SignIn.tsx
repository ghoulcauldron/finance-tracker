'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { styles } from '@/styles/guide';
import { useAuth } from '@/contexts/AuthContext';

export function SignIn() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      router.push('/'); // Redirect to main page after sign in
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className={styles.form.formSection}>
            <div>
              <label className={styles.form.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.form.input}
                required
              />
            </div>
            <div>
              <label className={styles.form.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.form.input}
                required
              />
            </div>
            {error && (
              <div className={styles.patterns.errorContainer}>{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className={styles.button.primary}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}