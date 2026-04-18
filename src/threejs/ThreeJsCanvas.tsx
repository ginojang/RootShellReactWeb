//src/threejs/ThreeJsCanvas.tsx

import * as THREE from "three"

import { useRef, useEffect } from 'react'
import { setupThree } from "./setupThree"

export default function ThreeJsCanvas({ onInit }: { onInit?: (scene: THREE.Scene) => void }) {

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return

        const { scene, camera, renderer, composer, start } = setupThree(
            canvasRef.current,
            true
        )

        onInit?.(scene) // 🧩 scene 넘기기

        sceneRef.current = scene
        rendererRef.current = renderer

        start();  // ✅ 중요: 렌더링 시작


        const handleResize = () => {
            const width = window.innerWidth
            const height = window.innerHeight
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            composer.setSize(width, height)
            renderer.setSize(width, height)
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100vw",
                height: "100vh",
                position: "absolute",
                zIndex: 2,
                pointerEvents: "none",
            }}
        />
    )
}