import * as THREE from 'three'

type BuildingId = 'wall' | 'turret' | 'laser' | 'missile' | 'shield'

type BuildingDef = {
  id: BuildingId
  label: string
  color: number
  cost: number
  range?: number
  fireRate?: number
  damage?: number
}

type BuildingInstance = {
  defId: BuildingId
  cell: { x: number; z: number }
  mesh: THREE.Mesh
  cooldown: number
}

type Meteor = {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  hp: number
  alive: boolean
}

const BUILDINGS: BuildingDef[] = [
  { id: 'wall', label: 'Wall', color: 0x64748b, cost: 25 },
  { id: 'turret', label: 'Turret', color: 0xf97316, cost: 70, range: 7.5, fireRate: 1.8, damage: 26 },
  { id: 'laser', label: 'Laser Tower', color: 0x22d3ee, cost: 110, range: 9.5, fireRate: 3.4, damage: 20 },
  { id: 'missile', label: 'Missile Pod', color: 0xa78bfa, cost: 140, range: 11, fireRate: 0.9, damage: 55 },
  { id: 'shield', label: 'Shield Emitter', color: 0x34d399, cost: 125 },
]

export class BaseDefenseGame {
  private readonly canvas: HTMLCanvasElement
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private clock = new THREE.Clock()
  private raf = 0
  private ro!: ResizeObserver

  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private hover = new THREE.Vector3(0, 0, 0)

  private baseHealth = 1000
  private credits = 300
  private wave = 0
  private meteorsLeftInWave = 0
  private spawnTimer = 0
  private nextWaveTimer = 2
  private selected: BuildingId = 'turret'

  private readonly buildings: BuildingInstance[] = []
  private readonly meteors: Meteor[] = []
  private readonly world = new THREE.Group()
  private readonly shots = new THREE.Group()
  private readonly effects = new THREE.Group()
  private readonly occupied = new Set<string>()
  private isLost = false

  onStateChange?: (state: { baseHealth: number; credits: number; wave: number; selected: BuildingId; incoming: number; gameOver: boolean }) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  start() {
    this.setupRenderer()
    this.setupWorld()
    this.attachEvents()
    this.tick()
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.detachEvents()
    this.ro.disconnect()
    this.renderer.dispose()
  }

  setSelected(id: BuildingId) {
    this.selected = id
    this.emitState()
  }

  private setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.shadowMap.enabled = true

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x030712)
    this.scene.fog = new THREE.Fog(0x030712, 28, 120)

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 500)
    this.camera.position.set(0, 24, 24)
    this.camera.lookAt(0, 0, 0)

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(this.canvas)
    this.resize()
  }

  private setupWorld() {
    this.scene.add(this.world)
    this.scene.add(this.shots)
    this.scene.add(this.effects)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.94, metalness: 0.03 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.world.add(ground)

    const grid = new THREE.GridHelper(60, 30, 0x1e3a8a, 0x1e293b)
    this.world.add(grid)

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 3.8, 3.5, 24),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 0.35 }),
    )
    base.position.set(0, 1.75, 0)
    base.castShadow = true
    this.world.add(base)

    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.08 }),
    )
    aura.position.set(0, 2.2, 0)
    this.world.add(aura)

    this.world.add(new THREE.AmbientLight(0xffffff, 0.4))
    const dir = new THREE.DirectionalLight(0xdbeafe, 1.2)
    dir.position.set(10, 24, 8)
    dir.castShadow = true
    this.world.add(dir)
  }

  private attachEvents() {
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('keydown', this.onKeyDown)
  }

  private detachEvents() {
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('keydown', this.onKeyDown)
  }

  private readonly onPointerMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  private readonly onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || this.isLost) return
    this.updateHoverCell()
    const x = Math.round(this.hover.x)
    const z = Math.round(this.hover.z)
    if (Math.hypot(x, z) < 4.2) return
    if (Math.abs(x) > 14 || Math.abs(z) > 14) return

    const key = `${x}:${z}`
    if (this.occupied.has(key)) return
    const def = BUILDINGS.find((b) => b.id === this.selected)
    if (!def || this.credits < def.cost) return

    this.credits -= def.cost
    this.occupied.add(key)
    this.placeBuilding(def, x, z)
    this.emitState()
  }

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (e.key === '1') this.setSelected('wall')
    if (e.key === '2') this.setSelected('turret')
    if (e.key === '3') this.setSelected('laser')
    if (e.key === '4') this.setSelected('missile')
    if (e.key === '5') this.setSelected('shield')
  }

  private placeBuilding(def: BuildingDef, x: number, z: number) {
    const height = def.id === 'wall' ? 1.7 : def.id === 'shield' ? 2.6 : 2.1
    const geo = def.id === 'shield' ? new THREE.CylinderGeometry(0.8, 0.8, height, 16) : new THREE.BoxGeometry(1.5, height, 1.5)
    const mat = new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.25, roughness: 0.55 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, height / 2, z)
    mesh.castShadow = true
    this.world.add(mesh)
    this.buildings.push({ defId: def.id, cell: { x, z }, mesh, cooldown: 0 })
  }

  private spawnMeteor() {
    const angle = Math.random() * Math.PI * 2
    const radius = 24 + Math.random() * 7
    const start = new THREE.Vector3(Math.cos(angle) * radius, 22 + Math.random() * 8, Math.sin(angle) * radius)

    const geo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.8, 0)
    const mat = new THREE.MeshStandardMaterial({ color: 0xfb7185, emissive: 0x7f1d1d, emissiveIntensity: 0.55, roughness: 0.8 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(start)
    mesh.castShadow = true
    this.world.add(mesh)

    const towardBase = new THREE.Vector3(-start.x, -start.y + 1, -start.z).normalize()
    const velocity = towardBase.multiplyScalar(5 + this.wave * 0.6)
    const hp = 30 + this.wave * 10
    this.meteors.push({ mesh, velocity, hp, alive: true })
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick)
    const dt = Math.min(0.04, this.clock.getDelta())
    if (!this.isLost) this.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    this.updateHoverCell()
    this.handleWaves(dt)
    this.updateMeteors(dt)
    this.updateBuildings(dt)
    this.cleanupProjectilesAndEffects(dt)
    this.emitState()
  }

  private handleWaves(dt: number) {
    if (this.meteorsLeftInWave <= 0 && this.meteors.every((m) => !m.alive)) {
      this.nextWaveTimer -= dt
      if (this.nextWaveTimer <= 0) {
        this.wave += 1
        this.meteorsLeftInWave = 6 + this.wave * 3
        this.spawnTimer = 0
        this.nextWaveTimer = 8
        this.credits += 40 + this.wave * 12
      }
      return
    }

    this.spawnTimer -= dt
    if (this.meteorsLeftInWave > 0 && this.spawnTimer <= 0) {
      this.spawnMeteor()
      this.meteorsLeftInWave -= 1
      this.spawnTimer = Math.max(0.35, 1.4 - this.wave * 0.06)
    }
  }

  private updateMeteors(dt: number) {
    for (const meteor of this.meteors) {
      if (!meteor.alive) continue
      meteor.mesh.position.addScaledVector(meteor.velocity, dt)
      meteor.mesh.rotation.x += dt * 1.4
      meteor.mesh.rotation.y += dt * 1.9

      if (meteor.mesh.position.length() < 2.8) {
        meteor.alive = false
        this.baseHealth -= 75
        this.spawnExplosion(meteor.mesh.position, 1.2, 0xff8a80)
        this.world.remove(meteor.mesh)
        if (this.baseHealth <= 0) {
          this.baseHealth = 0
          this.isLost = true
        }
      }
    }
  }

  private updateBuildings(dt: number) {
    for (const b of this.buildings) {
      const def = BUILDINGS.find((d) => d.id === b.defId)
      if (!def || !def.range || !def.fireRate || !def.damage) continue
      b.cooldown -= dt
      if (b.cooldown > 0) continue

      const source = new THREE.Vector3(b.cell.x, b.mesh.position.y + 0.4, b.cell.z)
      let target: Meteor | null = null
      let bestDist = Infinity

      for (const m of this.meteors) {
        if (!m.alive) continue
        const dist = source.distanceTo(m.mesh.position)
        if (dist > def.range) continue
        if (dist < bestDist) {
          bestDist = dist
          target = m
        }
      }
      if (!target) continue

      b.cooldown = 1 / def.fireRate
      target.hp -= def.damage
      this.spawnShot(source, target.mesh.position, def.id)
      if (target.hp <= 0) {
        target.alive = false
        this.credits += 12
        this.world.remove(target.mesh)
        this.spawnExplosion(target.mesh.position, 0.8, 0x38bdf8)
      }
    }
  }

  private spawnShot(from: THREE.Vector3, to: THREE.Vector3, defId: BuildingId) {
    const color = defId === 'laser' ? 0x22d3ee : defId === 'missile' ? 0xa78bfa : 0xfb923c
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 })
    const geo = new THREE.BufferGeometry().setFromPoints([from, to])
    const line = new THREE.Line(geo, mat)
    line.userData.life = defId === 'laser' ? 0.12 : 0.08
    this.shots.add(line)
  }

  private spawnExplosion(at: THREE.Vector3, size: number, color: number) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 10, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }),
    )
    mesh.position.copy(at)
    mesh.userData.life = 0.35
    this.effects.add(mesh)
  }

  private cleanupProjectilesAndEffects(dt: number) {
    for (const c of [...this.shots.children]) {
      c.userData.life -= dt
      if (c.userData.life <= 0) {
        const line = c as THREE.Line
        line.geometry.dispose()
        ;(line.material as THREE.Material).dispose()
        this.shots.remove(c)
      }
    }

    for (const c of [...this.effects.children]) {
      c.userData.life -= dt
      c.scale.multiplyScalar(1 + dt * 2.7)
      const m = c as THREE.Mesh
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, mat.opacity - dt * 1.2)
      if (c.userData.life <= 0) {
        m.geometry.dispose()
        mat.dispose()
        this.effects.remove(c)
      }
    }
  }

  private updateHoverCell() {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hit = this.raycaster.ray.intersectPlane(this.plane, this.hover)
    if (!hit) this.hover.set(0, 0, 0)
  }

  private emitState() {
    const incoming = this.meteors.filter((m) => m.alive).length + this.meteorsLeftInWave
    this.onStateChange?.({
      baseHealth: this.baseHealth,
      credits: this.credits,
      wave: this.wave,
      selected: this.selected,
      incoming,
      gameOver: this.isLost,
    })
  }

  private resize() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }
}

export { BUILDINGS }
