import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { useCart, useProducts, useProduct, useBlock, sizesOf, money, commas, lines, waLink, useReady } from '../lib/store'
import { Icon, Meter, ProductCard, Rail, flyToCart } from '../components/ui'
import { FAMILIES, GENDERS } from '../data/defaults'
import NotFound from './NotFound'

/* صفحة العطر (Luckyscent + Prabhuji) */
export default function Product() {
  const { slug } = useParams()
  const p = useProduct(slug)
  const ready = useReady()
  if (!p) return ready ? <NotFound /> : <div className="loading" />
  return <ProductView p={p} key={p.slug} />
}

function ProductView({ p }) {
  const { u, tx, t2, lang } = useLang()
  const { add, wish, toggleWish, setOpen } = useCart()
  const all = useProducts()
  const c = useBlock('contact')
  const sizes = sizesOf(p)
  const [size, setSize] = useState(sizes[0]?.label || '')
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('story')
  const [done, setDone] = useState(false)
  const imgs = [p.image_url, p.box_url, ...lines(p.gallery)].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i)
  const [img, setImg] = useState(0)
  const [zoom, setZoom] = useState(null)
  const cur = sizes.find((s) => s.label === size) || sizes[0] || { price: 0, compare: 0 }
  useEffect(() => { document.title = `${tx(p, 'name')} | NESYAN` }, [p, tx])

  const related = useMemo(() => {
    const score = (x) => (x.family === p.family ? 2 : 0) + (x.gender === p.gender ? 1 : 0)
    return all.filter((x) => x.slug !== p.slug).sort((a, b) => score(b) - score(a)).slice(0, 8)
  }, [all, p])
  const bundle = useMemo(() => [p, ...related.filter((x) => x.family !== 'set').slice(0, 2)], [p, related])
  const [pick, setPick] = useState(() => bundle.map(() => true))
  const bundleTotal = bundle.reduce((a, x, i) => a + (pick[i] ? (sizesOf(x)[0]?.price || 0) : 0), 0)

  const addMain = (e) => {
    add(p.slug, cur.label, qty); setDone(true); setTimeout(() => setDone(false), 1500)
    flyToCart(document.querySelector('.pg-main img'))
    e?.currentTarget?.blur()
  }
  const wa = waLink(c.whatsapp, `${u.whatsappMsg}\n${tx(p, 'name')} — ${cur.label} × ${qty}`)
  const notes = [['top', u.top, 'spark'], ['heart', u.heart, 'drop'], ['base', u.base, 'shield']].map(([k, l, ic]) => [l, ic, commas(tx(p, `notes_${k}`))]).filter(([, , n]) => n.length)
  const desc = String(tx(p, 'description')).split(/\n\s*\n/)

  return (
    <div className="pdp">
      <div className="wrap">
        <nav className="crumbs" aria-label="breadcrumb"><Link to="/">{u.home}</Link><Icon name="chev" size={12} className="flip-rtl" /><Link to={`/shop?family=${p.family}`}>{t2(FAMILIES[p.family]) || u.shop}</Link><Icon name="chev" size={12} className="flip-rtl" /><span>{tx(p, 'name')}</span></nav>
        <div className="pdp-grid">
          {/* المعرض */}
          <div className="pg">
            <div className="pg-thumbs">
              {imgs.map((src, k) => <button key={src} type="button" className={k === img ? 'on' : ''} onClick={() => setImg(k)} aria-label={[u.bottle, u.box, u.both][k] || String(k + 1)}><img src={src} alt="" className={src.includes('/media/') ? 'photo' : ''} /></button>)}
            </div>
            <div className="pg-main" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }) }} onMouseLeave={() => setZoom(null)}>
              <img key={img} src={imgs[img]} className={imgs[img]?.includes('/media/') ? 'photo' : ''} alt={tx(p, 'name')} style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%`, transform: 'scale(1.6)' } : undefined} />
              <div className="pg-badges">{p.is_new && <span className="bdg">{u.new}</span>}{p.is_exclusive && <span className="bdg red">{u.exclusive}</span>}</div>
              {imgs.length > 1 && <div className="pg-switch">{imgs.slice(0, 2).map((_, k) => <button key={k} type="button" className={k === img ? 'on' : ''} onClick={() => setImg(k)}>{[u.bottle, u.box][k]}</button>)}</div>}
            </div>
          </div>

          {/* البيانات */}
          <div className="pinfo">
            <p className="pinfo-brand">NESYAN · {t2(GENDERS[p.gender])}{p.inspired && ` · ${u.inspired}`}</p>
            <h1>{tx(p, 'name')}</h1>
            {tx(p, 'tagline') && <p className="pinfo-tag">{tx(p, 'tagline')}</p>}
            <p className="pinfo-price">{cur.price > 0 ? <><span key={cur.label}>{money(cur.price, lang)}</span>{cur.compare > cur.price && <del>{money(cur.compare, lang)}</del>}</> : <span className="ask">{u.askPrice}</span>}</p>
            {sizes.length > 0 && (
              <div className="opt">
                <p>{u.size}: <b>{cur.label}</b></p>
                <div className="sizes">{sizes.map((s) => <button key={s.label} type="button" className={s.label === cur.label ? 'on' : ''} onClick={() => setSize(s.label)}>{s.label}</button>)}</div>
              </div>
            )}
            {cur.price > 0 ? (
              <>
                <div className="buy">
                  <div className="stepper">
                    <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="-"><Icon name="minus" size={16} /></button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => setQty(Math.min(20, qty + 1))} aria-label="+"><Icon name="plus" size={16} /></button>
                  </div>
                  {p.in_stock === false
                    ? <button type="button" className="btn btn-dark grow" disabled>{u.outOfStock}</button>
                    : <button type="button" className={`btn btn-dark grow ${done ? 'is-done' : ''}`} onClick={addMain}>{done ? u.added : u.addToCart}</button>}
                  <button type="button" className={`wish-btn ${wish.includes(p.slug) ? 'on' : ''}`} onClick={() => toggleWish(p.slug)} aria-label={u.wishlist}><Icon name="heart" fill={wish.includes(p.slug) ? 'currentColor' : 'none'} /></button>
                </div>
                <div className="buy2">
                  {p.in_stock !== false && <button type="button" className="btn btn-gold" onClick={() => { addMain(); setTimeout(() => setOpen(true), 500) }}>{u.buyNow}</button>}
                  {c.whatsapp && <a className="btn btn-wa" href={wa} target="_blank" rel="noreferrer">{u.orderWhatsapp}</a>}
                </div>
              </>
            ) : (
              <div className="buy">
                {c.whatsapp && <a className="btn btn-wa grow" href={wa} target="_blank" rel="noreferrer">{u.orderWhatsapp}</a>}
                <button type="button" className={`wish-btn ${wish.includes(p.slug) ? 'on' : ''}`} onClick={() => toggleWish(p.slug)} aria-label={u.wishlist}><Icon name="heart" fill={wish.includes(p.slug) ? 'currentColor' : 'none'} /></button>
              </div>
            )}

            <div className="chips-attr">
              {[[u.gender, t2(GENDERS[p.gender])], [u.collection, t2(FAMILIES[p.family])], [u.size, sizes.map((x) => x.label).join(' / ')], [u.concentration, p.concentration], [u.year, p.year], [u.character, p.inspired ? tx(p, 'tagline') : '']].filter(([, v]) => v).map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}
            </div>

            {notes.length > 0 && (
              <div className="pyr">
                <h3>{u.pyramid}</h3>
                {notes.map(([l, ic, n], k) => (
                  <div key={l} className="pyr-row" style={{ '--i': k }} data-reveal>
                    <span className="pyr-ic"><Icon name={ic} size={18} /></span>
                    <div><small>{l}</small><p>{n.map((x) => <Link key={x} to={`/shop?q=${encodeURIComponent(x)}`}>{x}</Link>)}</p></div>
                  </div>
                ))}
              </div>
            )}
            {(p.longevity > 0 || p.sillage > 0) && <div className="meters"><Meter label={u.longevity} value={p.longevity || 0} /><Meter label={u.sillage} value={p.sillage || 0} /></div>}
          </div>
        </div>

        {/* تبويبات (Prabhuji) */}
        <section className="ptabs">
          <div className="tabs" role="tablist">{[['story', u.story], ['use', u.howToUse], ['ship', u.shippingReturns]].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
          <div className="ptab-body" key={tab}>
            {tab === 'story' && desc.map((x, k) => <p key={k}>{x}</p>)}
            {tab === 'use' && <p>{u.howToUseText}</p>}
            {tab === 'ship' && <p>{u.shippingText}</p>}
          </div>
        </section>

        {/* يُشترى معًا (Prabhuji) */}
        {bundle.length > 1 && bundleTotal > 0 && (
          <section className="fbt" data-reveal>
            <h3>{u.boughtTogether}</h3>
            <div className="fbt-in">
              <div className="fbt-imgs">{bundle.map((x, i) => <span key={x.slug} className={pick[i] ? '' : 'off'}>{i > 0 && <em>+</em>}<Link to={`/p/${x.slug}`}><img src={x.image_url} alt="" /></Link></span>)}</div>
              <div className="fbt-side">
                <p>{u.priceForAll}: <b>{money(bundleTotal, lang)}</b></p>
                <button type="button" className="btn btn-gold sm" onClick={() => { bundle.forEach((x, i) => pick[i] && add(x.slug, sizesOf(x)[0]?.label)); setOpen(true) }}>{u.addAll}</button>
              </div>
            </div>
            <ul className="fbt-list">{bundle.map((x, i) => (
              <li key={x.slug}><label><input type="checkbox" checked={pick[i]} disabled={i === 0} onChange={() => setPick(pick.map((v, k) => (k === i ? !v : v)))} />{tx(x, 'name')} — {sizesOf(x)[0]?.label}{sizesOf(x)[0]?.price > 0 && <> — <b>{money(sizesOf(x)[0]?.price, lang)}</b></>}</label></li>
            ))}</ul>
          </section>
        )}
      </div>

      <section className="sec related">
        <div className="wrap"><h2 className="sec-title center-t" data-reveal>{u.youMayLike}</h2></div>
        <Rail className="wrap">{related.map((x, k) => <ProductCard key={x.slug} p={x} i={k} />)}</Rail>
      </section>
    </div>
  )
}
