type Price = [string] | [string, string];
// [0] = base price display string
// [1] = special/final price (only present when has_special_price)

function NORM_PRICE_DATA(price: any): Price {
  if (!price) return ["—"];
  const base = `${price.gross} ${price.currency}`;
  if (price.has_special_price && price.final_gross) {
    return [base, `${price.final_gross} ${price.currency}`];
  }
  return [base];
}

export { NORM_PRICE_DATA };
export type { Price };
