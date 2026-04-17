// Default position limits per product. Prosperity changes products every
// season — to add a season, edit this map (or the user can override per
// product at runtime via the position-chart panel controls).
const KNOWN_LIMITS: Record<string, number> = {
  // Prosperity 4
  ASH_COATED_OSMIUM: 50,
  INTARIAN_PEPPER_ROOT: 50,
  // Prosperity 3
  RAINFOREST_RESIN: 50,
  KELP: 50,
  SQUID_INK: 50,
  CROISSANTS: 250,
  JAMS: 350,
  DJEMBES: 60,
  PICNIC_BASKET1: 60,
  PICNIC_BASKET2: 100,
  VOLCANIC_ROCK: 400,
  VOLCANIC_ROCK_VOUCHER_9500: 200,
  VOLCANIC_ROCK_VOUCHER_9750: 200,
  VOLCANIC_ROCK_VOUCHER_10000: 200,
  VOLCANIC_ROCK_VOUCHER_10250: 200,
  VOLCANIC_ROCK_VOUCHER_10500: 200,
  MAGNIFICENT_MACARONS: 75,
  // Prosperity 2 / 1 era
  AMETHYSTS: 20,
  STARFRUIT: 20,
  ORCHIDS: 100,
  CHOCOLATE: 250,
  STRAWBERRIES: 350,
  ROSES: 60,
  GIFT_BASKET: 60,
  COCONUT: 300,
  COCONUT_COUPON: 600,
};

export function defaultLimit(product: string): number {
  return KNOWN_LIMITS[product] ?? 50;
}

export function buildLimits(products: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of products) out[p] = defaultLimit(p);
  return out;
}
