// Seeds PostHog with fake users so funnels, retention and the experiment show results.
// Usage:
//   npm install posthog-node
//   PH_KEY=phc_xxx PH_HOST=https://us.i.posthog.com node seed.mjs
// Create the experiment (flag key: checkout-button-test) BEFORE running this.
import { PostHog } from 'posthog-node'

const KEY = process.env.PH_KEY
const HOST = process.env.PH_HOST || 'https://us.i.posthog.com' // EU: https://eu.i.posthog.com
const USERS = Number(process.env.USERS || 400)
if (!KEY) { console.error('Set PH_KEY to your project API key'); process.exit(1) }

const client = new PostHog(KEY, { host: HOST, flushAt: 200, flushInterval: 0 })
const FLAG = 'checkout-button-test'
const PRODUCTS = [['lamp_arc', 129], ['lamp_desk', 79], ['lamp_read', 59], ['lamp_ring', 99]]
const P_PURCHASE_AFTER_CHECKOUT = { control: 0.30, test: 0.42 } // test variant converts better
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const at = (base, mins) => new Date(base.getTime() + mins * 60000)

for (let i = 0; i < USERS; i++) {
  const distinctId = `seed_user_${i}`
  const variant = i % 2 ? 'test' : 'control'
  const start = new Date(Date.now() - Math.random() * 7 * 864e5) // spread over last 7 days
  const [pid, price] = pick(PRODUCTS)
  const base = { seeded: true, [`$feature/${FLAG}`]: variant }

  client.identify({ distinctId, properties: { plan: Math.random() < 0.3 ? 'pro' : 'free', seeded: true } })

  // Exposure event: this is what the experiment counts as "user saw the variant"
  client.capture({ distinctId, event: '$feature_flag_called', timestamp: start,
    properties: { $feature_flag: FLAG, $feature_flag_response: variant, ...base } })

  client.capture({ distinctId, event: 'product_viewed', timestamp: at(start, 1),
    properties: { product_id: pid, price, ...base } })

  if (Math.random() > 0.55) continue
  client.capture({ distinctId, event: 'added_to_cart', timestamp: at(start, 3),
    properties: { product_id: pid, price, ...base } })

  if (Math.random() > 0.60) continue
  client.capture({ distinctId, event: 'checkout_started', timestamp: at(start, 5),
    properties: { cart_value: price, ...base } })

  if (Math.random() > P_PURCHASE_AFTER_CHECKOUT[variant]) continue
  client.capture({ distinctId, event: 'purchase_completed', timestamp: at(start, 8),
    properties: { revenue: price, button_variant: variant, ...base } })
}

await client.shutdown()
console.log(`Sent events for ${USERS} fake users to ${HOST}`)
