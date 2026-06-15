/* ============================================================
   AstraVale — Cinematic Star Trails Background
   Professional long-exposure polar rotation effect
   ============================================================ */
(function () {
  const canvas = document.getElementById('starfield-canvas');
  if (!canvas) return;

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.sortObjects = false;

  /* ── Scene & Camera ── */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 6;

  /* ── Groups ── */
  const skyGroup   = new THREE.Group(); // rotates (trails + point stars)
  const staticGroup = new THREE.Group(); // fixed (nebulae)
  scene.add(skyGroup, staticGroup);

  // Offset pole centre for a natural, off-axis composition
  skyGroup.position.set(14, 7, 0);

  /* ══════════════════════════════════════════════════════════
     1. STAR TRAILS  (long-exposure arc segments)
     ══════════════════════════════════════════════════════════ */
  const TRAIL_COUNT      = 2800;
  const SEGS_PER_TRAIL   = 30;   // segments per trail (points = SEGS+1)

  const palette = [
    new THREE.Color(0xffffff),   // pure white  – most common
    new THREE.Color(0xe8f0ff),   // blue-white
    new THREE.Color(0xffd0a0),   // warm orange (K-type star)
    new THREE.Color(0x3b82f6),   // accent blue
    new THREE.Color(0x8b5cf6),   // accent purple
    new THREE.Color(0x06b6d4),   // accent cyan
    new THREE.Color(0xc0c8ff),   // cool blue-white
    new THREE.Color(0x4f46e5),   // indigo
  ];
  // Bias towards white/near-white for realism
  const colorWeights = [30, 25, 15, 8, 6, 6, 6, 4];
  const colorCDF = [];
  let acc = 0;
  colorWeights.forEach(w => { acc += w; colorCDF.push(acc); });
  function pickColor() {
    const r = Math.random() * acc;
    for (let i = 0; i < colorCDF.length; i++) if (r < colorCDF[i]) return palette[i];
    return palette[0];
  }

  const trailPositions  = [];
  const trailColors     = [];
  const trailOpacities  = [];

  for (let i = 0; i < TRAIL_COUNT; i++) {
    // Radial distribution: power curve puts more stars mid-range
    const radius    = Math.pow(Math.random(), 1.2) * 65 + 0.5;
    const startAngle = Math.random() * Math.PI * 2;
    // Arc length grows with radius (matches real angular motion)
    const arcBase   = 0.06 + Math.random() * 0.45;
    const arcLength  = arcBase * (1 + radius * 0.012);
    const col        = pickColor();
    // Depth scatter across several z-planes for parallax
    const z          = (Math.random() - 0.5) * 28 - 14;
    // Faint stars far out, brighter ones mid-range
    const brightness = Math.random() * 0.38 + 0.04;

    for (let j = 0; j < SEGS_PER_TRAIL; j++) {
      const t0 = j       / SEGS_PER_TRAIL;
      const t1 = (j + 1) / SEGS_PER_TRAIL;
      const a0 = startAngle + t0 * arcLength;
      const a1 = startAngle + t1 * arcLength;

      // Smooth fade: bright in middle, fades at tips
      const op0 = Math.sin(t0 * Math.PI) * brightness;
      const op1 = Math.sin(t1 * Math.PI) * brightness;

      trailPositions.push(
        Math.cos(a0) * radius, Math.sin(a0) * radius, z,
        Math.cos(a1) * radius, Math.sin(a1) * radius, z
      );
      trailColors.push(col.r, col.g, col.b, col.r, col.g, col.b);
      trailOpacities.push(op0, op1);
    }
  }

  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(trailPositions, 3));
  trailGeo.setAttribute('color',    new THREE.Float32BufferAttribute(trailColors,    3));
  trailGeo.setAttribute('aOpacity', new THREE.Float32BufferAttribute(trailOpacities, 1));

  const trailMat = new THREE.ShaderMaterial({
    vertexShader: /* glsl */`
      attribute float aOpacity;
      varying   vec3  vColor;
      varying   float vOpacity;
      void main() {
        vColor   = color;
        vOpacity = aOpacity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3  vColor;
      varying float vOpacity;
      void main() {
        gl_FragColor = vec4(vColor, vOpacity);
      }
    `,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    vertexColors: true,
  });

  skyGroup.add(new THREE.LineSegments(trailGeo, trailMat));

  /* ══════════════════════════════════════════════════════════
     2. POINT STARS  (stationary pin-prick stars for depth)
     ══════════════════════════════════════════════════════════ */
  const STAR_COUNT   = 1800;
  const starPos      = new Float32Array(STAR_COUNT * 3);
  const starCol      = new Float32Array(STAR_COUNT * 3);
  const starSize     = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    const r  = Math.pow(Math.random(), 0.7) * 70 + 1;
    const a  = Math.random() * Math.PI * 2;
    const z  = (Math.random() - 0.5) * 30 - 10;
    starPos[i*3]   = Math.cos(a) * r;
    starPos[i*3+1] = Math.sin(a) * r;
    starPos[i*3+2] = z;
    const c = pickColor();
    starCol[i*3]   = c.r;
    starCol[i*3+1] = c.g;
    starCol[i*3+2] = c.b;
    starSize[i] = Math.random() * 2.5 + 0.5;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos,  3));
  starGeo.setAttribute('color',    new THREE.Float32BufferAttribute(starCol,  3));
  starGeo.setAttribute('aSize',    new THREE.Float32BufferAttribute(starSize, 1));

  // Soft Gaussian disc shader for each star
  const starMat = new THREE.ShaderMaterial({
    vertexShader: /* glsl */`
      attribute float aSize;
      varying   vec3  vColor;
      void main() {
        vColor = color;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (280.0 / -mvPos.z);
        gl_Position  = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        float a = smoothstep(0.5, 0.0, d);
        // soft core + faint halo
        float core = smoothstep(0.25, 0.0, d);
        gl_FragColor = vec4(vColor + core * 0.5, a * 0.55);
      }
    `,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    vertexColors: true,
  });

  skyGroup.add(new THREE.Points(starGeo, starMat));

  /* ══════════════════════════════════════════════════════════
     3. POLARIS  (bright pole-star anchor, subtle cross bloom)
     ══════════════════════════════════════════════════════════ */
  // Core glow
  const polGeo = new THREE.BufferGeometry();
  polGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -2], 3));
  polGeo.setAttribute('aSize',    new THREE.Float32BufferAttribute([18], 1));

  const polarisMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`
      attribute float aSize;
      void main() {
        gl_PointSize = aSize;
        gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      void main() {
        float d    = length(gl_PointCoord - vec2(0.5));
        float core = smoothstep(0.45, 0.0, d);
        float twinkle = 0.75 + 0.25 * sin(uTime * 2.8);
        gl_FragColor = vec4(0.85, 0.92, 1.0, core * twinkle * 0.9);
      }
    `,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  });

  // Diffraction spike (4-point cross)
  function makeCrossSpike() {
    const geo  = new THREE.BufferGeometry();
    const half = 1.8;
    const pos  = new Float32Array([
      -half, 0, -2,   half, 0, -2,   // horizontal
       0, -half, -2,   0, half, -2,   // vertical
    ]);
    const op = new Float32Array([0, 0.0, 0, 0.0, 0, 0.0, 0, 0.0]);
    // We'll animate opacity in the shader via uniform
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */`
        varying float vT;
        void main() {
          // encode position along spike as t
          vT = abs(position.x) + abs(position.y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        varying float vT;
        void main() {
          float twinkle = 0.6 + 0.4 * sin(uTime * 2.8 + 1.0);
          float a = (1.0 - smoothstep(0.0, 1.8, vT)) * 0.5 * twinkle;
          gl_FragColor = vec4(0.8, 0.9, 1.0, a);
        }
      `,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });
    return { mesh: new THREE.LineSegments(geo, mat), mat };
  }

  const polarisCore = new THREE.Points(polGeo, polarisMat);
  const { mesh: spikeMesh, mat: spikeMat } = makeCrossSpike();

  // Place Polaris at the rotation pivot of skyGroup (world origin offset by skyGroup.position)
  // We add it directly to skyGroup so it stays fixed at its local origin
  skyGroup.add(polarisCore);
  skyGroup.add(spikeMesh);

  /* ══════════════════════════════════════════════════════════
     4. NEBULA GLOWS  (ambient colour wash)
     ══════════════════════════════════════════════════════════ */
  function nebula(color, x, y, z, sx, sy, opacity) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor:   { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uTime:    { value: 0 },
        uSeed:    { value: Math.random() * 100 },
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: /* glsl */`
        uniform vec3  uColor;
        uniform float uOpacity;
        uniform float uTime;
        uniform float uSeed;
        varying vec2  vUv;
        void main() {
          float d     = length(vUv - vec2(0.5));
          float pulse = 1.0 + 0.08 * sin(uTime * 0.18 + uSeed);
          float a     = smoothstep(0.5, 0.0, d * pulse) * uOpacity;
          gl_FragColor = vec4(uColor, a);
        }
      `,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, 1);
    return { mesh, mat };
  }

  const nebs = [
    nebula(0x1e3a8a,  10,  5, -20, 50, 36, 0.055),
    nebula(0x4c1d95, -14, -9, -24, 60, 42, 0.042),
    nebula(0x06b6d4,  -4, 14, -16, 42, 30, 0.032),
    nebula(0x0f172a,   2, -4, -30, 80, 60, 0.08 ),  // deep dark fill
  ];
  nebs.forEach(n => staticGroup.add(n.mesh));

  /* ══════════════════════════════════════════════════════════
     5. MOUSE PARALLAX
     ══════════════════════════════════════════════════════════ */
  const mouse  = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };

  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ══════════════════════════════════════════════════════════
     6. ANIMATION LOOP
     ══════════════════════════════════════════════════════════ */
  const clock = new THREE.Clock();
  let   rafId = null;

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse
    smooth.x += (mouse.x - smooth.x) * 0.028;
    smooth.y += (mouse.y - smooth.y) * 0.028;

    // Trails rotate slowly — realistic star-trail feel
    skyGroup.rotation.z = t * 0.0048;

    // Gentle parallax tilt
    scene.rotation.x =  smooth.y * 0.018;
    scene.rotation.y =  smooth.x * 0.018;
    scene.position.x =  smooth.x * 1.2;
    scene.position.y = -smooth.y * 1.2;

    // Polaris twinkle
    polarisMat.uniforms.uTime.value = t;
    spikeMat.uniforms.uTime.value   = t;

    // Nebula pulse
    nebs.forEach(n => { n.mat.uniforms.uTime.value = t; });

    renderer.render(scene, camera);
  }

  animate();

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ── Visibility: pause when tab hidden ── */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      clock.start();
      animate();
    }
  });

})();