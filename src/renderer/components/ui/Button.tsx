import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variantStyles = {
      primary: 
        'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors',
      outline:
        'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors',
      ghost:
        'hover:bg-accent hover:text-accent-foreground transition-colors',
      danger: 
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm', // 20px leading + 6px padding + 6px = 32px height
      md: 'px-6 py-2.5 text-sm', // 20px leading + 10px padding + 10px = 40px height
      lg: 'px-8 py-3.5 text-base', // 24px leading + 14px padding + 14px = ~52px height
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
