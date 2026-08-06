/* ------------------------------------------------------------------ *
 * liquidGLRenderer — renderer WebGL2 ÚNICO e compartilhado
 * ------------------------------------------------------------------ *
 * Cada <LiquidButton> costumava criar seu próprio contexto WebGL2. Os
 * navegadores limitam o número de contextos simultâneos (em GPUs fracas /
 * headless o teto chega a ~4-8); com 6 botões na página, os contextos
 * criados PRIMEIRO (Navbar, Hero) eram silenciosamente esvaziados pelo
 * browser e renderizavam preto — mesmo com isContextLost()===false.
 *
 * Solução: UM único contexto WebGL2 (numa canvas offscreen) que desenha
 * o efeito de QUALQUER botão. Cada botão mantém sua própria <canvas> 2D
 * visível e copia (drawImage) o resultado da canvas GL compartilhada.
 * Assim a página inteira usa 1 contexto WebGL, independente de quantos
 * botões existam — imune ao estouro de contextos.
 *
 * É resiliente a perda de contexto: ao receber `webglcontextlost` ele
 * impede o default e recompila tudo em `webglcontextrestored`.
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
  float grad=max(length(vec2(dFdx(dPill), dFdy(dPill))), 1e-4);
  float sd=dPill/grad;
  float halfAA=0.6;
  float bw=max(u_borderW, 1.0);
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

const UNIFORM_NAMES = [
  'u_res', 'u_pillC', 'u_pillB', 'u_pillR', 'u_borderW', 'u_cursor',
  'u_vel', 'u_bump', 'u_sigma', 'u_R', 'u_noiseAmp', 'u_noiseFreq',
  'u_stretch', 'u_time', 'u_color', 'u_wob', 'u_wobAmp',
];

let renderer = null;

function build() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;

  const create = () => {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      preserveDrawingBuffer: true, // precisamos ler via drawImage logo após desenhar
    });
    if (!gl) return null;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        console.warn('liquidGL shader:', gl.getShaderInfoLog(sh));
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
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const U = {};
    UNIFORM_NAMES.forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

    return { gl, prog, U };
  };

  let ctx = create();

  // resiliência: se o contexto cair, recompila quando voltar.
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); }, false);
  canvas.addEventListener('webglcontextrestored', () => { ctx = create(); }, false);

  return {
    canvas,
    get ok() { return !!ctx; },
    // garante que a canvas compartilhada comporta um botão de w×h (em px de device)
    ensureSize(w, h) {
      if (canvas.width < w) canvas.width = w;
      if (canvas.height < h) canvas.height = h;
    },
    // desenha o efeito de um botão; `set(gl,U)` aplica os uniforms específicos.
    // O resultado fica no canto INFERIOR-ESQUERDO (0,0,w,h) da canvas GL.
    draw(w, h, set) {
      if (!ctx) ctx = create();
      if (!ctx) return false;
      const { gl, prog, U } = ctx;
      this.ensureSize(w, h);
      gl.useProgram(prog);
      gl.viewport(0, 0, w, h);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      set(gl, U);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.SCISSOR_TEST);
      return true;
    },
  };
}

export default function getLiquidRenderer() {
  if (!renderer) renderer = build();
  return renderer;
}
