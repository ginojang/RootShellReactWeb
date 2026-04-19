import * as THREE from 'three'
import { GlobalEnv } from "../config/GlobalEnv"

type CosmicOptions = {
    count?: number
    radius?: number
    twinkle?: boolean
}

export function generateCosmicElements(scene: THREE.Scene, options: CosmicOptions = {}) {
    const isMobile = GlobalEnv.isMobile === true
    const count = options.count ?? (isMobile ? 900 : 1400)
    const radius = options.radius ?? 35
    const twinkle = options.twinkle ?? true

    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const seeds = new Float32Array(count)
    const colorSeeds = new Float32Array(count)

    const maxSize = isMobile ? 0.20 : 0.26

    for (let i = 0; i < count; i++) {
        // 납작한 은하원반 분포
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const r = Math.pow(Math.random(), 0.55) * radius

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.38 // y축 압축
        positions[i * 3 + 2] = r * Math.cos(phi)

        // 대부분 작고 몇 개만 크게 (power law)
        const t = Math.pow(Math.random(), 3.2)
        sizes[i] = 0.03 + t * maxSize

        seeds[i] = Math.random()
        colorSeeds[i] = Math.random()
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    geometry.setAttribute('seed', new THREE.Float32BufferAttribute(seeds, 1))
    geometry.setAttribute('colorSeed', new THREE.Float32BufferAttribute(colorSeeds, 1))

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            dpr: { value: dpr },
            twinkle: { value: twinkle ? 1.0 : 0.0 },
        },
        vertexShader: `
            attribute float size;
            attribute float seed;
            attribute float colorSeed;
            uniform float dpr;
            uniform float time;
            uniform float twinkle;
            varying float vAlpha;
            varying float vSeed;
            varying float vColorSeed;
            varying float vSize;

            void main() {
                vSeed      = seed;
                vColorSeed = colorSeed;
                vSize      = size;

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                float atten = 280.0 / max(1.0, -mvPosition.z);

                // 숨쉬기 애니메이션:
                //   sin → [0,1] 정규화 → smoothstep 으로 ease in/out 적용
                //   → peak·trough에서 천천히 머무는 들숨·날숨 곡선
                float phase = seed * 6.28318;
                float speed = 0.38 + seed * 0.18;        // 별마다 살짝 다른 주기 (0.38~0.56)
                float s     = sin(time * speed + phase) * 0.5 + 0.5;   // [0, 1]
                float breath = s * s * (3.0 - 2.0 * s);                // smoothstep ease
                float tw = mix(0.80, 1.20, breath);

                gl_PointSize = size * dpr * atten * tw;
                vAlpha       = tw;
                gl_Position  = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying float vAlpha;
            varying float vSeed;
            varying float vColorSeed;
            varying float vSize;
            uniform float time;

            vec3 hsl2rgb(vec3 c) {
                vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
                return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
            }

            void main() {
                vec2  coord = gl_PointCoord - vec2(0.5);
                float dist  = length(coord);
                if (dist > 0.5) discard;

                // 별 색상: colorSeed < 0.5 → 청백색(뜨거운 별), ≥ 0.5 → 황백색(따뜻한 별)
                float hue, sat, lig;
                if (vColorSeed < 0.5) {
                    hue = 0.57 + vColorSeed * 0.10;
                    sat = 0.22 + vColorSeed * 0.18;
                    lig = 0.87 + vColorSeed * 0.10;
                } else {
                    hue = 0.04 + (vColorSeed - 0.5) * 0.12;
                    sat = 0.06 + (vColorSeed - 0.5) * 0.14;
                    lig = 0.84 + (vColorSeed - 0.5) * 0.12;
                }
                // hue도 숨쉬기 리듬에 맞춰 미세하게 흔들림
                float hs = sin(time * 0.35 + vSeed * 6.28318) * 0.5 + 0.5;
                float hBreath = hs * hs * (3.0 - 2.0 * hs);
                hue = fract(hue + 0.010 * (hBreath * 2.0 - 1.0));

                vec3 rgb = hsl2rgb(vec3(hue, sat, lig));

                // 소프트 글로우 코어
                float glow = exp(-dist * 9.0) * 0.45;

                // 회절 스파이크 (큰 별에만)
                float spikeStr = smoothstep(0.05, 0.19, vSize);
                float spike_h  = exp(-abs(coord.y) * 28.0) * smoothstep(0.5, 0.0, abs(coord.x));
                float spike_v  = exp(-abs(coord.x) * 28.0) * smoothstep(0.5, 0.0, abs(coord.y));
                // 45도 대각 스파이크 (약하게)
                vec2  c45      = vec2(coord.x + coord.y, coord.x - coord.y) * 0.707;
                float spike_d1 = exp(-abs(c45.y) * 35.0) * smoothstep(0.5, 0.0, abs(c45.x));
                float spike_d2 = exp(-abs(c45.x) * 35.0) * smoothstep(0.5, 0.0, abs(c45.y));
                float spikes   = (spike_h + spike_v) * 0.30 * spikeStr
                               + (spike_d1 + spike_d2) * 0.12 * spikeStr;

                float core  = smoothstep(0.5, 0.0, dist);
                float alpha = clamp((core + glow + spikes) * (0.72 + 0.28 * vAlpha), 0.0, 1.0);

                gl_FragColor = vec4(rgb, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
    })

    const stars = new THREE.Points(geometry, material)
    stars.name = 'StarParticles'
    stars.frustumCulled = false
    scene.add(stars)

    const update = (delta: number) => {
        stars.rotation.y += delta * 0.014
        stars.rotation.x += delta * 0.0025
            ; (material.uniforms.time as THREE.IUniform).value += delta
    }

    const dispose = () => {
        scene.remove(stars)
        geometry.dispose()
        material.dispose()
    }

    return { update, dispose, mesh: stars }
}
