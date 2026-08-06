import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ *
 * LiquidButton (React + JavaScript)
 * ------------------------------------------------------------------ *
 * Botão com contorno "vivo": a borda gelatinosa estica em direção ao
 * cursor enquanto um preenchimento líquido é atraído a partir dele.
 * Renderizado com um shader WebGL2 (60 FPS). Sem dependências externas.
 *
 * Os estilos ESTRUTURAIS são inline (não dependem de Tailwind), então o
 * componente funciona em qualquer projeto React. Use `className` se quiser
 * estilizar o wrapper por fora (Tailwind, CSS, etc.).
 *
 * É seguro com React.StrictMode (não descarta o contexto WebGL no unmount).
 *
 * Props:
 *   children            texto do botão
 *   width  (px)  360 | height (px) 96
 *   viscosity (1-10) 6 | approach (px) 160
 *   deform (0-10) 2 | organic (0-10) 6 | fillDelay (ms) 0
 *   shape "pill"|"rect" | color "#ffffff"
 *   + qualquer prop nativa de <button> (onClick, disabled, type, ...)
 * ------------------------------------------------------------------ */

const VERT = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a,0.0,1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 u_res; uniform vec2 u_pillC; uniform vec2 u_pillB; uniform float u_pillR; uniform float u_borderW;
uniform vec2 u_cursor; uniform vec2 u_vel; uniform float u_bump; uniform float u_sigma; uniform float u_R;
uniform float u_noiseAmp; uniform float u_noiseFreq; uniform float u_stretch; uniform float u_time;
uniform vec2 u_wob; uniform float u_wobAmp;
uniform vec3 u_color;
out vec4 o;
float sdRound(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return min(max(q.x,q.y),0.0)+length(max(q,0.0))-r; }
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1)); vec2 u=f*f*(3.0-2.0*f); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){ v+=a*vn(p); p*=2.02; a*=0.5; } return v; }
float bumpG(vec2 p){
  vec2 rel=p-u_cursor; float sp=length(u_vel); vec2 dir = sp>0.001? u_vel/sp : vec2(1.0,0.0);
  float al=dot(rel,dir); float pe=dot(rel,vec2(-dir.y,dir.x));
  float st=1.0+u_stretch*min(sp,40.0);
  float r2=(al*al)/(st*st)+pe*pe; float s=max(u_sigma,1.0);
  return exp(-r2/(2.0*s*s));
}
float wobBump(vec2 p){ float s=max(u_sigma,1.0); vec2 d=p-u_wob; return exp(-dot(d,d)/(2.0*s*s)); }
void main(){
  vec2 p=vec2(gl_FragCoord.x, u_res.y-gl_FragCoord.y);
  float dBase=sdRound(p-u_pillC,u_pillB,u_pillR);
  float dPill=dBase - bumpG(p)*u_bump - wobBump(p)*u_wobAmp;
  // normalize by the gradient so the outline keeps a uniform screen-space width even
  // where the bump distorts the field (otherwise the stroke looks uneven / serrated)
  float grad=max(length(vec2(dFdx(dPill), dFdy(dPill))), 1e-4);
  float sd=dPill/grad;                       // signed distance in pixels
  float halfAA=0.6;                           // ~0.6px AA each side
  float bw=max(u_borderW, 1.0);               // stroke thickness in pixels
  float outer=smoothstep(halfAA,-halfAA, sd);
  float inner=smoothstep(halfAA,-halfAA, sd + bw);
  float ring=clamp(outer-inner,0.0,1.0);
  float wf=u_noiseAmp*(u_R/(u_R+70.0));
  vec2 warp=(vec2(fbm(p*u_noiseFreq+u_time*0.20), fbm(p*u_noiseFreq+11.7-u_time*0.16))-0.5)*2.0*wf;
  vec2 q=p+warp;
  float distC=length(q-u_cursor);
  float f=u_R-distC;
  float blob=smoothstep(-1.2, 1.2, f);
  float fill=clamp(blob*inner,0.0,1.0)*smoothstep(0.0,2.5,u_R);
  float whiteA=clamp(ring+fill,0.0,1.0);
  o=vec4(u_color*whiteA, whiteA);
}`;

const mr = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function sdf(px, py, cx, cy, bx, by, r) {
  const qx = Math.abs(px - cx) - bx + r;
  const qy = Math.abs(py - cy) - by + r;
  return (
    Math.min(Math.max(qx, qy), 0) +
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r
  );
}

function hexToRgb(c) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = c;
  const m = ctx.fillStyle.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  return [1, 1, 1];
}

export default function LiquidButton({
  children,
  width = 360,
  height = 96,
  viscosity = 6,
  approach = 160,
  deform = 2,
  bounce = 5,
  organic = 6,
  fillTime = 450,
  minSpeed = 800,
  snapSpeed = 300,
  sigma = 55,
  shape = "pill",
  color = "#ffffff",
  textColor,
  fontSize = 16,
  pad = 84,
  // se definido, o botão ignora `width` e se ajusta ao texto, com esse padding
  // horizontal interno (em px). Útil p/ vários botões com o mesmo respiro lateral.
  paddingX,
  className = "",
  style,
  ...buttonProps
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const btnRef = useRef(null);

  // Live config kept in a ref so the rAF loop reads fresh props
  // without re-creating the WebGL context.
  const cfgRef = useRef({});
  cfgRef.current = { viscosity, approach, deform, bounce, organic, fillTime, minSpeed, snapSpeed, sigma, shape, color, width, height };

  useEffect(() => {
    const canvas = canvasRef.current;
    const btn = btnRef.current;
    if (!canvas || !btn) return;
    const label = btn.querySelector("span");

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    if (!gl) {
      console.warn("LiquidButton: WebGL2 indisponível neste navegador.");
      return;
    }

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        console.warn("LiquidButton shader:", gl.getShaderInfoLog(sh));
      return sh;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const U = {};
    [
      "u_res", "u_pillC", "u_pillB", "u_pillR", "u_borderW", "u_cursor",
      "u_vel", "u_bump", "u_sigma", "u_R", "u_noiseAmp", "u_noiseFreq",
      "u_stretch", "u_time", "u_color", "u_wob", "u_wobAmp",
    ].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const geom = { cx: 0, cy: 0, bx: 0, by: 0, borderW: 1.6 * dpr };
    const s = { cx: 0, cy: 0, px: 0, py: 0, vx: 0, vy: 0, R: 0, B: 0, pressT: 0, pressE: 0, proxHist: [], engaged: false, peak: 0, wobStart: undefined, wobAmp: 1 };
    const mouse = { x: -99999, y: -99999, active: false, speed: 0, _lx: 0, _ly: 0, _lt: 0, _mt: 0 };

    const measure = () => {
      const cr = canvas.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      canvas.width = Math.max(2, Math.round(cr.width * dpr));
      canvas.height = Math.max(2, Math.round(cr.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      geom.cx = (br.left - cr.left + br.width / 2) * dpr;
      geom.cy = (br.top - cr.top + br.height / 2) * dpr;
      geom.bx = (br.width / 2) * dpr;
      geom.by = (br.height / 2) * dpr;
    };
    measure();
    s.cx = geom.cx; s.cy = geom.cy; s.px = s.cx; s.py = s.cy;

    const getCfg = () => {
      const c = cfgRef.current;
      const V = clamp(c.viscosity, 1, 10);
      const org = clamp(c.organic, 0, 10);
      const def = clamp(c.deform, 0, 10);
      const bnc = clamp(c.bounce, 0, 10);
      return {
        k: mr(V, 1, 10, 0.32, 0.06),
        kR: mr(V, 1, 10, 0.30, 0.07),
        approach: clamp(c.approach, 40, 320),
        noiseAmp: mr(org, 0, 10, 0, 34),
        noiseFreq: 0.018,
        bumpMax: mr(def, 0, 10, 0, 52),
        fillTime: clamp(c.fillTime, 0, 4000) / 1000,
        minSpeed: clamp(c.minSpeed, 0, 2500),
        snapSpeed: clamp(c.snapSpeed, 100, 6000),
        sigma: clamp(c.sigma, 10, 120),
        stretch: 0.02,
        bounce: bnc,
        radius: (c.shape === "rect" ? 16 : Math.min(c.height, c.width) / 2) * dpr,
        rgb: hexToRgb(c.color),
      };
    };

    let raf = 0;
    const t0 = performance.now();

    const draw = (now) => {
      const tSec = (now - t0) / 1000;
      const cfg = getCfg();
      const rect = canvas.getBoundingClientRect();

      let prox = 0;
      if (mouse.active) {
        const cx = (mouse.x - rect.left) * dpr;
        const cy = (mouse.y - rect.top) * dpr;
        const dpc = sdf(cx, cy, geom.cx, geom.cy, geom.bx, geom.by, cfg.radius);
        prox = dpc <= 0 ? 1 : Math.max(0, 1 - dpc / (cfg.approach * dpr));
        const RmaxC = Math.hypot(2 * geom.bx, 2 * geom.by) * 1.16;
        const fillFrac = clamp(s.R / RmaxC, 0, 1);
        const gap = Math.hypot(cx - s.cx, cy - s.cy);
        let kEff = Math.min(0.95, cfg.k + (gap / (150 * dpr)) * 0.45);
        kEff = Math.max(kEff, 1 - fillFrac);   // small/starting fill stays glued to the cursor; full fill keeps the viscous lag
        s.cx += (cx - s.cx) * kEff;
        s.cy += (cy - s.cy) * kEff;
        if (kEff > 0.85) { s.px = s.cx; s.py = s.cy; }
      }
      s.vx += (s.cx - s.px - s.vx) * 0.35;
      s.vy += (s.cy - s.py - s.vy) * 0.35;
      s.px = s.cx; s.py = s.cy;
      s.pressE += ((s.pressT ? 1 : 0) - s.pressE) * 0.2;
      const dt = Math.min(0.05, Math.max(0, tSec - (s.lastT || tSec))); s.lastT = tSec;
      const dprox = prox;   // fill responds the moment the cursor is over the button

      const Rmax = Math.hypot(2 * geom.bx, 2 * geom.by) * 1.16;
      const fresh = (performance.now() - (mouse._mt || 0)) < 90;
      const sp = fresh ? mouse.speed : 0;            // cursor speed (px/s)
      const proxNow = mouse.active ? prox : 0;
      if (proxNow >= 0.35) s.outStart = undefined;
      else if (s.engaged && s.outStart === undefined) { s.outStart = tSec; s.exitSp = sp; }
      const inGrace = s.outStart !== undefined && (tSec - s.outStart) <= 0.045;   // brief edge-grazes don't reset
      let targetR = Rmax * Math.max(Math.pow(dprox, 1.3), s.pressE);
      if (inGrace) targetR = Math.max(targetR, s.R);  // hold the fill through a quick graze (no drain/reset)
      if (s.snapFill) targetR = Rmax * s.pressE;     // removed fast → keep the fill from regrowing
      if (sp > cfg.snapSpeed * 2 && s.R < Rmax * 0.12) targetR = Rmax * s.pressE;  // don't START a fill while whipping past; once growing, fast moves don't suppress it
      const targetB = cfg.bumpMax * dpr * Math.max(prox, s.pressE * 0.8);

      if (targetR > s.R) {
        // exponential ease-out: fast start, slows as it completes, over ~fillTime
        if (cfg.fillTime > 0.01) s.R += (targetR - s.R) * (1 - Math.pow(0.05, dt / cfg.fillTime));
        else s.R = targetR;
      } else if (targetR < s.R) {
        // draining: collapse faster as it shrinks, so the fill doesn't linger as a centered dot
        const frac = clamp(s.R / Rmax, 0, 0.5);
        s.R += (targetR - s.R) * mr(frac, 0, 0.5, 0.5, cfg.kR);
      }
      if (targetR < 1 && s.R < 6) s.R = 0;   // mata a cauda sub-pixel pra não sobrar pontinho
      s.B += (targetB - s.B) * cfg.kR;

      // "balançadinha" LOCAL: a bolha no ponto exato onde o cursor saiu recua
      // — empurra pra fora e pra dentro algumas vezes — em vez do botão inteiro.
      if (proxNow > 0.25) { s.holdX = s.cx; s.holdY = s.cy; }   // último ponto de contato forte
      if (proxNow > 0.05) { s.engaged = true; s.peak = Math.max(s.peak || 0, dprox); s.snapFill = false; }
      if (s.engaged && proxNow < 0.35 && !inGrace) {        // exit fires near the edge, almost immediately
        const exitSpeed = s.exitSp || sp;
        if (exitSpeed > cfg.snapSpeed) { s.snapFill = true; s.R = 0; s.B = 0; }   // saiu rápido → some
        if (exitSpeed >= cfg.minSpeed && s.peak > 0.55) {
          s.wobStart = tSec; s.wobAmp = clamp(s.peak || 0.5, 0.4, 1);
          s.wobX = (s.holdX !== undefined) ? s.holdX : s.cx;
          s.wobY = (s.holdY !== undefined) ? s.holdY : s.cy;
        }
        s.engaged = false; s.peak = 0; s.outStart = undefined;
      }
      let wobAmp = 0;
      if (s.wobStart !== undefined) {
        const age = tSec - s.wobStart;
        if (age < 1.0) {                                    // ~1s recoil, independent of the fill (overlaps)
          const ampB = mr(cfg.bounce, 0, 10, 0, 42) * dpr * s.wobAmp;
          wobAmp = ampB * Math.sin(age * 26) * Math.exp(-age * 4.5);
        } else { s.wobStart = undefined; }
      }

      gl.useProgram(prog);
      gl.uniform2f(U.u_res, canvas.width, canvas.height);
      gl.uniform2f(U.u_pillC, geom.cx, geom.cy);
      gl.uniform2f(U.u_pillB, geom.bx, geom.by);
      gl.uniform1f(U.u_pillR, cfg.radius);
      gl.uniform1f(U.u_borderW, geom.borderW);
      gl.uniform2f(U.u_cursor, s.cx, s.cy);
      gl.uniform2f(U.u_vel, s.vx, s.vy);
      gl.uniform1f(U.u_bump, s.B);
      gl.uniform1f(U.u_sigma, cfg.sigma * dpr);
      gl.uniform1f(U.u_R, s.R);
      gl.uniform1f(U.u_noiseAmp, cfg.noiseAmp * dpr);
      gl.uniform1f(U.u_noiseFreq, cfg.noiseFreq / dpr);
      gl.uniform1f(U.u_stretch, cfg.stretch);
      gl.uniform1f(U.u_time, tSec);
      gl.uniform2f(U.u_wob, s.wobX || 0, s.wobY || 0);
      gl.uniform1f(U.u_wobAmp, wobAmp);
      gl.uniform3fv(U.u_color, cfg.rgb);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onMove = (e) => {
      const now = performance.now();
      if (mouse._lt) {
        const dt = (now - mouse._lt) / 1000;
        if (dt > 0) { const v = Math.hypot(e.clientX - mouse._lx, e.clientY - mouse._ly) / dt; mouse.speed = Math.max(v, mouse.speed * 0.55); }
      }
      mouse._lx = e.clientX; mouse._ly = e.clientY; mouse._lt = now; mouse._mt = now;
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    };
    const onOut = (e) => { if (!e.relatedTarget) mouse.active = false; };
    const onBlur = () => { mouse.active = false; };
    const onDown = () => { s.pressT = 1; };
    const onUp = () => { s.pressT = 0; };

    // is the client point inside the *deformed* silhouette (base pill + gel bulge)?
    const hitShape = (clientX, clientY) => {
      const cfg = getCfg();
      const cr = canvas.getBoundingClientRect();
      const px = (clientX - cr.left) * dpr, py = (clientY - cr.top) * dpr;
      let d = sdf(px, py, geom.cx, geom.cy, geom.bx, geom.by, cfg.radius);
      const sgm = cfg.sigma * dpr;
      const rel2 = (px - s.cx) * (px - s.cx) + (py - s.cy) * (py - s.cy);
      d -= Math.exp(-rel2 / (2 * sgm * sgm)) * s.B;   // subtract the bump bulge (velocity ≈ 0 at click)
      return d <= 0;
    };
    const activate = (clientX, clientY) => {
      s.wobStart = (performance.now() - t0) / 1000; s.wobAmp = 0.8;
      if (clientX != null) {
        const cr = canvas.getBoundingClientRect();
        s.wobX = (clientX - cr.left) * dpr; s.wobY = (clientY - cr.top) * dpr;
      } else { s.wobX = s.cx; s.wobY = s.cy; }
      btn.dispatchEvent(new CustomEvent("liquidclick", { bubbles: true }));
    };
    const wrap = wrapRef.current;
    const onWrapDown = (e) => { if (e.target !== btn && hitShape(e.clientX, e.clientY)) s.pressT = 1; };
    const onBtnClick = () => activate();
    const onWrapClick = (e) => { if (e.target !== btn && hitShape(e.clientX, e.clientY)) activate(e.clientX, e.clientY); };
    const onWrapMove = (e) => { if (wrap) wrap.style.cursor = (e.target !== btn && hitShape(e.clientX, e.clientY)) ? "pointer" : ""; };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseout", onOut);
    window.addEventListener("blur", onBlur);
    btn.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    btn.addEventListener("click", onBtnClick);
    if (wrap) {
      wrap.addEventListener("pointerdown", onWrapDown);
      wrap.addEventListener("click", onWrapClick);
      wrap.addEventListener("pointermove", onWrapMove);
    }

    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", measure);

    // NOTE: não chamamos loseContext() aqui — em React.StrictMode (dev) o
    // efeito roda mount→unmount→mount, e perder o contexto deixaria o canvas
    // em branco na segunda montagem. Parar o rAF e remover listeners basta.
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("blur", onBlur);
      btn.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      btn.removeEventListener("click", onBtnClick);
      if (wrap) {
        wrap.removeEventListener("pointerdown", onWrapDown);
        wrap.removeEventListener("click", onWrapClick);
        wrap.removeEventListener("pointermove", onWrapMove);
      }
      window.removeEventListener("resize", measure);
    };
  }, [width, height]);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        position: "relative",
        display: "inline-grid",
        placeItems: "center",
        width: paddingX != null ? "auto" : width + pad * 2,
        height: height + pad * 2,
        // MOBILE: o canvas inclui a folga do efeito (width + pad*2) e chegava a
        // 528px, estourando telas de 375px. Clampar aqui mantém o botão dentro
        // da viewport — o canvas se re-mede sozinho pelo ResizeObserver.
        // NÃO usar `100%` aqui: em pai com largura de conteúdo (flex +
        // items-center) a porcentagem é circular e é ignorada no cálculo
        // intrínseco — o pai continuava medindo 528px e gerava scroll
        // horizontal. A unidade de viewport é resolvível e sempre clampa.
        maxWidth: "calc(100vw - 2rem)",
        boxSizing: "border-box",
        ...(paddingX != null ? { paddingLeft: pad, paddingRight: pad } : null),
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <button
        ref={btnRef}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: paddingX != null ? "auto" : width,
          maxWidth: "100%",
          height,
          margin: 0,
          padding: paddingX != null ? `0 ${paddingX}px` : 0,
          border: 0,
          background: "transparent",
          cursor: "pointer",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
        }}
        {...buttonProps}
      >
        <span
          style={{
            font: `600 ${fontSize}px/1 'Space Grotesk', system-ui, sans-serif`,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: textColor || color,
            mixBlendMode: "difference",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          {children}
        </span>
      </button>
    </div>
  );
}
