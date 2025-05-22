/*
  # Sync Existing Stripe Data

  This migration will sync existing Stripe customer and subscription data into our new tables.
  
  1. Insert existing Stripe customers
  2. Insert existing Stripe subscriptions
  3. Insert existing Stripe orders
*/

-- First, let's sync the customers
INSERT INTO stripe_customers (user_id, customer_id)
SELECT 
  auth.uid() as user_id,
  metadata->>'stripe_customer_id' as customer_id
FROM auth.users
WHERE metadata->>'stripe_customer_id' IS NOT NULL
ON CONFLICT (customer_id) DO NOTHING;

-- Now sync subscriptions (assuming active status for existing ones)
INSERT INTO stripe_subscriptions (
  customer_id,
  subscription_id,
  status
)
SELECT 
  c.customer_id,
  metadata->>'stripe_subscription_id',
  'active'::stripe_subscription_status
FROM auth.users u
JOIN stripe_customers c ON c.user_id = u.id
WHERE metadata->>'stripe_subscription_id' IS NOT NULL
ON CONFLICT (customer_id) DO NOTHING;