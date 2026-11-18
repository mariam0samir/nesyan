import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { useProducts, minPrice, useBlock, pipes } from '../lib/store'
import { Icon, ProductCard } from '../components/ui'
import { FAMILIES, GENDERS } from '../data/defaults'

const PAGE = 12

/* صفحة المتجر: فلاتر جانبية + ترتيب + شبكة (Bloom / Fragrantica / Faces) */
export default function Shop() {
  const { u, t2, ar } = useLang()
  const all = useProducts()
  const cats = pipes(useBlock('categories').items)
  const [sp, setSp] = useSearchParams()
  const [more, setMore] = useState(1)
  const [side, setSide] = useState(false)
  const q = sp.get('q') || ''
  const sel = (k) => (sp.get(k) || '').split(',').filter(Boolean)
  const gender = sel('gender'), family = sel('family'), conc = sel('conc')
  const sort = sp.get('sort') || 'featured'
  const stock = sp.get('stock') === '1'
  const prices = all.map(minPrice).filter(Boolean)
  const maxP = Math.max(1000, ...prices)
  const pmax = Number(sp.get('max')) || maxP

  useEffect(() => { setMore(1) }, [sp])
  useEffect(() => { document.title = `${u.shop} | NESYAN` }, [u])
  useEffect(() => { document.body.classList.toggle('no-scroll', side); return () => document.body.classList.remove('no-scroll') }, [side])

  const setKey = (k, v) => { const n = new URLSearchParams(sp); if (v === '' || v == null) n.delete(k); else n.set(k, v); setSp(n, { replace: true }) }
  const toggle = (k, v) => { const cur = sel(k); setKey(k, (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).join(',')) }

  const list = useMemo(() => {
    const s = q.toLowerCase()
    let r = all.filter((p) => (!gender.length || gender.includes(p.gender)) && (!family.length || family.includes(p.family)) && (!conc.length || conc.includes(p.concentration))
      && (!stock || p.in_stock !== false) && minPrice(p) <= pmax
      && (!s || [p.name_ar, p.name_en, p.notes_top_ar, p.notes_top_en, p.notes_heart_ar, p.notes_heart_en, p.notes_base_ar, p.notes_base_en, p.family].join(' ').toLowerCase().includes(s)))
    const by = { new: (a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0), priceAsc: (a, b) => minPrice(a) - minPrice(b), priceDesc: (a, b) => minPrice(b) - minPrice(a), name: (a, b) => (ar ? a.name_ar : a.name_en).localeCompare(ar ? b.name_ar : b.name_en) }[sort]
    if (by) r = [...r].sort(by)
    return r
  }, [all, q, gender.join(), family.join(), conc.join(), sort, stock, pmax, ar])

  const fams = Object.keys(FAMILIES).filter((f) => all.some((p) => p.family === f))
  const concs = [...new Set(all.map((p) => p.concentration).filter(Boolean))]
  const count = (k, v) => all.filter((p) => p[k] === v).length
  const active = gender.length + family.length + conc.length + (stock ? 1 : 0) + (sp.get('max') ? 1 : 0) + (q ? 1 : 0)
  const shown = list.slice(0, PAGE * more)
  const title = q ? `${u.results2}: «${q}»` : family.length === 1 ? t2(FAMILIES[family[0]]) : gender.length === 1 ? t2(GENDERS[gender[0]]) : u.allPerfumes

  const Group = ({ label, k, opts }) => (
    <details className="fgroup" open>
      <summary>{label}<Icon name="down" size={14} /></summary>
      <div>{opts.map(([v, l, n]) => (
        <label key={v} className="fcheck"><input type="checkbox" checked={sel(k).includes(v)} onChange={() => toggle(k, v)} /><span>{l}</span><em>{n}</em></label>
      ))}</div>
    </details>
  )

  return (
    <div className="shop">
      <div className="wrap">
        <nav className="crumbs" aria-label="breadcrumb"><Link to="/">{u.home}</Link><Icon name="chev" size={12} className="flip-rtl" /><span>{u.shop}</span></nav>
        <h1 className="page-title" data-reveal>{title}</h1>
        <div className="cats sm">
          {cats.map(([a, e, to, img, bg], k) => (
            <Link key={k} to={to || '/shop'} className="cat" style={{ '--i': k }}><span className="cat-c" style={{ background: bg }}><img src={img} alt="" /></span><b>{ar ? a : e || a}</b></Link>
          ))}
        </div>
        <div className="shop-grid">
          <div className={`drawer-ov ${side ? 'is-open' : ''}`} onClick={() => setSide(false)} />
          <aside className={`filters ${side ? 'is-open' : ''}`}>
            <header><h3>{u.filters}</h3>{active > 0 && <button type="button" className="link-btn" onClick={() => setSp({}, { replace: true })}>{u.clearAll}</button>}<button type="button" className="hdr-ico f-close" onClick={() => setSide(false)} aria-label={u.close}><Icon name="close" /></button></header>
            <Group label={u.gender} k="gender" opts={Object.keys(GENDERS).map((g) => [g, t2(GENDERS[g]), count('gender', g)])} />
            <Group label={u.family} k="family" opts={fams.map((f) => [f, t2(FAMILIES[f]), count('family', f)])} />
            {concs.length > 0 && <Group label={u.concentration} k="conc" opts={concs.map((c) => [c, <bdi key={c} dir="ltr">{c}</bdi>, count('concentration', c)])} />}
            <details className="fgroup" open>
              <summary>{u.price}<Icon name="down" size={14} /></summary>
              <div className="frange">
                <input type="range" min={0} max={maxP} step={100} value={pmax} onChange={(e) => setKey('max', Number(e.target.value) >= maxP ? '' : e.target.value)} aria-label={u.price} />
                <p><span>0</span><b dir="ltr">≤ {pmax.toLocaleString('en-US')} {u.egp}</b></p>
              </div>
            </details>
            <label className="fcheck sw"><input type="checkbox" checked={stock} onChange={() => setKey('stock', stock ? '' : '1')} /><span>{u.inStock}</span></label>
            <button type="button" className="btn btn-dark btn-block f-apply" onClick={() => setSide(false)}>{u.apply} ({list.length})</button>
          </aside>
          <div className="shop-main">
            <div className="shop-bar">
              <button type="button" className="btn btn-line sm f-open" onClick={() => setSide(true)}><Icon name="filter" size={16} />{u.filters}{active > 0 && ` (${active})`}</button>
              <p>{u.showing.replace('{a}', shown.length).replace('{b}', list.length)}</p>
              <label className="sort">{u.sortBy}
                <select value={sort} onChange={(e) => setKey('sort', e.target.value === 'featured' ? '' : e.target.value)}>
                  {[['featured', u.sortFeatured], ['new', u.sortNew], ['priceAsc', u.sortPriceAsc], ['priceDesc', u.sortPriceDesc], ['name', u.sortName]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
            {active > 0 && (
              <div className="chips">
                {q && <button type="button" onClick={() => setKey('q', '')}>«{q}» ×</button>}
                {gender.map((g) => <button key={g} type="button" onClick={() => toggle('gender', g)}>{t2(GENDERS[g])} ×</button>)}
                {family.map((f) => <button key={f} type="button" onClick={() => toggle('family', f)}>{t2(FAMILIES[f])} ×</button>)}
                {conc.map((c) => <button key={c} type="button" onClick={() => toggle('conc', c)}>{c} ×</button>)}
              </div>
            )}
            {!list.length ? <p className="empty">{u.noResults}</p> : (
              <div className="grid3">{shown.map((p, k) => <ProductCard key={p.slug} p={p} notes i={k % 3} />)}</div>
            )}
            {shown.length < list.length && <div className="center"><button type="button" className="btn btn-dark" onClick={() => setMore(more + 1)}>{u.loadMore}</button><p className="muted" dir="ltr">{shown.length} / {list.length}</p></div>}
          </div>
        </div>
      </div>
    </div>
  )
}
