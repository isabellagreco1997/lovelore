-- First, let's sync the customers
INSERT INTO stripe_customers (user_id, customer_id)
SELECT 
  id as user_id,
  (raw_user_meta_data->>'stripe_customer_id')::text as customer_id
FROM auth.users
WHERE raw_user_meta_data->>'stripe_customer_id' IS NOT NULL
ON CONFLICT (customer_id) DO NOTHING;

-- Now sync subscriptions (assuming active status for existing ones)
INSERT INTO stripe_subscriptions (
  customer_id,
  subscription_id,
  status
)
SELECT 
  c.customer_id,
  (u.raw_user_meta_data->>'stripe_subscription_id')::text as subscription_id,
  'active'::stripe_subscription_status
FROM auth.users u
JOIN stripe_customers c ON c.user_id = u.id
WHERE u.raw_user_meta_data->>'stripe_subscription_id' IS NOT NULL
ON CONFLICT (customer_id) DO NOTHING;