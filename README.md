# Lifebot

A simple Babylon.js scene with three cube houses lined up on a flat ground. Open `index.html` in a browser to explore the world in first-person view. Use **WASD** (or the arrow keys) to walk around. Click inside the canvas to lock the pointer and look around; press **Esc** to release it. Each house contains a sink—click it to see the silver faucet rotate while blue water flows out. The ground is green and the houses use a brick-colored material.

The code is now organized so new gameplay features can be added easily. A basic shop building appears a short walk in front of the houses and the UI shows the player’s current coin count. Inside the shop are a few purchasable items. Click an item to pick it up, then carry it to the counter marked "TILL". If you have enough coins you’ll buy the item; otherwise a message will tell you so.

A three-story skyscraper with an elevator has been added near the beach. Use the panel in the bottom-left corner to teleport between the three levels and look out of the front door to see the ocean.

A new island sits a short distance offshore. An elevated road bridge arches over the water to connect it to the mainland, and the stadium now lives on this island with open space at its front.

Additional assets live in the `assets/` directory. It currently includes `brio_psx_style_han66st.glb`, a low-poly PSX-style car model. The car is loaded in `index.html` using `BABYLON.SceneLoader.ImportMesh` and appears behind the houses when the game loads.

To deploy on Netlify, push this repository and point your Netlify site at the repository root. No build step is required.
