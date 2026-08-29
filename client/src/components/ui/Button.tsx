import { cn } from '../../lib/utils';
import { useErrorModal } from '../../context/ErrorContext';
import type { ErrorCode } from '../../lib/errorMessages';

type ButtonVariant = 'filter' | 'sort' | 'search' | 'primary' | 'weight' | 'selected';

type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    disabledReason?: ErrorCode;
    className?: string;
    'aria-pressed'?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  filter:' text-lg font-medium hover:bg-opacity-90 p-3 underline underline-offset-5',
  sort: 'px-2 hover:underline hover:underline-offset-3',
  search: 'border-3 px-3 py-1 hover:bg-black hover:text-white',
  weight: 'm-1 px-1.5 p-1',
  primary: 'px-3 mb-1 text-lg hover:underline hover:underline-offset-5',
  selected: 'text-sm hover:line-through'
};

export const Button = ({children, onClick, variant = 'filter', disabled, disabledReason, className, 'aria-pressed': ariaPressed}: ButtonProps ) => {
    const { showError } = useErrorModal();

    const handleClick = () => {
        if (disabled && disabledReason) {
            showError(disabledReason);
            return;
        }
        onClick?.();
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled && !disabledReason}
            aria-disabled={disabled}
            aria-pressed={ariaPressed}
            className={cn(
                'p-2 disabled:opacity-50 disabled:cursor-not-allowed',
                disabled && disabledReason && 'opacity-50 cursor-not-allowed',
                variantStyles[variant],
                className
            )}
        >
            {children}
            {variant === 'selected' && <span className="sm:hidden ml-1" aria-hidden="true">×</span>}
        </button>
    );
};

