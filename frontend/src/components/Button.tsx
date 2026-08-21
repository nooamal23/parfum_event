import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  loading?: boolean;
}

export default function Button({ variant = 'primary', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const base = 'rounded-lg px-6 py-3 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed';
  const styles =
    variant === 'primary'
      ? 'bg-primary text-surface shadow-card hover:bg-primary-dark'
      : 'border border-primary text-primary hover:bg-lavender-100';

  return (
    <button className={`${base} ${styles} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? 'Envoi en cours…' : children}
    </button>
  );
}
