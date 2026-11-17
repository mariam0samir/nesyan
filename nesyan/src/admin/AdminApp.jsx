import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes, Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BLOCKS, FAMILIES, GENDERS } from '../data/defaults'
import './admin.css'

/* ═══════════ إعدادات الأقسام ═══════════ */
// [العنوان، الشرح، المجموعة]
const BLOCK_INFO = {
  home: ['ترتيب أقسام الرئيسية', 'رتّبي الأقسام بالأسهم، وأخفي أو أظهري أي قسم', 'home'],
  announce: ['شريط الإعلانات (فوق خالص)', 'كل سطر = رسالة بتتبدل لوحدها', 'home'],
  hero: ['الواجهة (السلايدر)', 'الصور بالترتيب — والشرائح: كل سطر «العنوان | السطر الصغير» — والروابط: رابط لكل شريحة بنفس الترتيب', 'home'],
  tagline: ['الجملة الكبيرة', '', 'home'],
  categories: ['دواير الأقسام', 'كل سطر: الاسم عربي | English | الرابط | الصورة | لون الدائرة', 'home'],
  novelties: ['إصدارات نسيان', 'العطور اللي بتظهر هنا: اللي متعلّم عليها «مميز» أو «جديد» في صفحة العطور', 'home'],
  editorial: ['الكارتين التحريرية', 'e1 = الكارت الأول، e2 = الكارت التاني', 'home'],
  tiles: ['شبكة المجموعات (6 صور طولية)', 'كل سطر: الصورة | الاسم عربي | English | الشارة عربي | English | الرابط', 'home'],
  banner: ['البانر العريض', '', 'home'],
  arrivals: ['تسوّق عطور نسيان', 'التبويبات: جديد / رجالي / حريمي / للجنسين', 'home'],
  discovery: ['المجموعة المتاحة', 'المنتجات اللي بتتعرض: slug لكل منتج في سطر', 'home'],
  splits: ['صورة + نص بالتبادل', 's1 = الأول، s2 = التاني', 'home'],
  tryme: ['اكتشف عطرك المميز', 'سطر فاضي بين الفقرات — آخر فقرة بتظهر بلون مميز. الزرار بيفتح اختبار اختيار العطر', 'home'],
  darktiles: ['الكارتين الغامقين', 't1 = الأول، t2 = التاني', 'home'],
  services: ['شريط المميزات (قبل الفوتر)', 'كل سطر: الأيقونة | النص — الأيقونات: shield, drop, spark, clock, sample, chat, truck, gift, cash', 'home'],
  about: ['صفحة عن نسيان', 'سطر فاضي بين الفقرات — المميزات: العنوان | النص', 'pages'],
  shop: ['الشحن والدفع', 'مصاريف الشحن بالجنيه (0 = تتحدد عند التأكيد) وحد الشحن المجاني (0 = مفيش)', 'general'],
  contact: ['بيانات التواصل', 'الواتساب بالصيغة الدولية من غير + (مثال 2010…)', 'general'],
  social: ['السوشيال ميديا', 'سيبي الخانة فاضية لو مش عايزة الأيقونة تظهر', 'general'],
}
const BLOCK_GROUPS = [['home', 'الصفحة الرئيسية'], ['pages', 'الصفحات'], ['general', 'إعدادات المتجر']]
const HOME_SECTION_NAMES = {
  hero: 'الواجهة (السلايدر)', tagline: 'الجملة الكبيرة', categories: 'دواير الأقسام', novelties: 'إصدارات نسيان', editorial: 'الكارتين التحريرية', tiles: 'شبكة المجموعات',
  banner: 'البانر العريض', arrivals: 'تسوّق عطور نسيان', discovery: 'المجموعة المتاحة', splits: 'صورة + نص بالتبادل', tryme: 'اكتشف عطرك المميز', darktiles: 'الكارتين الغامقين',
}
const LABELS = {
  sections: 'أقسام الصفحة الرئيسية', items: 'العناصر', images: 'الصور', slides: 'الشرائح', links: 'روابط الشرائح', button: 'نص الزر', title: 'العنوان', text: 'النص', eyebrow: 'العنوان الصغير',
  image_url: 'الصورة', image2_url: 'الصورة الثانية', hero_image_url: 'صورة الغلاف', link: 'الرابط', products: 'المنتجات (slug في كل سطر)', values: 'المميزات',
  shipping_fee: 'مصاريف الشحن (ج.م)', free_shipping_over: 'شحن مجاني للطلبات فوق (ج.م) — 0 = مفيش', cod_fee: 'رسوم الدفع عند الاستلام', instapay: 'رقم InstaPay / المحفظة', note: 'ملاحظة في صفحة الطلب',
  phone: 'التليفون', whatsapp: 'واتساب', email: 'الإيميل', address: 'العنوان', hours: 'مواعيد العمل', map_url: 'رابط الخريطة (embed)',
  instagram: 'إنستجرام', facebook: 'فيسبوك', tiktok: 'تيك توك', snapchat: 'سناب شات', x: 'X (تويتر)', youtube: 'يوتيوب',
}
const labelFor = (base) => {
  if (LABELS[base]) return LABELS[base]
  const m = base.match(/^(e|s|t)(\d)_(.+)$/)
  if (m) return `الكارت ${m[2] === '1' ? 'الأول' : 'التاني'}: ${LABELS[m[3]] || m[3]}`
  return base
}
const typeOf = (k, v) => k === 'sections' ? 'sections' : (k === 'images' || k.endsWith('_images')) ? 'images' : (k.endsWith('_url') && k !== 'map_url') ? 'image' : typeof v === 'boolean' ? 'check' : typeof v === 'number' ? 'number' : (String(v).includes('\n') || String(v).length > 90 || k.startsWith('items')) ? 'textarea' : 'text'
const SOURCES = { contact: 'تواصل', newsletter: 'النشرة البريدية' }
const STATUS = [['new', 'جديد'], ['confirmed', 'تم التأكيد'], ['shipped', 'تم الشحن'], ['delivered', 'تم التسليم'], ['cancelled', 'ملغي']]
const egp = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US')} ج.م`

/* ═══════════ أدوات ═══════════ */
async function upload(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${new Date().toISOString().slice(0, 7)}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '31536000', upsert: false })
  if (error) throw error
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}
function useToast() {
  const [t, setT] = useState(null)
  useEffect(() => { if (!t) return; const id = setTimeout(() => setT(null), 3200); return () => clearTimeout(id) }, [t])
  return [t && <div className={`ad-toast ${t.bad ? 'bad' : ''}`}>{t.msg}</div>, (msg, bad) => setT({ msg, bad })]
}

function Field({ f, value, onChange, toast }) {
  const [busy, setBusy] = useState(false)
  const pick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try { onChange(await upload(file)); toast('تم رفع الصورة ✓') } catch (err) { toast('فشل الرفع: ' + err.message, true) } finally { setBusy(false); e.target.value = '' }
  }
  const dir = f.ltr ? 'ltr' : undefined
  const wide = ['textarea', 'long', 'sections', 'images', 'sizes'].includes(f.type)
  const Tag = ['sections', 'images', 'sizes'].includes(f.type) ? 'div' : 'label'
  return (
    <Tag className={`ad-field ${wide ? 'wide' : ''} ${/_(ar|en)$/.test(f.k || '') || f.half ? '' : 'full'} ${f.type === 'check' ? 'is-check' : ''}`}>
      {f.type === 'check' ? <><input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /><span>{f.label}</span></> : <span>{f.label}{f.required && ' *'}</span>}
      {f.type === 'text' && <input dir={dir} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />}
      {f.type === 'number' && <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />}
      {f.type === 'textarea' && <textarea dir={dir} rows={Math.min(16, Math.max(3, String(value ?? '').split('\n').length + Math.ceil(String(value ?? '').length / 80)))} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />}
      {f.type === 'long' && <textarea dir={dir} rows={10} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />}
      {f.type === 'sections' && <SectionsEditor value={value} onChange={onChange} />}
      {f.type === 'images' && <ImagesEditor value={value} onChange={onChange} toast={toast} />}
      {f.type === 'sizes' && <SizesEditor value={value} onChange={onChange} />}
      {f.type === 'select' && <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
      {f.type === 'image' && (
        <div className="ad-media">
          {value && <img src={value} alt="" />}
          <input dir="ltr" placeholder="https://… أو ارفع صورة" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
          <span className={`ad-btn ghost sm ${busy ? 'busy' : ''}`}>{busy ? 'جاري الرفع…' : 'رفع صورة'}<input type="file" accept="image/*" onChange={pick} disabled={busy} /></span>
        </div>
      )}
    </Tag>
  )
}

function SectionsEditor({ value, onChange }) {
  const parse = String(value || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => ({ key: l.replace(/^-/, '').trim(), on: !l.startsWith('-') })).filter((r) => HOME_SECTION_NAMES[r.key])
  const rows = [...parse, ...Object.keys(HOME_SECTION_NAMES).filter((k) => !parse.some((r) => r.key === k)).map((key) => ({ key, on: false }))]
  const out = (list) => onChange(list.map((r) => (r.on ? '' : '-') + r.key).join('\n'))
  const move = (i, d) => { const l = [...rows]; const j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; out(l) }
  return (
    <div className="ad-sections">
      {rows.map((r, i) => (
        <div key={r.key} className={`ad-sec ${r.on ? '' : 'off'}`}>
          <b>{i + 1}</b><span>{HOME_SECTION_NAMES[r.key]}</span>
          <button type="button" className={`ad-pill ${r.on ? 'on' : ''}`} onClick={() => out(rows.map((x, k) => (k === i ? { ...x, on: !x.on } : x)))}>{r.on ? 'ظاهر' : 'مخفي'}</button>
          <button type="button" className="ad-ico" onClick={() => move(i, -1)} disabled={!i} aria-label="لفوق">↑</button>
          <button type="button" className="ad-ico" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="لتحت">↓</button>
        </div>
      ))}
    </div>
  )
}

function ImagesEditor({ value, onChange, toast }) {
  const [busy, setBusy] = useState(false)
  const list = String(value || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const set = (l) => onChange(l.join('\n'))
  const pick = async (e) => {
    const files = [...(e.target.files || [])]; if (!files.length) return
    setBusy(true)
    try { const urls = []; for (const f of files) urls.push(await upload(f)); set([...list, ...urls]); toast(`تم رفع ${urls.length} صورة ✓`) } catch (err) { toast('فشل الرفع: ' + err.message, true) } finally { setBusy(false); e.target.value = '' }
  }
  const move = (i, d) => { const l = [...list]; const j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; set(l) }
  return (
    <div className="ad-imgs">
      <div className="ad-thumbs">
        {list.map((u, i) => (
          <figure key={u + i}><img src={u} alt="" />
            <figcaption>
              <button type="button" onClick={() => move(i, -1)} disabled={!i}>→</button>
              <button type="button" className="del" onClick={() => set(list.filter((_, k) => k !== i))}>حذف</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1}>←</button>
            </figcaption>
          </figure>
        ))}
        <span className={`ad-add ${busy ? 'busy' : ''}`}>{busy ? 'جاري الرفع…' : '+ إضافة صور'}<input type="file" accept="image/*" multiple onChange={pick} disabled={busy} /></span>
      </div>
      <details><summary>تعديل الروابط يدويًا</summary><textarea dir="ltr" rows={Math.max(3, list.length + 1)} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></details>
    </div>
  )
}

/* الأحجام والأسعار — بتتحفظ نص: «الحجم | السعر | قبل الخصم» */
function SizesEditor({ value, onChange }) {
  const rows = String(value || '').split('\n').filter((l) => l.trim()).map((l) => { const [a = '', b = '', c = ''] = l.split('|').map((x) => x.trim()); return [a, b, c] })
  const out = (r) => onChange(r.filter((x) => x[0] || x[1]).map((x) => x.filter((v, i) => i < 2 || v).join(' | ')).join('\n'))
  const set = (i, j, v) => out(rows.map((r, k) => (k === i ? r.map((x, n) => (n === j ? v.replace(/\|/g, '') : x)) : r)))
  return (
    <div className="ad-sizes">
      <div className="ad-size head"><span>الحجم (مثال: 100 مل)</span><span>السعر</span><span>قبل الخصم (اختياري)</span><span /></div>
      {rows.map((r, i) => (
        <div key={i} className="ad-size">
          <input value={r[0]} onChange={(e) => set(i, 0, e.target.value)} placeholder="100 مل" />
          <input value={r[1]} onChange={(e) => set(i, 1, e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" dir="ltr" placeholder="3500" />
          <input value={r[2]} onChange={(e) => set(i, 2, e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" dir="ltr" placeholder="—" />
          <button type="button" onClick={() => out(rows.filter((_, k) => k !== i))} aria-label="حذف">✕</button>
        </div>
      ))}
      <button type="button" className="ad-btn ghost sm" onClick={() => onChange((value ? value + '\n' : '') + 'حجم جديد | 0')}>+ إضافة حجم</button>
    </div>
  )
}

/* ═══════════ تسجيل الدخول ═══════════ */
function Login() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw })
    if (error) setErr('الإيميل أو كلمة السر غلط'); setBusy(false)
  }
  return (
    <div className="ad-login">
      <form onSubmit={go} className="ad-box">
        <img src="/brand/logo-full.png" alt="NESYAN" />
        <h1>لوحة التحكم</h1>
        <label className="ad-field"><span>الإيميل</span><input dir="ltr" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></label>
        <label className="ad-field"><span>كلمة السر</span><input dir="ltr" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></label>
        {err && <p className="ad-err">{err}</p>}
        <button className="ad-btn" disabled={busy}>{busy ? '…' : 'دخول'}</button>
        <Link to="/" className="ad-back">← الرجوع للموقع</Link>
      </form>
    </div>
  )
}

/* ═══════════ محرر الأقسام ═══════════ */
function BlockEditor({ k, toast }) {
  const defaults = BLOCKS[k] || {}
  const [data, setData] = useState(null); const [saving, setSaving] = useState(false)
  useEffect(() => { setData(null); supabase.from('blocks').select('data').eq('key', k).maybeSingle().then(({ data: row }) => setData({ ...defaults, ...(row?.data || {}) })) }, [k])
  const groups = useMemo(() => {
    const seen = new Set(); const out = []
    Object.keys(defaults).forEach((key) => { const base = key.replace(/_(ar|en)$/, ''); if (seen.has(base)) return; seen.add(base); out.push(key.match(/_(ar|en)$/) ? [base + '_ar', base + '_en'] : [key]) })
    return out
  }, [k])
  if (!data) return <div className="ad-loading" />
  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('blocks').upsert({ key: k, data, updated_at: new Date().toISOString() })
    setSaving(false); toast(error ? 'حصل خطأ: ' + error.message : 'تم الحفظ ✓ — هيظهر في الموقع بعد تحديث الصفحة', Boolean(error))
  }
  const [title, hint] = BLOCK_INFO[k] || [k, '']
  return (
    <section className="ad-panel">
      <header className="ad-head">
        <div><h2>{title}</h2>{hint && <p>{hint}</p>}</div>
        <div className="ad-head-actions">
          <button className="ad-btn ghost" onClick={() => confirm('ترجعي للمحتوى الأصلي؟') && setData({ ...defaults })}>استرجاع الأصلي</button>
          <button className="ad-btn" onClick={save} disabled={saving}>{saving ? 'جاري الحفظ…' : 'حفظ'}</button>
        </div>
      </header>
      <div className="ad-form">
        {groups.map((g) => {
          const label = labelFor(g[0].replace(/_(ar|en)$/, ''))
          return g.map((key, i) => (
            <Field key={key} toast={toast} value={data[key]} onChange={(v) => setData((d) => ({ ...d, [key]: v }))}
              f={{ k: key, type: typeOf(key, defaults[key]), label: g.length > 1 ? `${label} (${i ? 'English' : 'عربي'})` : label, ltr: key.endsWith('_en') || /url|email|whatsapp|facebook|instagram|tiktok|snapchat|youtube|^x$|images|links|products|phone/.test(key) }} />
          ))
        })}
      </div>
      <div className="ad-sticky-save"><button className="ad-btn" onClick={save} disabled={saving}>{saving ? 'جاري الحفظ…' : 'حفظ'}</button></div>
    </section>
  )
}

/* ═══════════ العطور ═══════════ */
const T = (k, type, label, extra = {}) => ({ k, type, label, ...extra })
const BI = (k, type, label) => [T(k + '_ar', type, label + ' (عربي)'), T(k + '_en', type, label + ' (English)', { ltr: true })]
const PRODUCT_FIELDS = [
  ...BI('name', 'text', 'اسم العطر'), T('slug', 'text', 'الرابط (إنجليزي بدون مسافات، مثال: oud-nesyan)', { ltr: true, required: true }),
  ...BI('tagline', 'text', 'جملة قصيرة'),
  T('image_url', 'image', 'صورة الزجاجة (بتظهر في الكارت)', { half: true }), T('box_url', 'image', 'صورة العلبة (بتظهر لما تلمسي الكارت)', { half: true }),
  T('gallery', 'images', 'صور إضافية لصفحة العطر'),
  T('sizes', 'sizes', 'الأحجام والأسعار — السعر 0 = «السعر عند الطلب» والطلب بيبقى على واتساب'),
  T('gender', 'select', 'النوع', { half: true, options: Object.entries(GENDERS).map(([k, v]) => [k, v[0]]) }),
  T('family', 'select', 'المجموعة الموسمية', { half: true, options: Object.entries(FAMILIES).map(([k, v]) => [k, v[0]]) }),
  T('concentration', 'text', 'التركيز (اختياري)', { half: true, ltr: true }), T('year', 'number', 'سنة الإصدار', { half: true }),
  ...BI('notes_top', 'text', 'نوتات المقدمة (افصلي بفاصلة)'), ...BI('notes_heart', 'text', 'نوتات القلب'), ...BI('notes_base', 'text', 'نوتات القاعدة'),
  ...BI('description', 'long', 'الحكاية (سطر فاضي بين الفقرات)'),
  T('longevity', 'number', 'الثبات من 5 (0 = مخفي)', { half: true }), T('sillage', 'number', 'الفوحان من 5 (0 = مخفي)', { half: true }),
  T('is_new', 'check', 'جديد'), T('is_bestseller', 'check', 'الأكثر مبيعًا'), T('is_exclusive', 'check', 'حصري'), T('featured', 'check', 'مميز (يظهر في أحدث الإصدارات والقائمة)'), T('in_stock', 'check', 'متوفر'), T('inspired', 'check', 'عطر مستوحى (بيظهر «عطر مستوحى» في صفحة العطر)'),
]
function Products({ toast }) {
  const [rows, setRows] = useState(null); const [edit, setEdit] = useState(null); const [q, setQ] = useState(''); const [err, setErr] = useState('')
  const load = () => supabase.from('products').select('*').order('sort_order').order('created_at').then(({ data, error }) => { if (error) { setErr(error.message); setRows([]); return } setErr(''); setRows(data || []) })
  useEffect(() => { load() }, [])
  const blank = () => ({ name_ar: '', name_en: '', slug: '', tagline_ar: '', tagline_en: '', image_url: '', box_url: '', gallery: '', sizes: '50 مل | 0', gender: 'unisex', family: 'allseason', concentration: '', year: null, inspired: true, notes_top_ar: '', notes_top_en: '', notes_heart_ar: '', notes_heart_en: '', notes_base_ar: '', notes_base_en: '', description_ar: '', description_en: '', longevity: 0, sillage: 0, is_new: true, is_bestseller: false, is_exclusive: false, featured: false, in_stock: true, active: true, sort_order: (rows?.length || 0) + 1 })
  const save = async () => {
    if (!edit.name_ar?.trim()) return toast('اكتبي اسم العطر بالعربي', true)
    const slug = (edit.slug || edit.name_en || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!slug) return toast('اكتبي الرابط (slug) بالإنجليزي', true)
    const payload = { ...edit, slug }; delete payload.created_at
    for (const k of ['year', 'longevity', 'sillage', 'sort_order']) payload[k] = payload[k] === '' ? null : Number(payload[k])
    const res = payload.id ? await supabase.from('products').update(payload).eq('id', payload.id) : await supabase.from('products').insert(payload)
    if (res.error) return toast('خطأ: ' + (res.error.message.includes('duplicate') ? 'الرابط ده مستخدم لعطر تاني' : res.error.message), true)
    toast('تم الحفظ ✓'); setEdit(null); load()
  }
  const remove = async (r) => { if (!confirm(`حذف «${r.name_ar}» نهائيًا؟`)) return; const { error } = await supabase.from('products').delete().eq('id', r.id); toast(error ? error.message : 'تم الحذف', Boolean(error)); load() }
  const patch = async (r, p) => { const { error } = await supabase.from('products').update(p).eq('id', r.id); if (error) toast(error.message, true); load() }
  const view = (rows || []).filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))
  const move = async (i, d) => {
    const a = view[i], b = view[i + d]; if (!b) return
    await Promise.all([supabase.from('products').update({ sort_order: b.sort_order }).eq('id', a.id), supabase.from('products').update({ sort_order: a.sort_order === b.sort_order ? a.sort_order + d : a.sort_order }).eq('id', b.id)]); load()
  }

  if (edit) return (
    <section className="ad-panel">
      <header className="ad-head">
        <div><button className="ad-link" onClick={() => setEdit(null)}>→ العطور</button><h2>{edit.id ? `تعديل: ${edit.name_ar}` : 'عطر جديد'}</h2></div>
        <div className="ad-head-actions"><button className="ad-btn ghost" onClick={() => setEdit(null)}>إلغاء</button><button className="ad-btn" onClick={save}>حفظ</button></div>
      </header>
      <div className="ad-prev">
        <div className="pv"><img src={edit.image_url || '/brand/mark.png'} alt="" /></div>
        <div className="pv"><img src={edit.box_url || edit.image_url || '/brand/mark.png'} alt="" /></div>
        <div><b>{edit.name_ar || '—'}</b><br /><small>شكل الكارت: الزجاجة ← ولما تلمسيه بيقلب للعلبة</small></div>
      </div>
      <div className="ad-form">
        <p className="ad-help">💡 الصور: الأفضل PNG أو WEBP بخلفية شفافة أو فاتحة، مقاس طولي (مثال 800×1000).</p>
        {PRODUCT_FIELDS.map((f) => <Field key={f.k} f={f} toast={toast} value={edit[f.k]} onChange={(v) => setEdit((e) => ({ ...e, [f.k]: v }))} />)}
        <Field f={{ k: 'sort_order', type: 'number', label: 'الترتيب', half: true }} value={edit.sort_order} onChange={(v) => setEdit((e) => ({ ...e, sort_order: v }))} toast={toast} />
        <Field f={{ k: 'active', type: 'check', label: 'ظاهر في الموقع' }} value={edit.active} onChange={(v) => setEdit((e) => ({ ...e, active: v }))} toast={toast} />
      </div>
      <div className="ad-sticky-save"><button className="ad-btn" onClick={save}>حفظ</button></div>
    </section>
  )

  return (
    <section className="ad-panel">
      <header className="ad-head">
        <div><h2>العطور</h2><p>{rows ? `${rows.length} عطر` : '…'} — الأسهم للترتيب، والعين تخفي/تظهر.</p></div>
        <div className="ad-head-actions"><button className="ad-btn" onClick={() => setEdit(blank())}>+ عطر جديد</button></div>
      </header>
      <div className="ad-tools"><input placeholder="بحث…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {err && <p className="ad-err">مش قادر يجيب العطور: <bdi dir="ltr">{err}</bdi> — اتأكدي إنك شغّلتي schema.sql.</p>}
      {!rows ? <div className="ad-loading" /> : !view.length ? <p className="ad-empty">لا يوجد عطور — الموقع بيعرض العطور الافتراضية لحد ما تضيفي.</p> : (
        <ul className="ad-list">
          {view.map((r, i) => (
            <li key={r.id} className={r.active ? '' : 'off'}>
              <span className="ad-thumb">{r.image_url ? <img src={r.image_url} alt="" /> : '?'}</span>
              <div className="ad-li-text"><b>{r.name_ar}</b>{r.is_new && <em>جديد</em>}{r.is_bestseller && <em>الأكثر مبيعًا</em>}{r.is_exclusive && <em>حصري</em>}{r.in_stock === false && <em>غير متوفر</em>}<small>{String(r.sizes || '').split('\n')[0]}</small></div>
              <div className="ad-li-act">
                {!q && <><button title="لأعلى" onClick={() => move(i, -1)} disabled={!i}>↑</button><button title="لأسفل" onClick={() => move(i, 1)} disabled={i === view.length - 1}>↓</button></>}
                <button title={r.active ? 'إخفاء' : 'إظهار'} onClick={() => patch(r, { active: !r.active })}>{r.active ? '👁' : '🚫'}</button>
                <button onClick={() => setEdit({ ...r })}>تعديل</button>
                <button className="del" onClick={() => remove(r)}>حذف</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ═══════════ الطلبات ═══════════ */
function Orders({ toast, onCount }) {
  const [rows, setRows] = useState(null); const [st, setSt] = useState(''); const [open, setOpen] = useState(null); const [err, setErr] = useState(''); const [q, setQ] = useState('')
  const load = () => supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1000).then(({ data, error }) => {
    if (error) { setErr(error.message); setRows([]); return }
    setErr(''); setRows(data || []); onCount?.((data || []).filter((o) => o.status === 'new').length)
  })
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t) }, [])
  const setStatus = async (o, status) => { const { error } = await supabase.from('orders').update({ status }).eq('id', o.id); toast(error ? error.message : 'تم تحديث الحالة ✓', Boolean(error)); load() }
  const del = async (o) => { if (!confirm(`حذف الطلب ${o.code}؟`)) return; await supabase.from('orders').delete().eq('id', o.id); toast('تم الحذف'); load() }
  const view = (rows || []).filter((o) => (!st || o.status === st) && (!q || [o.code, o.name, o.phone, o.city, o.governorate].join(' ').toLowerCase().includes(q.toLowerCase())))
  const csv = () => {
    const cols = ['created_at', 'code', 'status', 'name', 'phone', 'email', 'governorate', 'city', 'address', 'payment', 'subtotal', 'shipping', 'total', 'notes']
    const body = [[...cols, 'items'].join(','), ...view.map((o) => [...cols.map((c) => o[c]), (o.items || []).map((i) => `${i.name} ${i.size} x${i.qty}`).join(' / ')].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv' })); a.download = 'nesyan-orders.csv'; a.click()
  }
  const wa = (o) => `https://wa.me/${String(o.phone).replace(/\D/g, '').replace(/^0/, '20')}?text=${encodeURIComponent(`مرحبًا ${o.name} 🌸\nمعاك نسيان للعطور بخصوص طلبك رقم ${o.code} بإجمالي ${egp(o.total)}.`)}`
  return (
    <section className="ad-panel">
      <header className="ad-head">
        <div><h2>الطلبات</h2><p>كل طلب من صفحة إتمام الطلب. غيّري الحالة أول بأول.</p></div>
        <div className="ad-head-actions"><button className="ad-btn ghost" onClick={() => { setRows(null); load() }}>تحديث ↻</button><button className="ad-btn ghost" onClick={csv}>تصدير Excel (CSV)</button></div>
      </header>
      <div className="ad-tools ad-chips">
        <button className={!st ? 'on' : ''} onClick={() => setSt('')}>الكل ({rows?.length || 0})</button>
        {STATUS.map(([k, l]) => <button key={k} className={st === k ? 'on' : ''} onClick={() => setSt(k)}>{l} ({(rows || []).filter((o) => o.status === k).length})</button>)}
      </div>
      <div className="ad-tools"><input placeholder="بحث برقم الطلب أو الاسم أو الموبايل…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {err && <p className="ad-err">مش قادر يجيب الطلبات: <bdi dir="ltr">{err}</bdi> — اتأكدي إنك شغّلتي schema.sql وإن حسابك أدمن.</p>}
      {!rows ? <div className="ad-loading" /> : !view.length ? <p className="ad-empty">لا توجد طلبات.</p> : (
        <ul className="ad-orders">
          {view.map((o) => (
            <li key={o.id}>
              <button className="ad-ord-head" onClick={() => setOpen(open === o.id ? null : o.id)}>
                <code dir="ltr">{o.code}</code>
                <span><b>{o.name}</b> <small className="hide-m">· {o.governorate} · {(o.items || []).reduce((a, i) => a + i.qty, 0)} قطعة</small></span>
                <span className="tot">{egp(o.total)}</span>
                <span className={`st st-${o.status}`}>{STATUS.find(([k]) => k === o.status)?.[1] || o.status}</span>
                <small className="hide-m">{new Date(o.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</small>
              </button>
              {open === o.id && (
                <div className="ad-ord-body">
                  <div>
                    <table><thead><tr><th>العطر</th><th>الحجم</th><th>الكمية</th><th>السعر</th></tr></thead>
                      <tbody>{(o.items || []).map((i, k) => <tr key={k}><td>{i.name}</td><td>{i.size}</td><td>{i.qty}</td><td>{egp(i.price * i.qty)}</td></tr>)}</tbody>
                    </table>
                    <dl style={{ marginTop: 12 }}><dt>المجموع</dt><dd>{egp(o.subtotal)}</dd><dt>الشحن</dt><dd>{egp(o.shipping)}</dd><dt><b>الإجمالي</b></dt><dd><b>{egp(o.total)}</b></dd></dl>
                  </div>
                  <div>
                    <dl>
                      <dt>الموبايل</dt><dd><bdi dir="ltr"><a href={`tel:${o.phone}`}>{o.phone}</a></bdi></dd>
                      {o.email && <><dt>الإيميل</dt><dd><bdi dir="ltr">{o.email}</bdi></dd></>}
                      <dt>العنوان</dt><dd>{o.governorate}، {o.city}{'\n'}{o.address}</dd>
                      <dt>الدفع</dt><dd>{o.payment === 'transfer' ? 'تحويل (InstaPay / محفظة)' : 'الدفع عند الاستلام'}</dd>
                      {o.notes && <><dt>ملاحظات</dt><dd>{o.notes}</dd></>}
                    </dl>
                    <div className="ad-ord-act">
                      <select value={o.status} onChange={(e) => setStatus(o, e.target.value)}>{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                      <a className="ad-btn sm" href={wa(o)} target="_blank" rel="noreferrer">واتساب العميل</a>
                      <button className="ad-btn ghost sm del" onClick={() => del(o)}>حذف</button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ═══════════ الرسائل ═══════════ */
function Inbox({ toast, onCount }) {
  const [rows, setRows] = useState(null); const [src, setSrc] = useState(''); const [open, setOpen] = useState(null); const [err, setErr] = useState('')
  const load = () => supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(1000).then(({ data, error }) => {
    if (error) { setErr(error.message); setRows([]); return }
    setErr(''); setRows(data || []); onCount?.((data || []).filter((m) => !m.is_read).length)
  })
  useEffect(() => { load() }, [])
  const read = async (m) => { setOpen(open === m.id ? null : m.id); if (!m.is_read) { await supabase.from('messages').update({ is_read: true }).eq('id', m.id); load() } }
  const del = async (m) => { if (!confirm('حذف الرسالة؟')) return; await supabase.from('messages').delete().eq('id', m.id); toast('تم الحذف'); load() }
  const view = (rows || []).filter((m) => !src || m.source === src)
  const csv = () => {
    const cols = ['created_at', 'source', 'name', 'email', 'phone', 'body']
    const body = [cols.join(','), ...view.map((m) => cols.map((c) => `"${String(m[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv' })); a.download = 'nesyan-messages.csv'; a.click()
  }
  return (
    <section className="ad-panel">
      <header className="ad-head">
        <div><h2>الرسائل والمشتركين</h2><p>رسائل صفحة التواصل + إيميلات النشرة البريدية.</p></div>
        <div className="ad-head-actions"><button className="ad-btn ghost" onClick={() => { setRows(null); load() }}>تحديث ↻</button><button className="ad-btn ghost" onClick={csv}>تصدير Excel (CSV)</button></div>
      </header>
      <div className="ad-tools ad-chips">
        <button className={!src ? 'on' : ''} onClick={() => setSrc('')}>الكل ({rows?.length || 0})</button>
        {Object.entries(SOURCES).map(([k, l]) => <button key={k} className={src === k ? 'on' : ''} onClick={() => setSrc(k)}>{l} ({(rows || []).filter((m) => m.source === k).length})</button>)}
      </div>
      {err && <p className="ad-err">مش قادر يجيب الرسائل: <bdi dir="ltr">{err}</bdi> — اتأكدي إنك شغّلتي schema.sql وإن حسابك أدمن.</p>}
      {!rows ? <div className="ad-loading" /> : !view.length ? <p className="ad-empty">لا توجد رسائل.</p> : (
        <ul className="ad-msgs">
          {view.map((m) => (
            <li key={m.id} className={`${m.is_read ? '' : 'new'} ${open === m.id ? 'open' : ''}`}>
              <button className="ad-msg-head" onClick={() => read(m)}>
                <i /><b>{m.name}</b><span className="tag">{SOURCES[m.source] || m.source}</span>
                <span className="sub">{m.body?.slice(0, 80) || m.email}</span>
                <time>{new Date(m.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</time>
              </button>
              {open === m.id && (
                <div className="ad-msg-body">
                  <dl>
                    {m.phone && <><dt>موبايل</dt><dd><bdi dir="ltr"><a href={`tel:${m.phone}`}>{m.phone}</a> · <a href={`https://wa.me/${m.phone.replace(/\D/g, '').replace(/^0/, '20')}`} target="_blank" rel="noreferrer">واتساب</a></bdi></dd></>}
                    {m.email && <><dt>إيميل</dt><dd><bdi dir="ltr"><a href={`mailto:${m.email}`}>{m.email}</a></bdi></dd></>}
                  </dl>
                  {m.body && <p>{m.body}</p>}
                  <button className="ad-btn ghost sm del" onClick={() => del(m)}>حذف</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ═══════════ الرئيسية ═══════════ */
function Dashboard() {
  const [s, setS] = useState(null)
  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('status,total,created_at,code,name').order('created_at', { ascending: false }).limit(1000),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ]).then(([o, p, m]) => {
      const orders = o.data || []
      const since = Date.now() - 30 * 864e5
      setS({
        neu: orders.filter((x) => x.status === 'new').length,
        month: orders.filter((x) => new Date(x.created_at) > since && x.status !== 'cancelled').length,
        revenue: orders.filter((x) => x.status === 'delivered').reduce((a, x) => a + Number(x.total || 0), 0),
        products: p.count ?? 0, msgs: m.count ?? 0, latest: orders.slice(0, 6),
      })
    })
  }, [])
  return (
    <section className="ad-panel">
      <header className="ad-head"><div><h2>أهلاً بيكي 👋</h2><p>من هنا بتتحكمي في متجر نسيان: العطور، الطلبات، وكل أقسام الموقع بالعربي والإنجليزي.</p></div></header>
      {!s ? <div className="ad-loading" /> : (
        <>
          <div className="ad-stats">
            <Link to="/admin/orders" className="ad-stat hot"><b>{s.neu}</b><span>طلب جديد</span></Link>
            <div className="ad-stat"><b>{s.month}</b><span>طلب آخر 30 يوم</span></div>
            <div className="ad-stat"><b>{egp(s.revenue)}</b><span>مبيعات تم تسليمها</span></div>
            <Link to="/admin/products" className="ad-stat"><b>{s.products}</b><span>عطر</span></Link>
          </div>
          {s.msgs > 0 && <p className="ad-help" style={{ marginBottom: 18 }}>📩 عندك {s.msgs} رسالة جديدة — <Link to="/admin/messages">افتحي الرسائل</Link></p>}
          <h3 className="ad-sub">آخر الطلبات</h3>
          {!s.latest.length ? <p className="ad-empty">لسه مفيش طلبات.</p> : (
            <ul className="ad-list">{s.latest.map((o) => <li key={o.code}><div className="ad-li-text"><b dir="ltr">{o.code}</b><small>{o.name}</small></div><span className={`st st-${o.status}`}>{STATUS.find(([k]) => k === o.status)?.[1]}</span><b>{egp(o.total)}</b></li>)}</ul>
          )}
        </>
      )}
      {BLOCK_GROUPS.map(([g, gt]) => (
        <div key={g}>
          <h3 className="ad-sub">{gt}</h3>
          <div className="ad-blocks">{Object.entries(BLOCK_INFO).filter(([, v]) => v[2] === g).map(([k, [t, h]]) => <Link key={k} to={`/admin/b/${k}`}><span>{t}{h && <small>{h}</small>}</span><i>←</i></Link>)}</div>
        </div>
      ))}
    </section>
  )
}

/* ═══════════ الإطار ═══════════ */
export default function AdminApp() {
  const [session, setSession] = useState(undefined); const [isAdmin, setIsAdmin] = useState(null); const [side, setSide] = useState(false)
  const [newOrders, setNewOrders] = useState(0); const [unread, setUnread] = useState(0)
  const [toastEl, toast] = useToast()
  useEffect(() => {
    document.documentElement.dir = 'rtl'; document.documentElement.lang = 'ar'; document.title = 'لوحة التحكم — NESYAN'
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session) { setIsAdmin(null); return }
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(Boolean(data)))
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new').then(({ count }) => setNewOrders(count || 0))
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false).then(({ count }) => setUnread(count || 0))
  }, [session])

  if (!supabase) return <div className="ad-login"><div className="ad-box"><img src="/brand/logo-full.png" alt="" /><h1>لوحة التحكم مش متوصلة</h1><p className="ad-note">لازم تضيفي <code>VITE_SUPABASE_URL</code> و <code>VITE_SUPABASE_ANON_KEY</code> في ملف <code>.env</code> أو في إعدادات Vercel (Environment Variables) وبعدين Redeploy. التفاصيل في README.</p><Link to="/" className="ad-back">← الرجوع للموقع</Link></div></div>
  if (session === undefined) return <div className="ad-loading full" />
  if (!session) return <Login />
  if (isAdmin === null) return <div className="ad-loading full" />
  if (!isAdmin) return <div className="ad-login"><div className="ad-box"><img src="/brand/logo-full.png" alt="" /><h1>الحساب ده مش أدمن</h1><p className="ad-note">{session.user.email}<br />شغّلي أمر إضافة الأدمن في Supabase SQL Editor (موجود في آخر schema.sql) بالإيميل ده.</p><button type="button" className="ad-btn" onClick={() => supabase.auth.signOut()}>تسجيل خروج</button></div></div>

  const nav = (to, label, extra) => <NavLink to={to} end onClick={() => setSide(false)}>{label}{extra}</NavLink>
  return (
    <div className={`ad ${side ? 'side-open' : ''}`}>
      <aside className="ad-side">
        <Link to="/admin" className="ad-logo"><img src="/brand/mark.png" alt="NESYAN" /><span>لوحة التحكم</span></Link>
        <nav>
          {nav('/admin', 'الرئيسية')}
          {nav('/admin/orders', 'الطلبات', newOrders ? <em>{newOrders}</em> : null)}
          {nav('/admin/products', 'العطور')}
          {nav('/admin/messages', 'الرسائل والمشتركين', unread ? <em>{unread}</em> : null)}
          {BLOCK_GROUPS.map(([g, gt]) => (
            <div key={g}><p>{gt}</p>{Object.entries(BLOCK_INFO).filter(([, v]) => v[2] === g).map(([k, [t]]) => <span key={k}>{nav(`/admin/b/${k}`, t)}</span>)}</div>
          ))}
        </nav>
        <div className="ad-side-foot">
          <a href="/" target="_blank" rel="noreferrer">عرض الموقع ↗</a>
          <button onClick={() => supabase.auth.signOut()}>خروج</button>
          <small dir="ltr">{session.user.email}</small>
        </div>
      </aside>
      <button className="ad-burger" onClick={() => setSide(!side)} aria-label="menu">☰</button>
      <main className="ad-main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders toast={toast} onCount={setNewOrders} />} />
          <Route path="products" element={<Products toast={toast} />} />
          <Route path="messages" element={<Inbox toast={toast} onCount={setUnread} />} />
          <Route path="b/:key" element={<BlockRoute toast={toast} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
      {toastEl}
    </div>
  )
}
function BlockRoute({ toast }) { const { key } = useParams(); return BLOCKS[key] ? <BlockEditor k={key} toast={toast} /> : <Navigate to="/admin" replace /> }
