'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function GridBackground3D() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.035)

    // Camera
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 200)
    camera.position.set(0, 8, 14)
    camera.lookAt(0, 0, 0)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    // Grid — основная сетка
    const gridHelper = new THREE.GridHelper(60, 60, 0x222222, 0x1a1a1a)
    scene.add(gridHelper)

    // Акцентные линии по осям
    const axisMatX = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.6 })
    const axisMatZ = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.6 })
    const geomX = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-30, 0, 0), new THREE.Vector3(30, 0, 0)])
    const geomZ = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -30), new THREE.Vector3(0, 0, 30)])
    scene.add(new THREE.Line(geomX, axisMatX))
    scene.add(new THREE.Line(geomZ, axisMatZ))

    // Touch/mouse orbit
    let isDragging = false
    let prevX = 0
    let prevY = 0
    let rotX = 0.4  // начальный наклон
    let rotY = 0
    let targetRotX = 0.4
    let targetRotY = 0
    const radius = 18

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true
      prevX = e.clientX
      prevY = e.clientY
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      const dx = (e.clientX - prevX) * 0.005
      const dy = (e.clientY - prevY) * 0.005
      targetRotY += dx
      targetRotX = Math.max(0.05, Math.min(1.2, targetRotX + dy))
      prevX = e.clientX
      prevY = e.clientY
    }
    const onPointerUp = () => { isDragging = false }

    mount.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    // Resize
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // Auto-rotate when idle
    let autoRotate = true
    let lastInteract = Date.now()
    mount.addEventListener('pointerdown', () => { autoRotate = false; lastInteract = Date.now() })

    // Animate
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)

      if (!isDragging && Date.now() - lastInteract > 2000) {
        autoRotate = true
      }
      if (autoRotate) {
        targetRotY += 0.002
      }

      // Smooth lerp
      rotX += (targetRotX - rotX) * 0.08
      rotY += (targetRotY - rotY) * 0.08

      camera.position.x = radius * Math.sin(rotY) * Math.cos(rotX)
      camera.position.y = radius * Math.sin(rotX)
      camera.position.z = radius * Math.cos(rotY) * Math.cos(rotX)
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      mount.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 touch-none"
      style={{ cursor: 'grab' }}
    />
  )
}
