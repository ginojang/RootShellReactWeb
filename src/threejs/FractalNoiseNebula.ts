// FractalNoiseNebula.ts
import * as THREE from 'three'
import { GlobalEnv } from "../config/GlobalEnv"

// 공통 vertex shader (단순 UV 패스스루)
const VERT = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

// 공통 noise 유틸 (hash 시드를 파라미터로 달리해 레이어 분리)
function buildFragShader(hashSeed: string, fbmOctaves: number, style: 'base' | 'wisp' | 'accent') {
    return `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3  uColor1;
        uniform vec3  uColor2;
        uniform float uIntensity;
        uniform float uScale;
        uniform float uWarpAmp;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(${hashSeed}))) * 43758.5453);
        }
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
        }
        float fbm(vec2 p) {
            float v = 0.0, amp = 0.5;
            for (int i = 0; i < ${fbmOctaves}; i++) {
                v  += amp * noise(p);
                p   = p * 2.1 + vec2(1.7, 9.2);
                amp *= 0.5;
            }
            return v;
        }

        void main() {
            vec2  uv = vUv;
            float t  = uTime * 0.016;

            // 도메인 워핑: UV를 두 번 뒤틀어 유기적 형태 생성
            vec2 warp1 = vec2(
                fbm(uv * uScale + vec2( t,       0.3)),
                fbm(uv * uScale + vec2( 0.3, t * 0.7) + vec2(5.2, 1.3))
            );
            vec2 warp2 = vec2(
                fbm((uv + uWarpAmp * warp1) * uScale + vec2(3.7, 2.1)),
                fbm((uv + uWarpAmp * warp1) * uScale + vec2(1.1, 8.4))
            );
            vec2 warpedUV = uv + uWarpAmp * warp2;

            float n = fbm(warpedUV * uScale + vec2(t * 0.6, t * 0.25));

            // 중심에서 가장자리로 비네팅
            float vignette = 1.0 - smoothstep(0.18, 0.72, length(uv - 0.5));

            ${style === 'base' ? `
                vec3  col   = mix(uColor1, uColor2, smoothstep(0.3, 0.8, n));
                float alpha = pow(n, 2.0) * vignette;
                gl_FragColor = vec4(col * n * uIntensity, clamp(alpha * uIntensity * 0.38, 0.0, 1.0));
            ` : style === 'wisp' ? `
                // 높은 대비로 가느다란 위스프 표현
                float wisp  = pow(max(0.0, n - 0.42), 2.2) * 4.0 * vignette;
                vec3  col   = mix(uColor1, uColor2, wisp);
                gl_FragColor = vec4(col * wisp * uIntensity, clamp(wisp * uIntensity * 0.28, 0.0, 1.0));
            ` : `
                // 악센트: 밝은 핫스팟 강조
                float glow  = pow(n, 4.0) * vignette * 5.5;
                gl_FragColor = vec4(uColor1 * glow * uIntensity, clamp(glow * uIntensity * 0.22, 0.0, 1.0));
            `}
        }
    `
}

export function createFractalNebulaPlane(scene: THREE.Scene) {
    const isMobile = GlobalEnv.isMobile === true

    // ── 레이어 1: 딥 퍼플/블루 메인 바디 ──────────────────────────────────
    const mat1 = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite:  false,
        blending:    THREE.AdditiveBlending,
        uniforms: {
            uTime:      { value: 0 },
            uColor1:    { value: new THREE.Color(0x120838) },  // 딥 인디고
            uColor2:    { value: new THREE.Color(0x0a1f5c) },  // 딥 블루
            uIntensity: { value: isMobile ? 4.8 : 2.4 },
            uScale:     { value: 1.7 },
            uWarpAmp:   { value: 0.42 },
        },
        vertexShader:   VERT,
        fragmentShader: buildFragShader('127.1, 311.7', isMobile ? 5 : 6, 'base'),
    })
    const plane1 = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), mat1)
    plane1.position.z = -1.0
    scene.add(plane1)

    // ── 레이어 2: 청록 위스프 (하이라이트) ───────────────────────────────
    const mat2 = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite:  false,
        blending:    THREE.AdditiveBlending,
        uniforms: {
            uTime:      { value: 0 },
            uColor1:    { value: new THREE.Color(0x062e3a) },  // 딥 틸
            uColor2:    { value: new THREE.Color(0x0d4a52) },  // 밝은 틸
            uIntensity: { value: isMobile ? 3.2 : 1.6 },
            uScale:     { value: 2.1 },
            uWarpAmp:   { value: 0.36 },
        },
        vertexShader:   VERT,
        fragmentShader: buildFragShader('113.5, 271.9', isMobile ? 4 : 5, 'wisp'),
    })
    const plane2 = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), mat2)
    plane2.position.z  = -0.4
    plane2.rotation.z  =  0.28
    scene.add(plane2)

    // ── 레이어 3: 마젠타 악센트 (모바일 생략 가능) ───────────────────────
    let mat3: THREE.ShaderMaterial | null = null
    if (!isMobile) {
        mat3 = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite:  false,
            blending:    THREE.AdditiveBlending,
            uniforms: {
                uTime:      { value: 0 },
                uColor1:    { value: new THREE.Color(0x3a0828) },  // 딥 마젠타
                uColor2:    { value: new THREE.Color(0x3a0828) },
                uIntensity: { value: 1.3 },
                uScale:     { value: 1.3 },
                uWarpAmp:   { value: 0.50 },
            },
            vertexShader:   VERT,
            fragmentShader: buildFragShader('211.3, 157.4', 4, 'accent'),
        })
        const plane3 = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), mat3)
        plane3.position.z = -1.6
        plane3.rotation.z = -0.18
        scene.add(plane3)
    }

    return (deltaTime: number) => {
        mat1.uniforms.uTime.value += deltaTime
        mat2.uniforms.uTime.value += deltaTime
        if (mat3) mat3.uniforms.uTime.value += deltaTime
    }
}
