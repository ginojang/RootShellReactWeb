import * as THREE from 'three'
import { GlobalEnv } from "../config/GlobalEnv"

type CosmicOptions = {
    count?: number
    radius?: number           // 입자 분포 반경
    color?: THREE.Color | string | number
    maxSizeMobile?: number
    maxSizeDesktop?: number
    twinkle?: boolean         // 반짝임 on/off
}

export function generateCosmicElements(
    scene: THREE.Scene,
    options: CosmicOptions = {}
) {
    const count = options.count ?? 700
    const radius = options.radius ?? 30

    const maxSizeMobile = options.maxSizeMobile ?? 0.2
    const maxSizeDesktop = options.maxSizeDesktop ?? 0.2
    const twinkle = options.twinkle ?? true

    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    // 구형 분포(가볍게)
    for (let i = 0; i < count; i++) {
        // 랜덤 방향 벡터
        const x = Math.random() * 2 - 1
        const y = Math.random() * 2 - 1
        const z = Math.random() * 2 - 1
        const len = Math.sqrt(x * x + y * y + z * z) || 1
        const r = Math.cbrt(Math.random()) * radius // 중심 밀집 완화

        positions[i * 3] = (x / len) * r
        positions[i * 3 + 1] = (y / len) * r
        positions[i * 3 + 2] = (z / len) * r

        const base = GlobalEnv.isMobile ? maxSizeMobile : maxSizeDesktop
        // 1 ~ base 사이, 과도한 값은 clamp
        sizes[i] = Math.min(base, 0.1 + Math.random() * base)
    }

    // ⭐️ per-particle 색상 위상을 위한 seed 추가
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = Math.random(); // 0~1

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('seed', new THREE.Float32BufferAttribute(seeds, 1)); // ✅ 추가

    // 기본색: 흰색 베이스에 아주 약한 채도와 높은 명도
    const baseColor = new THREE.Color(options.color ?? 'white');
    const baseHSL = { h: 0, s: 0.1, l: 0.95 };
    baseColor.setHSL(baseHSL.h, baseHSL.s, baseHSL.l);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            // hueBase는 0~1, hueAmp는 아주 작게 (예: 0.04 → ±0.04)
            hueBase: { value: baseHSL.h },
            hueAmp: { value: 0.04 },
            satBase: { value: baseHSL.s },
            lightBase: { value: baseHSL.l },
            time: { value: 0.0 },
            dpr: { value: dpr },
            twinkle: { value: twinkle ? 1.0 : 0.0 },
        },
        vertexShader: `
    attribute float size;
    attribute float seed;     // ✅ 별별 위상차
    uniform float dpr;
    uniform float time;
    uniform float twinkle;
    varying float vAlpha;
    varying float vSeed;      // ✅ 프래그먼트로 전달

    void main() {
      vSeed = seed;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      float atten = 300.0 / max(1.0, -mvPosition.z);

      float tw = 1.0 + (twinkle * 0.15) * sin(time * 1.5 + position.x*7.0 + position.y*5.0 + position.z*3.0);
      gl_PointSize = size * dpr * atten * tw;

      vAlpha = tw;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
        fragmentShader: `
    // HSL → RGB
    vec3 hsl2rgb(in vec3 c){
      vec3 rgb = clamp( abs(mod(c.x*6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0 );
      return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0*c.z - 1.0));
    }

    varying float vAlpha;
    varying float vSeed;
    uniform float hueBase;
    uniform float hueAmp;
    uniform float satBase;
    uniform float lightBase;
    uniform float time;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      // 별마다 약간 다른 위상으로 hue를 살짝 흔듦
      float hue = fract(hueBase + hueAmp * sin(time * 0.7 + vSeed * 6.28318530718));
      float sat = satBase;     // 너무 튀지 않게 낮은 채도 유지
      float lig = lightBase;   // 밝기 유지 (흰색 베이스)

      vec3 rgb = hsl2rgb(vec3(hue, sat, lig));

      float alpha = smoothstep(0.5, 0.0, dist) * (0.7 + 0.3 * vAlpha);
      gl_FragColor = vec4(rgb, alpha);
    }
  `,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(geometry, material)
    stars.name = "StarParticles"
    stars.frustumCulled = false       // 화면 벗어나도 회전 연출 유지
    scene.add(stars)

    const update = (delta: number) => {
        stars.rotation.y += delta * 0.02;
        (material.uniforms.time as any).value += delta;
    };

    const dispose = () => {
        scene.remove(stars);
        geometry.dispose();
        material.dispose();
    };

    return { update, dispose, mesh: stars };

    return { update, dispose, mesh: stars }
}
