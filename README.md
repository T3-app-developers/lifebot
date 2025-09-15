# Lifebot Town — Release Candidate

Lifebot Town is a stylised Babylon.js playground that mixes light RPG progression with interactive set pieces. The project has been reworked for release with a cohesive UI, a richer economy loop, and quests that guide players from the coastal plaza all the way to the hidden spy facility offshore.

## Quick start

Open `index.html` in a modern desktop browser (Chrome, Edge, Firefox or Safari). No build step is required—the scene boots immediately after the Babylon.js CDN libraries load.

## Controls & UX

- **WASD / Arrow Keys** – Movement
- **Space** – Jump (short hop)
- **Shift** – Sprint
- **E** – Interact with highlighted objects/NPCs
- **Tab** – Peek at inventory contents via the HUD
- **M** – Toggle the holographic minimap overlay
- **Esc** – Release pointer lock

On first launch the canvas displays a full-screen onboarding card. Clicking locks the pointer, reveals the reticle, and activates contextual prompts. The HUD shows coins, inventory highlights, current objectives and rolling notifications; toast cards announce quest beats and key rewards.

## World tour

- **Town plaza** – Three refreshed residences with PBR brick/wood materials surround a glassy plaza. The first house hosts the upgraded purifier sink used in the opening quest. A boutique shop sells gadgets, consumables, and the spy clearance badge.
- **FlameBot** – The harbour guardian now delivers voiced text prompts, accepts quest items, and flips progression flags that open up later zones.
- **Harbour bridge** – A mechanical bridge rises segment-by-segment once you earn authorisation. It spans the bay toward the distant spy island, adding drama to the transition.
- **Stadium** – The LifeBot stadium was rebuilt as a living venue: crowd ambience, cheering VFX, a dynamic scoreboard and contract hooks reward the player for leading chants from any seat.
- **Skyscraper** – A three-storey tower with an animated lift and interactive floor buttons. The observation deck remains locked until FlameBot clears you for spy work.
- **Spy island** – PBR rock strata, neon portal ring, animated elevator platform and multi-level command centre. Console interactions award coins, gadgets, and mark quest completion.

## Progression & economy

- **Quests** – A quest manager tracks objectives in the HUD. The “Harbor Systems Check” introduces collection, delivery and bridge deployment. Completing it unlocks the “Spy Initiative”, pushing players to buy clearance, descend into the spy base, and decrypt harbour intel.
- **Jobs board** – A plaza board assigns rotating contracts (crop harvest, stadium cheer, bridge patrol) for quick coin injections.
- **Inventory & rewards** – Purchases, harvested glow berries, water samples and spy gadgets land in the shared inventory readout. Notifications recap additions/removals and coin deltas.
- **Secret cache** – Trigger the hidden `A A A A A` sequence to materialise a reward chest near the player.

## Technical notes

- Scene logic is split into ES modules under `src/` for maintainability.
- Materials lean on PBR textures from the Babylon.js CDN, backed by global tone mapping, fog and a directional sun rig.
- Interactions use a highlight/reticle system plus a custom interaction manager for consistent prompts.
- Quests are orchestrated via an `EventTarget`-based game state, keeping UI and progression decoupled.
- The cruise-ship web component (`cruise_ship.html`, `cruise-ship-item.js`) retains its own demo entry point but now mirrors the global UI language.

## Asset & audio credits

- Babylon.js default environment (`environment.env`) and texture set via CDN.
- Crowd ambience from [Pixabay / RedOctopus](https://pixabay.com/sound-effects/stadium-ambience-1-126380/).
- Particle flare sprite from `https://assets.babylonjs.com/particles/flare.png`.

Enjoy exploring, and feel free to adapt the quests and encounters for your own releases.
