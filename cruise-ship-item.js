class CruiseShipItem extends HTMLElement {
  static get observedAttributes(){ return ['scale','deck']; }

  #shadow; #viewport; #svg; #hudDeck; #hudInventory; #transition; #state; #inventory; #audio; #waveTimer;

  constructor(){
    super();
    this.#shadow = this.attachShadow({mode:'open'});
    this.#shadow.innerHTML = `
      <style>
        :host{ display:block; contain:content; position:relative; font-family:'Inter', 'Segoe UI', sans-serif; }
        .wrap{ position:relative; width:100%; height:100%; background:radial-gradient(circle at 30% 20%, rgba(28,48,80,.85), rgba(4,12,28,.95)); border-radius:20px; overflow:hidden; box-shadow:0 28px 60px rgba(0,0,0,.45); }
        .wrap::before, .wrap::after{ content:''; position:absolute; inset:-40% -20%; background:radial-gradient(circle at 50% 50%, rgba(60,150,255,.18), transparent 60%); animation:drift 18s linear infinite; }
        .wrap::after{ animation-duration:24s; animation-direction:reverse; opacity:.6; }
        @keyframes drift { from{ transform:translate3d(0,0,0) rotate(0deg);} to{ transform:translate3d(0,-6%,0) rotate(360deg);} }
        .viewport{ position:absolute; inset:0; display:grid; grid-template-rows:auto 1fr; }
        .hud{ display:flex; justify-content:space-between; padding:18px 24px; pointer-events:none; }
        .hud .card{ background:rgba(10,18,34,.8); border:1px solid rgba(110,214,255,.35); border-radius:14px; padding:10px 16px; min-width:160px; box-shadow:0 18px 40px rgba(0,0,0,.35); }
        .hud .label{ font-size:11px; text-transform:uppercase; letter-spacing:.12em; color:#9cb3d9; }
        .hud .value{ font-size:18px; font-weight:600; color:#eef6ff; }
        svg{ width:100%; height:100%; align-self:stretch; justify-self:stretch; }
        .transition{ position:absolute; inset:0; background:linear-gradient(180deg,rgba(9,17,28,.75),rgba(9,17,28,.2)); opacity:0; pointer-events:none; transition:opacity .35s ease; }
        .transition.active{ opacity:1; }
      </style>
      <div class="wrap">
        <div class="viewport">
          <div class="hud">
            <div class="card">
              <div class="label">Deck</div>
              <div class="value" id="deckLabel">Exterior</div>
            </div>
            <div class="card" style="max-width:220px;">
              <div class="label">Inventory</div>
              <div class="value" id="inventoryLabel">—</div>
            </div>
          </div>
          <svg part="svg"></svg>
          <div class="transition" id="transition"></div>
        </div>
      </div>
    `;

    this.#viewport = this.#shadow.querySelector('.viewport');
    this.#svg = this.#shadow.querySelector('svg');
    this.#hudDeck = this.#shadow.getElementById('deckLabel');
    this.#hudInventory = this.#shadow.getElementById('inventoryLabel');
    this.#transition = this.#shadow.getElementById('transition');

    this.#inventory = [];
    this.#state = {
      scale: parseFloat(this.getAttribute('scale')||'1'),
      deck: this.getAttribute('deck') || 'ext',
      doorProgress: 0,
      doorOpen: false
    };
    this.#audio = {
      door: new Audio('https://cdn.pixabay.com/download/audio/2022/03/31/audio_b4d051c27d.mp3?filename=electric-door-hipass-114368.mp3'),
      chime: new Audio('https://cdn.pixabay.com/download/audio/2021/11/09/audio_a3a36505ad.mp3?filename=interface-hint-notification-91176.mp3'),
      wave: new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_03b72593cf.mp3?filename=calm-sea-waves-ambient-110878.mp3')
    };
    this.#audio.wave.loop = true;
    this.#audio.wave.volume = 0.18;
  }

  connectedCallback(){
    this.#render();
    this.#updateHUD();
  }

  attributeChangedCallback(){ this.#applyAttr(); }

  openDoor(){ if (this.#audio.wave.paused) this.#audio.wave.play().catch(()=>{}); this.#animateDoor(1); this.#play('door'); this.#state.doorOpen = true; }
  closeDoor(){ this.#animateDoor(0); this.#state.doorOpen = false; }
  enter(){ this.setDeck('1'); this.#emit('enter',{}); }
  exit(){ this.setDeck('ext'); this.#emit('exit',{}); }
  setDeck(name){
    if (this.#state.deck === name) return;
    this.#state.deck = name;
    this.setAttribute('deck', name);
    this.#flashTransition();
    if (this.#audio.wave.paused) this.#audio.wave.play().catch(()=>{});
    this.#play('chime');
    this.#render();
    this.#emit('deck', { deck:name });
  }
  getInventory(){ return this.#inventory.map(i=>({...i})); }
  resetInventory(){ this.#inventory = []; this.#render(); this.#updateHUD(); }

  #emit(name, detail){ this.dispatchEvent(new CustomEvent(name,{detail,bubbles:true,composed:true})); }

  #applyAttr(){
    this.#state.scale = parseFloat(this.getAttribute('scale')||'1');
    const deck = this.getAttribute('deck');
    if (deck && deck !== this.#state.deck) {
      this.#state.deck = deck;
      this.#flashTransition();
    }
    this.#render();
  }

  #play(key){
    const sound = this.#audio[key];
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(()=>{});
  }

  #animateDoor(target){
    const start = this.#state.doorProgress;
    const duration = 260;
    const startTime = performance.now();
    const tick = (now)=>{
      const t = Math.min(1, (now - startTime)/duration);
      this.#state.doorProgress = start + (target - start) * (1 - Math.cos(Math.PI * t))/2;
      this.#render();
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  #flashTransition(){
    this.#transition.classList.add('active');
    clearTimeout(this.#transition._hideTimer);
    this.#transition._hideTimer = setTimeout(()=>this.#transition.classList.remove('active'), 220);
  }

  #updateHUD(){
    const deckNames = { ext:'Exterior', '1':'Deck 1 — Pool', '2':'Deck 2 — Cabins', '3':'Deck 3 — Spa', '4':'Deck 4 — Lounge', bridge:'Bridge' };
    this.#hudDeck.textContent = deckNames[this.#state.deck] || this.#state.deck;
    if (!this.#inventory.length) {
      this.#hudInventory.textContent = 'Inventory empty';
    } else {
      this.#hudInventory.textContent = this.#inventory.map(i => `${i.name} ×${i.uses ?? i.quantity ?? 1}`).join(', ');
    }
  }

  #addFood(name, uses=3){
    const existing = this.#inventory.find(i=>i.name===name);
    if(existing){ existing.uses += uses; }
    else { this.#inventory.push({name, uses}); }
    this.#emit('pickup',{name, uses});
    this.#updateHUD();
  }

  #consume(name){
    const item = this.#inventory.find(i=>i.name===name);
    if(!item) return;
    item.uses -= 1;
    this.#emit('consume',{name, remaining:item.uses});
    if(item.uses<=0){ this.#inventory = this.#inventory.filter(i=>i!==item); }
    this.#updateHUD();
  }

  #render(){
    if (!this.isConnected) return;
    this.#svg.innerHTML = '';
    const S = 8 * (this.#state.scale||1);
    const W = 120*S, H = 60*S;
    this.#svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    this.#makeGradients();
    const deck = this.#state.deck;
    if(deck==='ext') this.#drawExterior(W,H,S);
    if(deck==='1') this.#drawDeck1(W,H,S);
    if(deck==='2') this.#drawDeck2(W,H,S);
    if(deck==='3') this.#drawDeck3(W,H,S);
    if(deck==='4') this.#drawDeck4(W,H,S);
    if(deck==='bridge') this.#drawBridge(W,H,S);
    this.#drawHUD(W,H,S);
    this.#updateHUD();
  }

  #makeGradients(){
    const defs = document.createElementNS(this.#svg.namespaceURI,'defs');
    this.#svg.appendChild(defs);
    const hullGrad = document.createElementNS(this.#svg.namespaceURI,'linearGradient');
    hullGrad.id = 'hullGrad'; hullGrad.setAttribute('x1','0'); hullGrad.setAttribute('x2','0'); hullGrad.setAttribute('y1','0'); hullGrad.setAttribute('y2','1');
    const stop1 = document.createElementNS(this.#svg.namespaceURI,'stop'); stop1.setAttribute('offset','0%'); stop1.setAttribute('stop-color','#7a86a8');
    const stop2 = document.createElementNS(this.#svg.namespaceURI,'stop'); stop2.setAttribute('offset','100%'); stop2.setAttribute('stop-color','#3a4a6a');
    hullGrad.append(stop1, stop2);
    defs.appendChild(hullGrad);
  }

  #drawExterior(W,H,S){
    const svg = this.#svg; const cx=W/2, cy=H/2; const hullW = 84*S, hullH = 22*S;
    const hull = document.createElementNS(svg.namespaceURI,'rect');
    hull.setAttribute('x', cx - hullW/2);
    hull.setAttribute('y', cy - hullH/2);
    hull.setAttribute('width', hullW);
    hull.setAttribute('height', hullH);
    hull.setAttribute('rx', 12*S);
    hull.setAttribute('fill','url(#hullGrad)');
    svg.appendChild(hull);

    const deck = document.createElementNS(svg.namespaceURI,'rect');
    deck.setAttribute('x', cx - (hullW-4*S)/2);
    deck.setAttribute('y', cy - (hullH-6*S)/2);
    deck.setAttribute('width', hullW-4*S);
    deck.setAttribute('height', hullH-6*S);
    deck.setAttribute('fill','#0e1e39');
    svg.appendChild(deck);

    const progress = this.#state.doorProgress;
    const doorW = 6*S, doorH = 8*S;
    const doorX = cx + hullW/2 - doorW - 1.5*S;
    const doorY = cy + hullH/2 - doorH - 2*S;

    const door = document.createElementNS(svg.namespaceURI,'rect');
    door.setAttribute('x', doorX);
    door.setAttribute('y', doorY);
    door.setAttribute('width', doorW);
    door.setAttribute('height', doorH);
    door.setAttribute('fill','#cfd7e6');
    door.setAttribute('transform', `translate(${progress * doorW * -0.9},0) skewY(${progress * -8})`);
    door.classList.add('clickable');
    door.addEventListener('click', ()=>{ this.#state.doorOpen ? this.closeDoor() : this.openDoor(); this.#emit('door',{open:this.#state.doorOpen}); });
    svg.appendChild(door);

    const title = this.#text(cx, cy - hullH/2 - 6, 'Cruise Ship — Exterior', 'label');
    svg.appendChild(title);

    const enterBtn = this.#button(cx, cy + hullH/2 + 6*S, 20*S, 6*S, this.#state.doorOpen ? 'Enter Ship' : 'Knock', ()=>{ if(!this.#state.doorOpen) this.openDoor(); else this.enter(); });
    svg.appendChild(enterBtn);
  }

  #drawDeck1(W,H,S){
    const svg = this.#svg; const cx=W/2, cy=H/2; const pad=6*S; const deckW=90*S, deckH=42*S;
    const frame = this.#roundedRect(cx-deckW/2, cy-deckH/2, deckW, deckH, 4*S, '#10213f'); svg.appendChild(frame);
    svg.appendChild(this.#text(cx, cy-deckH/2-5, 'Deck 1 — Pool & Cafe', 'label'));

    const poolW=40*S, poolH=16*S; const poolX = cx - poolW/2; const poolY = cy + deckH/2 - poolH - pad;
    svg.appendChild(this.#roundedRect(poolX, poolY, poolW, poolH, 3*S,'#1c6ea4'));
    svg.appendChild(this.#roundedRect(poolX+2*S, poolY+2*S, poolW-4*S, poolH-4*S, 2*S,'#1e87c7'));
    svg.appendChild(this.#text(poolX+poolW/2, poolY-3, 'Swimming Pool', 'small'));

    const cafeW=deckW-2*pad, cafeH=14*S; const cafeX=cx-cafeW/2; const cafeY=cy - cafeH/2;
    svg.appendChild(this.#roundedRect(cafeX, cafeY, cafeW, cafeH, 2*S, '#0e1e39'));
    svg.appendChild(this.#text(cx, cafeY-2, 'Cafe', 'small'));
    const counter = this.#roundedRect(cafeX+2*S, cafeY+2*S, cafeW-4*S, 3*S, S, '#172a4f'); svg.appendChild(counter);

    const foods = [
      {name:'Coffee', x: -16*S},
      {name:'Croissant', x: -8*S},
      {name:'Sandwich', x: 0},
      {name:'Juice', x: 8*S},
      {name:'Cake', x: 16*S},
    ];
    foods.forEach(f=>{
      const plate = this.#roundedRect(cx + f.x - 1.1*S, cafeY+2.2*S, 2.2*S, 1*S, .5*S, '#203a70');
      plate.addEventListener('click', ()=> this.#addFood(f.name,3));
      svg.appendChild(plate);
      svg.appendChild(this.#text(cx+f.x, cafeY+5*S, f.name, 'small'));
    });

    const exitBtn = this.#button(cx - 18*S, cy + deckH/2 + 4*S, 14*S, 5*S, 'Exit', ()=>this.exit()); svg.appendChild(exitBtn);
    const nextDeck = this.#button(cx + 18*S, cy + deckH/2 + 4*S, 14*S, 5*S, 'Up to Deck 2', ()=>this.setDeck('2'));
    svg.appendChild(nextDeck);
  }

  #drawDeck2(W,H,S){
    const svg = this.#svg; const cx=W/2, cy=H/2; const deckW=84*S, deckH=38*S;
    svg.appendChild(this.#roundedRect(cx-deckW/2, cy-deckH/2, deckW, deckH, 4*S, '#10213f'));
    svg.appendChild(this.#text(cx, cy-deckH/2-5, 'Deck 2 — Cabins', 'label'));

    for(let i=0;i<3;i++){
      const cabinX = cx - deckW/2 + (i* (deckW/3)) + 6*S;
      svg.appendChild(this.#roundedRect(cabinX, cy-10*S, 22*S, 20*S, 2*S, '#142648'));
      svg.appendChild(this.#text(cabinX+11*S, cy-10*S-2, `Cabin ${i+1}`, 'small'));
    }

    const hall = this.#roundedRect(cx-4*S, cy-16*S, 8*S, 32*S, 2*S, '#1a3766'); svg.appendChild(hall);
    svg.appendChild(this.#text(cx, cy+deckH/2+4*S, 'Down to Deck 1', 'small'));
    const up = this.#button(cx + 20*S, cy + deckH/2 + 4*S, 14*S, 5*S, 'Up to Deck 3', ()=>this.setDeck('3'));
    svg.appendChild(up);
  }

  #drawDeck3(W,H,S){
    const svg = this.#svg; const cx=W/2, cy=H/2;
    svg.appendChild(this.#roundedRect(cx-80*S/2, cy-34*S/2, 80*S, 34*S, 4*S, '#132045'));
    svg.appendChild(this.#text(cx, cy-34*S/2-5, 'Deck 3 — Spa & Gym', 'label'));

    const spa = this.#roundedRect(cx-28*S, cy-10*S, 24*S, 20*S, 3*S, '#142a4b'); svg.appendChild(spa);
    svg.appendChild(this.#text(cx-16*S, cy-10*S-2, 'Hydro Spa', 'small'));
    svg.appendChild(this.#roundedRect(cx-25*S, cy, 18*S, 8*S, 3*S, '#1e87c7'));

    const gym = this.#roundedRect(cx+6*S, cy-10*S, 30*S, 20*S, 3*S, '#172a4f'); svg.appendChild(gym);
    svg.appendChild(this.#text(cx+21*S, cy-10*S-2, 'Gym Studio', 'small'));
    const bar = this.#button(cx + 18*S, cy + 14*S, 16*S, 5*S, 'Order Smoothie', ()=>this.#addFood('Detox Smoothie',2));
    svg.appendChild(bar);

    const nav = this.#button(cx - 18*S, cy + 20*S, 14*S, 5*S, 'To Deck 2', ()=>this.setDeck('2'));
    svg.appendChild(nav);
    svg.appendChild(this.#button(cx + 18*S, cy + 20*S, 14*S, 5*S, 'To Deck 4', ()=>this.setDeck('4')));
  }

  #drawDeck4(W,H,S){
    const svg = this.#svg; const cx=W/2, cy=H/2;
    svg.appendChild(this.#roundedRect(cx-70*S/2, cy-32*S/2, 70*S, 32*S, 3*S, '#0e1e39'));
    svg.appendChild(this.#text(cx, cy-32*S/2-5, 'Deck 4 — Lounge & Observatory', 'label'));
    svg.appendChild(this.#roundedRect(cx-25*S, cy-10*S, 20*S, 18*S, 3*S, '#142648'));
    svg.appendChild(this.#text(cx-15*S, cy-10*S-2, 'Observation', 'small'));

    const lounge = this.#roundedRect(cx+6*S, cy-8*S, 24*S, 16*S, 3*S, '#172a4f'); svg.appendChild(lounge);
    svg.appendChild(this.#text(cx+18*S, cy-8*S-2, 'Sky Lounge', 'small'));
    svg.appendChild(this.#button(cx, cy + 16*S, 16*S, 5*S, 'To Bridge', ()=>this.setDeck('bridge')));
    svg.appendChild(this.#button(cx, cy + 22*S, 16*S, 5*S, 'To Deck 3', ()=>this.setDeck('3')));
  }

  #drawBridge(W,H,S){
    const svg = this.#svg; const cx=W/2, cy=H/2;
    svg.appendChild(this.#roundedRect(cx-64*S/2, cy-28*S/2, 64*S, 28*S, 3*S, '#101e34'));
    svg.appendChild(this.#text(cx, cy-28*S/2-5, 'Bridge — Command Deck', 'label'));
    svg.appendChild(this.#roundedRect(cx-20*S, cy-6*S, 40*S, 12*S, 2*S, '#172a4f'));
    svg.appendChild(this.#text(cx, cy-6*S-2, 'Helm & Navigation', 'small'));

    const helmBtn = this.#button(cx, cy + 12*S, 20*S, 6*S, 'Take Helm', ()=>this.#emit('helm',{mode:'manual'}));
    svg.appendChild(helmBtn);
    svg.appendChild(this.#button(cx-18*S, cy + 18*S, 14*S, 5*S, 'To Deck 4', ()=>this.setDeck('4')));
  }

  #drawHUD(W,H,S){ /* placeholder for compatibility */ }

  #roundedRect(x, y, w, h, r, fill){
    const rect = document.createElementNS(this.#svg.namespaceURI,'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('rx', r);
    rect.setAttribute('fill', fill);
    return rect;
  }

  #text(x, y, content, variant='label'){
    const text = document.createElementNS(this.#svg.namespaceURI,'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('text-anchor','middle');
    text.setAttribute('fill', variant==='small' ? '#9fb1c9' : '#dfe8f6');
    text.setAttribute('font-family','Inter, sans-serif');
    text.setAttribute('font-weight', variant==='label' ? '600' : '500');
    text.setAttribute('font-size', variant==='small' ? 10 : 14);
    text.textContent = content;
    return text;
  }

  #button(cx, cy, w, h, label, onClick){
    const g = document.createElementNS(this.#svg.namespaceURI,'g');
    const rect = this.#roundedRect(cx - w/2, cy - h/2, w, h, h/2, '#132045');
    rect.setAttribute('stroke','#6ea8ff');
    rect.setAttribute('stroke-width', 0.6);
    const text = this.#text(cx, cy + 4, label, 'label');
    text.setAttribute('font-size', 12);
    g.append(rect,text);
    g.style.cursor = 'pointer';
    g.addEventListener('click', onClick);
    return g;
  }
}

customElements.define('cruise-ship-item', CruiseShipItem);
