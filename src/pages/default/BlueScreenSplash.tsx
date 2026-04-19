
//src/pages/BlueScreenSplash.tsx

import { useRef } from 'react'
import * as THREE from 'three'

import ThreeJsCanvas from '../../threejs/ThreeJsCanvas'
import { createBloomText } from '../../threejs/createBloomText'
import { log } from '../../utils/log';
import { getText } from '../../i18n'

//
interface BlueScreenSplashProps {
    statusScreen: string
    onExited: () => void
}
export default function BlueScreenStartSplash({ statusScreen, onExited }: BlueScreenSplashProps) {

    const sceneRef = useRef<THREE.Scene | null>(null)
    const textMainMeshRef = useRef<THREE.Mesh | null>(null)
    const textsubMeshRef = useRef<THREE.Mesh | null>(null)

    const handleThreeInit = (scene: THREE.Scene) => {
        sceneRef.current = scene
        updateStatusText(scene, statusScreen)
    }

    const updateStatusText = async (scene: THREE.Scene, status: string) => {

        addTextMesh(scene,
            await createBloomText(getMainMessageForStatus(status), new THREE.Vector3(0.1, 1.2 + 1.3, -8), 0.44 + 0.06),
            textMainMeshRef);

        addTextMesh(scene,
            await createBloomText(getSubMessageForStatus(status), new THREE.Vector3(0.1, -0.8 + 1.3, -8), 0.3 + 0.06),
            textsubMeshRef);
    }

    const getMainMessageForStatus = (status: string): string => {
        switch (status) {
            case 'punker_start':
                return 'MCP Punker Start App'

            case 'idle':
                return ''
            case 'maintenance':
                return 'System Under Maintenance'
            case 'error_404':
                return '404 Not Found'
            case 'failed':
                return 'Unsupported Platform'

            case 'kakao':
                return `카카오 인앱에서는 일부 기능이\n 동작하지 않을 수 있습니다.`

            case 'unsupported_ios_version':
                return getText('t024'); //`iOS 17 이상에서만\n이용 가능합니다.`

            //case 'failed_wallet':
            //    return 'Error '
            default:
                return ''
        }
    }

    const getSubMessageForStatus = (status: string): string => {
        if (status == 'kakao') {
            return ' 화면을 두번 터치하면\n클립보드에 현재 주소가 복사 됩니다.\n외부 브라우저에서 실행하세요.'
        }
        else if (status === 'unsupported_ios_version') {
            return getText('t025'); //'설정 → 일반 → 소프트웨어 업데이트에서 최신 버전으로 업데이트하세요.'
        }
        else
            return 'Touch to start the Arena game'
    }

    const addTextMesh = (scene: THREE.Scene, mesh: THREE.Mesh, currentMesh: any) => {
        // 기존 메시지 제거
        if (currentMesh.current) {
            scene.remove(currentMesh.current)
        }
        scene.add(mesh)
        currentMesh.current = mesh
    }

    const handleTouchEnd = async () => {

        if (statusScreen === 'kakao') {

            const currentUrl = window.location.href;
            await navigator.clipboard.writeText(currentUrl);
            alert(' 현재 주소를 복사했습니다.\n외부 브라우저에서 붙여넣어 실행하세요.');

            return;
        }
        else {
            await onExited()
        }
    }

    return (
        <div
            //onTouchEnd={handleTouchEnd}
            onClick={handleTouchEnd}
            style={{
                position: 'fixed',   // 부모 레이아웃 영향 없이 뷰포트 기준 고정
                inset: 0,
                zIndex: 0,
                backgroundColor: 'transparent',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontFamily: 'sans-serif',
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                lineHeight: '1.2',
                cursor: 'pointer',
            }}
        >
            <ThreeJsCanvas onInit={handleThreeInit} />

        </div>
    )
}

