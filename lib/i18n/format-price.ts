// The one place a price becomes text: "359,00 zł" (pl / PLN), "€359.00" (en / EUR).
export function format_price(
  amount: string | number | null | undefined,
  currency: string | null | undefined,
  language: string,
): string {
  const value = Number(amount);
  if (amount == null || amount === "" || !Number.isFinite(value)) return "—";
  const options: Intl.NumberFormatOptions = currency
    ? { style: "currency", currency: currency.toUpperCase() }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return new Intl.NumberFormat(language, options).format(value);
}
