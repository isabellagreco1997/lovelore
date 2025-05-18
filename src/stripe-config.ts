export interface Product {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const products: Product[] = [
  {
    id: 'prod_SKnfEBbc4Xh5wK',
    priceId: 'price_1RQ84GA5F3yID83zA886qepx',
    name: 'Lovelore One-Month Pass',
    description: '£5.99 one-time payment, no subscription, no auto-renew, 30 days of unlimited reading, try it out with zero commitment',
    mode: 'payment'
  },
  {
    id: 'prod_SKnaBDpQOCp1Bu',
    priceId: 'price_1RQ7zdA5F3yID83zkNUSPBfu',
    name: 'Lovelore Yearly Plan',
    description: '£47.99/year 💸 (~£4/month — Save 60%!)',
    mode: 'subscription'
  },
  {
    id: 'prod_SKnYHgSVzHufai',
    priceId: 'price_1RQ7xKA5F3yID83zA3CX9OxY',
    name: 'Lovelore Monthly Plan',
    description: '£7.99/month',
    mode: 'subscription'
  }
];

export const getProduct = (priceId: string): Product | undefined => {
  return products.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};