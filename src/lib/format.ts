const currencyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD'
});

export function formatMoney(value: number | null | undefined): string {
	return value != null ? currencyFormatter.format(value) : '—';
}
