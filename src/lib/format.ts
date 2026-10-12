const currencyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD'
});

export function formatMoney(value: number | null | undefined): string {
	return value != null ? currencyFormatter.format(value) : '—';
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'medium',
	timeStyle: 'short'
});

export function formatDateTime(value: string | null | undefined): string {
	return value ? dateTimeFormatter.format(new Date(value)) : 'Never';
}

export function formatPercent(value: number | null | undefined): string {
	return value != null ? `${value.toFixed(2)}%` : '—';
}

/** Tailwind text color for a gain (green) or loss (red); neutral when zero or unknown. */
export function gainLossClass(value: number | null | undefined): string {
	if (value == null || value === 0) return 'text-muted-foreground';
	return value > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
}
