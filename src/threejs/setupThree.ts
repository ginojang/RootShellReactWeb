import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"
import { createFractalNebulaPlane } from './FractalNoiseNebula'
import { generateCosmicElements } from "./generateCosmicElements"
//import { createBloomText } from './createBloomText'

import { GlobalEnv } from "../config/GlobalEnv"

export interface ThreeCore {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    composer: EffectComposer
    isLight: boolean
    start: () => void
}

export const setupThree = (
    canvas: HTMLCanvasElement,
    isLight: boolean
): ThreeCore => {
    const getSize = () => {
        const width = window.innerWidth
        const height = window.visualViewport?.height || window.innerHeight
        return { width, height }
    }

    const { width, height } = getSize()
    const dpr = Math.max(window.devicePixelRatio, 2)

    // 스타일 적용
    canvas.style.position = "fixed"
    canvas.style.inset = "0px"
    canvas.style.width = "100vw"
    canvas.style.height = "100vh"
    canvas.style.zIndex = "0"
    canvas.style.touchAction = "none" // canvas 자체는 none (스크롤 방지), pointerEvents:none으로 터치는 부모에게 전달됨

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
        preserveDrawingBuffer: true,
        precision: "highp"
    })
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)
    renderer.domElement.width = width * dpr
    renderer.domElement.height = height * dpr
    renderer.setClearColor(0xffffff, 0)

    //renderer.toneMapping = THREE.NeutralToneMapping
    //renderer.toneMappingExposure = 1
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1

    renderer.outputColorSpace = THREE.SRGBColorSpace


    // ✅ 라이트 세팅
    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    const directionalLight = new THREE.DirectionalLight(0xfff2e0, 0.6)
    directionalLight.position.set(0, 3, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)


    // 오브젝트 배치
    const updateNebula = createFractalNebulaPlane(scene)

    const updateFns: Array<(delta: number) => void> = []
    const disposers: Array<() => void> = []

    updateFns.push(updateNebula)

    const cosmic = generateCosmicElements(scene)
    updateFns.push(cosmic.update)
    disposers.push(cosmic.dispose)


    // ✅ 블룸 세팅
    const composer = new EffectComposer(renderer)
    const renderScene = new RenderPass(scene, camera)
    composer.addPass(renderScene)

    /*
    const unrealBloom = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        (GlobalEnv.isMobile === true) ? 0.4 : 0.2,
        0.8,
        0.4
    )*/
    const unrealBloom = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        (GlobalEnv.isMobile === true) ? 0.35 : 0.25, // strength
        0.7,  // radius
        0.45  // threshold
    )

    composer.addPass(unrealBloom)

    const outputPass = new OutputPass()
    composer.addPass(outputPass)


    // ✅ 핸들 사이즈 조정
    const handleResize = () => {
        const { width, height } = getSize()
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
        composer.setSize(width, height)
        renderer.domElement.width = width * dpr
        renderer.domElement.height = height * dpr
    }
    window.addEventListener("resize", handleResize)


    // ✅ 애니메이션 조정
    const clock = new THREE.Clock()
    const animate = () => {
        requestAnimationFrame(animate)
        const delta = clock.getDelta()
        updateFns.forEach(fn => fn(delta))
        composer.render()
    }

    return {
        scene,
        camera,
        renderer,
        composer,
        isLight,
        start: animate,
    }
}
