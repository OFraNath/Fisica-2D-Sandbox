// ── Núcleo WebGL2: canvas, contexto e shaders ─────────────────────────────────
// Cria o canvas GPU sobreposto ao canvas 2D do Matter e compila os shaders
// de corpo (fill/outline), blur gaussiano e cópia/composite.
// Nenhum estado de cena é mantido aqui — apenas infraestrutura de GPU.

const GPU_PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, 1.5);

let gpuCanvas = null;  // canvas WebGL2 (camada de corpos + bloom)
let gpuGl     = null;  // contexto WebGL2

// ── Shaders (GLSL ES 3.00) ────────────────────────────────────────────────────
// Corpo: vértice local (x, y + normais de outline) × atributos correntes por
// corpo (pos, ângulo, alpha + cor, via vertexAttrib*), câmera no VS.
// Cores sempre premultiplicadas pelo FS.

const BODY_VS = `#version 300 es
layout(location = 0) in vec4 aLocal;   // x, y local + normais exteriores (x, y)
layout(location = 1) in vec4 aInst;    // posX, posY, angle, alpha (valores correntes)
layout(location = 2) in vec3 aColor;   // rgb 0..1 (valores correntes)
uniform vec2  uView;                   // largura/altura da área alvo (px)
uniform vec2  uCam;                    // câmera (mundo)
uniform float uZoom;
uniform int   uMode;                   // 0 = fill, 1 = outline/glow
uniform float uOutline;                // espessura do outline (px de mundo)
out vec4 vColor;
void main() {
  vec2 p = aLocal.xy;
  float a = aInst.w;
  if (uMode == 1) {
    // Outline/glow: desloca o traço pelas normais. O alpha vem por corpo
    // (sleeping = 50%, glow ∝ velocidade) — o FS premultiplica.
    p += aLocal.zw * uOutline;
  }
  float c = cos(aInst.z);
  float s = sin(aInst.z);
  vec2 rotated = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  vec2 screen = (aInst.xy + rotated - uCam) * uZoom;
  vec2 ndc = vec2(screen.x / uView.x * 2.0 - 1.0, 1.0 - screen.y / uView.y * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  vColor = vec4(aColor, a);
}
`;

const BODY_FS = `#version 300 es
precision highp float;
in vec4 vColor;
out vec4 fragColor;
void main() {
  fragColor = vec4(vColor.rgb * vColor.a, vColor.a); // premultiplicado
}
`;

// Quad de tela cheia (NDC) usado pelos passes de blur/cópia
const QUAD_VS = `#version 300 es
layout(location = 0) in vec2 aQuad;
out vec2 vUv;
void main() {
  vUv = aQuad * 0.5 + 0.5;
  gl_Position = vec4(aQuad, 0.0, 1.0);
}
`;

// Blur gaussiano separável: direção via uniform, pesos via array (GPU_BLUR_TAPS)
const BLUR_FS = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
uniform vec2  uTexel;
uniform int   uDir;       // 0 = horizontal, 1 = vertical
uniform float uWeights[25];
in vec2 vUv;
out vec4 fragColor;
void main() {
  vec2 dir = (uDir == 0) ? vec2(uTexel.x, 0.0) : vec2(0.0, uTexel.y);
  vec4 acc = texture(uTex, vUv) * uWeights[12];
  for (int i = 1; i <= 12; i++) {
    acc += texture(uTex, vUv + dir * float(i)) * uWeights[12 + i];
    acc += texture(uTex, vUv - dir * float(i)) * uWeights[12 - i];
  }
  fragColor = acc;
}
`;

// Cópia com blend aditivo (composite do glow na tela)
const COPY_FS = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
in vec2 vUv;
out vec4 fragColor;
void main() {
  vec4 c = texture(uTex, vUv);
  fragColor = vec4(c.rgb, c.a);
}
`;

let gpuPrograms = null; // { body, blur, copy } com .locs pré-resolvidos

/**
 * Compila e linka um programa com locations cacheadas.
 */
function buildProgram(gl, vsSrc, fsSrc, uniformNames) {
  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error('Shader: ' + gl.getShaderInfoLog(sh));
    }
    return sh;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('Programa: ' + gl.getProgramInfoLog(prog));
  }
  prog.locs = {};
  uniformNames.forEach(name => {
    prog.locs[name] = gl.getUniformLocation(prog, name);
  });
  return prog;
}

/** Redimensiona o canvas GPU para o tamanho físico (CSS × pixelRatio). */
function resizeGpuCanvas() {
  if (!gpuCanvas) return;
  gpuCanvas.width  = Math.max(1, Math.round(W * GPU_PIXEL_RATIO));
  gpuCanvas.height = Math.max(1, Math.round(H * GPU_PIXEL_RATIO));
  gpuCanvas.style.width  = W + 'px';
  gpuCanvas.style.height = H + 'px';
}

/**
 * Cria o contexto WebGL2 e compila os programas.
 * @returns {boolean} true se a GPU está disponível
 */
function initWebGL() {
  if (gpuGl) return true;
  try {
    gpuCanvas = document.createElement('canvas');
    gpuCanvas.id = 'gpu-canvas';
    gpuGl = gpuCanvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });
    if (!gpuGl) { gpuGl = null; gpuCanvas = null; return false; }

    resizeGpuCanvas();

    gpuPrograms = {
      body: buildProgram(gpuGl, BODY_VS, BODY_FS, ['uView', 'uCam', 'uZoom', 'uMode', 'uOutline']),
      blur: buildProgram(gpuGl, QUAD_VS, BLUR_FS, ['uTex', 'uTexel', 'uDir', 'uWeights']),
      copy: buildProgram(gpuGl, QUAD_VS, COPY_FS, ['uTex']),
    };

    readGpuInfo(gpuGl);
    wrap.appendChild(gpuCanvas);
    gpuCanvas.style.display = 'none';

    // Perda de contexto (ex.: troca de GPU/gráficos): cai para o backend CPU
    gpuCanvas.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      setRenderBackend('cpu');
    });

    return true;
  } catch (e) {
    gpuGl = null; gpuCanvas = null;
    return false;
  }
}

/** true se o contexto WebGL2 está ativo. */
function gpuSupported() { return !!gpuGl; }
