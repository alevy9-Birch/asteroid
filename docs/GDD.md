# Meteor Base Defense — What each structure is for

Plain-language design intent: what the player is *supposed* to feel each building is for. Balance and exact behavior live in the game code.

You defend a grid base against asteroid waves. **Command centers** are your lifeline—lose them all and the run ends. **Credits** pay for construction, **supply** limits how much you can build, and **power** keeps industry and many weapons running during combat.

**Naming:** The skill tree sometimes says “Mega-Complex” while the build wheel says **Mega Factory** for the same top-tier factory. Worth aligning the words everywhere players see them.

---

## Core and logistics (neutral)

**Command Center** — Your headquarters. It’s meant to anchor the base: it raises how much you can build, trickles in credits, and contributes a little power so the early grid isn’t dead weight. It’s the thing you protect above all else.

**Supply Depot (small and large)** — These exist so you can **afford more structures**. They don’t fight; they expand your build budget. The large one is the same job with a bigger footprint and a bigger bump to capacity.

**Repair Bay** — Sends repair drones to hurt buildings. The fantasy is **surgical recovery**: something got chipped by a rock or splash, and this facility chases the damage down instead of waiting for passive fixes.

**Support Node** — A small relay that periodically **heals everything nearby** at the cost of power. It’s for blanket upkeep around a cluster of important buildings, not precision drone work.

**Reconstruction Yard** — Insurance. When something is destroyed, this is meant to **bring it back** (at a discount) if it was inside its coverage—so a bad wave doesn’t permanently erase your layout.

---

## Economy (neutral)

**Business** — The starter money building. It’s meant to be cheap to slot in and teach that **economy costs power**, not just credits.

**Factory** — A step up: larger footprint, better payouts, still the “normal” industrial backbone of the mid-game.

**Mega Factory** — The heavy end of the neutral factory line. It’s meant to be a **credit powerhouse** that demands serious power and supply—you commit grid space and infrastructure to it.

**Refinery** and **Mega Refinery** — Fast, punchy income tuned for **high throughput and high power draw**. The idea is “burstier cash” than factories, with a smaller refinery for tight layouts and a mega version when you’ve stabilized the grid.

**Chemical Installation** — A risky high-tech earner. It’s meant to pay well but **punish careless packing**: the fantasy is toxic runoff or volatile chemistry hurting neighbors if you stack bases too tight.

---

## Power grid (neutral)

**Generator (small and large)** — Straightforward: turn space into **steady power**. Small for early expansion, large for when one big block is better than many tiny ones.

**Battery (small and large)** — **Headroom** for the grid. They don’t create energy; they let you store spikes from weapons and refill between waves so defenses don’t brown out the moment everything fires at once.

**Pylon** — Part of a **network**: weak alone, meaningful when linked with other pylons. The intent is a secondary path to power that rewards placement patterns and carries a risk (damaged pylons aren’t harmless to their neighbors).

**Nuclear Plant** — Maximum baseline generation at a **ongoing credit cost**. The fantasy is you’re buying raw output by running something expensive and politically ugly—fine when you’re rich, painful when you’re broke.

---

## Ballistic and rail defenses (neutral)

**Auto-Turret** — The workhorse anti-asteroid gun: **high rate of fire**, modest per-shot punch, hungry for power. It’s meant to chew through swarms and chip big targets over time.

**Auto-Turret (large)** — Same role, bigger platform: more durability, more DPS, more supply and power commitment.

**Siege Cannon** — **Slow, long-range artillery** for big rocks. You trade cadence for single-shot impact—ideal when asteroids have time to cross the map.

**Heavy Siege Cannon** — The siege fantasy turned up: even slower, even harder hits, a **fortress piece** for the back line.

**AA Gun** — Long reach and **splash**. It’s meant to feel like flak or burst AA—good against clusters and smaller threats at distance, not the same niche as a single-target siege tube.

**Railgun** — A **capital weapon** that eats stored energy instead of a constant trickle drain. The intent is spike damage and piercing fantasy: you bank power, then delete something important.

---

## Missiles (neutral)

**Missile Launcher (S and M)** — Reliable **guided missiles** with area damage—middle of the road range, rate, and blast. S is compact; M is the same idea scaled up.

**Portable Silo** — A **compact silo** with slow shots and big booms—meant for tight bases that still want retargeting heavy missiles.

**Missile Silo** and **Nuclear Silo** — Escalating **endgame silos**: huge range, huge payloads, long reloads. The player fantasy is “I saved for this, and now the sky falls.”

**Hydra Launcher** — A **volley** system: many small hits in quick succession with little or no splash. It’s meant to feel like saturation fire—strip shields, stress many targets—rather than one nuclear-style bubble.

---

## Shields and energy weapons (neutral)

**Shield Generator (medium and large)** — Local **domes** that absorb hits for buildings underneath until the shield breaks, then need power to come back. Medium is the default unlock; large is the same fantasy with a wider bubble and heavier upkeep.

**Tesla Tower** — **Short-range, constant zaps**—the “everything in this radius melts” tower. High power draw matches the fantasy of an always-on coil.

**Plasma Laser (S, M, L)** — **Sustained beams at long range**—damage-over-time pressure on single targets (or whatever the beam is touching). Sizes step up commitment, reach, and throughput.

---

## Archangel (commander)

**Airfield** — Deploys **gunships** that stream fire downrange. The intent is mobile air DPS that depends on fuel and bullets—you’re running a mini airbase, not a static turret.

**Starport** — Deploys **bombers** with slow, heavy missiles. Fantasy is fewer shots, bigger pops; same logistics loop as the airfield but aimed at chunky targets and clusters.

**Fueling Station** and **Bulk Fueling Station** — Keep planes **airworthy during waves**. More stations mean faster turnaround; bulk is the large-footprint version for serious air economies.

**Munitions Plant** and **Missile Factory** — **Loadout buildings**: one feeds gunship rounds, the other bomber ordnance while craft are on the pad. They’re meant to make air power feel like supply chain gameplay, not free damage.

---

## Dominion (commander)

**Orbital Cannon** — **Global strike fantasy**: one enormous shot on a long timer, meant to delete or cripple something anywhere on the map and feel like you called down the hammer.

**Flak Gun** — **Anti-air style** work at long range with splash and secondary shrapnel. It’s meant to punish high targets and groups, with positioning rules that make it different from ground-hugging autocannons.

**Seeker Drone Spawner** — Launches drones that **cling to asteroids** and grind them down while slowing them—control and chip damage, not burst.

**Defensive Bunker** — A **tough, general-purpose ballistic nest**: durable, medium range, steady fire—your “reliable line infantry” emplacement.

**Laser Drill** — A weapon that **pays you while it fires**—mining fantasy tied to combat; you’re melting rocks for salvage as well as defense.

**Support Bay** — **Dropship healing** over a wide area, faster and punchier than scattered small nodes. The intent is mobile triage for a battered front line.

---

## Nova (commander)

**Gravity Well** — **Pulls incoming threats** toward it so you can shape waves—less raw DPS, more “I decide where the rocks go.”

**Photon Projector (S and L)** — **Slow, piercing energy orbs** with trail damage—long-range line weapons meant to punch through multiple targets or saturate a lane.

**Shockwave Pulsar** — A **wide, repeating shock** that mostly slows (and with upgrades can lock) asteroids. Fantasy is crowd control and tempo, not primary burst damage.

**Universal Forcefield** — A **single shared barrier** over the map (or HQ region)—stackable fantasy of one umbrella shield instead of many small domes.

**Power Bank** — Makes **nearby weapons cheaper in power per shot** (and can add a little offensive oomph). It’s meant to be the “efficiency aura” that lets you run more beams and missiles without rebuilding the whole grid.

---

## Citadel (commander)

**Repair Conduit** — **Area heal pulses** like a heavy-duty support node: larger radius, stronger role as the citadel’s dedicated medic structure.

**Construction Conduit** — **Discounts new building** placed inside its influence. Fantasy: forward operating engineering—expand cheaper where you’ve prepared the ground.

**Defense Conduit** — **Reduces impact damage** to buildings in its ward—small footprint, “harden this cluster” gameplay.

**Attack Conduit** — **Amplifies damage** dealt by defenses in range—pair with choke points or turret nests.

**Efficiency Conduit** — **Speeds up firing** for covered defenses—same footprint idea as attack, different knob (cadence instead of alpha).

**Range Conduit** — **Extends reach** of covered weapons—meant to stretch a defensive line without moving every turret.

---

## Jupiter (commander)

**Mass Relay** — **Shared health pool** across relays: one network, one collective durability fantasy—plus light linking behavior for power.

**Arc Thrower** — **Chaining lightning** that grows nastier when you have energy banked—reward for keeping batteries filled.

**Overclock Augment** — **Turbocharges adjacent defenses** while you have power—placement puzzle: tuck it against the wall that matters most.

**Radar Station** — **Marks asteroids** so they take more damage and refund energy when killed—spotter / debuffer fantasy.

**Recon Drone** — **Orbital coil** that zaps mid-range targets and **boosts generation** for buildings under it—map-aware support, not just damage.

**Battery Complex** — Large **storage and trickle generation**, with a fantasy of “strategic reserve”—especially strong when the grid is running empty (with upgrades).

---

## Kingpin (commander)

**Data Array** — **Infrequent huge credit dumps**—fragile, slow cycle, meant for players who like batch income and timing.

**Investment Complex** — **Passive wealth** that scales with how many credits you’re already holding—compound-interest fantasy on the base itself.

**Cryptographic Decoder** — **Buffs nearby refineries**—syndicate tech stealing margin from supply chains you already built.

**Indoctrinated Labor** — **Removes idle power drain** on nearby factories—meant to make heavy industry feel cheaper to run once you’ve paid the moral (and placement) cost.

**Mineral Processor** — **Pays credits when kills happen near linked turrets**—salvage routing: combat directly feeds the economy if you wire the base correctly.

**Slag Cannon** — A **heavy gun that spends credits per shot** as well as power—meant to convert banked money into burst damage when you need a breacher.

---

## Related docs

- `docs/BALANCE_AND_EXCEL.md` — where numbers live and export ideas.  
- `docs/BALANCE_PIPELINE.md` — future data-driven balance.  
- `docs/PERFORMANCE_PLAN.md` — performance work.
