import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { useBlock, useProducts, lines, pipes, commas } from '../lib/store'
import { Icon, ProductCard, Rail, SecHead, Price, ScentFinder, Marquee, Bottle3D } from '../components/ui'

/* ───────── الواجهة: سلايدر بصور كاملة وكارت أبيض في النص (Jovoy) ───────── */
function Hero() {
  const h = useBlock('hero')
  const { tx, u } = useLang()
  const ad = useBlock('adbanner')
  let imgs = lines(h.images)
  let mimgs = lines(h.mobile_images)
  let slides = pipes(tx(h, 'slides'))
  let links = lines(h.links)
  // صورة البانر الإعلاني بتبقى أول شريحة في السلايدر (لو مش موجودة فيه أصلًا)
  if (ad.in_hero !== false && ad.hero_image_url && !imgs.includes(ad.hero_image_url)) {
    const pad = (a) => [...a, ...Array(Math.max(0, imgs.length - a.length)).fill('')]
    imgs = [ad.hero_image_url, ...imgs]
    mimgs = [ad.hero_mobile_url || '', ...pad(mimgs)]
    slides = [[tx(ad, 'title'), tx(ad, 'sub')], ...slides]
    links = [ad.link || '/shop', ...pad(links)]
  }
  const n = Math.max(imgs.length, 1)
  const [i, setI] = useState(0)
  const canvas = useRef(null)
  useEffect(() => { if (n < 2) return; const t = setInterval(() => setI((x) => (x + 1) % n), 6500); return () => clearInterval(t) }, [n, i])
  // غبار ذهبي متحرك
  useEffect(() => {
    const c = canvas.current; if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = c.getContext('2d'); let raf; const dpr = Math.min(2, devicePixelRatio || 1)
    const size = () => { c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr }
    size(); addEventListener('resize', size)
    const P = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + 0.4, s: Math.random() * 0.0007 + 0.0002, a: Math.random() * Math.PI * 2 }))
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height)
      for (const p of P) {
        p.y -= p.s; p.a += 0.02; if (p.y < -0.02) { p.y = 1.02; p.x = Math.random() }
        const x = (p.x + Math.sin(p.a) * 0.004) * c.width, y = p.y * c.height
        ctx.beginPath(); ctx.arc(x, y, p.r * dpr, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(243, 214, 140, ${0.35 + Math.sin(p.a) * 0.25})`; ctx.shadowColor = '#f3d68c'; ctx.shadowBlur = 8 * dpr; ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size) }
  }, [])
  const [title, sub] = slides[i % Math.max(slides.length, 1)] || []
  return (
    <section className="hero">
      {imgs.map((src, k) => (
        <picture key={src + k}>
          {mimgs[k] && <source media="(max-width: 640px)" srcSet={mimgs[k]} />}
          <img src={src} alt="" className={`hero-img ${k === i ? 'is-on' : ''}`} fetchPriority={k === 0 ? 'high' : 'low'} />
        </picture>
      ))}
      {n > 1 && <button type="button" className="hero-arrow prev" onClick={() => setI((i - 1 + n) % n)} aria-label={u.prev}><Icon name="chev" size={22} className="flip-x" /></button>}
      {n > 1 && <button type="button" className="hero-arrow next" onClick={() => setI((i + 1) % n)} aria-label={u.next}><Icon name="chev" size={22} /></button>}
      <canvas ref={canvas} className="hero-dust" aria-hidden="true" />
      <div className="hero-card" key={i}>
        {title && <h1>{title}</h1>}
        {sub && <p>{sub}</p>}
        <Link to={links[i] || '/shop'} className="btn btn-dark">{tx(h, 'button') || u.discover}</Link>
      </div>
      {n > 1 && <div className="hero-dots">{imgs.map((_, k) => <button key={k} type="button" className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={String(k + 1)}><i /></button>)}</div>}
    </section>
  )
}

/* ───────── الجملة الكبيرة (Be Different. Smell Unique.) ───────── */
function Tagline() {
  const t = useBlock('tagline')
  const { tx } = useLang()
  const words = tx(t, 'title').split(' ')
  return (
    <section className="tagline">
      <h2 data-reveal>{words.map((w, k) => <span key={k} style={{ '--i': k }}>{w}{k < words.length - 1 ? ' ' : ''}</span>)}</h2>
    </section>
  )
}

/* ───────── بانر إعلاني (صورة تصميم كاملة) ───────── */
function AdBanner() {
  const b = useBlock('adbanner')
  if (b.in_hero !== false && b.hero_image_url) return null
  const { tx } = useLang()
  if (!b.image_url) return null
  return (
    <section className="adbanner">
      <Link to={b.link || '/shop'} className="adbanner-in" data-reveal aria-label={tx(b, 'alt')}>
        <picture>
          {b.mobile_image_url && <source media="(max-width: 640px)" srcSet={b.mobile_image_url} />}
          <img src={b.image_url} alt={tx(b, 'alt')} loading="lazy" />
        </picture>
        <span className="adbanner-shine" />
      </Link>
    </section>
  )
}

/* ───────── دواير الأقسام (Faces) ───────── */
function Categories() {
  const c = useBlock('categories')
  const { ar } = useLang()
  const items = pipes(c.items)
  return (
    <section className="cats wrap">
      {items.map(([a, e, to, img, bg], k) => (
        <Link key={k} to={to || '/shop'} className="cat" data-reveal style={{ '--i': k }}>
          <span className="cat-c" style={{ background: bg || '#f1ebe0' }}><img src={img} alt="" loading="lazy" /></span>
          <b>{ar ? a : e || a}</b>
        </Link>
      ))}
    </section>
  )
}

/* ───────── أحدث الإصدارات مع النوتات (Jovoy) ───────── */
function Novelties() {
  const b = useBlock('novelties')
  const { tx } = useLang()
  const list = useProducts().filter((p) => p.featured || p.is_new).slice(0, 10)
  return (
    <section className="sec novelties">
      <div className="wrap"><SecHead title={tx(b, 'title')} center={false} /></div>
      <Rail className="wrap" auto={2600}>{list.map((p, k) => <ProductCard key={p.slug} p={p} notes i={k} />)}</Rail>
    </section>
  )
}

/* ───────── شريط كلام متحرك ───────── */
function TextMarquee() {
  const b = useBlock('marquee')
  const { tx } = useLang()
  const items = lines(tx(b, 'items'))
  if (!items.length) return null
  return (
    <section className="tmq" aria-hidden="true">
      <Marquee speed={35}>{items.map((t, k) => <span key={k}>{t}<img src="/brand/mark.png" alt="" /></span>)}</Marquee>
    </section>
  )
}

/* ───────── شريط زجاجات متحرك ───────── */
function BottlesMarquee() {
  const b = useBlock('marquee')
  const { tx } = useLang()
  const all = useProducts()
  if (!all.length) return null
  const half = Math.ceil(all.length / 2)
  const row = (list) => list.map((p) => <Link key={p.slug} to={`/p/${p.slug}`} className="bmq-item"><span className="bmq-spin"><img src={p.image_url} alt="" loading="lazy" /></span><span>{tx(p, 'name')}</span></Link>)
  return (
    <section className="sec bmq">
      <div className="wrap"><SecHead eyebrow={tx(b, 'eyebrow')} title={tx(b, 'title')} /></div>
      <Marquee speed={60}>{row(all.slice(0, half))}</Marquee>
      <Marquee speed={70} reverse>{row(all.slice(half))}</Marquee>
    </section>
  )
}

/* ───────── سلايدر العطر المميز (تلقائي) ───────── */
function Spotlight() {
  const b = useBlock('spotlight')
  const { tx, u } = useLang()
  const all = useProducts()
  const list = lines(b.products).map((s) => all.find((p) => p.slug === s)).filter(Boolean)
  const [i, setI] = useState(0)
  const [hold, setHold] = useState(false)
  useEffect(() => { if (list.length < 2 || hold) return; const t = setInterval(() => setI((x) => (x + 1) % list.length), 5000); return () => clearInterval(t) }, [list.length, hold, i])
  if (!list.length) return null
  const p = list[i % list.length]
  const notes = [[u.top, 'notes_top'], [u.heart, 'notes_heart'], [u.base, 'notes_base']].map(([l, k]) => [l, commas(tx(p, k)).slice(0, 3).join(' · ')]).filter(([, v]) => v)
  return (
    <section className="spot" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <div className="spot-bg" key={'bg' + p.slug} style={{ backgroundImage: `url(${p.image_url})` }} />
      <div className="wrap spot-in">
        <div className="spot-txt" key={'t' + p.slug}>
          <p className="eyebrow">{tx(b, 'eyebrow')}</p>
          <h2>{tx(p, 'name')}</h2>
          <p className="spot-tag">{tx(p, 'tagline')}</p>
          {notes.length > 0 && <dl className="spot-notes">{notes.map(([l, v], k) => <div key={l} style={{ '--i': k }}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>}
          <Link to={`/p/${p.slug}`} className="btn btn-gold">{u.discover}</Link>
        </div>
        <div className="spot-art">
          <span className="spot-ring" />
          <div className="spot-3d" key={'i' + p.slug}><Bottle3D p={p} auto={0.55} drag /></div>
          {p.box_url && <img key={'b' + p.slug} className="spot-box" src={p.box_url} alt="" />}
        </div>
      </div>
      <div className="wrap spot-nav">
        {list.map((x, k) => <button key={x.slug} type="button" className={k === i % list.length ? 'on' : ''} onClick={() => setI(k)}><img src={x.image_url} alt="" /><span>{tx(x, 'name')}</span>{k === i % list.length && !hold && <i />}</button>)}
      </div>
    </section>
  )
}

/* ───────── كارتين تحريرية (Jovoy: Musk Margarita / Velvet Tonka) ───────── */
function Editorial() {
  const e = useBlock('editorial')
  const { tx } = useLang()
  return (
    <section className="sec wrap edit2">
      {['e1', 'e2'].map((k, i) => (
        <Link key={k} to={e[`${k}_link`] || '/shop'} className="edit" data-reveal style={{ '--i': i }}>
          <div className="edit-img"><img src={e[`${k}_image_url`]} alt="" loading="lazy" /></div>
          <h3>{tx(e, `${k}_title`)}</h3>
          <p>{tx(e, `${k}_text`)}</p>
          <span className="ulink">{tx(e, `${k}_link`)}</span>
        </Link>
      ))}
    </section>
  )
}

/* ───────── شبكة المجموعات الطولية (Aedes) ───────── */
function Tiles() {
  const t = useBlock('tiles')
  const { ar } = useLang()
  const items = pipes(t.items)
  return (
    <section className="sec wrap tiles">
      {items.map(([img, na, ne, la, le, to], k) => (
        <Link key={k} to={to || '/shop'} className="tile" data-reveal style={{ '--i': k % 3 }}>
          <img src={img} alt="" loading="lazy" />
          <div className="tile-cap"><h3>{ar ? na : ne || na}</h3></div>
          <span className="tile-btn">{ar ? la : le || la}</span>
        </Link>
      ))}
    </section>
  )
}

/* ───────── بانر عريض (Aedes: Now available) ───────── */
function Banner() {
  const b = useBlock('banner')
  const { tx } = useLang()
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const on = () => { const r = el.getBoundingClientRect(); const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; el.style.setProperty('--py', `${Math.max(-60, Math.min(60, p * -60))}px`) }
    on(); addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on)
  }, [])
  return (
    <Link to={b.link || '/shop'} className="banner" ref={ref}>
      <img src={b.image_url} alt="" loading="lazy" />
      <div className="banner-in" data-reveal>
        <small>{tx(b, 'eyebrow')}</small>
        <h2>{tx(b, 'title')}</h2>
      </div>
    </Link>
  )
}

/* ───────── أحدث العطور بتبويبات (Aedes + Ramfa) ───────── */
function Arrivals() {
  const b = useBlock('arrivals')
  const { tx, u } = useLang()
  const all = useProducts()
  const tabs = [['new', u.new, (p) => p.is_new], ['men', u.men, (p) => p.gender === 'men'], ['women', u.women, (p) => p.gender === 'women'], ['unisex', u.unisex, (p) => p.gender === 'unisex']]
  const [tab, setTab] = useState('new')
  const f = tabs.find((x) => x[0] === tab)[2]
  const list = (tab === 'new' ? [...all.filter(f), ...all.filter((p) => !f(p))] : all.filter(f)).slice(0, 8)
  return (
    <section className="sec wrap arrivals">
      <SecHead eyebrow={tx(b, 'eyebrow')} title={tx(b, 'title')} />
      <div className="tabs" role="tablist" data-reveal>{tabs.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div className="grid4" key={tab}>{list.map((p, k) => <ProductCard key={p.slug} p={p} notes i={k} />)}</div>
      <div className="center"><Link to="/shop" className="btn btn-dark">{u.viewAll}</Link></div>
    </section>
  )
}

/* ───────── أطقم الاكتشاف: صورة + كاروسيل (Aedes) ───────── */
function Discovery() {
  const d = useBlock('discovery')
  const { tx, u } = useLang()
  const all = useProducts()
  const list = lines(d.products).map((s) => all.find((p) => p.slug === s)).filter(Boolean)
  const [i, setI] = useState(0)
  useEffect(() => { if (list.length < 2) return; const t = setInterval(() => setI((x) => (x + 1) % list.length), 4500); return () => clearInterval(t) }, [list.length])
  if (!list.length) return null
  const p = list[i % list.length]
  return (
    <section className="sec wrap disc">
      <div className="disc-img" data-reveal><img src={d.image_url} alt="" loading="lazy" /><div className="disc-title"><h2>{tx(d, 'title')}</h2><p>{tx(d, 'text')}</p></div></div>
      <div className="disc-side" data-reveal>
        <button type="button" className="rail-btn prev" onClick={() => setI((i - 1 + list.length) % list.length)} aria-label={u.prev}><Icon name="chev" size={18} className="flip-x" /></button>
        <div className="disc-item" key={p.slug}>
          <Link to={`/p/${p.slug}`} className="disc-pimg"><img src={p.box_url || p.image_url} alt="" /></Link>
          <b>{tx(p, 'name')}</b>
          <Price p={p} />
          <Link to={`/p/${p.slug}`} className="btn btn-dark sm">{u.viewProduct}</Link>
        </div>
        <button type="button" className="rail-btn next" onClick={() => setI((i + 1) % list.length)} aria-label={u.next}><Icon name="chev" size={18} /></button>
        <div className="dots">{list.map((_, k) => <i key={k} className={k === i % list.length ? 'on' : ''} />)}</div>
      </div>
    </section>
  )
}

/* ───────── صورة + نص بالتبادل (Aedes: Nomenclature / Santa Maria Novella) ───────── */
function Splits() {
  const s = useBlock('splits')
  const { tx } = useLang()
  return (
    <section className="splits">
      <div className="split">
        <div className="split-img" data-reveal><img src={s.s1_image_url} alt="" loading="lazy" /></div>
        <Link to={s.s1_link || '/shop'} className="split-txt" data-reveal><h2 className="ul-title">{tx(s, 's1_title')}</h2><span>{tx(s, 's1_text')}</span></Link>
      </div>
      <div className="split rev">
        <Link to={s.s2_link || '/shop'} className="split-txt" data-reveal><small className="ul-small">{tx(s, 's2_eyebrow')}</small><h2 className="ul-title">{tx(s, 's2_title')}</h2></Link>
        <div className="split-img" data-reveal><img src={s.s2_image_url} alt="" loading="lazy" /></div>
      </div>
    </section>
  )
}

/* ───────── خدمة جرّبني (Jovoy: Try me) ───────── */
function TryMe() {
  const t = useBlock('tryme')
  const { tx } = useLang()
  const [open, setOpen] = useState(false)
  const paras = String(tx(t, 'text')).split(/\n\s*\n/)
  return (
    <section className="sec tryme">
      <div className="wrap tryme-in">
        <div className="tryme-media" data-reveal><img src={t.image_url} alt="" loading="lazy" /><span className="tryme-play"><img src="/brand/mark.png" alt="" /></span></div>
        <div className="tryme-txt" data-reveal>
          <h2>{tx(t, 'title')}</h2>
          {paras.map((x, k) => <p key={k} className={k === paras.length - 1 ? 'hl' : ''}>{x}</p>)}
        </div>
      </div>
      <div className="center"><button type="button" className="btn btn-dark" onClick={() => setOpen(true)}>{tx(t, 'button')}</button></div>
      {open && <ScentFinder onClose={() => setOpen(false)} />}
    </section>
  )
}

/* ───────── كارتين غامقين (Jovoy: My Jovoy / Our stores) ───────── */
function DarkTiles() {
  const d = useBlock('darktiles')
  const { tx } = useLang()
  return (
    <section className="sec wrap dtiles">
      {['t1', 't2'].map((k, i) => (
        <div key={k} className="dtile" data-reveal style={{ '--i': i }}>
          <img src={d[`${k}_image_url`]} alt="" loading="lazy" />
          <div className="dtile-in">
            <h3>{tx(d, `${k}_title`)}</h3>
            <p>{tx(d, `${k}_text`)}</p>
            <Link to={d[`${k}_link`] || '/'} className="btn btn-light">{tx(d, `${k}_button`)}</Link>
          </div>
        </div>
      ))}
    </section>
  )
}

/* ───────── فيديو في نص الرئيسية ───────── */
function VideoSection() {
  const v = useBlock('video')
  const { tx, u } = useLang()
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause() }, { threshold: 0.25 })
    io.observe(el); return () => io.disconnect()
  }, [v.video_url])
  if (!v.video_url) return null
  return (
    <section className="vsec" data-reveal>
      <div className="wrap">
        {(tx(v, 'eyebrow') || tx(v, 'title')) && <div className="vsec-head">{tx(v, 'eyebrow') && <p className="eyebrow">{tx(v, 'eyebrow')}</p>}{tx(v, 'title') && <h2>{tx(v, 'title')}</h2>}</div>}
        <div className="vsec-frame">
          <video ref={ref} src={v.video_url} poster={v.poster_url || undefined} muted loop playsInline preload="metadata" aria-label={tx(v, 'title')} />
        </div>
        {v.link && <div className="vsec-cta"><Link to={v.link} className="btn btn-line">{tx(v, 'button') || u.shopNow || 'Shop'}</Link></div>}
      </div>
    </section>
  )
}

export const HOME_SECTIONS = {
  hero: Hero, tagline: Tagline, categories: Categories, adbanner: AdBanner, textmarquee: TextMarquee, spotlight: Spotlight, bottles: BottlesMarquee, novelties: Novelties, editorial: Editorial, tiles: Tiles,
  banner: Banner, video: VideoSection, arrivals: Arrivals, discovery: Discovery, splits: Splits, tryme: TryMe, darktiles: DarkTiles,
}

export default function Home() {
  const h = useBlock('home')
  useEffect(() => { document.title = 'نسيان للعطور | NESYAN — عطرٌ لا يُنسى' }, [])
  let all = lines(h.sections)
  // لو الترتيب المحفوظ قديم ومفيهوش الفيديو، نحطه في النص بعد البانر
  if (!all.some((l) => l.replace(/^-/, '') === 'video')) { const i = all.indexOf('banner'); all = i >= 0 ? [...all.slice(0, i + 1), 'video', ...all.slice(i + 1)] : [...all.slice(0, Math.ceil(all.length / 2)), 'video', ...all.slice(Math.ceil(all.length / 2))] }
  const order = all.filter((l) => !l.startsWith('-') && HOME_SECTIONS[l])
  return <>{order.map((k) => { const C = HOME_SECTIONS[k]; return <C key={k} /> })}</>
}
