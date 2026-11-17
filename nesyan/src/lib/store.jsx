import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { DEFAULT_DATA } from '../data/defaults'

/* ───────── أدوات نصوص ───────── */
export const lines = (s) => String(s || '').split('\n').map((l) => l.trim()).filter(Boolean)
export const pipes = (s) => lines(s).map((l) => l.split('|').map((x) => x.trim()))
export const commas = (s) => String(s || '').split(/[,،]/).map((x) => x.trim()).filter(Boolean)

// الأحجام: "100 مل | 4800 | 5400" → [{ label, price, compare }]
export const sizesOf = (p) => pipes(p?.sizes).map(([label, price, compare]) => ({ label, price: Number(String(price).replace(/[^\d.]/g, '')) || 0, compare: Number(String(compare || '').replace(/[^\d.]/g, '')) || 0 })).filter((s) => s.label)
const isSample = (label) => /عين|sample/i.test(label)
export const minPrice = (p) => {
  const s = sizesOf(p).filter((x) => x.price > 0)
  const full = s.filter((x) => !isSample(x.label))
  const pool = full.length ? full : s
  return pool.length ? Math.min(...pool.map((x) => x.price)) : 0
}
export const mainSize = (p) => sizesOf(p)[0] || { label: '', price: 0, compare: 0 }
export const money = (n, lang) => {
  const v = Math.round(Number(n) || 0).toLocaleString('en-US')
  return lang === 'ar' ? `${v} ج.م` : `EGP ${v}`
}

// رقم الموبايل: أرقام بس (بيحوّل الأرقام العربي لإنجليزي)
export const cleanPhone = (v) => String(v || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/(?!^\+)[^\d]/g, '').slice(0, 16)
export const validPhone = (v) => { const d = cleanPhone(v).replace(/\D/g, ''); return d.length >= 10 && d.length <= 15 }
export const phoneProps = { type: 'tel', inputMode: 'tel', dir: 'ltr', maxLength: 16, autoComplete: 'tel', onInput: (e) => { const c = cleanPhone(e.target.value); if (c !== e.target.value) e.target.value = c } }
export const waLink = (num, text) => `https://wa.me/${String(num || '').replace(/\D/g, '')}?text=${encodeURIComponent(text || '')}`

/* ───────── المحتوى (المنتجات + الأقسام) ───────── */
const ContentCtx = createContext({ data: DEFAULT_DATA, ready: false })

async function loadAll() {
  if (!supabase) return DEFAULT_DATA
  const [b, p] = await Promise.all([
    supabase.from('blocks').select('key,data'),
    supabase.from('products').select('*').eq('active', true).order('sort_order', { ascending: true }),
  ])
  const data = { ...DEFAULT_DATA, blocks: { ...DEFAULT_DATA.blocks } }
  if (!b.error) for (const row of b.data || []) {
    // الخانات الفاضية في لوحة التحكم ما بتمسحش الافتراضي
    const clean = Object.fromEntries(Object.entries(row.data || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    data.blocks[row.key] = { ...(DEFAULT_DATA.blocks[row.key] || {}), ...clean }
  }
  if (!p.error && p.data?.length) data.products = p.data
  return data
}

export function ContentProvider({ children }) {
  const [state, setState] = useState({ data: DEFAULT_DATA, ready: !supabase })
  useEffect(() => {
    let alive = true
    loadAll().then((data) => alive && setState({ data, ready: true })).catch(() => alive && setState({ data: DEFAULT_DATA, ready: true }))
    return () => { alive = false }
  }, [])
  return <ContentCtx.Provider value={state}>{children}</ContentCtx.Provider>
}
export const useProducts = () => useContext(ContentCtx).data.products
export const useBlock = (key) => useContext(ContentCtx).data.blocks[key] || {}
export const useReady = () => useContext(ContentCtx).ready
export const useProduct = (slug) => useProducts().find((p) => p.slug === slug)

/* ───────── السلة والمفضلة (محفوظة في المتصفح) ───────── */
const CartCtx = createContext(null)
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : d } catch { return d } }
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode */ } }

export function CartProvider({ children }) {
  const products = useProducts()
  const [items, setItems] = useState(() => load('ns-cart', []))
  const [wish, setWish] = useState(() => load('ns-wish', []))
  const [open, setOpen] = useState(false)
  const [bump, setBump] = useState(0)
  useEffect(() => save('ns-cart', items), [items])
  useEffect(() => save('ns-wish', wish), [wish])

  const add = useCallback((slug, size, qty = 1) => {
    setItems((list) => {
      const i = list.findIndex((x) => x.slug === slug && x.size === size)
      if (i > -1) { const c = [...list]; c[i] = { ...c[i], qty: Math.min(20, c[i].qty + qty) }; return c }
      return [...list, { slug, size, qty }]
    })
    setBump((b) => b + 1)
  }, [])
  const setQty = useCallback((slug, size, qty) => setItems((l) => (qty < 1 ? l.filter((x) => !(x.slug === slug && x.size === size)) : l.map((x) => (x.slug === slug && x.size === size ? { ...x, qty: Math.min(20, qty) } : x)))), [])
  const clear = useCallback(() => setItems([]), [])
  const toggleWish = useCallback((slug) => setWish((w) => (w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug])), [])

  // تفاصيل كل عنصر بالأسعار الحالية
  const lines_ = useMemo(() => items.map((it) => {
    const p = products.find((x) => x.slug === it.slug)
    if (!p) return null
    const s = sizesOf(p).find((x) => x.label === it.size) || mainSize(p)
    return { ...it, product: p, price: s.price, total: s.price * it.qty }
  }).filter(Boolean), [items, products])
  const count = lines_.reduce((a, l) => a + l.qty, 0)
  const subtotal = lines_.reduce((a, l) => a + l.total, 0)

  const value = { items: lines_, count, subtotal, add, setQty, clear, open, setOpen, bump, wish, toggleWish }
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}
export const useCart = () => useContext(CartCtx)

/* ───────── الإرسال ───────── */
export async function sendMessage(payload) {
  if (!supabase) throw new Error('not-configured')
  const { error } = await supabase.from('messages').insert({ ...payload, is_read: false })
  if (error) throw error
}

export async function placeOrder(order) {
  if (!supabase) throw new Error('not-configured')
  const { error } = await supabase.from('orders').insert({ ...order, status: 'new' })
  if (error) throw error
}

export const orderCode = () => 'NS-' + Date.now().toString(36).slice(-4).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase()
