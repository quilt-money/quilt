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
