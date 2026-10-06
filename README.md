# PostHog POC: Lumen demo store (React)

A small online lamp store used to demo PostHog's product analytics, session replay, feature flags and A/B experiments.

## 1. Setup

```bash
cp .env.example .env      # add your Project API Token (and host if your project is in the EU)
npm install
npm run dev               # http://localhost:3000
```

|Set Variable Value |
|---|---|
| `VITE_POSTHOG_PROJECT_TOKEN` | Project API key (PostHog > Settings > Project) |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` or `https://eu.i.posthog.com` |

```bash
VITE_POSTHOG_PROJECT_TOKEN= <your token from Project Settings> 
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

Restart `npm run dev` after editing `.env`. Use a browser profile with ad blockers off.

## 2. PostHog configuration (one time) in POstHog Project Settings

1. **Session replay:** Project Settings > Session replay > turn on recording.
2. **Feature flag:** create a flag with key `new-checkout-layout`. Start at 0% rollout.
3. **Experiment:** create an experiment with flag key `checkout-button-test`, variants `control` and `test`, and the goal funnel `checkout_started` > `purchase_completed`. Launch it.

Create the experiment before seeding data so exposures are counted.

## 3. Seed demo data

```bash
PH_KEY=<your key> PH_HOST=https://us.i.posthog.com npm run seed
```

Sends 400 fake users over the last 7 days (`USERS=1000` for more). The `test` variant converts at about 14% versus 10% for `control`. All seeded data carries `seeded: true`. Seeded users have no recordings, so use real clicks for the replay part.

## 4. What the app sends

| Event | When | Key properties |
|---|---|---|
| `$pageview` | every route change | URL |
| `product_viewed` | product page opens | `product_id`, `price` |
| `added_to_cart` | Add to cart clicked | `product_id`, `price` |
| `checkout_started` | Go to checkout clicked | `cart_value` |
| `purchase_completed` | Buy button clicked | `revenue`, `button_variant`, `new_layout` |

The demo panel (bottom right) shows live flag values and lets you sign in as a pro or free user, or reset to a new anonymous user.

## 5. Demo script (about 15 minutes)

### A. Product analytics (4 min)
1. In the app, view a product, add to cart, start checkout and buy. Repeat once with a different lamp.
2. In PostHog open **Activity** to show events arriving live.
3. Create a **funnel**: `product_viewed` > `added_to_cart` > `checkout_started` > `purchase_completed`. Point out the biggest drop-off.
4. Show a **trends** insight on `purchase_completed` summed by `revenue`, and a **retention** chart.
5. Pin the insights to a **dashboard**.
6. Optional: run a **SQL (HogQL)** query, for example revenue by `button_variant`.

### B. Session replay (3 min)
1. In the app, view a product, add to cart, go to checkout, then leave without buying.
2. In PostHog open **Replay** and filter for users who did `checkout_started` but not `purchase_completed`.
3. Play the recording and show the event timeline, console and network tabs.

### C. Feature flags (4 min)
1. Open the checkout page and note the stacked layout (demo panel shows `new-checkout-layout: false`).
2. Set the flag to 100% rollout, reload, and show the side-by-side layout.
3. Change the release condition to `plan = pro`. In the demo panel click **Sign in (free)**, then **Sign in (pro)**, and watch the layout change.
4. Show the kill switch: disable the flag and reload.

### D. A/B experiment (4 min)
1. Open the app in two incognito windows, go to checkout in each, and compare the button text ("Buy now" vs "Complete purchase").
2. Open the experiment in PostHog and show exposures per variant and the conversion results from the seeded data.
3. Explain significance and the "ship the winner" action.

## 6. Troubleshooting

| Problem | Fix |
|---|---|
| No events in Activity | Check `.env`, restart the dev server, disable ad blockers, check the browser console and Network tab for blocked requests |
| Flag shows `undefined` | Flags take a moment to load. Confirm the flag key matches exactly and the flag is enabled |
| Always the same experiment variant | Click **Reset user** in the demo panel, or use incognito |
| Experiment shows no exposures | Create the experiment before seeding, and make sure the app has loaded the checkout page at least once |
| Wrong region | Match `VITE_POSTHOG_HOST` to your project's region (US or EU) |
| `posthog-js/react` import error | Check PostHog's React docs for the current import path for your installed version |

## 7. Project layout

```
index.html
seed.mjs            # fake-user data generator
src/
  main.jsx          # posthog.init + PostHogProvider
  App.jsx           # routes, events, flag hooks, demo panel
  products.js
  styles.css
```
