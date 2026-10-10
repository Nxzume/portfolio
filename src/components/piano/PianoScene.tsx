import { ContactShadows, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { Group, Object3D } from 'three'
import * as THREE from 'three'
import { primeAudio } from '../../lib/pianoAudio'

const MODEL = '/models/piano-keyboard.glb'
/** Hinge press amount (radians) — keybed clearance in the GLB allows a real tip travel. */
const PRESS = 0.085
type HingeTarget = {
  hinge: Object3D
  note: string
  pressed: number
}

type Props = {
  onKeyPlay: (note: string) => void
  unlocking: boolean
}

function collectHinges(root: Object3D): HingeTarget[] {
  const hinges: HingeTarget[] = []
  root.traverse((obj) => {
    if (!obj.name.startsWith('Hinge_')) return
    const note = String(obj.userData.note || obj.name.replace(/^Hinge_[WB]_/, ''))
    if (!note) return
    hinges.push({ hinge: obj, note, pressed: 0 })
  })
  return hinges
}

function PianoModel({ onKeyPlay, unlocking }: Props) {
  const { scene } = useGLTF(MODEL)
  const invalidate = useThree((s) => s.invalidate)
  const clone = useMemo(() => scene.clone(true), [scene])
  const hinges = useMemo(() => collectHinges(clone), [clone])
  const group = useRef<Group>(null)
  const hingeByNote = useMemo(() => {
    const map = new Map<string, HingeTarget>()
    for (const h of hinges) map.set(h.note, h)
    return map
  }, [hinges])

  useEffect(() => {
    // Paint once after materials/shadows settle (Canvas uses frameloop="demand").
    invalidate()
  }, [clone, invalidate])

  useEffect(() => {
    if (unlocking) invalidate()
  }, [unlocking, invalidate])

  useEffect(() => {
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      // Keys skip the shadow pass — dozens of casters was a major frame-time cost.
      const isKey = /^[WB]_/.test(obj.name)
      obj.castShadow = !isKey
      obj.receiveShadow = !isKey

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of mats) {
        if (!(mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial)) {
          continue
        }
        mat.envMapIntensity = 0.35
        mat.toneMapped = true
        // Clearcoat is a second specular lobe; drop it for cheaper per-fragment work.
        if ('clearcoat' in mat) mat.clearcoat = 0
        if (/^W_/.test(obj.name)) {
          mat.color.set('#d8d0c4')
          mat.roughness = 0.55
          mat.metalness = 0
        } else if (/^B_/.test(obj.name)) {
          mat.color.set('#141416')
          mat.roughness = 0.35
          mat.metalness = 0.05
        } else if (/NameRail/i.test(obj.name)) {
          mat.color.set('#b8923a')
          mat.roughness = 0.4
          mat.metalness = 0.85
        } else {
          mat.color.set('#2a1810')
          mat.roughness = 0.62
          mat.metalness = 0.02
        }
        mat.needsUpdate = true
      }

      if (!isKey) return
      const hinge = obj.parent
      if (!hinge?.name.startsWith('Hinge_')) return
      const note = String(hinge.userData.note || obj.name.slice(2))
      obj.userData.interactiveNote = note
    })
  }, [clone])

  const unlockT = useRef(0)

  useFrame((_, dt) => {
    const t = Math.min(dt, 0.05)
    let anyPressed = false
    for (const key of hinges) {
      if (key.pressed > 0.001) {
        anyPressed = true
        key.pressed = THREE.MathUtils.damp(key.pressed, 0, 10, t)
        key.hinge.rotation.x = key.pressed * PRESS
      } else if (key.pressed !== 0) {
        key.pressed = 0
        key.hinge.rotation.x = 0
      }
    }

    if (group.current && unlocking) {
      unlockT.current = THREE.MathUtils.damp(unlockT.current, 1, 0.95, t)
      const u = unlockT.current
      group.current.scale.setScalar(THREE.MathUtils.lerp(5.2, 6.4, u))
      group.current.position.z = THREE.MathUtils.lerp(0, 0.12, u)
      group.current.rotation.x = THREE.MathUtils.lerp(-0.35, -0.22, u)
    }

    // Keep the demand loop alive only while keys or unlock still move.
    if (unlocking || anyPressed) invalidate()
  })

  return (
    <group
      ref={group}
      // Model is X=width, Y=up, Z=depth after glTF Yup export.
      rotation={[-0.35, 0.22, 0]}
      position={[0, -0.02, 0]}
      scale={5.2}
      onPointerDown={(e) => {
        e.stopPropagation()
        // Best-effort unlock in this gesture frame (DOM listeners are the reliable path on iOS).
        primeAudio()
        let cursor: Object3D | null = e.object
        while (cursor) {
          const note = cursor.userData.interactiveNote as string | undefined
          if (note) {
            const target = hingeByNote.get(note)
            if (target) target.pressed = 1
            invalidate()
            onKeyPlay(note)
            return
          }
          cursor = cursor.parent
        }
      }}
    >
      <primitive object={clone} />
      <ContactShadows
        frames={1}
        position={[0, -0.028, 0]}
        opacity={0.7}
        scale={2.0}
        blur={2.2}
        far={0.95}
        color="#000000"
        resolution={256}
      />
    </group>
  )
}

export function PianoScene({ onKeyPlay, unlocking }: Props) {
  return (
    <>
      <color attach="background" args={['#070706']} />
      <fog attach="fog" args={['#070706', 1.6, 3.8]} />
      <ambientLight intensity={0.16} />
      <directionalLight
        castShadow
        position={[0.7, 1.5, 1.1]}
        intensity={0.85}
        color="#f2ebe0"
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-1.1, 0.7, 0.4]} intensity={0.22} color="#8fa3b8" />
      <pointLight position={[0.05, 0.35, 0.5]} intensity={0.35} color="#c49a4a" distance={2.2} />
      <PianoModel onKeyPlay={onKeyPlay} unlocking={unlocking} />
    </>
  )
}

useGLTF.preload(MODEL)
