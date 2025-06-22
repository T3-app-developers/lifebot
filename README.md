# Lifebot

A simple Babylon.js scene with three cube houses lined up on a flat ground. **Serve the project over HTTP**—for example run `python -m http.server` from this directory and visit `http://localhost:8000/index.html`, or use the deployed Netlify site. Opening `index.html` directly from the filesystem won't load external assets.

The code is now organized so new gameplay features can be added easily. A basic shop building appears a short walk in front of the houses and the UI shows the player’s current coin count. Inside the shop are a few purchasable items. Click an item to pick it up, then carry it to the counter marked "TILL". If you have enough coins you’ll buy the item; otherwise a message will tell you so.

Additional assets live in the `assets/` directory. It currently includes `brio_psx_style_han66st.glb`, a low-poly PSX-style car model. The car is loaded in `index.html` using `BABYLON.SceneLoader.ImportMesh` and appears behind the houses when the game loads.

To deploy on Netlify, push this repository and point your Netlify site at the repository root. No build step is required.
