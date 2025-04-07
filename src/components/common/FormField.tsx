import { styles } from "@/styles/guide";

// src/components/common/FormField.tsx
interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children
}) => {
  return (
    <div className={styles.form.formSection}>
      <label className={styles.form.label}>{label}</label>
      {children}
      {error && <span className={styles.patterns.errorText}>{error}</span>}
    </div>
  );
};