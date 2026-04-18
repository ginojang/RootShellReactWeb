// src/threejs/createBloomText.ts
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js'

// ✅ BufferGeometryUtils 없이 간단 머지
function mergeTextGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
    // 총 정점/인덱스 수 계산
    let totalVerts = 0
    let totalIndex = 0
    const info = geos.map(g => {
        const pos = g.getAttribute('position') as THREE.BufferAttribute
        const count = pos.count
        const idx = g.index ? g.index.array as ArrayLike<number> : null
        const idxCount = idx ? idx.length : count
        totalVerts += count
        totalIndex += idxCount
        return { g, pos, count, idx, idxCount }
    })

    const merged = new THREE.BufferGeometry()

    // 필수 속성
    const posArray = new Float32Array(totalVerts * 3)
    const hasNormal = !!geos[0].getAttribute('normal')
    const hasUV = !!geos[0].getAttribute('uv')
    const norArray = hasNormal ? new Float32Array(totalVerts * 3) : undefined
    const uvArray = hasUV ? new Float32Array(totalVerts * 2) : undefined

    const indexArray = new (totalVerts > 65535 ? Uint32Array : Uint16Array)(totalIndex)

    let vOff = 0
    let iOff = 0
    for (const { g, pos, count, idx, idxCount } of info) {
        // position
        posArray.set(pos.array as Float32Array, vOff * 3)
        // normal
        if (hasNormal) {
            const n = g.getAttribute('normal') as THREE.BufferAttribute
            if (n) norArray!.set(n.array as Float32Array, vOff * 3)
        }
        // uv
        if (hasUV) {
            const uv = g.getAttribute('uv') as THREE.BufferAttribute
            if (uv) uvArray!.set(uv.array as Float32Array, vOff * 2)
        }
        // index (없으면 0..count-1)
        if (idx) {
            for (let i = 0; i < idx.length; i++) indexArray[iOff + i] = idx[i] + vOff
        } else {
            for (let i = 0; i < count; i++) indexArray[iOff + i] = vOff + i
        }
        vOff += count
        iOff += idxCount
    }

    merged.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    if (hasNormal) merged.setAttribute('normal', new THREE.BufferAttribute(norArray!, 3))
    if (hasUV) merged.setAttribute('uv', new THREE.BufferAttribute(uvArray!, 2))
    merged.setIndex(new THREE.BufferAttribute(indexArray, 1))
    merged.computeBoundingBox()
    merged.computeBoundingSphere()
    return merged
}

export async function createBloomText(
    text: string,
    position: THREE.Vector3,
    font_size: number
): Promise<THREE.Mesh> {

    const fontUrl = `${window.location.origin}/fonts/DoHyeon-Regular.json`

    const font = await new Promise<Font>((resolve, reject) => {
        new FontLoader().load(fontUrl, resolve, undefined, reject)
    })

    const lines = text.split('\n')
    const lineHeight = font_size * 1.2 // ✅ 줄간격 1.2
    const totalHeight = lineHeight * (lines.length - 1)

    const material = new THREE.MeshBasicMaterial({
        color: 0x00eeee,
        transparent: true,
        opacity: 0.8,
    })

    const geos: THREE.BufferGeometry[] = []

    lines.forEach((line, idx) => {
        const geo = new TextGeometry(line, {
            font,
            size: font_size,
            depth: 0.02,
            curveSegments: 30,
        })
        geo.computeBoundingBox()

        // 가로 가운데 정렬
        if (geo.boundingBox) {
            const center = new THREE.Vector3()
            geo.boundingBox.getCenter(center)
            geo.translate(-center.x, 0, -center.z)
        }

        // 세로 중앙 정렬(블록 기준)
        const y = (totalHeight / 2) - (idx * lineHeight)
        geo.translate(0, y, 0)

        geos.push(geo)
    })

    // ✅ 로컬 머지로 하나의 Mesh 생성
    const merged = mergeTextGeometries(geos)
    const mesh = new THREE.Mesh(merged, material)

    // 원하는 위치로 이동
    mesh.position.copy(position)
    return mesh
}
