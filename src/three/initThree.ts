import * as THREE from 'three'

export function initThree() {
  const canvasEl = document.getElementById('three-canvas') as HTMLCanvasElement | null
  if (!canvasEl) return
  const canvas = canvasEl

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x05070f)

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
  camera.position.set(0, 1.5, 4)

  const light = new THREE.DirectionalLight(0xffffff, 1.2)
  light.position.set(3, 5, 2)
  scene.add(light)
  scene.add(new THREE.AmbientLight(0xffffff, 0.25))

  const ship = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 1.4, 24),
    new THREE.MeshStandardMaterial({ color: 0xa5b4fc, metalness: 0.2, roughness: 0.35 }),
  )
  body.rotation.x = Math.PI / 2
  ship.add(body)

  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0x93c5fd, metalness: 0.05, roughness: 0.1 }),
  )
  cockpit.position.set(0, 0.15, 0.3)
  ship.add(cockpit)
  scene.add(ship)

  const starsGeo = new THREE.BufferGeometry()
  const starsCount = 600
  const positions = new Float32Array(starsCount * 3)
  for (let i = 0; i < starsCount; i++) {
    const r = 40 * Math.random() + 10
    const theta = Math.random() * Math.PI * 2
    const y = (Math.random() - 0.5) * 25
    positions[i * 3 + 0] = Math.cos(theta) * r
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = Math.sin(theta) * r
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const stars = new THREE.Points(
    starsGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, sizeAttenuation: true }),
  )
  scene.add(stars)

  const clock = new THREE.Clock()

  function resize() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  let raf = 0
  const animate = () => {
    raf = window.requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    ship.rotation.y = t * 0.6
    ship.position.y = Math.sin(t * 1.2) * 0.08
    renderer.render(scene, camera)
  }
  animate()

  window.addEventListener('beforeunload', () => {
    window.cancelAnimationFrame(raf)
    ro.disconnect()
    renderer.dispose()
    starsGeo.dispose()
    ;(stars.material as THREE.Material).dispose()
    ;(body.geometry as THREE.BufferGeometry).dispose()
    ;(body.material as THREE.Material).dispose()
    ;(cockpit.geometry as THREE.BufferGeometry).dispose()
    ;(cockpit.material as THREE.Material).dispose()
  })
}
