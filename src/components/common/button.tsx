import { styles } from "@/styles/guide";

// src/components/common/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary',
  icon,
  children,
  className,
  ...props
}) => {
  const baseStyle = styles.button[variant];
  const withIconStyle = icon ? styles.button.withIcon : '';
  
  return (
    <button 
      className={`${baseStyle} ${withIconStyle} ${className || ''}`}
      {...props}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </button>
  );
};