export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold transition-colors';
  const variants = {
    primary: 'bg-brand hover:bg-brand-dark text-white',
    ghost: 'border border-gray-700 hover:border-white text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
