'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { styles } from '@/styles/guide';
import { useRouter } from 'next/navigation';

export function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              name: formData.name,
            },
          ]);

        if (profileError) throw profileError;

        router.push('/dashboard');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layout.pageContainer}>
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSignUp} className={styles.form.formSection}>
          <div>
            <label className={styles.form.label}>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={styles.form.input}
              required
            />
          </div>
          <div>
            <label className={styles.form.label}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={styles.form.input}
              required
            />
          </div>
          <div>
            <label className={styles.form.label}>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={styles.form.input}
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}