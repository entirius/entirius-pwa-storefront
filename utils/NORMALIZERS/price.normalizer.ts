// Amounts stay raw strings; the text is made at render time by i18n.price(amount, currency), so the
// active language decides the separators and the currency symbol.
type Price = {
  gross: string;
  currency: string;
  // Only present when a special price applies.
  final_gross?: string;
};

function NORM_PRICE_DATA(price: any): Price | null {
  if (!price) return null;
  const { gross, currency, final_gross, has_special_price } = price;
  return {
    gross,
    currency,
    ...(has_special_price && final_gross ? { final_gross } : {}),
  };
}

export { NORM_PRICE_DATA };
export type { Price };
