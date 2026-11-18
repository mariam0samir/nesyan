import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { useCart, useBlock, money, placeOrder, orderCode, validPhone, cleanPhone, phoneProps, waLink } from '../lib/store'
import { Icon } from '../components/ui'

const GOV = [
  ['القاهرة', 'Cairo'], ['الجيزة', 'Giza'], ['الإسكندرية', 'Alexandria'], ['القليوبية', 'Qalyubia'], ['الشرقية', 'Sharqia'], ['الدقهلية', 'Dakahlia'], ['الغربية', 'Gharbia'],
  ['المنوفية', 'Monufia'], ['البحيرة', 'Beheira'], ['كفر الشيخ', 'Kafr El Sheikh'], ['دمياط', 'Damietta'], ['بورسعيد', 'Port Said'], ['الإسماعيلية', 'Ismailia'], ['السويس', 'Suez'],
  ['الفيوم', 'Faiyum'], ['بني سويف', 'Beni Suef'], ['المنيا', 'Minya'], ['أسيوط', 'Asyut'], ['سوهاج', 'Sohag'], ['قنا', 'Qena'], ['الأقصر', 'Luxor'], ['أسوان', 'Aswan'],
  ['البحر الأحمر', 'Red Sea'], ['مطروح', 'Matrouh'], ['شمال سيناء', 'North Sinai'], ['جنوب سيناء', 'South Sinai'], ['الوادي الجديد', 'New Valley'],
]

export default function Checkout() {
  const { u, lang, tx, ar } = useLang()
  const { items, subtotal, clear } = useCart()
  const shop = useBlock('shop')
  const c = useBlock('contact')
  const [st, setSt] = useState({ busy: false, err: '' })
  const [done, setDone] = useState(null)
  const [gift, setGift] = useState(false)
  useEffect(() => { document.title = `${u.checkout} | NESYAN` }, [u])
  const free = Number(shop.free_shipping_over) || 0
  const fee = Number(shop.shipping_fee) || 0
  const ship = items.length && fee && (!free || subtotal < free) ? fee : 0
  const shipLabel = ship ? money(ship, lang) : (!fee ? u.shipLater : u.free)
  const total = subtotal + ship

  const summaryText = (code, v) => [
    `${u.whatsappMsg}`, code ? `${u.orderNo}: ${code}` : '',
    ...items.map((it) => `• ${tx(it.product, 'name')} — ${it.size} × ${it.qty} = ${money(it.total, lang)}`),
    `${u.shipping}: ${shipLabel}`, `${u.total}: ${money(total, lang)}`,
    v ? `${v.name} — ${v.phone}\n${v.governorate}، ${v.city}\n${v.address}` : '',
  ].filter(Boolean).join('\n')

  const submit = async (e) => {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.currentTarget).entries())
    if (!v.name?.trim() || !v.phone?.trim() || !v.governorate || !v.city?.trim() || !v.address?.trim()) { setSt({ busy: false, err: u.required }); return }
    if (!validPhone(v.phone)) { setSt({ busy: false, err: u.badPhone }); return }
    const code = orderCode()
    const order = {
      code, name: v.name.trim(), phone: cleanPhone(v.phone), email: v.email?.trim() || null, governorate: v.governorate, city: v.city.trim(), address: v.address.trim(),
      notes: [v.notes?.trim(), gift ? `🎁 ${u.giftWrap}: ${v.gift_note || ''}` : ''].filter(Boolean).join('\n') || null,
      payment: v.payment || 'cod', items: items.map((it) => ({ slug: it.slug, name: it.product.name_ar, name_en: it.product.name_en, size: it.size, qty: it.qty, price: it.price })),
      subtotal, shipping: ship, total, lang,
    }
    setSt({ busy: true, err: '' })
    try {
      await placeOrder(order)
      setDone({ code, text: summaryText(code, { ...v, phone: order.phone }) }); clear(); scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('[Nesyan] order failed:', err?.message || err, err)
      setSt({ busy: false, err: u.failed })
    }
  }

  if (done) return (
    <div className="wrap done">
      <div className="done-card">
        <span className="done-ic"><Icon name="check" size={34} stroke={2} /></span>
        <h1>{u.orderDone}</h1>
        <p>{u.orderNo}: <b dir="ltr">{done.code}</b></p>
        <p className="muted">{u.orderDoneText}</p>
        <div className="done-btns">
          {c.whatsapp && <a className="btn btn-wa" href={waLink(c.whatsapp, done.text)} target="_blank" rel="noreferrer">{u.confirmWhatsapp}</a>}
          <Link to="/shop" className="btn btn-line">{u.continueShopping}</Link>
        </div>
      </div>
    </div>
  )

  if (!items.length) return (
    <div className="wrap done"><div className="done-card"><img src="/brand/mark.png" alt="" className="done-mark" /><h1>{u.emptyCart}</h1><p className="muted">{u.emptyCartText}</p><Link to="/shop" className="btn btn-dark">{u.shopNow}</Link></div></div>
  )

  return (
    <div className="wrap checkout">
      <h1 className="page-title" data-reveal>{u.checkout}</h1>
      <div className="co-grid">
        <form className="co-form" onSubmit={submit} noValidate>
          <h3>{u.shippingInfo}</h3>
          <div className="row2">
            <label><span>{u.name} *</span><input name="name" autoComplete="name" required maxLength={120} /></label>
            <label><span>{u.phone} *</span><input name="phone" {...phoneProps} placeholder="01xxxxxxxxx" required /></label>
          </div>
          <label><span>{u.email}</span><input name="email" type="email" dir="ltr" autoComplete="email" maxLength={200} /></label>
          <div className="row2">
            <label><span>{u.governorate} *</span><select name="governorate" required defaultValue=""><option value="" disabled>—</option>{GOV.map(([a, e]) => <option key={a} value={a}>{ar ? a : e}</option>)}</select></label>
            <label><span>{u.city} *</span><input name="city" required maxLength={120} /></label>
          </div>
          <label><span>{u.address} *</span><textarea name="address" rows={3} required maxLength={500} /></label>
          <label><span>{u.notes2}</span><textarea name="notes" rows={2} maxLength={500} /></label>
          <label className="fcheck"><input type="checkbox" checked={gift} onChange={() => setGift(!gift)} /><span>🎁 {u.giftWrap}</span></label>
          {gift && <label><span>{u.giftNote}</span><input name="gift_note" maxLength={200} /></label>}
          <h3>{u.payment}</h3>
          <div className="pays">
            <label className="pay-opt"><input type="radio" name="payment" value="cod" defaultChecked /><span><Icon name="cash" size={20} />{u.cod}</span></label>
            <label className="pay-opt"><input type="radio" name="payment" value="transfer" /><span><Icon name="phone" size={20} />{u.transfer}</span></label>
          </div>
          <p className="muted">{tx(shop, 'note')}</p>
          {st.err && <p className="err">{st.err}</p>}
          <button type="submit" className="btn btn-dark btn-block" disabled={st.busy}>{st.busy ? u.placing : `${u.placeOrder} — ${money(total, lang)}`}</button>
          {c.whatsapp && <a className="btn btn-wa btn-block" href={waLink(c.whatsapp, summaryText())} target="_blank" rel="noreferrer">{u.orderWhatsapp}</a>}
        </form>
        <aside className="co-sum">
          <h3>{u.orderSummary}</h3>
          <ul>{items.map((it) => (
            <li key={it.slug + it.size}><span className="co-img"><img src={it.product.image_url} alt="" /><em>{it.qty}</em></span><span><b>{tx(it.product, 'name')}</b><small>{it.size}</small></span><span>{money(it.total, lang)}</span></li>
          ))}</ul>
          <dl>
            <div><dt>{u.subtotal}</dt><dd>{money(subtotal, lang)}</dd></div>
            <div><dt>{u.shipping}</dt><dd>{shipLabel}</dd></div>
            <div className="tot"><dt>{u.total}</dt><dd>{money(total, lang)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
