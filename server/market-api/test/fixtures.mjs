// SYNTHETIC official-shape test fixtures. Never imported by production code.
export const NOW = Date.parse('2026-10-16T12:00:00.000Z');
export function fixture(kind, { setNum = '21322-1', condition = 'N', country = 'GLOBAL' } = {}) {
  const sale = (date, value, quantity = 1) => ({ quantity, unit_price: value,
    date_ordered: date, seller_country_code: country === 'KR' ? 'KR' : 'US', buyer_country_code: 'GB' });
  const recent = sale('2026-10-14T08:00:00.000Z', '200.0000');
  return { meta: { code: 200, message: 'OK', description: 'Synthetic fixture' }, data: {
    item: { no: setNum, type: 'SET' }, new_or_used: condition, currency_code: 'KRW',
    min_price: kind === 'sold' ? '100.0000' : '90.0000', max_price: '900.0000',
    avg_price: '350.0000', qty_avg_price: '125.0000', unit_quantity: kind === 'sold' ? 4 : 2, total_quantity: kind === 'sold' ? 13 : 3,
    price_detail: kind === 'sold' ? [sale('2026-10-15T08:00:00.000Z', '100.0000', 10), recent, { ...recent },
      sale('2026-08-01T08:00:00.000Z', '900.0000'), sale('2027-01-01T08:00:00.000Z', '999.0000'), sale('2026-10-14T08:00:00.000Z', 'invalid')]
      : [{ quantity: 2, unit_price: '90.0000', shipping_available: true }, { quantity: 1, unit_price: '150.0000', shipping_available: false }],
  } };
}
export function mockTransport({ calls = [], respond } = {}) {
  return async (input, options) => {
    const url = new URL(input);
    calls.push({ url, options });
    const result = respond ? await respond(url, options) : fixture(url.searchParams.get('guide_type'), {
      setNum: decodeURIComponent(url.pathname.split('/').at(-2)), condition: url.searchParams.get('new_or_used'), country: url.searchParams.get('country_code') || 'GLOBAL',
    });
    return { status: 200, ok: true, text: async () => JSON.stringify(result) };
  };
}
