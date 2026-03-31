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
  builtInInactivePhase: number
  hp: number
  mesh: THREE.Object3D
  healthBar: HealthBar
  refundSprite?: THREE.Sprite
  cooldown: number
  econTimer: number
}

type WeaponAim = {
  yaw?: THREE.Object3D
  pitch?: THREE.Object3D
  muzzle?: THREE.Object3D
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

export type UpgradeId =
  | 'core_protocol'
  | 'unlock_factory'
  | 'unlock_megacomplex'
  | 'turret_targeting'
  | 'generator_efficiency'

type BuildingModifier = {
  rangeAdd?: number
  damageAdd?: number
  fireRateMul?: number
  creditPayoutMul?: number
  powerGenMul?: number
}

export type UpgradeDef = {
  id: UpgradeId
  label: string
  category: BuildingCategory
  creditCost: number
  description: string
  prereqIds?: UpgradeId[]
  unlockBuildingIds?: BuildingId[]
  modifiers?: Partial<Record<BuildingId, BuildingModifier>>
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

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'core_protocol',
    label: 'Core Protocol',
    category: 'structural',
    creditCost: 0,
    description: 'Starting upgrade. Unlocks adjacent branches in the skill tree.',
  },
  {
    id: 'unlock_factory',
    label: 'Unlock Factory Tier',
    category: 'economy',
    creditCost: 550,
    description: 'Unlocks the Factory building.',
    unlockBuildingIds: ['factory_factory'],
  },
  {
    id: 'unlock_megacomplex',
    label: 'Unlock Mega-Complex',
    category: 'economy',
    creditCost: 1200,
    description: 'Unlocks the Mega-Complex building.',
    prereqIds: ['unlock_factory'],
    unlockBuildingIds: ['factory_megacomplex'],
  },
  {
    id: 'turret_targeting',
    label: 'Turret Targeting Suite',
    category: 'turrets',
    creditCost: 700,
    description: 'Auto-Turret and Siege Cannon gain range and damage.',
    modifiers: {
      auto_turret: { rangeAdd: 5, damageAdd: 2 },
      siege_cannon: { rangeAdd: 10, damageAdd: 30 },
    },
  },
  {
    id: 'generator_efficiency',
    label: 'Generator Efficiency',
    category: 'electrical',
    creditCost: 480,
    description: 'Generators produce 25% more power.',
    modifiers: {
      generator_small: { powerGenMul: 1.25 },
      generator_large: { powerGenMul: 1.25 },
    },
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
  private readonly tmpAimVec = new THREE.Vector3()
  private readonly tmpAimPos = new THREE.Vector3()

  // Camera controls
  private camPos = new THREE.Vector3(0, 55, 70)
  private yaw = Math.PI
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
  private toSpawn = 0
  private spawnTimer = 0

  // Active/Inactive wave lifecycle.
  // Active:
  // - spawn window: timer counts down while enemies spawn (circle fills on UI)
  // - cleanup: spawning stops when timer ends; wave continues until asteroids are destroyed
  // Inactive:
  // - lasts up to 60s (UI shows timer); player can press Space early to start next wave
  private spawnWindowDurationSec = 0
  private spawnWindowElapsedSec = 0
  private spawnWindowEnded = false
  private inactiveTimeLeftSec = 0
  private readonly inactiveDurationSec = 60
  private currentInactivePhase = 0
  private readonly purchasedUpgradeIds = new Set<UpgradeId>()
  private readonly purchasedUpgradePhase = new Map<UpgradeId, number>()
  private readonly unlockedBuildingIds = new Set<BuildingId>([
    'command_center',
    'supply_depot',
    'factory_business',
    'generator_small',
    'generator_large',
    'battery',
    'auto_turret',
    'siege_cannon',
    'missile_launcher',
    'silo',
    'shield_generator',
  ])

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
  private refundSpriteMap?: THREE.Texture

  onStateChange?: (state: {
    credits: number
    supplyUsed: number
    supplyCap: number
    powerStored: number
    powerCap: number
    wave: number
    waveReady: boolean
    waveInProgress: boolean
    waveSpawnProgress: number
    waveSpawnEnded: boolean
    inactiveTimeLeftSec: number
    asteroidsRemaining: number
    unlockedBuildingIds: BuildingId[]
    purchasedUpgradeIds: UpgradeId[]
    refundableUpgradeIds: UpgradeId[]
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

  purchaseUpgrade(id: UpgradeId) {
    if (this.isLost) return
    const up = UPGRADES.find((u) => u.id === id)
    if (!up) return
    if (this.purchasedUpgradeIds.has(id)) return
    if (this.credits < up.creditCost) return

    this.credits -= up.creditCost
    this.purchasedUpgradeIds.add(id)
    this.purchasedUpgradePhase.set(id, this.currentInactivePhase)
    this.recomputeUnlockedBuildingIds()
    this.emitState()
  }

  refundUpgrade(id: UpgradeId) {
    if (this.isLost || this.waveInProgress) return
    if (id === 'core_protocol') return
    if (!this.purchasedUpgradeIds.has(id)) return
    const phase = this.purchasedUpgradePhase.get(id)
    if (phase !== this.currentInactivePhase) return
    const up = UPGRADES.find((u) => u.id === id)
    if (!up) return

    this.credits += up.creditCost
    this.purchasedUpgradeIds.delete(id)
    this.purchasedUpgradePhase.delete(id)
    this.recomputeUnlockedBuildingIds()

    if (!this.unlockedBuildingIds.has(this.selected)) {
      const fallback = BUILDINGS.find((b) => this.unlockedBuildingIds.has(b.id))
      if (fallback) {
        this.selected = fallback.id
        this.updateGhostForSelected()
      }
    }
    this.emitState()
  }

  startNextWave(manual: boolean = true) {
    if (this.isLost) return

    // Can't start while a wave is active.
    if (this.waveInProgress) return

    // Avoid starting while asteroids are still alive.
    const asteroidsClear = this.asteroids.every((a) => !a.alive)
    if (!asteroidsClear) return

    // First wave can always be started manually.
    if (!this.firstWaveStarted) {
      if (!manual) return
      this.firstWaveStarted = true
    }

    // During inactive: allow manual early-start with Space, or auto-start at the end.
    if (this.firstWaveStarted && this.wave > 0) {
      if (manual) {
        if (this.inactiveTimeLeftSec <= 0) return
      } else {
        if (this.inactiveTimeLeftSec > 0) return
      }
    }

    this.currentInactivePhase += 1
    this.wave += 1
    this.waveInProgress = true
    this.waveReady = false

    this.spawnWindowEnded = false
    this.spawnWindowElapsedSec = 0
    this.toSpawn = 18 + this.wave * 10
    this.spawnTimer = 0

    // Approximate how long spawning will last so the UI circle matches the spawn window.
    const spawnInterval = Math.max(0.08, 0.38 - this.wave * 0.012)
    this.spawnWindowDurationSec = Math.max(6, this.toSpawn * spawnInterval)
    this.inactiveTimeLeftSec = 0

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
    this.toSpawn = 0
    this.spawnTimer = 0
    this.spawnWindowDurationSec = 0
    this.spawnWindowElapsedSec = 0
    this.spawnWindowEnded = false
    this.inactiveTimeLeftSec = 0
    this.currentInactivePhase = 0
    this.purchasedUpgradeIds.clear()
    this.purchasedUpgradeIds.add('core_protocol')
    this.purchasedUpgradePhase.clear()
    this.purchasedUpgradePhase.set('core_protocol', -1)
    this.recomputeUnlockedBuildingIds()

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
    this.scene.fog = new THREE.Fog(0x05070f, 80, 320)

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

    // Generic dark ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(101, 101),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95, metalness: 0.02 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.world.add(ground)

    // 101 cells at 1 unit each: lines at half-cell boundaries align to integer cell centers.
    const grid = new THREE.GridHelper(101, 101, 0x1e3a8a, 0x1e293b)
    grid.position.y = 0.01
    this.world.add(grid)

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
      // Keep gameplay camera fixed while the wheel UI is open.
      if (!this.wheelOpen) applyLook(dx, dy)
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

    // During active waves, building placement and selling are disabled.
    if (this.waveInProgress) return

    if (e.button === 2) {
      this.sellLookedAt()
      return
    }

    if (e.button !== 0) return
    this.updateHover()
    if (!this.hoverValid) return
    const def = this.getEffectiveDef(this.selected)
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
    // Prevent large jumps when pointer lock is toggled (e.g., interacting with UI).
    this.hasMousePos = false
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick)
    const dt = Math.min(0.04, this.clock.getDelta())
    this.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    this.updateCamera(dt)
    if (!this.waveInProgress && !this.wheelOpen) {
      this.updateHover()
      this.updateHoverIndicators()
    } else {
      this.hoverValid = false
      if (this.hoverGhost) this.hoverGhost.visible = false
    }
    this.updateResources(dt)
    this.updateWave(dt)
    this.updateAsteroids(dt)
    this.updateDefenses(dt)
    this.updateProjectiles(dt)
    this.updateHealthBars()
    this.updateRefundSprites()
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

    // Allow the player camera to dip closer to the ground for building inspection.
    this.camPos.y = clamp(this.camPos.y, 6, 140)
    this.camPos.x = clamp(this.camPos.x, -170, 170)
    this.camPos.z = clamp(this.camPos.z, -170, 170)

    const lookTarget = new THREE.Vector3().addVectors(this.camPos, forward)
    this.camera.position.copy(this.camPos)
    this.camera.up.copy(up)
    this.camera.lookAt(lookTarget)
  }

  private getBaseDef(id: BuildingId): BuildingDef | undefined {
    return BUILDINGS.find((d) => d.id === id)
  }

  private getEffectiveDef(id: BuildingId): BuildingDef | undefined {
    const base = this.getBaseDef(id)
    if (!base) return undefined
    const out: BuildingDef = { ...base }
    for (const upId of this.purchasedUpgradeIds) {
      const up = UPGRADES.find((u) => u.id === upId)
      const mod = up?.modifiers?.[id]
      if (!mod) continue
      if (mod.rangeAdd) out.range = (out.range ?? 0) + mod.rangeAdd
      if (mod.damageAdd) out.damage = (out.damage ?? 0) + mod.damageAdd
      if (mod.fireRateMul) out.fireRate = (out.fireRate ?? 0) * mod.fireRateMul
      if (mod.creditPayoutMul) out.creditPayout = (out.creditPayout ?? 0) * mod.creditPayoutMul
      if (mod.powerGenMul) out.powerGenPerSec = (out.powerGenPerSec ?? 0) * mod.powerGenMul
    }
    return out
  }

  private updateResources(dt: number) {
    let gen = 0
    let drain = 0
    let powerCap = 20
    let supplyCap = 0
    let supplyUsed = 0

    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      const d = this.getEffectiveDef(b.defId) ?? b.def
      supplyCap += d.supplyCapAdd ?? 0
      supplyUsed += d.supplyCost
      powerCap += d.powerCapAdd ?? 0
      gen += d.powerGenPerSec ?? 0
      drain += d.powerDrainPerSec ?? 0
    }

    this.supplyCap = supplyCap
    this.supplyUsed = supplyUsed
    this.powerCap = powerCap

    // Building jobs only run during ACTIVE waves.
    // Inactive phase: no economy payouts and no power production/drain ticking.
    if (!this.waveInProgress) {
      this.powerStored = Math.min(this.powerStored, this.powerCap)
      return
    }

    // Power is a stored resource produced over time and drained by active buildings.
    this.powerStored = clamp(this.powerStored + gen * dt - drain * dt, 0, this.powerCap)

    // Economy payouts (require power to operate if the building has drain and power is empty).
    for (const b of this.buildings) {
      const d = this.getEffectiveDef(b.defId) ?? b.def
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
    const asteroidsAlive = this.asteroids.some((a) => a.alive)

    // ACTIVE: spawn + cleanup until asteroids are gone.
    if (this.waveInProgress) {
      this.spawnWindowElapsedSec += dt

      // When the spawn timer ends, stop spawning but keep the wave active
      // until all existing asteroids are destroyed.
      if (!this.spawnWindowEnded && this.spawnWindowElapsedSec >= this.spawnWindowDurationSec) {
        this.spawnWindowEnded = true
        this.toSpawn = 0
      }

      if (!this.spawnWindowEnded && this.toSpawn > 0) {
        this.spawnTimer -= dt
        if (this.spawnTimer <= 0) {
          const spawnInterval = Math.max(0.08, 0.38 - this.wave * 0.012)
          this.spawnTimer = spawnInterval
          this.spawnAsteroid()
          this.toSpawn -= 1
        }
      }

      // Cleanup end condition: no asteroids remain.
      if (!asteroidsAlive && (this.spawnWindowEnded || this.toSpawn <= 0)) {
        this.waveInProgress = false
        this.waveReady = true
        this.inactiveTimeLeftSec = this.inactiveDurationSec
        this.spawnWindowEnded = false
        this.spawnWindowDurationSec = 0
        this.spawnWindowElapsedSec = 0
        this.emitState()
      }
      return
    }

    // INACTIVE
    if (!this.firstWaveStarted) {
      this.waveReady = true
      return
    }

    // If there are still asteroids alive, don't start the timer yet.
    if (asteroidsAlive) return

    this.waveReady = this.inactiveTimeLeftSec > 0
    this.inactiveTimeLeftSec -= dt
    if (this.inactiveTimeLeftSec <= 0) {
      this.inactiveTimeLeftSec = 0
      // Auto-start at the end of the 1-minute inactive window.
      this.startNextWave(false)
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
    // Defenses are inactive outside ACTIVE waves.
    if (!this.waveInProgress) return

    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      const d = this.getEffectiveDef(b.defId) ?? b.def

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

      const baseOrigin = new THREE.Vector3(b.origin.x + (d.size.w - 1) / 2, 1.1, b.origin.z + (d.size.h - 1) / 2)
      const aim = (b.mesh.userData as any)?.aim as WeaponAim | undefined

      let target: Asteroid | null = null
      let best = Infinity
      for (const a of this.asteroids) {
        if (!a.alive) continue
        const dist = baseOrigin.distanceTo(a.mesh.position)
        if (dist > d.range) continue
        if (dist < best) {
          best = dist
          target = a
        }
      }
      if (!target) continue

      b.cooldown = 1 / d.fireRate
      const origin = baseOrigin.clone()
      if (aim?.muzzle) origin.copy(aim.muzzle.getWorldPosition(this.tmpAimPos))

      if (aim?.yaw && aim?.pitch) {
        // Horizontal yaw (around +Y) points the turret toward the target.
        const yawObj = aim.yaw
        yawObj.getWorldPosition(this.tmpAimPos)
        this.tmpAimVec.copy(target.mesh.position).sub(this.tmpAimPos)
        const yaw = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
        yawObj.rotation.y = yaw

        // Barrel pitch (up/down) pitches toward the target's elevation.
        const pitchDist = Math.hypot(this.tmpAimVec.x, this.tmpAimVec.z)
        const pitch = Math.atan2(this.tmpAimVec.y, pitchDist)
        // Sign is flipped because of the barrel's base orientation in the composed meshes.
        const limit = Math.PI / 3
        aim.pitch.rotation.x = -clamp(pitch, -limit, limit)
      } else if (aim?.yaw) {
        const yawObj = aim.yaw
        yawObj.getWorldPosition(this.tmpAimPos)
        this.tmpAimVec.copy(target.mesh.position).sub(this.tmpAimPos)
        const yaw = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
        yawObj.rotation.y = yaw
      }

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

    // 100% refund for buildings placed this inactive phase, otherwise 50%.
    const fullRefund = !this.waveInProgress && top.builtInInactivePhase === this.currentInactivePhase
    this.credits += fullRefund ? top.def.creditCost : Math.floor(top.def.creditCost * 0.5)
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
    if (!this.unlockedBuildingIds.has(def.id)) return
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

    let refundSprite: THREE.Sprite | undefined
    if (!free) {
      refundSprite = this.createRefundSprite()
      refundSprite.position.set(0, 3.3 + def.size.h * 0.25, 0)
      mesh.add(refundSprite)
    }

    // Shield bubble
    if (def.id === 'shield_generator') {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(def.range ?? 12, 26, 18),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.08 }),
      )
      const anchor = (mesh.userData as any)?.shieldBubbleAnchor as THREE.Object3D | undefined
      if (anchor) {
        anchor.add(bubble)
        bubble.position.set(0, 0, 0)
      } else {
        bubble.position.y = 4.0
        mesh.add(bubble)
      }
    }

    const placed: PlacedBuilding = {
      id,
      defId: def.id,
      def,
      origin: { x: ox, z: oz },
      builtInInactivePhase: free ? -1 : this.currentInactivePhase,
      hp: def.maxHp,
      mesh,
      healthBar: hb,
      refundSprite,
      cooldown: 0,
      econTimer: 0,
    }
    this.buildings.push(placed)
  }

  private updateRefundSprites() {
    for (const b of this.buildings) {
      if (!b.refundSprite || b.hp <= 0) continue
      b.refundSprite.visible = !this.waveInProgress && b.builtInInactivePhase === this.currentInactivePhase
    }
  }

  private createRefundSprite(): THREE.Sprite {
    if (!this.refundSpriteMap) this.refundSpriteMap = this.createRefundSpriteTexture()
    const mat = new THREE.SpriteMaterial({ map: this.refundSpriteMap, transparent: true, depthWrite: false })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(1.2, 1.2, 1)
    return sprite
  }

  private createRefundSpriteTexture(): THREE.Texture {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.76)'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size * 0.34, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)'
    ctx.lineWidth = 6
    ctx.stroke()

    ctx.fillStyle = '#eab308'
    ctx.font = 'bold 66px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('$', size / 2, size / 2 + 1)

    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }

  private createBuildingMesh(def: BuildingDef): THREE.Object3D {
    const group = new THREE.Group()
    const aim: WeaponAim = {}

    const mkMat = (color: number, metalness = 0.1, roughness = 0.88) =>
      new THREE.MeshStandardMaterial({ color, metalness, roughness })
    const mkEmat = (color: number, intensity = 0.35, roughness = 0.45) =>
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: intensity, roughness })

    const metalDark = mkMat(def.color, 0.08, 0.95)
    const glass = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.14,
      metalness: 0.0,
      roughness: 0.1,
      emissive: def.color,
      emissiveIntensity: 0.22,
    })

    const w = def.size.w
    const h = def.size.h

    const addBase = (baseH: number, bodyColor = def.color) => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, baseH, h), mkMat(bodyColor, 0.14, 0.88))
      body.position.y = baseH / 2
      body.castShadow = true
      group.add(body)
      return { baseH, body }
    }

    if (def.id === 'command_center') {
      const { baseH } = addBase(3.4, def.color)
      // bunker lip
      const lip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.18, h * 0.98), mkMat(0x0b1220, 0.02, 0.95))
      lip.position.y = baseH + 0.09
      group.add(lip)
      // central core
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 2.2, 14), mkEmat(def.color, 0.55, 0.35))
      core.position.set(0, baseH + 1.1, 0)
      group.add(core)
      const coreTop = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), mkEmat(0x22d3ee, 0.8, 0.25))
      coreTop.position.set(0, baseH + 2.2, 0)
      group.add(coreTop)

      // antenna
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 10), mkMat(0xe2e8f0, 0.25, 0.5))
      ant.position.set(0, baseH + 2.65, 0)
      group.add(ant)
      return group
    }

    if (def.id === 'supply_depot') {
      const { baseH } = addBase(1.9, def.color)
      // stacks of crates
      const crateMat = mkMat(0x9ca3af, 0.06, 0.92)
      const stackW = w * 0.35
      const stackD = h * 0.35
      for (let r = -1; r <= 1; r += 2) {
        for (let s = -1; s <= 1; s += 2) {
          const crate = new THREE.Mesh(new THREE.BoxGeometry(stackW, 0.6, stackD), crateMat)
          crate.position.set(r * w * 0.2, 0.65 + r * 0.0, s * h * 0.2)
          group.add(crate)
        }
      }
      // conveyor plates
      const plate = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.06, h * 0.92), mkMat(0x0b1220, 0.02, 0.95))
      plate.position.y = baseH + 0.03
      group.add(plate)
      return group
    }

    if (def.id === 'factory_business' || def.id === 'factory_factory' || def.id === 'factory_megacomplex') {
      const tiers = def.id === 'factory_business' ? 1 : def.id === 'factory_factory' ? 2 : 3
      const baseH = 2.2 + tiers * 0.45
      const { body } = addBase(baseH, def.color)
      // stacked decks
      const deckCount = tiers
      for (let i = 0; i < deckCount; i++) {
        const deckT = 0.18
        const deckSizeX = w * (0.78 - i * 0.08)
        const deckSizeZ = h * (0.78 - i * 0.08)
        const deck = new THREE.Mesh(new THREE.BoxGeometry(deckSizeX, deckT, deckSizeZ), metalDark)
        deck.position.y = 0.9 + i * (0.7 + (tiers * 0.07))
        group.add(deck)
      }
      // chimney stacks
      const stackMat = mkMat(0xe2e8f0, 0.2, 0.55)
      for (let i = 0; i < tiers; i++) {
        const sx = (i - (tiers - 1) / 2) * (w * 0.18)
        const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.0 + tiers * 0.2, 12), stackMat)
        chimney.position.set(sx, baseH + 0.2 + i * 0.1, 0)
        group.add(chimney)
      }
      // small emitter light
      ;(body.material as THREE.MeshStandardMaterial).emissive.setHex(def.color)
      return group
    }

    if (def.id === 'generator_small' || def.id === 'generator_large') {
      const isLarge = def.id === 'generator_large'
      const baseH = isLarge ? 2.8 : 2.1
      addBase(baseH, def.color)

      // central generator core
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(isLarge ? 0.35 : 0.27, isLarge ? 0.45 : 0.33, isLarge ? 1.7 : 1.2, 14),
        mkEmat(0xeab308, isLarge ? 0.55 : 0.42, 0.3),
      )
      core.position.set(0, baseH + (isLarge ? 0.85 : 0.6), 0)
      group.add(core)

      // side vents
      const ventMat = mkMat(0x0b1220, 0.02, 0.95)
      const ventCount = isLarge ? 4 : 2
      for (let i = 0; i < ventCount; i++) {
        const a = (i / ventCount) * Math.PI * 2
        const vx = Math.sin(a) * w * 0.25
        const vz = Math.cos(a) * h * 0.25
        const vent = new THREE.Mesh(new THREE.BoxGeometry(isLarge ? 0.55 : 0.4, 0.18, isLarge ? 0.12 : 0.1), ventMat)
        vent.position.set(vx, baseH + 0.3, vz)
        group.add(vent)
      }
      if (isLarge) {
        // tall tower fins
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.4, 10), mkMat(0xe2e8f0, 0.25, 0.5))
        tower.position.set(0, baseH + 1.2, 0)
        group.add(tower)
      }
      return group
    }

    if (def.id === 'battery') {
      const baseH = 1.5
      addBase(baseH, def.color)
      // cell grid
      const cellMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.05,
        roughness: 0.85,
        emissive: def.color,
        emissiveIntensity: 0.18,
      })
      const count = 2
      const cellW = w / count
      const cellD = h / count
      for (let ix = 0; ix < count; ix++) {
        for (let iz = 0; iz < count; iz++) {
          const cell = new THREE.Mesh(new THREE.BoxGeometry(cellW * 0.7, 0.35, cellD * 0.7), cellMat)
          cell.position.set(-w / 2 + cellW * (ix + 0.5), 0.75, -h / 2 + cellD * (iz + 0.5))
          group.add(cell)
        }
      }
      // terminals
      const term = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.12), mkMat(0xe2e8f0, 0.25, 0.5))
      term.position.set(0, baseH + 0.35, h * 0.28)
      group.add(term)
      return group
    }

    // Weapons with aiming + muzzle
    if (def.id === 'auto_turret' || def.id === 'siege_cannon' || def.id === 'missile_launcher' || def.id === 'silo') {
      const isAuto = def.id === 'auto_turret'
      const isSiege = def.id === 'siege_cannon'
      const isMissile = def.id === 'missile_launcher'
      const isSilo = def.id === 'silo'
      const baseH = isSilo ? 1.0 : 2.0

      if (isSilo) {
        // circular low base
        const radius = Math.max(w, h) * 0.5
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * 0.98, radius * 1.02, 0.95, 18),
          mkMat(def.color, 0.12, 0.9),
        )
        base.position.y = 0.48
        base.castShadow = true
        group.add(base)

        // concrete ring bands
        for (let i = 0; i < 3; i++) {
          const ring = new THREE.Mesh(new THREE.CylinderGeometry(radius * (0.76 - i * 0.1), radius * (0.82 - i * 0.1), 0.08, 18), mkMat(0x0b1220, 0.02, 0.95))
          ring.position.y = 0.52 + i * 0.1
          group.add(ring)
        }

        const missile = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.22, 2.7, 14),
          mkMat(0xe2e8f0, 0.25, 0.45),
        )
        missile.position.set(0, 1.05 + 1.35, 0)
        missile.castShadow = true
        group.add(missile)

        const tip = new THREE.Mesh(
          new THREE.ConeGeometry(0.22, 0.45, 12),
          mkEmat(def.color, 0.65, 0.25),
        )
        tip.position.set(0, 1.05 + 2.7 + 0.22, 0)
        group.add(tip)

        const muzzle = new THREE.Object3D()
        muzzle.position.set(0, 1.05 + 2.7 + 0.45, 0)
        group.add(muzzle)
        aim.muzzle = muzzle
        group.userData.aim = aim
        return group
      }

      // Square-ish base for turrets/launchers
      const { baseH: builtBaseH } = addBase(baseH, def.color)

      const yawPivot = new THREE.Group()
      yawPivot.position.set(0, builtBaseH + 0.28, 0)
      group.add(yawPivot)

      if (isAuto) {
        const turretBody = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.22, h * 0.86), metalDark)
        turretBody.position.y = 0.12
        yawPivot.add(turretBody)

        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.24, 12), mkEmat(def.color, 0.55, 0.25))
        core.position.set(0, 0.28, 0)
        yawPivot.add(core)

        const barrelPivot = new THREE.Group()
        barrelPivot.position.set(0, 0.16, 0)
        yawPivot.add(barrelPivot)

        const barrelLen = 1.8
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.09, barrelLen, 12),
          mkMat(0xe2e8f0, 0.28, 0.42),
        )
        barrel.rotation.x = Math.PI / 2 // axis along +Z
        barrel.position.set(0, 0, barrelLen / 2)
        barrel.castShadow = true
        barrelPivot.add(barrel)

        const muzzle = new THREE.Object3D()
        muzzle.position.set(0, 0, barrelLen)
        barrelPivot.add(muzzle)

        aim.yaw = yawPivot
        aim.pitch = barrelPivot
        aim.muzzle = muzzle
        group.userData.aim = aim
        return group
      }

      if (isSiege) {
        const turretBody = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.24, h * 0.98), metalDark)
        turretBody.position.y = 0.14
        yawPivot.add(turretBody)

        const armor = new THREE.Mesh(new THREE.BoxGeometry(w * 0.68, 0.12, h * 0.68), mkMat(0x0b1220, 0.02, 0.95))
        armor.position.set(0, 0.25, 0)
        yawPivot.add(armor)

        const barrelPivot = new THREE.Group()
        barrelPivot.position.set(0, 0.18, 0)
        yawPivot.add(barrelPivot)

        const barrelLen = 2.6
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, barrelLen, 14), mkMat(0xe2e8f0, 0.28, 0.42))
        barrel.rotation.x = Math.PI / 2
        barrel.position.set(0, 0, barrelLen / 2)
        barrel.castShadow = true
        barrelPivot.add(barrel)

        // muzzle brake
        const brake = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.18), mkEmat(def.color, 0.45, 0.3))
        brake.position.set(0, -0.02, barrelLen - 0.08)
        barrelPivot.add(brake)

        const muzzle = new THREE.Object3D()
        muzzle.position.set(0, 0, barrelLen)
        barrelPivot.add(muzzle)

        aim.yaw = yawPivot
        aim.pitch = barrelPivot
        aim.muzzle = muzzle
        group.userData.aim = aim
        return group
      }

      if (isMissile) {
        // rotating launcher platform + pods
        const turretBody = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.22, h * 0.9), metalDark)
        turretBody.position.y = 0.12
        yawPivot.add(turretBody)

        const dish = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mkEmat(def.color, 0.38, 0.22))
        dish.position.set(0, 0.30, 0)
        yawPivot.add(dish)

        const podMat = mkMat(0xe2e8f0, 0.22, 0.45)
        const podLen = 0.7
        const podZ = 0.62
        const pods = [-0.18, 0, 0.18]
        for (let i = 0; i < pods.length; i++) {
          const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, podLen, 10), podMat)
          pod.rotation.x = Math.PI / 2
          pod.position.set(pods[i], 0.16, podZ)
          yawPivot.add(pod)
        }

        const muzzle = new THREE.Object3D()
        muzzle.position.set(0, 0.16, podZ + podLen / 2)
        yawPivot.add(muzzle)

        aim.yaw = yawPivot
        aim.muzzle = muzzle
        group.userData.aim = aim
        return group
      }

      // fallback
      group.userData.aim = aim
      return group
    }

    if (def.id === 'shield_generator') {
      const baseH = 2.2
      addBase(baseH, def.color)
      // base ring
      const radius = Math.max(w, h) * 0.65
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.15, 12, 26), mkMat(0x93c5fd, 0.12, 0.62))
      ring.position.y = baseH + 0.3
      ring.rotation.x = Math.PI / 2
      ring.castShadow = false
      group.add(ring)
      // energy dome
      const dome = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.62, 22, 16), glass)
      dome.position.y = baseH + 0.65
      group.add(dome)

      // anchor for shield bubble sphere
      const anchor = new THREE.Object3D()
      anchor.position.set(0, baseH + 0.65, 0)
      group.add(anchor)
      group.userData.shieldBubbleAnchor = anchor
      return group
    }

    // Default fallback: simple body
    addBase(2.4, def.color)
    group.userData.aim = aim
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

    const def = this.getEffectiveDef(this.selected)
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
    const def = this.getEffectiveDef(this.selected)
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
    const asteroidsRemaining = this.asteroids.reduce((acc, a) => acc + (a.alive ? 1 : 0), 0)
    const waveSpawnProgress =
      this.waveInProgress && this.spawnWindowDurationSec > 0 ? clamp(this.spawnWindowElapsedSec / this.spawnWindowDurationSec, 0, 1) : 0
    const refundableUpgradeIds = [...this.purchasedUpgradeIds].filter(
      (id) => id !== 'core_protocol' && this.purchasedUpgradePhase.get(id) === this.currentInactivePhase && !this.waveInProgress,
    )
    this.onStateChange?.({
      credits: Math.floor(this.credits),
      supplyUsed: Math.floor(this.supplyUsed),
      supplyCap: Math.floor(this.supplyCap),
      powerStored: Math.floor(this.powerStored),
      powerCap: Math.floor(this.powerCap),
      wave: this.wave,
      waveReady: this.waveReady,
      waveInProgress: this.waveInProgress,
      waveSpawnProgress,
      waveSpawnEnded: this.spawnWindowEnded,
      inactiveTimeLeftSec: this.inactiveTimeLeftSec,
      asteroidsRemaining,
      unlockedBuildingIds: [...this.unlockedBuildingIds],
      purchasedUpgradeIds: [...this.purchasedUpgradeIds],
      refundableUpgradeIds,
      selected: this.selected,
      gameOver: this.isLost,
    })
  }

  private recomputeUnlockedBuildingIds() {
    this.unlockedBuildingIds.clear()
    this.unlockedBuildingIds.add('command_center')
    this.unlockedBuildingIds.add('supply_depot')
    this.unlockedBuildingIds.add('factory_business')
    this.unlockedBuildingIds.add('generator_small')
    this.unlockedBuildingIds.add('generator_large')
    this.unlockedBuildingIds.add('battery')
    this.unlockedBuildingIds.add('auto_turret')
    this.unlockedBuildingIds.add('siege_cannon')
    this.unlockedBuildingIds.add('missile_launcher')
    this.unlockedBuildingIds.add('silo')
    this.unlockedBuildingIds.add('shield_generator')
    for (const upId of this.purchasedUpgradeIds) {
      const up = UPGRADES.find((u) => u.id === upId)
      for (const bid of up?.unlockBuildingIds ?? []) this.unlockedBuildingIds.add(bid)
    }
  }

  private resize() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }
}

