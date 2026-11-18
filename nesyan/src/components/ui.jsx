import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { useBlock, useCart, useProducts, money, minPrice, mainSize, sizesOf, commas, waLink } from '../lib/store'
import { FAMILIES, GENDERS } from '../data/defaults'

/* ───────── الأيقونات ───────── */
const ICONS = {
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3',
  bag: 'M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 016 0v2',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  close: 'M6 6l12 12M18 6L6 18',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  chev: 'M9 6l6 6-6 6',
  down: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  menu: 'M4 7h16M4 12h16M4 17h16',
  flip: 'M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M18 3v4h-4M6 21v-4h4',
  filter: 'M4 6h16M7 12h10M10 18h4',
  truck: 'M3 6h11v9H3zM14 9h4l3 3v3h-7zM7 18a2 2 0 100-4 2 2 0 000 4zM17 18a2 2 0 100-4 2 2 0 000 4z',
  gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0',
  sample: 'M10 3h4M11 3v5l-4 9a2 2 0 002 3h6a2 2 0 002-3l-4-9V3M8 14h8',
  cash: 'M3 7h18v10H3zM12 15a3 3 0 100-6 3 3 0 000 6zM6 10v4M18 10v4',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4',
  chat: 'M4 5h16v11H8l-4 4V5zM8 10h8M8 13h5',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  pin: 'M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11zM12 12a2 2 0 100-4 2 2 0 000 4z',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  check: 'M5 12l5 5L20 7',
  drop: 'M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18',
  up: 'M12 19V5M6 11l6-6 6 6',
}
export function Icon({ name, size = 20, className = '', stroke = 1.6, fill }) {
  return (
    <svg className={`ic ${className}`} width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] || ''} />
    </svg>
  )
}
const SOCIAL = {
  instagram: 'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zM12 16a4 4 0 100-8 4 4 0 000 8zM17.5 6.5v.01',
  facebook: 'M14 8h3V4h-3a4 4 0 00-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z',
  tiktok: 'M14 3v11a3.5 3.5 0 11-3.5-3.5M14 3c.5 2.5 2.5 4.5 5 5',
  snapchat: 'M12 3c3 0 5 2.2 5 5v3l2 1-2 1c-.5 2-2 3-2 3l3 1c-1 1-3 1-3 1l-1 2-2-.5-2 .5-1-2s-2 0-3-1l3-1s-1.5-1-2-3l-2-1 2-1V8c0-2.8 2-5 5-5z',
  x: 'M4 4l16 16M20 4L4 20',
  youtube: 'M3 8a3 3 0 013-3h12a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V8zM10 9l5 3-5 3V9z',
}
export function Socials({ className = '' }) {
  const s = useBlock('social')
  const items = Object.keys(SOCIAL).filter((k) => s[k])
  if (!items.length) return null
  return (
    <ul className={`socials ${className}`}>
      {items.map((k) => <li key={k}><a href={s[k]} target="_blank" rel="noreferrer" aria-label={k}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={SOCIAL[k]} /></svg></a></li>)}
    </ul>
  )
}

/* ───────── اللوجو ───────── */
export function Logo({ variant = 'lockup', className = '' }) {
  const src = { lockup: '/brand/lockup.png', full: '/brand/logo-full.png', mark: '/brand/mark.png', word: '/brand/word.png' }[variant]
  return <img src={src} alt="NESYAN — نسيان" className={`logo logo-${variant} ${className}`} />
}

/* ───────── أنيميشن الظهور مع السكرول ───────── */
export function useReveal() {
  const { pathname } = useLocation()
  useEffect(() => {
    const els = [...document.querySelectorAll('[data-reveal]:not(.in)')]
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach((e) => e.classList.add('in')); return }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    els.forEach((e) => io.observe(e))
    // عناصر بتتضاف بعد التحميل
    const mo = new MutationObserver(() => document.querySelectorAll('[data-reveal]:not(.in):not([data-obs])').forEach((e) => { e.setAttribute('data-obs', ''); io.observe(e) }))
    mo.observe(document.body, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [pathname])
}

/* ───────── شاشة التحميل ───────── */
export function Preloader() {
  const [gone, setGone] = useState(false)
  useEffect(() => { const t = setTimeout(() => setGone(true), 1500); return () => clearTimeout(t) }, [])
  return (
    <div className={`preloader ${gone ? 'is-gone' : ''}`} aria-hidden="true">
      <div className="pl-in"><img src="/brand/mark.png" alt="" /><span className="pl-line" /><img src="/brand/word.png" alt="" className="pl-word" /></div>
    </div>
  )
}

/* ───────── العناوين ───────── */
export function SecHead({ eyebrow, title, center = true, children }) {
  return (
    <header className={`sec-head ${center ? 'is-center' : ''}`} data-reveal>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {title && <h2 className="sec-title">{title}</h2>}
      {children}
    </header>
  )
}

/* ───────── السعر ───────── */
export function Price({ p, size }) {
  const { lang, u } = useLang()
  const s = size || mainSize(p)
  const many = !size && sizesOf(p).length > 1
  const val = size ? s.price : minPrice(p)
  if (!val) return <span className="price ask">{u.askPrice}</span>
  return (
    <span className="price">
      {many && <small>{u.from} </small>}{money(val, lang)}
      {s.compare > s.price && (size || !many) && <del>{money(s.compare, lang)}</del>}
    </span>
  )
}

/* ───────── كارت المنتج (بيقلب للعلبة عند اللمس) ───────── */
export function ProductCard({ p, notes = false, i = 0 }) {
  const { u, tx, t2 } = useLang()
  const { add, wish, toggleWish } = useCart()
  const [flip, setFlip] = useState(false)
  const [done, setDone] = useState(false)
  const s = mainSize(p)
  const c = useBlock('contact')
  const sale = s.price > 0 && s.compare > s.price
  const quick = (e) => {
    e.preventDefault(); add(p.slug, s.label); setDone(true); setTimeout(() => setDone(false), 1400)
    flyToCart(e.currentTarget.closest('.pcard')?.querySelector('.pc-front'))
  }
  return (
    <article className={`pcard ${flip ? 'is-flipped' : ''}`} style={{ '--i': i }} data-reveal
      onMouseMove={(e) => { const m = e.currentTarget.querySelector('.pc-media'); if (!m || matchMedia('(hover: none)').matches) return; const r = m.getBoundingClientRect(); m.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -6}deg`); m.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 6}deg`) }}
      onMouseLeave={(e) => { const m = e.currentTarget.querySelector('.pc-media'); m?.style.setProperty('--rx', '0deg'); m?.style.setProperty('--ry', '0deg') }}>
      <Link to={`/p/${p.slug}`} className="pc-media" aria-label={tx(p, 'name')}>
        <div className="pc-badges">
          {p.is_new && <span className="bdg">{u.new}</span>}
          {p.is_exclusive && <span className="bdg red">{u.exclusive}</span>}
          {sale && <span className="bdg gold" dir="ltr">-{Math.round((1 - s.price / s.compare) * 100)}%</span>}
        </div>
        <div className="pc-flip">
          <img className="pc-front" src={p.image_url} alt={tx(p, 'name')} loading="lazy" />
          <img className="pc-back" src={p.box_url || p.image_url} alt="" loading="lazy" />
        </div>
        <span className="pc-shine" />
        {p.in_stock !== false && (s.price > 0
          ? <button type="button" className="pc-quick" onClick={quick}>{done ? u.added : u.addToCart}</button>
          : c.whatsapp && <button type="button" className="pc-quick wa" onClick={(e) => { e.preventDefault(); window.open(waLink(c.whatsapp, `${u.whatsappMsg}\n${tx(p, 'name')} — ${s.label}`), '_blank', 'noopener') }}>{u.orderWhatsapp}</button>)}
      </Link>
      <button type="button" className={`pc-wish ${wish.includes(p.slug) ? 'on' : ''}`} onClick={() => toggleWish(p.slug)} aria-label={u.wishlist}><Icon name="heart" size={18} fill={wish.includes(p.slug) ? 'currentColor' : 'none'} /></button>
      <button type="button" className="pc-flipbtn" onClick={() => setFlip(!flip)} aria-label={u.flip}><Icon name="flip" size={16} /></button>
      <div className="pc-body">
        <p className="pc-fam">{[t2(FAMILIES[p.family]), t2(GENDERS[p.gender])].filter(Boolean).join(' · ')}</p>
        <h3 className="pc-name"><Link to={`/p/${p.slug}`}>{tx(p, 'name')}</Link></h3>
        <Price p={p} />
      </div>
      {notes && (p.notes_top_ar || p.notes_top_en) && (
        <dl className="pc-notes">
          <div><dt>{u.head}</dt><dd>{commas(tx(p, 'notes_top'))[0]}</dd></div>
          <div><dt>{u.heart}</dt><dd>{commas(tx(p, 'notes_heart'))[0]}</dd></div>
          <div><dt>{u.base}</dt><dd>{commas(tx(p, 'notes_base'))[0]}</dd></div>
        </dl>
      )}
    </article>
  )
}

// أنيميشن «تطير للسلة»
export function flyToCart(img) {
  try {
    const target = document.querySelector('.hdr-cart')
    if (!img || !target || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const a = img.getBoundingClientRect(); const b = target.getBoundingClientRect()
    const c = img.cloneNode(); c.className = 'fly'
    Object.assign(c.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' })
    document.body.appendChild(c)
    requestAnimationFrame(() => Object.assign(c.style, { left: b.left + b.width / 2 - 12 + 'px', top: b.top + b.height / 2 - 12 + 'px', width: '24px', height: '30px', opacity: '.4' }))
    setTimeout(() => c.remove(), 900)
  } catch { /* تجاهل */ }
}

/* ───────── سلايدر أفقي بأسهم وسحب ───────── */
export function Rail({ children, className = '', auto = 0 }) {
  const ref = useRef(null)
  const paused = useRef(false)
  const { ar, u } = useLang()
  const go = (d) => {
    const el = ref.current; if (!el) return
    const max = el.scrollWidth - el.clientWidth, pos = Math.abs(el.scrollLeft)
    if (d > 0 && pos >= max - 4) { el.scrollTo({ left: 0, behavior: 'smooth' }); return }
    if (d < 0 && pos <= 4) { el.scrollTo({ left: max * (ar ? -1 : 1), behavior: 'smooth' }); return }
    const card = el.firstElementChild?.getBoundingClientRect().width || el.clientWidth * 0.8
    el.scrollBy({ left: d * (card + 20) * (ar ? -1 : 1), behavior: 'smooth' })
  }
  // تشغيل تلقائي — بيقف لما الماوس عليه أو الصفحة مش ظاهرة
  useEffect(() => {
    if (!auto || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => { if (!paused.current && !document.hidden) go(1) }, auto)
    return () => clearInterval(t)
  }, [auto, ar])
  // سحب بالماوس
  useEffect(() => {
    const el = ref.current; if (!el) return
    let down = false, x = 0, s = 0, moved = false
    const dn = (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = false; x = e.clientX; s = el.scrollLeft }
    const mv = (e) => { if (!down) return; const dx = e.clientX - x; if (!moved && Math.abs(dx) > 6) { moved = true; el.classList.add('dragging') } if (moved) el.scrollLeft = s - dx }
    const up = () => { down = false; el.classList.remove('dragging') }
    const ck = (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false } }
    el.addEventListener('pointerdown', dn); window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); el.addEventListener('click', ck, true)
    return () => { el.removeEventListener('pointerdown', dn); window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); el.removeEventListener('click', ck, true) }
  }, [])
  return (
    <div className={`rail ${className}`} onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }} onTouchStart={() => { paused.current = true }} onTouchEnd={() => { setTimeout(() => { paused.current = false }, 4000) }}>
      <button type="button" className="rail-btn prev" onClick={() => go(-1)} aria-label={u.prev}><Icon name="chev" size={18} className="flip-x" /></button>
      <div className="rail-track" ref={ref}>{children}</div>
      <button type="button" className="rail-btn next" onClick={() => go(1)} aria-label={u.next}><Icon name="chev" size={18} /></button>
    </div>
  )
}

/* ───────── شريط متحرك لا نهائي ───────── */
export function Marquee({ children, speed = 40, reverse = false, className = '' }) {
  return (
    <div className={`mq ${reverse ? 'rev' : ''} ${className}`} style={{ '--mq': speed + 's' }}>
      <div className="mq-track"><div className="mq-group">{children}</div><div className="mq-group" aria-hidden="true">{children}</div></div>
    </div>
  )
}

/* ───────── شريط مقياس (الثبات / الفوحان) ───────── */
export function Meter({ label, value }) {
  return (
    <div className="meter" data-reveal>
      <span>{label}</span>
      <div className="meter-bar">{[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= value ? 'on' : ''} style={{ '--d': n }} />)}</div>
    </div>
  )
}

/* ───────── اختبار «اكتشف عطرك» ───────── */
export function ScentFinder({ onClose }) {
  const { u, tx, t2 } = useLang()
  const products = useProducts().filter((p) => p.family !== 'set')
  const [step, setStep] = useState(0)
  const [a, setA] = useState({})
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); document.body.classList.add('no-scroll'); return () => { removeEventListener('keydown', k); document.body.classList.remove('no-scroll') } }, [onClose])
  const fams = [...new Set(products.map((p) => p.family))]
  const Q = [
    { k: 'g', q: u.finderQ1, opts: [['women', u.forHer], ['men', u.forHim], ['unisex', u.anyone]] },
    { k: 'f', q: u.finderQ2, opts: fams.map((f) => [f, t2(FAMILIES[f])]) },
    { k: 's', q: u.finderQ3, opts: [[2, u.light], [3, u.medium], [5, u.strong]] },
  ]
  const pick = (v) => { const n = { ...a, [Q[step].k]: v }; setA(n); setStep(step + 1) }
  const score = (p) => (a.g && (p.gender === a.g || p.gender === 'unisex') ? 3 : 0) + (p.family === a.f ? 4 : 0) + (a.s ? 2 - Math.abs((p.sillage || 3) - a.s) * 0.6 : 0)
  const matches = step >= Q.length ? [...products].sort((x, y) => score(y) - score(x)).slice(0, 3) : []
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={u.finderTitle} onClick={onClose}>
      <div className="modal-card finder" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-x" onClick={onClose} aria-label={u.close}><Icon name="close" /></button>
        <img src="/brand/mark.png" alt="" className="finder-mark" />
        <h3>{u.finderTitle}</h3>
        <div className="finder-steps">{Q.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
        {step < Q.length ? (
          <div className="finder-q" key={step}>
            <p>{Q[step].q}</p>
            <div className="finder-opts">{Q[step].opts.map(([v, l]) => <button key={v} type="button" onClick={() => pick(v)}>{l}</button>)}</div>
          </div>
        ) : (
          <div className="finder-res">
            <p>{u.yourMatches}</p>
            <div className="finder-grid">{matches.map((p) => (
              <Link key={p.slug} to={`/p/${p.slug}`} onClick={onClose} className="finder-item"><img src={p.image_url} alt="" /><b>{tx(p, 'name')}</b><Price p={p} /></Link>
            ))}</div>
            <button type="button" className="link-btn" onClick={() => { setA({}); setStep(0) }}>{u.again}</button>
          </div>
        )}
      </div>
    </div>
  )
}
