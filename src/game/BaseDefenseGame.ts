import * as THREE from 'three'

export type BuildingId =
  | 'command_center'
  | 'supply_depot'
  | 'factory_business'
  | 'factory_factory'
  | 'factory_megacomplex'
  | 'generator_small'
  | 'generator_large'
  | 'battery'
  | 'auto_turret'
  | 'siege_cannon'
  | 'missile_launcher'
  | 'silo'
  | 'shield_generator'

export type BuildingCategory = 'structural' | 'economy' | 'electrical' | 'turrets' | 'missile' | 'utility'

type BuildingDef = {
  id: BuildingId
  label: string
  category: BuildingCategory
  color: number
  size: { w: number; h: number } // cells (x,z)
  maxHp: number

  // Cost / capacity
  creditCost: number
  supplyCost: number
  supplyCapAdd?: number

  powerCapAdd?: number
  powerGenPerSec?: number
  powerDrainPerSec?: number

  // Economy
  creditPayout?: number
  creditIntervalSec?: number

  // Combat
  range?: number
  fireRate?: number
  damage?: number
  aoeRadius?: number
  burst?: number
  projectileSpeed?: number
  kind?: 'hitscan' | 'missiles' | 'ballistic' | 'shield'

  wheelDetails: () => [string, string]
}

type HealthBar = { group: THREE.Group; fill: THREE.Mesh; bg: THREE.Mesh }

type PlacedBuilding = {
  id: string
  defId: BuildingId
  def: BuildingDef
  origin: { x: number; z: number } // top-left in cells
  hp: number
  mesh: THREE.Object3D
  healthBar: HealthBar
  cooldown: number
  econTimer: number
}

type Asteroid = {
  mesh: THREE.Mesh
  healthBar: HealthBar
  hp: number
  maxHp: number
  alive: boolean
  target: THREE.Vector3
  velocity: THREE.Vector3
  impactRadius: number
  impactDamage: number
}

type Missile = {
  mesh: THREE.Mesh
  target: Asteroid | null
  speed: number
  ttl: number
  damage: number
  aoeRadius: number
}

type Ballistic = {
  mesh: THREE.Mesh
  start: THREE.Vector3
  end: THREE.Vector3
  t: number
  duration: number
  damage: number
  aoeRadius: number
}

const BOARD_SIZE = 101
const HALF = Math.floor(BOARD_SIZE / 2) // 50

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const key = (x: number, z: number) => `${x}:${z}`

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'command_center',
    label: 'Command Center',
    category: 'structural',
    color: 0x60a5fa,
    size: { w: 3, h: 3 },
    maxHp: 2600,
    creditCost: 450,
    supplyCost: 0,
    supplyCapAdd: 40,
    creditPayout: 18,
    creditIntervalSec: 3,
    powerGenPerSec: 2.2,
    wheelDetails: () => ['Cost: 450c', '+Supply Cap: 40'],
  },
  {
    id: 'supply_depot',
    label: 'Supply Depo',
    category: 'structural',
    color: 0x60a5fa,
    size: { w: 2, h: 2 },
    maxHp: 700,
    creditCost: 120,
    supplyCost: 2,
    supplyCapAdd: 20,
    wheelDetails: () => ['Cost: 120c', '+Supply Cap: 20'],
  },
  {
    id: 'factory_business',
    label: 'Business',
    category: 'economy',
    color: 0x22c55e,
    size: { w: 2, h: 2 },
    maxHp: 650,
    creditCost: 160,
    supplyCost: 4,
    creditPayout: 6,
    creditIntervalSec: 1,
    powerDrainPerSec: 0.6,
    wheelDetails: () => ['Cost: 160c', '+6c / 1s'],
  },
  {
    id: 'factory_factory',
    label: 'Factory',
    category: 'economy',
    color: 0x22c55e,
    size: { w: 3, h: 3 },
    maxHp: 1250,
    creditCost: 480,
    supplyCost: 10,
    creditPayout: 80,
    creditIntervalSec: 10,
    powerDrainPerSec: 2.2,
    wheelDetails: () => ['Cost: 480c', '+80c / 10s'],
  },
  {
    id: 'factory_megacomplex',
    label: 'Mega-Complex',
    category: 'economy',
    color: 0x22c55e,
    size: { w: 4, h: 4 },
    maxHp: 2600,
    creditCost: 1400,
    supplyCost: 22,
    creditPayout: 450,
    creditIntervalSec: 60,
    powerDrainPerSec: 4.5,
    wheelDetails: () => ['Cost: 1400c', '+450c / 60s'],
  },
  {
    id: 'generator_small',
    label: 'Generator (S)',
    category: 'electrical',
    color: 0xeab308,
    size: { w: 2, h: 2 },
    maxHp: 520,
    creditCost: 120,
    supplyCost: 3,
    powerGenPerSec: 4.5,
    wheelDetails: () => ['Cost: 120c', '+4.5 Power/s'],
  },
  {
    id: 'generator_large',
    label: 'Generator (L)',
    category: 'electrical',
    color: 0xeab308,
    size: { w: 3, h: 3 },
    maxHp: 1050,
    creditCost: 360,
    supplyCost: 7,
    powerGenPerSec: 12,
    wheelDetails: () => ['Cost: 360c', '+12 Power/s'],
  },
  {
    id: 'battery',
    label: 'Battery',
    category: 'electrical',
    color: 0xeab308,
    size: { w: 2, h: 2 },
    maxHp: 600,
    creditCost: 140,
    supplyCost: 3,
    powerCapAdd: 40,
    wheelDetails: () => ['Cost: 140c', '+Max Power: 40'],
  },
  {
    id: 'auto_turret',
    label: 'Auto-Turret',
    category: 'turrets',
    color: 0xf97316,
    size: { w: 1, h: 1 },
    maxHp: 260,
    creditCost: 60,
    supplyCost: 2,
    powerDrainPerSec: 0.25,
    kind: 'hitscan',
    range: 14,
    fireRate: 9.5,
    damage: 6,
    wheelDetails: () => ['Cost: 60c', 'Dmg: Low • ROF: High'],
  },
  {
    id: 'siege_cannon',
    label: 'Siege Cannon',
    category: 'turrets',
    color: 0xf97316,
    size: { w: 2, h: 2 },
    maxHp: 520,
    creditCost: 220,
    supplyCost: 6,
    powerDrainPerSec: 0.55,
    kind: 'hitscan',
    range: 48,
    fireRate: 0.45,
    damage: 170,
    wheelDetails: () => ['Cost: 220c', 'Range: Long • Dmg: High'],
  },
  {
    id: 'missile_launcher',
    label: 'Missile Launcher',
    category: 'missile',
    color: 0xef4444,
    size: { w: 2, h: 2 },
    maxHp: 520,
    creditCost: 280,
    supplyCost: 7,
    powerDrainPerSec: 0.8,
    kind: 'missiles',
    range: 42,
    fireRate: 0.35,
    damage: 32,
    aoeRadius: 3.2,
    burst: 5,
    projectileSpeed: 26,
    wheelDetails: () => ['Cost: 280c', 'AOE: Med • Burst Missiles'],
  },
  {
    id: 'silo',
    label: 'Silo',
    category: 'missile',
    color: 0xef4444,
    size: { w: 3, h: 3 },
    maxHp: 1200,
    creditCost: 650,
    supplyCost: 14,
    powerDrainPerSec: 1.1,
    kind: 'ballistic',
    range: 70,
    fireRate: 0.08,
    damage: 900,
    aoeRadius: 9.5,
    wheelDetails: () => ['Cost: 650c', 'AOE: Massive • Slow'],
  },
  {
    id: 'shield_generator',
    label: 'Shield Generator',
    category: 'utility',
    color: 0x38bdf8,
    size: { w: 3, h: 3 },
    maxHp: 1100,
    creditCost: 520,
    supplyCost: 10,
    kind: 'shield',
    range: 12, // shield radius
    powerDrainPerSec: 6.5,
    wheelDetails: () => ['Cost: 520c', 'Power Drain • Blocks Impacts'],
  },
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
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private readonly tmpV3 = new THREE.Vector3()

  // Camera controls
  private camPos = new THREE.Vector3(0, 55, 70)
  private yaw = 0
  private pitch = -0.65
  private readonly moveKeys = new Set<string>()
  private lookLocked = false
  private hasMousePos = false
  private lastMouseX = 0
  private lastMouseY = 0

  // Selection / hover
  private selected: BuildingId = 'auto_turret'
  private hoverCell = { x: 0, z: 0 }
  private hoverValid = false

  // Resources
  private credits = 650
  private supplyCap = 0
  private supplyUsed = 0
  private powerCap = 20
  private powerStored = 20

  // Wave control
  private wave = 0
  private firstWaveStarted = false
  private waveInProgress = false
  private waveReady = true
  private autoWaveTimer = 0
  private toSpawn = 0
  private spawnTimer = 0

  // World state
  private readonly buildings: PlacedBuilding[] = []
  private readonly asteroids: Asteroid[] = []
  private readonly missiles: Missile[] = []
  private readonly ballistics: Ballistic[] = []
  private readonly occupied = new Map<string, string>() // cell -> placedBuilding.id

  private isLost = false
  private wheelOpen = false

  // Scene objects
  private readonly world = new THREE.Group()
  private readonly projectiles = new THREE.Group()
  private readonly effects = new THREE.Group()
  private hoverOutline!: THREE.LineSegments
  private hoverGhost!: THREE.Mesh
  private skyStars!: { obj: THREE.Points; dispose: () => void }

  onStateChange?: (state: {
    credits: number
    supplyUsed: number
    supplyCap: number
    powerStored: number
    powerCap: number
    wave: number
    waveReady: boolean
    waveInProgress: boolean
    selected: BuildingId
    gameOver: boolean
  }) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  start() {
    this.setupRenderer()
    this.setupWorld()
    this.attachEvents()
    this.resetRun()
    this.tick()
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.detachEvents()
    this.ro.disconnect()
    this.skyStars?.dispose()
    this.renderer.dispose()
  }

  setSelected(id: BuildingId) {
    this.selected = id
    this.updateGhostForSelected()
    this.emitState()
  }

  setWheelOpen(open: boolean) {
    this.wheelOpen = open
  }

  startNextWave() {
    if (this.isLost) return
    if (!this.waveReady || this.waveInProgress) return
    // Manual trigger is only needed/allowed for the first wave.
    if (this.firstWaveStarted) return
    this.firstWaveStarted = true
    this.wave += 1
    this.waveInProgress = true
    this.waveReady = false
    this.toSpawn = 18 + this.wave * 10
    this.spawnTimer = 0
    this.emitState()
  }

  private resetRun() {
    // Clear state
    for (const b of this.buildings) this.world.remove(b.mesh), this.world.remove(b.healthBar.group)
    for (const a of this.asteroids) this.world.remove(a.mesh), this.world.remove(a.healthBar.group)
    for (const m of this.missiles) this.projectiles.remove(m.mesh)
    for (const b of this.ballistics) this.projectiles.remove(b.mesh)
    this.buildings.length = 0
    this.asteroids.length = 0
    this.missiles.length = 0
    this.ballistics.length = 0
    this.occupied.clear()

    this.isLost = false
    this.credits = 650
    this.powerCap = 20
    this.powerStored = 20
    this.supplyCap = 0
    this.supplyUsed = 0
    this.wave = 0
    this.firstWaveStarted = false
    this.waveInProgress = false
    this.waveReady = true
    this.autoWaveTimer = 0
    this.toSpawn = 0
    this.spawnTimer = 0

    // Place initial command center at grid center.
    const cc = BUILDINGS.find((d) => d.id === 'command_center')!
    this.placeBuilding(cc, -1, -1, true)

    this.emitState()
  }

  private setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.shadowMap.enabled = true

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x030712)
    this.scene.fog = new THREE.Fog(0x050617, 90, 360)

    this.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1400)
    this.camera.position.copy(this.camPos)
    this.camera.lookAt(0, 0, 0)

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(this.canvas)
    this.resize()
  }

  private setupWorld() {
    this.scene.add(this.world)
    this.scene.add(this.projectiles)
    this.scene.add(this.effects)

    // Desert ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220),
      new THREE.MeshStandardMaterial({ color: 0xcbb48a, roughness: 0.98, metalness: 0.0 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.world.add(ground)

    const grid = new THREE.GridHelper(202, 101, 0x8b7a56, 0x6b5d44)
    grid.position.y = 0.01
    this.world.add(grid)

    // Sandy mountains ring just out of bounds
    const mountains = new THREE.Group()
    const mGeo = new THREE.ConeGeometry(6, 22, 6)
    const mMat = new THREE.MeshStandardMaterial({ color: 0xbca57d, roughness: 1 })
    const r = 120
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2
      const peak = new THREE.Mesh(mGeo, mMat)
      peak.position.set(Math.cos(a) * r, 11, Math.sin(a) * r)
      peak.rotation.y = a + Math.random() * 0.6
      peak.scale.setScalar(0.8 + Math.random() * 0.7)
      peak.castShadow = true
      mountains.add(peak)
    }
    this.world.add(mountains)

    // Night sky + stars
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(900, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0x050816, side: THREE.BackSide }),
    )
    this.world.add(sky)

    this.skyStars = this.createStars()
    this.world.add(this.skyStars.obj)

    // Lighting
    this.world.add(new THREE.AmbientLight(0xffffff, 0.18))
    const moon = new THREE.DirectionalLight(0xdbeafe, 0.9)
    moon.position.set(80, 120, 40)
    moon.castShadow = true
    this.world.add(moon)

    // Hover outline + ghost
    const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 0.02, 1.02))
    const outlineMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.95 })
    this.hoverOutline = new THREE.LineSegments(outlineGeo, outlineMat)
    this.hoverOutline.position.set(0, 0.02, 0)
    this.world.add(this.hoverOutline)

    const ghostGeo = new THREE.BoxGeometry(1, 1, 1)
    const ghostMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.25 })
    this.hoverGhost = new THREE.Mesh(ghostGeo, ghostMat)
    this.hoverGhost.castShadow = false
    this.world.add(this.hoverGhost)
    this.updateGhostForSelected()
  }

  private attachEvents() {
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
  }

  private detachEvents() {
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
  }

  private readonly onPointerMove = (e: PointerEvent) => {
    const applyLook = (dx: number, dy: number) => {
      const rotSpeed = 0.0022
      this.yaw -= dx * rotSpeed
      this.pitch -= dy * rotSpeed
      const limit = Math.PI / 2 - 0.18
      this.pitch = Math.max(-limit, Math.min(limit, this.pitch))
    }

    if (!this.hasMousePos) {
      this.hasMousePos = true
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
    } else {
      const dx = this.lookLocked ? e.movementX : e.clientX - this.lastMouseX
      const dy = this.lookLocked ? e.movementY : e.clientY - this.lastMouseY
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
      applyLook(dx, dy)
    }

    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  private readonly onPointerDown = (e: PointerEvent) => {
    if (this.isLost) return
    if (this.wheelOpen) return
    if (document.pointerLockElement !== this.canvas) {
      this.canvas.requestPointerLock()
      return
    }

    if (e.button === 2) {
      this.sellLookedAt()
      return
    }

    if (e.button !== 0) return
    this.updateHover()
    if (!this.hoverValid) return
    const def = BUILDINGS.find((d) => d.id === this.selected)
    if (!def) return
    this.tryPlace(def, this.hoverCell.x, this.hoverCell.z)
  }

  private readonly onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (k === 'w' || k === 'a' || k === 's' || k === 'd' || k === 'q' || k === 'e') this.moveKeys.add(k)
    if (e.key === ' ') this.startNextWave()
  }

  private readonly onKeyUp = (e: KeyboardEvent) => {
    this.moveKeys.delete(e.key.toLowerCase())
  }

  private readonly onPointerLockChange = () => {
    this.lookLocked = document.pointerLockElement === this.canvas
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick)
    const dt = Math.min(0.04, this.clock.getDelta())
    this.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    this.updateCamera(dt)
    this.updateHover()
    this.updateHoverIndicators()
    this.updateResources(dt)
    this.updateWave(dt)
    this.updateAsteroids(dt)
    this.updateDefenses(dt)
    this.updateProjectiles(dt)
    this.updateHealthBars()
    this.emitState()
  }

  private updateCamera(dt: number) {
    const forward = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    )
    const forwardH = new THREE.Vector3(forward.x, 0, forward.z)
    if (forwardH.lengthSq() > 0.000001) forwardH.normalize()
    const rightH = new THREE.Vector3()
    if (forwardH.lengthSq() > 0.000001) rightH.crossVectors(forwardH, new THREE.Vector3(0, 1, 0)).normalize()
    const up = new THREE.Vector3(0, 1, 0)

    const speed = 38
    const move = new THREE.Vector3()
    if (this.moveKeys.has('w')) move.add(forwardH)
    if (this.moveKeys.has('s')) move.sub(forwardH)
    if (this.moveKeys.has('a')) move.sub(rightH)
    if (this.moveKeys.has('d')) move.add(rightH)
    if (this.moveKeys.has('e')) move.add(up)
    if (this.moveKeys.has('q')) move.sub(up)
    if (move.lengthSq() > 0) this.camPos.add(move.normalize().multiplyScalar(speed * dt))

    this.camPos.y = clamp(this.camPos.y, 14, 140)
    this.camPos.x = clamp(this.camPos.x, -170, 170)
    this.camPos.z = clamp(this.camPos.z, -170, 170)

    const lookTarget = new THREE.Vector3().addVectors(this.camPos, forward)
    this.camera.position.copy(this.camPos)
    this.camera.up.copy(up)
    this.camera.lookAt(lookTarget)
  }

  private updateResources(dt: number) {
    let gen = 0
    let drain = 0
    let powerCap = 20
    let supplyCap = 0
    let supplyUsed = 0

    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      const d = b.def
      supplyCap += d.supplyCapAdd ?? 0
      supplyUsed += d.supplyCost
      powerCap += d.powerCapAdd ?? 0
      gen += d.powerGenPerSec ?? 0
      drain += d.powerDrainPerSec ?? 0
    }

    this.supplyCap = supplyCap
    this.supplyUsed = supplyUsed
    this.powerCap = powerCap

    // Structures are offline until first wave begins.
    if (!this.firstWaveStarted) {
      this.powerStored = Math.min(this.powerStored, this.powerCap)
      return
    }

    // Power is a stored resource produced over time and drained by active buildings.
    this.powerStored = clamp(this.powerStored + gen * dt - drain * dt, 0, this.powerCap)

    // Economy payouts (require power to operate if the building has drain and power is empty).
    for (const b of this.buildings) {
      const d = b.def
      if (!d.creditPayout || !d.creditIntervalSec) continue
      if (b.hp <= 0) continue
      // if out of power, pause economy buildings
      if ((d.powerDrainPerSec ?? 0) > 0 && this.powerStored <= 0.001) continue
      b.econTimer += dt
      if (b.econTimer >= d.creditIntervalSec) {
        b.econTimer -= d.creditIntervalSec
        this.credits += d.creditPayout
      }
    }
  }

  private updateWave(dt: number) {
    if (!this.waveInProgress) {
      const clear = this.asteroids.every((a) => !a.alive)
      if (!clear) return
      // Before first wave, wait for Space.
      if (!this.firstWaveStarted) {
        this.waveReady = true
        return
      }
      // After first wave, auto-start subsequent waves.
      this.waveReady = false
      this.autoWaveTimer -= dt
      if (this.autoWaveTimer <= 0) {
        this.wave += 1
        this.waveInProgress = true
        this.toSpawn = 18 + this.wave * 10
        this.spawnTimer = 0
      }
      return
    }

    // spawn
    this.spawnTimer -= dt
    if (this.toSpawn > 0 && this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.08, 0.38 - this.wave * 0.012)
      this.spawnAsteroid()
      this.toSpawn -= 1
    }

    const active = this.asteroids.some((a) => a.alive)
    if (!active && this.toSpawn <= 0) {
      this.waveInProgress = false
      this.waveReady = false
      this.autoWaveTimer = 6
    }
  }

  private spawnAsteroid() {
    const spawnAngle = Math.random() * Math.PI * 2
    const spawnR = 160 + Math.random() * 60
    const start = new THREE.Vector3(Math.cos(spawnAngle) * spawnR, 90 + Math.random() * 30, Math.sin(spawnAngle) * spawnR)

    const tx = Math.round((Math.random() * 2 - 1) * HALF)
    const tz = Math.round((Math.random() * 2 - 1) * HALF)
    const target = new THREE.Vector3(tx, 0, tz)

    const geo = new THREE.DodecahedronGeometry(1.4 + Math.random() * 1.8, 0)
    const mat = new THREE.MeshStandardMaterial({ color: 0x9f1239, emissive: 0x7f1d1d, emissiveIntensity: 0.45, roughness: 0.92 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(start)
    mesh.castShadow = true
    this.world.add(mesh)

    const maxHp = 120 + this.wave * 22
    const hp = maxHp
    const velocity = new THREE.Vector3().subVectors(target, start).normalize().multiplyScalar(18 + this.wave * 0.55)

    const healthBar = this.createHealthBar(2.2, 0.22)
    healthBar.group.position.copy(start).add(new THREE.Vector3(0, 3.1, 0))
    this.world.add(healthBar.group)

    this.asteroids.push({
      mesh,
      healthBar,
      hp,
      maxHp,
      alive: true,
      target,
      velocity,
      impactRadius: 4.6,
      impactDamage: 420 + this.wave * 30,
    })
  }

  private updateAsteroids(dt: number) {
    for (const a of this.asteroids) {
      if (!a.alive) continue
      a.mesh.position.addScaledVector(a.velocity, dt)
      a.mesh.rotation.x += dt * 1.1
      a.mesh.rotation.y += dt * 1.3

      // Shield interception
      const shield = this.getActiveShieldHit(a.mesh.position)
      if (shield) {
        // destroy asteroid and drain extra power based on damage
        a.alive = false
        this.world.remove(a.mesh)
        this.world.remove(a.healthBar.group)
        // extra drain: convert damage into power
        this.powerStored = Math.max(0, this.powerStored - a.impactDamage * 0.02)
        this.spawnExplosion(a.mesh.position, 2.2, 0x38bdf8)
        continue
      }

      const distToTarget = a.mesh.position.distanceTo(a.target)
      if (distToTarget < 2.2 || a.mesh.position.y <= 0.6) {
        // Impact AOE
        a.alive = false
        const impactPos = new THREE.Vector3(a.target.x, 0, a.target.z)
        this.world.remove(a.mesh)
        this.world.remove(a.healthBar.group)
        this.spawnExplosion(impactPos, 3.0, 0xff8a80)
        this.applyAoeDamage(impactPos, a.impactRadius, a.impactDamage)
      }
    }
  }

  private updateDefenses(dt: number) {
    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      const d = b.def

      // Shield: visible bubble + active only if has power
      if (d.kind === 'shield') {
        // nothing else here; interception handled in asteroid update
        continue
      }

      if (!d.range || !d.fireRate || !d.damage) continue
      // if out of power and the building drains power, it pauses
      if ((d.powerDrainPerSec ?? 0) > 0 && this.powerStored <= 0.001) continue

      b.cooldown -= dt
      if (b.cooldown > 0) continue

      const origin = new THREE.Vector3(b.origin.x + (d.size.w - 1) / 2, 1.1, b.origin.z + (d.size.h - 1) / 2)
      let target: Asteroid | null = null
      let best = Infinity
      for (const a of this.asteroids) {
        if (!a.alive) continue
        const dist = origin.distanceTo(a.mesh.position)
        if (dist > d.range) continue
        if (dist < best) {
          best = dist
          target = a
        }
      }
      if (!target) continue

      b.cooldown = 1 / d.fireRate

      if (d.kind === 'hitscan') {
        target.hp -= d.damage
        this.spawnShot(origin, target.mesh.position, d.color)
        if (target.hp <= 0) {
          target.alive = false
          this.world.remove(target.mesh)
          this.world.remove(target.healthBar.group)
          this.spawnExplosion(target.mesh.position, 1.4, 0x38bdf8)
        }
      } else if (d.kind === 'missiles') {
        const burst = d.burst ?? 4
        for (let i = 0; i < burst; i++) {
          this.spawnMissile(origin, target, d)
        }
      } else if (d.kind === 'ballistic') {
        this.spawnBallistic(origin, target.mesh.position, d)
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (const m of [...this.missiles]) {
      m.ttl -= dt
      if (m.ttl <= 0) {
        this.projectiles.remove(m.mesh)
        this.missiles.splice(this.missiles.indexOf(m), 1)
        continue
      }
      const tgt = m.target && m.target.alive ? m.target.mesh.position : null
      if (tgt) {
        const dir = new THREE.Vector3().subVectors(tgt, m.mesh.position).normalize()
        // mild steering
        const vel = dir.multiplyScalar(m.speed)
        m.mesh.position.addScaledVector(vel, dt)
      } else {
        m.mesh.position.y -= dt * 20
      }
      m.mesh.rotation.y += dt * 8

      const hit = m.target && m.target.alive ? m.mesh.position.distanceTo(m.target.mesh.position) < 1.2 : false
      if (hit) {
        this.explodeAt(m.mesh.position, m.aoeRadius, m.damage, 0xffb703)
        this.projectiles.remove(m.mesh)
        this.missiles.splice(this.missiles.indexOf(m), 1)
      }
    }

    for (const b of [...this.ballistics]) {
      b.t += dt
      const t = clamp(b.t / b.duration, 0, 1)
      // simple arc
      const p = new THREE.Vector3().lerpVectors(b.start, b.end, t)
      const arc = Math.sin(Math.PI * t) * 28
      p.y += arc
      b.mesh.position.copy(p)
      b.mesh.rotation.y += dt * 2
      if (t >= 1) {
        this.explodeAt(b.end, b.aoeRadius, b.damage, 0xff4d6d)
        this.projectiles.remove(b.mesh)
        this.ballistics.splice(this.ballistics.indexOf(b), 1)
      }
    }

    this.updateProjectilesAndEffects(dt)
  }

  private explodeAt(pos: THREE.Vector3, radius: number, damage: number, color: number) {
    this.spawnExplosion(pos, Math.max(2.2, radius * 0.75), color)
    // Damage asteroids
    for (const a of this.asteroids) {
      if (!a.alive) continue
      const dist = a.mesh.position.distanceTo(pos)
      if (dist > radius) continue
      const falloff = 1 - dist / radius
      a.hp -= damage * (0.45 + 0.55 * falloff)
      if (a.hp <= 0) {
        a.alive = false
        this.world.remove(a.mesh)
        this.world.remove(a.healthBar.group)
      }
    }
  }

  private applyAoeDamage(pos: THREE.Vector3, radius: number, damage: number) {
    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      // approximate building center
      const cx = b.origin.x + (b.def.size.w - 1) / 2
      const cz = b.origin.z + (b.def.size.h - 1) / 2
      const dist = Math.hypot(cx - pos.x, cz - pos.z)
      if (dist > radius) continue
      const falloff = 1 - dist / radius
      b.hp -= damage * (0.35 + 0.65 * falloff)
      if (b.hp <= 0) {
        b.hp = 0
        this.destroyBuilding(b)
      }
    }

    // lose if all command centers dead
    const anyCC = this.buildings.some((b) => b.hp > 0 && b.defId === 'command_center')
    if (!anyCC) this.isLost = true
  }

  private destroyBuilding(b: PlacedBuilding) {
    this.world.remove(b.mesh)
    this.world.remove(b.healthBar.group)
    // free occupancy
    for (let dz = 0; dz < b.def.size.h; dz++) {
      for (let dx = 0; dx < b.def.size.w; dx++) {
        this.occupied.delete(key(b.origin.x + dx, b.origin.z + dz))
      }
    }
  }

  private sellLookedAt() {
    // raycast from screen center to building meshes
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)
    const candidates: THREE.Object3D[] = this.buildings.filter((b) => b.hp > 0).map((b) => b.mesh)
    const hits = this.raycaster.intersectObjects(candidates, true)
    const hitObj = hits[0]?.object
    if (!hitObj) return
    const top = this.findRootBuildingByObject(hitObj)
    if (!top) return
    if (top.defId === 'command_center') return

    // refund 50% credits and free supply via removing building
    this.credits += Math.floor(top.def.creditCost * 0.5)
    top.hp = 0
    this.destroyBuilding(top)
  }

  private findRootBuildingByObject(obj: THREE.Object3D): PlacedBuilding | null {
    let cur: THREE.Object3D | null = obj
    while (cur) {
      const id = cur.userData?.buildingId
      if (typeof id === 'string') {
        const b = this.buildings.find((bb) => bb.id === id) ?? null
        if (b) return b
      }
      cur = cur.parent
    }
    return null
  }

  private tryPlace(def: BuildingDef, cx: number, cz: number) {
    // center cell -> top-left origin
    const ox = cx - Math.floor(def.size.w / 2)
    const oz = cz - Math.floor(def.size.h / 2)

    // resource checks
    if (this.credits < def.creditCost) return
    if (this.supplyUsed + def.supplyCost > this.supplyCap) return

    // bounds and occupancy
    for (let dz = 0; dz < def.size.h; dz++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        const x = ox + dx
        const z = oz + dz
        if (Math.abs(x) > HALF || Math.abs(z) > HALF) return
        // keep a little buffer for mountains / edge
        if (Math.abs(x) >= HALF - 1 || Math.abs(z) >= HALF - 1) return
        // can't overlap existing
        if (this.occupied.has(key(x, z))) return
      }
    }

    // commit
    this.credits -= def.creditCost
    this.placeBuilding(def, ox, oz, false)
    this.emitState()
  }

  private placeBuilding(def: BuildingDef, ox: number, oz: number, free: boolean) {
    const id = crypto.randomUUID()

    // occupy footprint
    for (let dz = 0; dz < def.size.h; dz++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        this.occupied.set(key(ox + dx, oz + dz), id)
      }
    }

    if (!free) {
      // supply/credits tracked via resource recompute; credits already charged
    } else {
      // free placement (starting CC) still counts for supply cap add
    }

    const mesh = this.createBuildingMesh(def)
    mesh.position.set(ox + (def.size.w - 1) / 2, 0, oz + (def.size.h - 1) / 2)
    mesh.traverse((o) => (o.userData.buildingId = id))
    this.world.add(mesh)

    const hb = this.createHealthBar(Math.max(1.6, def.size.w * 0.9), 0.22)
    hb.group.position.set(mesh.position.x, 3.8 + def.size.h * 0.2, mesh.position.z)
    this.world.add(hb.group)

    // Shield bubble
    if (def.id === 'shield_generator') {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(def.range ?? 12, 26, 18),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.08 }),
      )
      bubble.position.y = 4.0
      mesh.add(bubble)
    }

    const placed: PlacedBuilding = {
      id,
      defId: def.id,
      def,
      origin: { x: ox, z: oz },
      hp: def.maxHp,
      mesh,
      healthBar: hb,
      cooldown: 0,
      econTimer: 0,
    }
    this.buildings.push(placed)
  }

  private createBuildingMesh(def: BuildingDef): THREE.Object3D {
    const group = new THREE.Group()
    const isWeapon = def.category === 'turrets' || def.category === 'missile'
    const baseH = def.id === 'command_center' ? 4.0 : isWeapon ? 2.0 : 2.4
    const geo = new THREE.BoxGeometry(def.size.w, baseH, def.size.h)
    const mat = new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.1, roughness: 0.88 })
    const body = new THREE.Mesh(geo, mat)
    body.position.y = baseH / 2
    body.castShadow = true
    group.add(body)

    // simple turret barrel detail
    if (isWeapon) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 1.6, 10),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.3, roughness: 0.4 }),
      )
      barrel.rotation.z = Math.PI / 2
      barrel.position.set(0, baseH + 0.2, 0.25)
      group.add(barrel)
    }

    return group
  }

  private updateHover() {
    const ndc = this.lookLocked ? new THREE.Vector2(0, 0) : this.pointer
    this.raycaster.setFromCamera(ndc, this.camera)
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.tmpV3)
    if (!hit) {
      this.hoverCell.x = 0
      this.hoverCell.z = 0
      this.hoverValid = false
      return
    }
    const x = Math.round(this.tmpV3.x)
    const z = Math.round(this.tmpV3.z)
    this.hoverCell.x = x
    this.hoverCell.z = z

    const def = BUILDINGS.find((d) => d.id === this.selected)
    if (!def) {
      this.hoverValid = false
      return
    }

    // Use center cell and validate placement
    const ox = x - Math.floor(def.size.w / 2)
    const oz = z - Math.floor(def.size.h / 2)

    if (this.credits < def.creditCost) {
      this.hoverValid = false
      return
    }
    if (this.supplyUsed + def.supplyCost > this.supplyCap) {
      this.hoverValid = false
      return
    }

    for (let dz = 0; dz < def.size.h; dz++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        const cx = ox + dx
        const cz = oz + dz
        if (Math.abs(cx) > HALF || Math.abs(cz) > HALF) return void (this.hoverValid = false)
        if (Math.abs(cx) >= HALF - 1 || Math.abs(cz) >= HALF - 1) return void (this.hoverValid = false)
        if (this.occupied.has(key(cx, cz))) return void (this.hoverValid = false)
      }
    }
    this.hoverValid = true
  }

  private updateHoverIndicators() {
    const def = BUILDINGS.find((d) => d.id === this.selected)
    if (!def) return

    const ox = this.hoverCell.x - Math.floor(def.size.w / 2)
    const oz = this.hoverCell.z - Math.floor(def.size.h / 2)
    // outline shows footprint
    this.hoverOutline.position.set(ox + (def.size.w - 1) / 2, 0.02, oz + (def.size.h - 1) / 2)
    this.hoverOutline.scale.set(def.size.w, 1, def.size.h)

    const mat = this.hoverOutline.material as THREE.LineBasicMaterial
    mat.color.setHex(this.hoverValid ? 0x22d3ee : 0xfb7185)
    mat.opacity = this.hoverValid ? 0.95 : 0.7

    this.hoverGhost.visible = true
    this.hoverGhost.position.set(this.hoverOutline.position.x, 0, this.hoverOutline.position.z)
    this.hoverGhost.scale.set(def.size.w, 1, def.size.h)
    const gmat = this.hoverGhost.material as THREE.MeshStandardMaterial
    gmat.color.setHex(def.color)
    gmat.opacity = this.hoverValid ? 0.22 : 0.1
  }

  private updateGhostForSelected() {
    // ghost is a box; scale handled in indicator update
  }

  private createHealthBar(width: number, height: number): HealthBar {
    const group = new THREE.Group()
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.8 }),
    )
    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.08, height - 0.08),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.95 }),
    )
    bg.renderOrder = 60
    fill.renderOrder = 61
    group.add(bg)
    group.add(fill)
    return { group, fill, bg }
  }

  private setHealthBar(bar: HealthBar, hp: number, maxHp: number) {
    const t = Math.max(0, Math.min(1, maxHp <= 0 ? 0 : hp / maxHp))
    bar.fill.scale.x = t
    bar.fill.position.x = (t - 1) * 0.5
    const mat = bar.fill.material as THREE.MeshBasicMaterial
    mat.color.setHex(t > 0.6 ? 0x22c55e : t > 0.3 ? 0xf59e0b : 0xef4444)
    // Slight fade when dead
    ;(bar.bg.material as THREE.MeshBasicMaterial).opacity = hp <= 0 ? 0 : 0.8
    mat.opacity = hp <= 0 ? 0 : 0.95
  }

  private updateHealthBars() {
    for (const b of this.buildings) {
      this.setHealthBar(b.healthBar, b.hp, b.def.maxHp)
      b.healthBar.group.position.set(
        b.origin.x + (b.def.size.w - 1) / 2,
        4.2 + b.def.size.h * 0.2,
        b.origin.z + (b.def.size.h - 1) / 2,
      )
      b.healthBar.group.quaternion.copy(this.camera.quaternion)
    }
    for (const a of this.asteroids) {
      if (!a.alive) continue
      this.setHealthBar(a.healthBar, a.hp, a.maxHp)
      a.healthBar.group.position.copy(a.mesh.position).add(new THREE.Vector3(0, 3.1, 0))
      a.healthBar.group.quaternion.copy(this.camera.quaternion)
    }
  }

  private spawnShot(from: THREE.Vector3, to: THREE.Vector3, color: number) {
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 })
    const geo = new THREE.BufferGeometry().setFromPoints([from, to])
    const line = new THREE.Line(geo, mat)
    line.userData.life = 0.06
    this.effects.add(line)
  }

  private spawnExplosion(at: THREE.Vector3, size: number, color: number) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 12, 9),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28 }),
    )
    mesh.position.copy(at)
    mesh.userData.life = 0.35
    this.effects.add(mesh)
  }

  private spawnMissile(origin: THREE.Vector3, target: Asteroid, def: BuildingDef) {
    const geo = new THREE.ConeGeometry(0.15, 0.7, 10)
    const mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, emissive: 0xf59e0b, emissiveIntensity: 0.4 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(origin)
    mesh.position.y += 0.5
    mesh.rotation.x = Math.PI / 2
    mesh.castShadow = true
    this.projectiles.add(mesh)
    this.missiles.push({
      mesh,
      target,
      speed: def.projectileSpeed ?? 24,
      ttl: 4.5,
      damage: def.damage ?? 30,
      aoeRadius: def.aoeRadius ?? 3,
    })
  }

  private spawnBallistic(origin: THREE.Vector3, targetPos: THREE.Vector3, def: BuildingDef) {
    const geo = new THREE.CylinderGeometry(0.22, 0.22, 1.2, 10)
    const mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, emissive: 0xef4444, emissiveIntensity: 0.35 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(origin)
    mesh.position.y += 0.8
    mesh.castShadow = true
    this.projectiles.add(mesh)

    this.ballistics.push({
      mesh,
      start: mesh.position.clone(),
      end: new THREE.Vector3(targetPos.x, 0, targetPos.z),
      t: 0,
      duration: 3.2,
      damage: def.damage ?? 800,
      aoeRadius: def.aoeRadius ?? 10,
    })
  }

  private updateProjectilesAndEffects(dt: number) {
    for (const c of [...this.effects.children]) {
      c.userData.life -= dt
      if (c.userData.life <= 0) {
        if (c instanceof THREE.Line) {
          c.geometry.dispose()
          ;(c.material as THREE.Material).dispose()
        } else if (c instanceof THREE.Mesh) {
          c.geometry.dispose()
          ;(c.material as THREE.Material).dispose()
        }
        this.effects.remove(c)
      } else if (c instanceof THREE.Mesh) {
        c.scale.multiplyScalar(1 + dt * 2.3)
        const m = c.material as THREE.MeshBasicMaterial
        m.opacity = Math.max(0, m.opacity - dt * 0.9)
      }
    }
  }

  private getActiveShieldHit(pos: THREE.Vector3): PlacedBuilding | null {
    // shield is active only if powerStored > 0 (we already drained constant in resource update)
    if (this.powerStored <= 0.001) return null
    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      if (b.defId !== 'shield_generator') continue
      const radius = b.def.range ?? 12
      const cx = b.origin.x + (b.def.size.w - 1) / 2
      const cz = b.origin.z + (b.def.size.h - 1) / 2
      const dist = Math.hypot(pos.x - cx, pos.z - cz)
      if (dist <= radius) return b
    }
    return null
  }

  private createStars() {
    const geo = new THREE.BufferGeometry()
    const count = 1600
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 520 + Math.random() * 340
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * r
      pos[i * 3 + 1] = Math.cos(phi) * r * 0.65
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true })
    const points = new THREE.Points(geo, mat)
    return {
      obj: points,
      dispose() {
        geo.dispose()
        mat.dispose()
      },
    }
  }

  private emitState() {
    this.onStateChange?.({
      credits: Math.floor(this.credits),
      supplyUsed: Math.floor(this.supplyUsed),
      supplyCap: Math.floor(this.supplyCap),
      powerStored: Math.floor(this.powerStored),
      powerCap: Math.floor(this.powerCap),
      wave: this.wave,
      waveReady: this.waveReady,
      waveInProgress: this.waveInProgress,
      selected: this.selected,
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

