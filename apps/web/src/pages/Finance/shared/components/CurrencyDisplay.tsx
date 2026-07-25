import { CURRENCY_SYMBOL } from '../constants/financeConstants';

type CurrencySize = 'sm' | 'md' | 'lg';

interface CurrencyDisplayProps {
  amount: string;
  size?: CurrencySize;
}

const sizeClass: Record<CurrencySize, string> = {
  sm: 'text-sm font-medium',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-bold',
};

export function CurrencyDisplay({ amount, size = 'md' }: CurrencyDisplayProps) {
  const isPlaceholder = amount === `${CURRENCY_SYMBOL}0` || amount === '₹0';

  return (
    <span className={`${sizeClass[size]} ${isPlaceholder ? 'text-slate-400' : 'text-slate-800'}`}>
      {amount}
    </span>
  );
}
