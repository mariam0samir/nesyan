import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { useBlock, useCart, useProducts, lines, pipes, money, sendMessage, waLink, commas } from '../lib/store'
import { Icon, Logo, Socials, useReveal, Preloader, Price } from './ui'
import { FAMILIES } from '../data/defaults'

/* ───────── شريط الإعلانات المتحرك ───────── */
function Announce() {
  const a = useBlock('announce')
  const { tx, u } = useLang()
  const items = lines(tx(a, 'items'))
  const [i, setI] = useState(0)
  useEffect(() => { if (items.length < 2) return; const t = setInterval(() => setI((x) => (x + 1) % items.length), 4200); return () => clearInterval(t) }, [items.length])
  if (!items.length) return null
  return (
    <div className="announce">
      <button type="button" onClick={() => setI((i - 1 + items.length) % items.length)} aria-label={u.prev}><Icon name="chev" size={14} className="flip-x" /></button>
      <p key={i}>{items[i % items.length]}</p>
      <button type="button" onClick={() => setI((i + 1) % items.length)} aria-label={u.next}><Icon name="chev" size={14} /></button>
    </div>
  )
}

/* ───────── البحث ───────── */
function SearchBox({ onDone, autoFocus }) {
  const { u, tx } = useLang()
  const products = useProducts()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const res = useMemo(() => {
    const s = q.trim().toLowerCase(); if (s.length < 2) return []
    return products.filter((p) => [p.name_ar, p.name_en, p.notes_top_ar, p.notes_top_en, p.notes_heart_ar, p.notes_heart_en, p.notes_base_ar, p.notes_base_en, p.family].join(' ').toLowerCase().includes(s)).slice(0, 6)
  }, [q, products])
  const go = (e) => { e.preventDefault(); if (q.trim()) { nav(`/shop?q=${encodeURIComponent(q.trim())}`); setQ(''); onDone?.() } }
  return (
    <form className="sbox" onSubmit={go} role="search">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={u.search} aria-label={u.searchTitle} autoFocus={autoFocus} />
      <button type="submit" aria-label={u.searchTitle}><Icon name="search" size={18} /></button>
      {res.length > 0 && (
        <ul className="sbox-res">
          {res.map((p) => <li key={p.slug}><Link to={`/p/${p.slug}`} onClick={() => { setQ(''); onDone?.() }}><img src={p.image_url} alt="" /><span><b>{tx(p, 'name')}</b><small>{commas(tx(p, 'notes_heart')).slice(0, 2).join(' · ')}</small></span><Price p={p} /></Link></li>)}
        </ul>
      )}
    </form>
  )
}

/* ───────── الهيدر ───────── */
export function Header() {
  const { u, toggle, t2, tx } = useLang()
  const { count, setOpen, bump, wish } = useCart()
  const products = useProducts()
  const [solid, setSolid] = useState(false)
  const [menu, setMenu] = useState(false)
  const [mega, setMega] = useState(false)
  const [search, setSearch] = useState(false)
  const timer = useRef()
  const { pathname, search: qs } = useLocation()
  useEffect(() => { const on = () => setSolid(scrollY > 40); on(); addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on) }, [])
  useEffect(() => { setMenu(false); setMega(false); setSearch(false) }, [pathname, qs])
  useEffect(() => { document.body.classList.toggle('no-scroll', menu) }, [menu])
  const openMega = (v) => { clearTimeout(timer.current); if (v) setMega(true); else timer.current = setTimeout(() => setMega(false), 220) }
  const links = [
    ['/shop', u.allPerfumes, true], ['/shop?gender=women', u.women], ['/shop?gender=men', u.men], ['/shop?gender=unisex', u.unisex],
    ['/shop?family=winter', u.oud], ['/shop?family=night', u.sets], ['/about', u.about], ['/contact', u.contact],
  ]
  const feat = products.filter((p) => p.featured).slice(0, 2)
  const fams = Object.keys(FAMILIES).filter((f) => products.some((p) => p.family === f))
  const isActive = (to) => (to.includes('?') ? pathname + qs === to : pathname === to && !qs)
  return (
    <header className={`hdr ${solid ? 'is-solid' : ''}`}>
      <Announce />
      <div className="hdr-main wrap">
        <div className="hdr-start">
          <button type="button" className="hdr-ico hdr-burger" onClick={() => setMenu(true)} aria-label={u.menu}><Icon name="menu" /></button>
          <div className="hdr-search"><SearchBox /></div>
          <button type="button" className="hdr-ico hdr-search-btn" onClick={() => setSearch(true)} aria-label={u.searchTitle}><Icon name="search" /></button>
        </div>
        <Link to="/" className="hdr-logo" aria-label={u.home} onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}><Logo /></Link>
        <div className="hdr-end">
          <button type="button" className="hdr-lang" onClick={toggle}>{u.lang}</button>
          <Link to="/wishlist" className="hdr-ico" aria-label={u.wishlist}><Icon name="heart" />{wish.length > 0 && <em>{wish.length}</em>}</Link>
          <button type="button" className="hdr-ico hdr-cart" onClick={() => setOpen(true)} aria-label={u.cart}><Icon name="bag" />{count > 0 && <em key={bump} className="bump">{count}</em>}</button>
        </div>
      </div>
      <nav className="hdr-nav" aria-label="main" onMouseLeave={() => openMega(false)}>
        <div className="wrap hdr-nav-in">
          {links.map(([to, label, hasMega]) => (
            <div key={to} className="hdr-item" onMouseEnter={() => openMega(Boolean(hasMega))}>
              <Link to={to} className={`hdr-link ${isActive(to) ? 'active' : ''}`}>{label}{hasMega && <Icon name="down" size={13} />}</Link>
            </div>
          ))}
        </div>
        <div className={`mega ${mega ? 'is-open' : ''}`} onMouseEnter={() => openMega(true)} onMouseLeave={() => openMega(false)}>
          <div className="wrap mega-in">
            <div><h4>{u.byGender}</h4>{[['women', u.women], ['men', u.men], ['unisex', u.unisex]].map(([g, l]) => <Link key={g} to={`/shop?gender=${g}`}>{l}</Link>)}</div>
            <div><h4>{u.byFamily}</h4><div className="mega-fams">{fams.map((f) => <Link key={f} to={`/shop?family=${f}`}>{t2(FAMILIES[f])}</Link>)}</div></div>
            {feat.map((p) => (
              <Link key={p.slug} to={`/p/${p.slug}`} className="mega-card"><div><img src={p.image_url} alt="" /></div><b>{tx(p, 'name')}</b><small>{tx(p, 'tagline')}</small></Link>
            ))}
          </div>
        </div>
      </nav>

      {/* بحث الموبايل */}
      <div className={`search-ov ${search ? 'is-open' : ''}`} onClick={() => setSearch(false)}>
        <div className="search-ov-in" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="modal-x" onClick={() => setSearch(false)} aria-label={u.close}><Icon name="close" /></button>
          <p>{u.typeToSearch}</p>
          {search && <SearchBox autoFocus onDone={() => setSearch(false)} />}
        </div>
      </div>

      {/* قائمة الموبايل */}
      <div className={`drawer-ov ${menu ? 'is-open' : ''}`} onClick={() => setMenu(false)} />
      <aside className={`mnav ${menu ? 'is-open' : ''}`} aria-hidden={!menu}>
        <div className="mnav-head"><Logo /><button type="button" className="hdr-ico" onClick={() => setMenu(false)} aria-label={u.close}><Icon name="close" /></button></div>
        <nav>
          {[['/', u.home], ...links].map(([to, label], i) => <Link key={to} to={to} style={{ '--i': i }}>{label}<Icon name="chev" size={16} className="flip-rtl" /></Link>)}
        </nav>
        <div className="mnav-foot"><button type="button" className="btn btn-line" onClick={toggle}>{u.lang}</button><Socials /></div>
      </aside>
    </header>
  )
}

/* ───────── السلة الجانبية ───────── */
export function CartDrawer() {
  const { u, lang, tx } = useLang()
  const { items, subtotal, open, setOpen, setQty } = useCart()
  const shop = useBlock('shop')
  const free = Number(shop.shipping_fee) ? Number(shop.free_shipping_over) || 0 : 0
  const left = Math.max(0, free - subtotal)
  const nav = useNavigate()
  useEffect(() => { document.body.classList.toggle('no-scroll-cart', open); const k = (e) => e.key === 'Escape' && setOpen(false); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [open, setOpen])
  return (
    <>
      <div className={`drawer-ov ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`cart ${open ? 'is-open' : ''}`} aria-label={u.cart} aria-hidden={!open}>
        <header className="cart-head"><h3>{u.cart}</h3><button type="button" className="hdr-ico" onClick={() => setOpen(false)} aria-label={u.close}><Icon name="close" /></button></header>
        {free > 0 && items.length > 0 && (
          <div className="ship-bar">
            <p>{left > 0 ? u.freeShipLeft.replace('{x}', money(left, lang)) : u.freeShipDone}</p>
            <div><i style={{ width: `${Math.min(100, (subtotal / free) * 100)}%` }} /></div>
          </div>
        )}
        {!items.length ? (
          <div className="cart-empty"><img src="/brand/mark.png" alt="" /><h4>{u.emptyCart}</h4><p>{u.emptyCartText}</p><button type="button" className="btn btn-dark" onClick={() => { setOpen(false); nav('/shop') }}>{u.shopNow}</button></div>
        ) : (
          <>
            <ul className="cart-list">
              {items.map((it) => (
                <li key={it.slug + it.size}>
                  <Link to={`/p/${it.slug}`} onClick={() => setOpen(false)} className="cart-img"><img src={it.product.image_url} alt="" /></Link>
                  <div className="cart-info">
                    <b>{tx(it.product, 'name')}</b><small>{it.size}</small>
                    <div className="stepper sm">
                      <button type="button" onClick={() => setQty(it.slug, it.size, it.qty - 1)} aria-label="-"><Icon name="minus" size={14} /></button>
                      <span>{it.qty}</span>
                      <button type="button" onClick={() => setQty(it.slug, it.size, it.qty + 1)} aria-label="+"><Icon name="plus" size={14} /></button>
                    </div>
                  </div>
                  <div className="cart-end"><span>{money(it.total, lang)}</span><button type="button" className="link-btn" onClick={() => setQty(it.slug, it.size, 0)}>{u.remove}</button></div>
                </li>
              ))}
            </ul>
            <footer className="cart-foot">
              <div className="cart-sum"><span>{u.subtotal}</span><b>{money(subtotal, lang)}</b></div>
              <button type="button" className="btn btn-dark btn-block" onClick={() => { setOpen(false); nav('/checkout') }}>{u.checkout}</button>
              <button type="button" className="link-btn" onClick={() => setOpen(false)}>{u.continueShopping}</button>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}

/* ───────── الفوتر ───────── */
function Newsletter() {
  const { u } = useLang()
  const [st, setSt] = useState('')
  const sub = async (e) => {
    e.preventDefault()
    const email = new FormData(e.currentTarget).get('email')?.toString().trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email || '')) { setSt('bad'); return }
    setSt('busy')
    try { await sendMessage({ source: 'newsletter', name: email.split('@')[0], email }); setSt('ok'); e.target.reset() } catch (err) { console.error('[Nesyan]', err); setSt('fail') }
  }
  return (
    <form className="news" onSubmit={sub} noValidate>
      <input name="email" type="email" dir="ltr" placeholder={u.yourEmail} aria-label={u.yourEmail} />
      <button type="submit" className="btn btn-gold" disabled={st === 'busy'}>{st === 'ok' ? u.subscribed : u.subscribe}</button>
      {st === 'bad' && <small className="err">{u.required}</small>}
      {st === 'fail' && <small className="err">{u.failed}</small>}
    </form>
  )
}

const SERV_ICONS = ['truck', 'sample', 'gift', 'cash', 'shield', 'chat', 'drop', 'spark', 'clock', 'heart', 'phone', 'check']
export function Services() {
  const s = useBlock('services')
  const { tx } = useLang()
  const items = pipes(tx(s, 'items'))
  if (!items.length) return null
  return (
    <section className="services">
      <div className="wrap services-in">
        {items.map(([ic, title], i) => (
          <div key={i} className="serv" data-reveal style={{ '--i': i }}><span><Icon name={SERV_ICONS.includes(ic) ? ic : 'spark'} size={30} stroke={1.2} /></span><p>{title}</p></div>
        ))}
      </div>
    </section>
  )
}

export function Footer() {
  const { u, tx, lang } = useLang()
  const c = useBlock('contact')
  const social = useBlock('social')
  return (
    <footer className="ftr">
      <div className="wrap ftr-grid">
        <div className="ftr-brand">
          <Link to="/" aria-label={u.home}><Logo variant="full" /></Link>
          <p>{u.aboutShort}</p>
        </div>
        <div>
          <h4>{u.shop}</h4>
          <ul>
            <li><Link to="/shop">{u.allPerfumes}</Link></li>
            <li><Link to="/shop?gender=women">{u.women}</Link></li>
            <li><Link to="/shop?gender=men">{u.men}</Link></li>
            <li><Link to="/shop?gender=unisex">{u.unisex}</Link></li>
            <li><Link to="/shop?family=summer">{lang === 'ar' ? 'صيفية ومنعشة' : 'Summer & Fresh'}</Link></li><li><Link to="/shop?family=night">{u.sets}</Link></li>
          </ul>
        </div>
        <div>
          <h4>{u.information}</h4>
          <ul>
            <li><Link to="/about">{u.about}</Link></li>
            <li><Link to="/contact">{u.contact}</Link></li>
            <li><Link to="/wishlist">{u.wishlist}</Link></li>
            <li><Link to="/checkout">{u.checkout}</Link></li>
          </ul>
        </div>
        <div>
          <h4>{u.customerCare}</h4>
          <ul className="ftr-contact">
            {c.phone && <li><Icon name="phone" size={16} /><a href={`tel:${c.phone.replace(/\s/g, '')}`} dir="ltr">{c.phone}</a></li>}
            {c.email && <li><Icon name="mail" size={16} /><a href={`mailto:${c.email}`}>{c.email}</a></li>}
            {tx(c, 'address') && <li><Icon name="pin" size={16} /><span>{tx(c, 'address')}</span></li>}
            {tx(c, 'hours') && <li><Icon name="clock" size={16} /><span>{tx(c, 'hours')}</span></li>}
          </ul>
        </div>
        <div className="ftr-news">
          <h4>{u.newsletter}</h4>
          <p>{u.newsletterText}</p>
          <Newsletter />
          {Object.values(social).some(Boolean) && <><h4 className="mt">{u.followUs}</h4><Socials /></>}
        </div>
      </div>
      <div className="wrap ftr-bottom">
        <p>© {new Date().getFullYear()} NESYAN — {u.rights}</p>
        <div className="pay">{['VISA', 'Mastercard', 'meeza', 'InstaPay', lang === 'ar' ? 'كاش' : 'Cash'].map((x) => <span key={x}>{x}</span>)}</div>
      </div>
    </footer>
  )
}

/* ───────── عناصر عائمة ───────── */
function Floating() {
  const c = useBlock('contact')
  const { u } = useLang()
  const [up, setUp] = useState(false)
  useEffect(() => { const on = () => setUp(scrollY > 700); on(); addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on) }, [])
  return (
    <>
      {c.whatsapp && <a className="wa-float" href={waLink(c.whatsapp, '')} target="_blank" rel="noreferrer" aria-label="WhatsApp"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" /></svg></a>}
      <button type="button" className={`totop ${up ? 'is-on' : ''}`} onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} aria-label={u.backTop}><Icon name="up" size={18} /></button>
    </>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { scrollTo(0, 0) }, [pathname])
  useReveal()
  return (
    <>
      <Preloader />
      <Header />
      <main className="page" key={pathname}><Outlet /></main>
      <Services />
      <Footer />
      <CartDrawer />
      <Floating />
    </>
  )
}
