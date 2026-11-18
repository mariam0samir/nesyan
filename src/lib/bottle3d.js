/* ═══════════════════════════════════════════════════════════════
   زجاجة نسيان ثلاثية الأبعاد — WebGL خفيف من غير مكتبات
   ─ زجاج بحواف مشطوفة + سائل ملوّن + غطا جلد كريمي + حلقات دهب
   ─ الليبل مطبوع على الوش بس، فلما الزجاجة تلف ضهرها بيبان من غير كتابة
   ─ ريندرر واحد بيرسم كل الزجاجات اللي ظاهرة على الشاشة
═══════════════════════════════════════════════════════════════ */

const VS = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUv;
uniform mat4 uModel, uView, uProj; uniform mat3 uNM;
varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec3 vL;
void main(){ vec4 w = uModel*vec4(aPos,1.); vW=w.xyz; vL=aPos; vN=normalize(uNM*aNor); vUv=aUv; gl_Position=uProj*uView*w; }`

const FS = `
precision highp float;
varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec3 vL;
uniform int uMode; uniform vec3 uColor; uniform vec3 uCam; uniform sampler2D uTex; uniform float uAlpha;
float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
vec3 env(vec3 r){
  vec3 c = mix(vec3(.10,.08,.06), vec3(.55,.50,.44), smoothstep(-.4,.8,r.y));
  c += vec3(1.6,1.5,1.35)*exp(-pow((r.x-.62)*5.5,2.))*smoothstep(-.35,.5,r.y);
  c += vec3(1.1,1.05,1.)*exp(-pow((r.x+.72)*7.,2.))*smoothstep(-.2,.7,r.y)*.8;
  c += vec3(1.3)*smoothstep(.75,.98,r.y);
  c += vec3(.35,.28,.18)*smoothstep(-.2,-.9,r.y);
  return c; }
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(uCam-vW); if(!gl_FrontFacing) N=-N;
  vec3 L=normalize(vec3(.55,.8,.9)); vec3 R=reflect(-V,N);
  float nv=max(dot(N,V),0.); float fr=.04+.96*pow(1.-nv,5.);
  float dif=max(dot(N,L),0.); float sp=pow(max(dot(N,normalize(L+V)),0.),80.);
  if(uMode==0){ // زجاج
    vec3 e=env(R); float l=dot(e,vec3(.3,.59,.11));
    float edge=smoothstep(.55,1.,1.-nv);
    vec3 c=e*(.10+fr*1.5)+vec3(1.)*sp*1.4+vec3(.95,.97,1.)*edge*.25;
    float hi=smoothstep(.9,1.6,l);
    gl_FragColor=vec4(c, clamp(.02+fr*.7+edge*.22+hi*.45+sp*1.2, 0., .9)*uAlpha);
  } else if(uMode==1){ // سائل
    float g=smoothstep(-.55,.3,vL.y);
    vec3 base=uColor*mix(.78,1.12,g);
    vec3 c=base*(.78+.38*dif);
    c*=mix(1.,.72,pow(1.-nv,1.6));
    c+=pow(uColor,vec3(.6))*.18*smoothstep(.2,1.,nv);
    c+=env(R)*.05+sp*.5;
    gl_FragColor=vec4(c, .97);
  } else if(uMode==2){ // دهب
    vec3 gold=vec3(1.,.77,.34); vec3 e=env(R);
    vec3 c=gold*(.18+e*.95)+vec3(1.,.92,.7)*sp*1.6;
    gl_FragColor=vec4(c,1.);
  } else if(uMode==3){ // جلد
    float b=n3(vL*90.)*.55+n3(vL*220.)*.45;
    vec3 Nb=normalize(N+vec3(b-.5)*.08);
    float d=max(dot(Nb,L),0.);
    vec3 cream=vec3(.96,.88,.78)*(1.-b*.035);
    vec3 c=cream*(.45+.62*d)+env(R)*.04+pow(max(dot(Nb,normalize(L+V)),0.),18.)*.12;
    gl_FragColor=vec4(c,1.);
  } else { // ليبل
    vec4 t=texture2D(uTex,vUv); if(t.a<.02) discard;
    gl_FragColor=vec4(t.rgb*(.82+.25*dif), t.a);
  } }`

/* ───── الهندسة ───── */
function push(arr, ...v) { for (const x of v) arr.push(x) }
function finalize(pos, uv, center) {
  // نورمال لكل مثلث (شكل مشطوف) — وبنقلب أي مثلث متجه لجوه
  const nor = []
  for (let i = 0; i < pos.length; i += 9) {
    const a = pos.slice(i, i + 3), b = pos.slice(i + 3, i + 6), c = pos.slice(i + 6, i + 9)
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const m = Math.hypot(...n) || 1; n = n.map((x) => x / m)
    const cx = (a[0] + b[0] + c[0]) / 3 - center[0], cy = (a[1] + b[1] + c[1]) / 3 - center[1], cz = (a[2] + b[2] + c[2]) / 3 - center[2]
    if (n[0] * cx + n[1] * cy + n[2] * cz < 0) {
      n = n.map((x) => -x)
      for (let k = 0; k < 3; k++) { const t = pos[i + 3 + k]; pos[i + 3 + k] = pos[i + 6 + k]; pos[i + 6 + k] = t }
      if (uv) for (let k = 0; k < 2; k++) { const j = (i / 3) * 2; const t = uv[j + 2 + k]; uv[j + 2 + k] = uv[j + 4 + k]; uv[j + 4 + k] = t }
    }
    push(nor, ...n, ...n, ...n)
  }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv || new Array((pos.length / 3) * 2).fill(0)) }
}
function oct(a, d, c, y) { return [[a - c, y, d], [a, y, d - c], [a, y, -d + c], [a - c, y, -d], [-a + c, y, -d], [-a, y, -d + c], [-a, y, d - c], [-a + c, y, d]] }
function chamferBox(w, h, dpt, c, b, y0 = 0) {
  const a = w / 2, d = dpt / 2, hb = h / 2
  const rings = [oct(a - b, d - b, Math.max(0.01, c - b * 0.5), y0 - hb), oct(a, d, c, y0 - hb + b), oct(a, d, c, y0 + hb - b), oct(a - b, d - b, Math.max(0.01, c - b * 0.5), y0 + hb)]
  const pos = []
  for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) {
    const p = rings[r][i], q = rings[r][(i + 1) % 8], s = rings[r + 1][(i + 1) % 8], t = rings[r + 1][i]
    push(pos, ...p, ...q, ...s, ...p, ...s, ...t)
  }
  for (const [ring, yy] of [[rings[0], y0 - hb], [rings[3], y0 + hb]]) for (let i = 0; i < 8; i++) push(pos, 0, yy, 0, ...ring[i], ...ring[(i + 1) % 8])
  return finalize(pos, null, [0, y0, 0])
}
function cylinder(r, h, y0, seg = 48) {
  const pos = [], nor = []
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2
    const x0 = Math.cos(a0) * r, z0 = Math.sin(a0) * r, x1 = Math.cos(a1) * r, z1 = Math.sin(a1) * r
    const n0 = [Math.cos(a0), 0, Math.sin(a0)], n1 = [Math.cos(a1), 0, Math.sin(a1)]
    push(pos, x0, y0, z0, x0, y0 + h, z0, x1, y0 + h, z1, x0, y0, z0, x1, y0 + h, z1, x1, y0, z1)
    push(nor, ...n0, ...n0, ...n1, ...n0, ...n1, ...n1)
    push(pos, 0, y0 + h, 0, x1, y0 + h, z1, x0, y0 + h, z0); push(nor, 0, 1, 0, 0, 1, 0, 0, 1, 0)
    push(pos, 0, y0, 0, x0, y0, z0, x1, y0, z1); push(nor, 0, -1, 0, 0, -1, 0, 0, -1, 0)
  }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array((pos.length / 3) * 2) }
}
function plane(w, h, cx, cy, z) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2
  return { pos: new Float32Array([x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z]), nor: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), uv: new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]) }
}

/* ───── مصفوفات ───── */
const persp = (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0] }
function lookAt(e, c) {
  let z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]]; let m = Math.hypot(...z); z = z.map((v) => v / m)
  let x = [z[2], 0, -z[0]]; m = Math.hypot(...x); x = x.map((v) => v / m)
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]]
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1]
}
const rotY = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1] }
const nm3 = (m) => [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]
const hex = (h) => { const n = parseInt(String(h || '#d9a53a').replace('#', '').slice(0, 6), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] }
const lum = (c) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11

/* ───── الليبل (بيترسم مرة لكل عطر) ───── */
const IMG = {}
function loadImg(src) { return IMG[src] || (IMG[src] = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src })) }
async function labelCanvas(name, dark) {
  const [mark, word] = await Promise.all([loadImg('/brand/mark-black.png'), loadImg('/brand/word-ar.png')])
  try { await document.fonts?.ready } catch { /* */ }
  const W = 512, H = 768, cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const x = cv.getContext('2d'); const ink = dark ? '#ecd08c' : '#141009'
  const tint = (img, w, h) => { const t = document.createElement('canvas'); t.width = w; t.height = h; const g = t.getContext('2d'); g.drawImage(img, 0, 0, w, h); g.globalCompositeOperation = 'source-in'; g.fillStyle = ink; g.fillRect(0, 0, w, h); return t }
  if (mark) { const h = 300, w = (mark.width / mark.height) * h; x.drawImage(tint(mark, w, h), (W - w) / 2, 40) }
  if (word) { const w = 250, h = (word.height / word.width) * w; x.drawImage(tint(word, w, h), (W - w) / 2, 370) }
  x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'alphabetic'
  const serif = '"Cormorant Garamond", "Times New Roman", Georgia, serif'
  const spaced = (t, y, size, sp, weight = 600) => {
    x.font = `${weight} ${size}px ${serif}`
    const chars = [...t]; const ws = chars.map((c) => x.measureText(c).width)
    let total = ws.reduce((a, b) => a + b, 0) + sp * (chars.length - 1)
    let s = 1; if (total > W - 60) { s = (W - 60) / total; x.font = `${weight} ${size * s}px ${serif}`; total = W - 60 }
    let cx = (W - total) / 2; x.textAlign = 'left'
    chars.forEach((c, i) => { x.fillText(c, cx, y); cx += x.measureText(c).width + sp * s })
    x.textAlign = 'center'
  }
  spaced('NESYAN', 495, 38, 9)
  spaced(String(name || '').toUpperCase(), 578, 46, 5, 700)
  x.fillRect(100, 614, 140, 3); x.fillRect(W - 240, 614, 140, 3)
  x.save(); x.translate(W / 2, 615); x.rotate(Math.PI / 4); x.fillRect(-11, -11, 22, 22); x.restore()
  spaced('50 ML', 694, 38, 3, 700)
  return cv
}

/* ───── المحرك ───── */
let ENGINE
export function getEngine() {
  if (ENGINE !== undefined) return ENGINE
  try {
    const cv = document.createElement('canvas')
    const gl = cv.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: true })
    if (!gl) return (ENGINE = null)
    ENGINE = makeEngine(gl, cv)
  } catch { ENGINE = null }
  return ENGINE
}

function makeEngine(gl, cv) {
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o }
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr)
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link')
  gl.useProgram(pr)
  const A = { pos: gl.getAttribLocation(pr, 'aPos'), nor: gl.getAttribLocation(pr, 'aNor'), uv: gl.getAttribLocation(pr, 'aUv') }
  const U = {}; for (const n of ['uModel', 'uView', 'uProj', 'uNM', 'uMode', 'uColor', 'uCam', 'uTex', 'uAlpha']) U[n] = gl.getUniformLocation(pr, n)
  const mesh = (g) => {
    const b = (d) => { const o = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, o); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); return o }
    return { p: b(g.pos), n: b(g.nor), u: b(g.uv), count: g.pos.length / 3 }
  }
  // الأبعاد مأخوذة من صور الزجاجة الحقيقية
  const BODY_H = 1.05, BY = -0.2
  const M = {
    glass: mesh(chamferBox(1.0, BODY_H, 0.62, 0.16, 0.05, BY)),
    liquid: mesh(chamferBox(0.86, 0.8, 0.5, 0.12, 0.03, BY + 0.06)),
    collar: mesh(cylinder(0.24, 0.085, BY + BODY_H / 2)),
    capRing: mesh(cylinder(0.302, 0.03, BY + BODY_H / 2 + 0.085)),
    cap: mesh(cylinder(0.3, 0.47, BY + BODY_H / 2 + 0.115)),
    topRing: mesh(cylinder(0.305, 0.055, BY + BODY_H / 2 + 0.585)),
    label: mesh(plane(0.5, 0.75, 0, BY + 0.06, 0.252)),
  }
  const bind = (m) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, m.p); gl.enableVertexAttribArray(A.pos); gl.vertexAttribPointer(A.pos, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, m.n); gl.enableVertexAttribArray(A.nor); gl.vertexAttribPointer(A.nor, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, m.u); gl.enableVertexAttribArray(A.uv); gl.vertexAttribPointer(A.uv, 2, gl.FLOAT, false, 0, 0)
  }
  const eye = [0, 0.32, 4.15], target = [0, 0.14, 0], view = lookAt(eye, target)
  gl.uniformMatrix4fv(U.uView, false, view); gl.uniform3fv(U.uCam, eye); gl.uniform1i(U.uTex, 0)
  gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.CULL_FACE)

  const texCache = new Map()
  const getTex = (key, name, dark) => {
    if (texCache.has(key)) return texCache.get(key)
    const rec = { tex: null }; texCache.set(key, rec)
    labelCanvas(name, dark).then((c) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      rec.tex = t; targets.forEach((tg) => { if (tg.key === key) tg.dirty = true }); kick()
    })
    return rec
  }

  const targets = new Set()
  let raf = 0
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame) }
  function draw(tg) {
    const dpr = Math.min(1.75, devicePixelRatio || 1)
    const w = Math.max(2, Math.round(tg.canvas.clientWidth * dpr)), h = Math.max(2, Math.round(tg.canvas.clientHeight * dpr))
    if (tg.canvas.width !== w || tg.canvas.height !== h) { tg.canvas.width = w; tg.canvas.height = h }
    if (cv.width < w || cv.height < h) { cv.width = Math.max(cv.width, w); cv.height = Math.max(cv.height, h) }
    gl.viewport(0, 0, w, h); gl.scissor(0, 0, w, h); gl.enable(gl.SCISSOR_TEST)
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    const asp = w / h, fov = asp < 0.82 ? 0.56 * (0.82 / asp) : 0.56
    gl.uniformMatrix4fv(U.uProj, false, persp(fov * tg.zoom, asp, 0.1, 20))
    const model = rotY(tg.angle); gl.uniformMatrix4fv(U.uModel, false, model); gl.uniformMatrix3fv(U.uNM, false, nm3(model))
    const one = (m, mode, opt = {}) => {
      bind(m); gl.uniform1i(U.uMode, mode); gl.uniform1f(U.uAlpha, opt.alpha ?? 1)
      gl.cullFace(opt.front ? gl.FRONT : gl.BACK); gl.depthMask(opt.depth !== false)
      gl.drawArrays(gl.TRIANGLES, 0, m.count)
    }
    gl.uniform3fv(U.uColor, tg.color)
    one(M.cap, 3); one(M.capRing, 2); one(M.topRing, 2); one(M.collar, 2)
    one(M.glass, 0, { front: true, depth: false, alpha: 0.7 })
    one(M.liquid, 1)
    if (tg.tex.tex) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tg.tex.tex); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -1); one(M.label, 4, { depth: false }); gl.disable(gl.POLYGON_OFFSET_FILL) }
    one(M.glass, 0, { depth: false })
    gl.depthMask(true)
    const ctx = tg.ctx; ctx.clearRect(0, 0, w, h)
    // ظل ناعم تحت الزجاجة
    const sg = ctx.createRadialGradient(w / 2, h * 0.86, 0, w / 2, h * 0.86, w * 0.36)
    sg.addColorStop(0, 'rgba(40,28,10,.28)'); sg.addColorStop(1, 'rgba(40,28,10,0)')
    ctx.save(); ctx.translate(0, h * 0.86); ctx.scale(1, 0.18); ctx.translate(0, -h * 0.86); ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h); ctx.restore()
    ctx.drawImage(cv, 0, cv.height - h, w, h, 0, 0, w, h)
    tg.dirty = false
  }
  function frame(t) {
    raf = 0
    let again = false
    targets.forEach((tg) => {
      if (tg.auto && !tg.drag) { tg.angle += tg.auto * 0.016; tg.dirty = true }
      if (!tg.dirty) return
      const r = tg.canvas.getBoundingClientRect()
      if (r.bottom < -60 || r.top > innerHeight + 60 || r.width < 2) return
      draw(tg)
      if (tg.auto) again = true
    })
    if (again || [...targets].some((tg) => tg.auto)) kick()
  }
  addEventListener('scroll', () => { targets.forEach((tg) => { if (tg.auto) tg.dirty = true }); kick() }, { passive: true })
  addEventListener('resize', () => { targets.forEach((tg) => { tg.dirty = true }); kick() })

  return {
    add(canvas, { color, name, angle = -0.35, auto = 0, zoom = 1 }) {
      const c = hex(color), dark = lum(c) < 0.33
      const tg = { canvas, ctx: canvas.getContext('2d'), color: c, angle, auto, zoom, dirty: true, key: name + (dark ? 'd' : 'l') }
      tg.tex = getTex(tg.key, name, dark)
      targets.add(tg); kick()
      return {
        setAngle(a) { if (Math.abs(a - tg.angle) > 1e-4) { tg.angle = a; tg.dirty = true; kick() } },
        get angle() { return tg.angle },
        setDrag(v) { tg.drag = v },
        refresh() { tg.dirty = true; kick() },
        remove() { targets.delete(tg) },
      }
    },
  }
}
