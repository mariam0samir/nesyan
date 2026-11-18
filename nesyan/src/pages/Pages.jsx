import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { useBlock, useCart, useProducts, pipes, sendMessage, validPhone, cleanPhone, phoneProps, waLink } from '../lib/store'
import { Icon, ProductCard, SecHead } from '../components/ui'

/* ───────── عن نسيان ───────── */
export function About() {
  const a = useBlock('about')
  const { u, tx } = useLang()
  useEffect(() => { document.title = `${u.about} | NESYAN` }, [u])
  const paras = String(tx(a, 'text')).split(/\n\s*\n/)
  return (
    <div className="about">
      <section className="phero"><img src={a.hero_image_url} alt="" /><div className="phero-in" data-reveal><img src="/brand/mark.png" alt="" /><h1>{tx(a, 'title')}</h1></div></section>
      <section className="sec wrap about-in">
        <div className="about-txt" data-reveal>{paras.map((p, k) => <p key={k} className={k === 0 ? 'lead' : ''}>{p}</p>)}</div>
        <div className="about-img" data-reveal><img src={a.image2_url} alt="" loading="lazy" /></div>
      </section>
      <section className="sec wrap">
        <SecHead title={u.ourValues} />
        <div className="values">{pipes(tx(a, 'values')).map(([t, d], k) => <div key={k} className="value" data-reveal style={{ '--i': k }}><span>0{k + 1}</span><h3>{t}</h3><p>{d}</p></div>)}</div>
        <div className="center"><Link to="/shop" className="btn btn-dark">{u.shopNow}</Link></div>
      </section>
    </div>
  )
}

/* ───────── تواصل ───────── */
export function Contact() {
  const c = useBlock('contact')
  const { u, tx } = useLang()
  const [st, setSt] = useState({ busy: false, note: '', ok: false })
  useEffect(() => { document.title = `${u.contact} | NESYAN` }, [u])
  const submit = async (e) => {
    e.preventDefault()
    const f = e.currentTarget; const v = Object.fromEntries(new FormData(f).entries())
    if (!v.name?.trim() || !v.phone?.trim() || !v.body?.trim()) { setSt({ note: u.required }); return }
    if (!validPhone(v.phone)) { setSt({ note: u.badPhone }); return }
    setSt({ busy: true })
    try { await sendMessage({ source: 'contact', name: v.name.trim(), phone: cleanPhone(v.phone), email: v.email?.trim() || null, body: v.body.trim() }); f.reset(); setSt({ note: u.sent, ok: true }) }
    catch (err) { console.error('[Nesyan] message failed:', err?.message || err, err); setSt({ note: u.failed }) }
  }
  return (
    <div className="wrap contact">
      <SecHead title={u.contactTitle}><p className="muted">{u.contactText}</p></SecHead>
      <div className="contact-grid">
        <form className="co-form" onSubmit={submit} noValidate data-reveal>
          <div className="row2">
            <label><span>{u.name} *</span><input name="name" autoComplete="name" maxLength={120} /></label>
            <label><span>{u.phone} *</span><input name="phone" {...phoneProps} placeholder="01xxxxxxxxx" /></label>
          </div>
          <label><span>{u.email}</span><input name="email" type="email" dir="ltr" maxLength={200} /></label>
          <label><span>{u.message} *</span><textarea name="body" rows={5} maxLength={3000} /></label>
          {st.note && <p className={st.ok ? 'ok' : 'err'}>{st.note}</p>}
          <button type="submit" className="btn btn-dark" disabled={st.busy}>{st.busy ? u.sending : u.send}</button>
        </form>
        <aside className="contact-info" data-reveal>
          {c.phone && <p><Icon name="phone" /><a href={`tel:${c.phone.replace(/\s/g, '')}`} dir="ltr">{c.phone}</a></p>}
          {c.whatsapp && <p><Icon name="chat" /><a href={waLink(c.whatsapp, '')} target="_blank" rel="noreferrer" dir="ltr">WhatsApp</a></p>}
          {c.email && <p><Icon name="mail" /><a href={`mailto:${c.email}`}>{c.email}</a></p>}
          {tx(c, 'address') && <p><Icon name="pin" /><span>{tx(c, 'address')}</span></p>}
          {tx(c, 'hours') && <p><Icon name="clock" /><span>{tx(c, 'hours')}</span></p>}
          {c.map_url && <iframe src={c.map_url} title="map" loading="lazy" />}
        </aside>
      </div>
    </div>
  )
}

/* ───────── المفضلة ───────── */
export function Wishlist() {
  const { u } = useLang()
  const { wish } = useCart()
  const list = useProducts().filter((p) => wish.includes(p.slug))
  useEffect(() => { document.title = `${u.wishlist} | NESYAN` }, [u])
  return (
    <div className="wrap sec">
      <SecHead title={u.wishlist} />
      {!list.length ? <div className="center"><p className="muted">{u.wishlistEmpty}</p><Link to="/shop" className="btn btn-dark">{u.shopNow}</Link></div>
        : <div className="grid4">{list.map((p, k) => <ProductCard key={p.slug} p={p} i={k} />)}</div>}
    </div>
  )
}
