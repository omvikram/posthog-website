import { useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { usePostHog, useFeatureFlagEnabled, useFeatureFlagVariantKey } from 'posthog-js/react'
import { PRODUCTS } from './products.js'

const FLAG_LAYOUT = 'new-checkout-layout'      // boolean feature flag
const FLAG_EXPERIMENT = 'checkout-button-test' // experiment: control | test

export default function App() {
  const posthog = usePostHog()
  const location = useLocation()
  const [cart, setCart] = useState([])
  const total = cart.reduce((s, p) => s + p.price, 0)

  // SPA pageviews
  useEffect(() => { posthog.capture('$pageview') }, [location.pathname, posthog])

  return (
    <>
      <header>
        <Link to="/" className="logo"><i />Lumen</Link>
        <Link to="/cart">Cart ({cart.length})</Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<Product cart={cart} setCart={setCart} />} />
          <Route path="/cart" element={<Cart cart={cart} total={total} />} />
          <Route path="/checkout" element={<Checkout cart={cart} setCart={setCart} total={total} />} />
          <Route path="/done" element={<Done />} />
        </Routes>
      </main>
      <DevPanel />
    </>
  )
}

function Home() {
  const nav = useNavigate()
  return (
    <>
      <h1>Light for the work you do at night.</h1>
      <p className="sub">Four desk lamps. Free shipping over $100.</p>
      <div className="grid">
        {PRODUCTS.map(p => (
          <div key={p.id} className="card" onClick={() => nav(`/product/${p.id}`)}>
            <div className="swatch" style={{ background: p.color }}>{p.emoji}</div>
            <strong>{p.name}</strong>
            <div className="price">${p.price}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function Product({ cart, setCart }) {
  const { id } = useParams()
  const nav = useNavigate()
  const posthog = usePostHog()
  const p = PRODUCTS.find(x => x.id === id)

  useEffect(() => {
    if (p) posthog.capture('product_viewed', { product_id: p.id, product_name: p.name, price: p.price })
  }, [id])

  if (!p) return <h1>Product not found</h1>
  const add = () => {
    setCart([...cart, p])
    posthog.capture('added_to_cart', { product_id: p.id, price: p.price, cart_size: cart.length + 1 })
    nav('/cart')
  }
  return (
    <div className="two">
      <div className="swatch box" style={{ background: p.color, height: 320, fontSize: 96 }}>{p.emoji}</div>
      <div>
        <h1 style={{ fontSize: 34 }}>{p.name}</h1>
        <p className="sub">{p.desc}</p>
        <h2>${p.price}</h2>
        <button className="amber" onClick={add}>Add to cart</button>
      </div>
    </div>
  )
}

function Cart({ cart, total }) {
  const nav = useNavigate()
  const posthog = usePostHog()
  if (!cart.length) return (
    <>
      <h1>Your cart is empty</h1>
      <p className="sub">Pick a lamp from the shop.</p>
      <button onClick={() => nav('/')}>Browse lamps</button>
    </>
  )
  const start = () => {
    posthog.capture('checkout_started', { cart_value: total, items: cart.length })
    nav('/checkout')
  }
  return (
    <>
      <h1>Cart</h1>
      {cart.map((p, i) => <div className="row" key={i}><span>{p.name}</span><span>${p.price}</span></div>)}
      <div className="row"><strong>Total</strong><strong>${total}</strong></div>
      <br /><button className="amber" onClick={start}>Go to checkout</button>
    </>
  )
}

function Checkout({ cart, setCart, total }) {
  const nav = useNavigate()
  const posthog = usePostHog()
  const newLayout = !!useFeatureFlagEnabled(FLAG_LAYOUT)               // feature flag
  const variant = useFeatureFlagVariantKey(FLAG_EXPERIMENT) || 'control' // experiment
  const label = variant === 'test' ? 'Complete purchase' : 'Buy now'

  if (!cart.length) return <button onClick={() => nav('/')}>Back to shop</button>

  const pay = () => {
    posthog.capture('purchase_completed', { revenue: total, items: cart.length, button_variant: variant, new_layout: newLayout })
    setCart([])
    nav('/done')
  }
  const form = (
    <div className="box">
      <label>Email<input defaultValue="demo@lumen.test" /></label>
      <label>Card number<input defaultValue="4242 4242 4242 4242" /></label>
      <button className="amber" onClick={pay}>{label}</button>
    </div>
  )
  const summary = (
    <div className="box">
      {cart.map((p, i) => <div className="row" key={i}><span>{p.name}</span><span>${p.price}</span></div>)}
      <div className="row"><strong>Total</strong><strong>${total}</strong></div>
    </div>
  )
  return (
    <>
      <h1>Checkout</h1>
      {newLayout ? <div className="two">{form}{summary}</div> : <>{summary}<br />{form}</>}
    </>
  )
}

function Done() {
  const nav = useNavigate()
  return (
    <>
      <h1>Thanks, order confirmed.</h1>
      <p className="sub">A receipt is on its way.</p>
      <button onClick={() => nav('/')}>Keep shopping</button>
    </>
  )
}

function DevPanel() {
  const posthog = usePostHog()
  const layout = useFeatureFlagEnabled(FLAG_LAYOUT)
  const variant = useFeatureFlagVariantKey(FLAG_EXPERIMENT)
  const signIn = (plan) => {
    const id = `demo_${plan}_${Math.floor(Math.random() * 1000)}`
    posthog.identify(id, { plan, email: `${id}@lumen.test` })
  }
  return (
    <div id="dev">
      <strong>Demo panel</strong><br />
      {FLAG_LAYOUT}: <b>{String(layout)}</b><br />
      {FLAG_EXPERIMENT}: <b>{String(variant)}</b><br />
      <button onClick={() => signIn('pro')}>Sign in (pro)</button>
      <button onClick={() => signIn('free')}>Sign in (free)</button>
      <button onClick={() => { posthog.reset(); window.location.href = '/' }}>Reset user</button>
    </div>
  )
}
