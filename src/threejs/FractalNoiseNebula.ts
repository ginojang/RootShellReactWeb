// FractalNoiseNebula.ts
import * as THREE from 'three'
import { GlobalEnv } from "../config/GlobalEnv"

export function createFractalNebulaPlane(scene: THREE.Scene) {
    const geometry = new THREE.PlaneGeometry(10, 10, 128, 128)

    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0x261e5b) },
            uIntensity: { value: (GlobalEnv.isMobile === true) ? 10.2 : 3.2 },
            uScale: { value: 1.6 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uIntensity;
            uniform float uScale;

            float random(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p){
                vec2 i = floor(p);
                vec2 f = fract(p);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));

                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            float fbm(vec2 p) {
                float v = 0.0;
                float amp = 0.5;
                for(int i = 0; i < 5; i++) {
                v += amp * noise(p);
                p *= 2.0;
                amp *= 0.5;
                }
                return v;
            }

            void main() {
                float n = fbm(vUv * uScale + vec2(uTime * 0.02, 0.0));
                float alpha = pow(n, 3.0);
                gl_FragColor = vec4(uColor * n * uIntensity, alpha);
            }
        `
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane)

    return (deltaTime: number) => {
        material.uniforms.uTime.value += deltaTime;
    }
}

// 사용 예시 (setupThree.ts 내부에서)
// const updateNebula = createFractalNebulaPlane();
// animation loop 내부에서: updateNebula(deltaTime);
