// cruise-ship-item.js
class CruiseShipItem extends HTMLElement {
  static get observedAttributes(){ return ['scale','deck']; }
  #root; #svg; #state; #defs; #inventory;

  constructor(){
    super();
    const shadow = this.attachShadow({mode:'open'});
    shadow.innerHTML = `
      <style>
        :host{ display:block; contain:content; }
        .wrap{ width:100%; height:100%; display:grid; place-items:center; background:linear-gradient(180deg,#0b1220,#0a1529 40%, #08162c); border-radius:16px; box-shadow: 0 10px 30px rgba(0,0,0,.3) inset; }
        svg{ width:100%; height:100%; border-radius:14px; }
        .label{ font: 600 12px/1 Inter, system-ui, sans-serif; fill:#dfe8f6; }
        .small{ font: 600 10px/1 Inter, system-ui, sans-serif; fill:#c8d6f0; }
        .clickable{ cursor: pointer; }
        .room{ fill:#10213f; stroke:#2b436e; stroke-width:1; }
        .glass{ fill:#1a3766; }
        .hull{ fill:url(#hullGrad); stroke:#4b5f86; stroke-width:2; }
        .deck{ fill:#0e1e39; }
        .door{ fill:#cfd7e6; }
        .water{ fill:#1c6ea4; }
        .counter{ fill:#172a4f; }
        .table{ fill:#142648; }
        .bed{ fill:#1b2f58; }
        .spa{ fill:#142a4b; }
        .hotwater{ fill:#1e87c7; opacity:.9; }
        .poolwater{ fill:#1e87c7; opacity:.85; }
        .helm{ fill:#1b335f; }
        .button{ fill:#203a70; stroke:#6ea8ff; stroke-width:1; }
      </style>
      <div class="wrap"></div>
    `;
    this.#root = shadow.querySelector('.wrap');
    this.#inventory = [];
    this.#state = {
      scale: parseFloat(this.getAttribute('scale')||'1'),
      deck: this.getAttribute('deck') || 'ext',
      doorOpen: false,
    };
  }

  connectedCallback(){ this.#render(); }
  attributeChangedCallback(){ this.#applyAttr(); }

  openDoor(){ this.#state.doorOpen = true; this.#render(); this.#emit('door',{open:true}); }
  closeDoor(){ this.#state.doorOpen = false; this.#render(); this.#emit('door',{open:false}); }
  enter(){ this.setDeck('1'); this.#emit('enter',{}); }
  exit(){ this.setDeck('ext'); this.#emit('exit',{}); }
  setDeck(name){ this.#state.deck = name; this.setAttribute('deck', name); this.#render(); }
  getInventory(){ return this.#inventory.map(i=>({...i})); }
  resetInventory(){ this.#inventory = []; this.#render(); }

  #emit(name, detail){ this.dispatchEvent(new CustomEvent(name,{detail, bubbles:true, composed:true})); }
  #applyAttr(){
    this.#state.scale = parseFloat(this.getAttribute('scale')||'1');
    this.#state.deck = this.getAttribute('deck')||'ext';
    this.#render();
  }

  #addFood(name, uses=3){
    const existing = this.#inventory.find(i=>i.name===name);
    if(existing){ existing.uses += uses; }
    else { this.#inventory.push({name, uses}); }
    this.#emit('pickup',{name, uses});
    this.#render();
  }

  #consume(name){
    const item = this.#inventory.find(i=>i.name===name);
    if(!item) return;
    item.uses -= 1;
    this.#emit('consume',{name, remaining:item.uses});
    if(item.uses<=0){ this.#inventory = this.#inventory.filter(i=>i!==item); }
    this.#render();
  }

  #render(){
    const S = 8 * (this.#state.scale||1);
    const W = 120*S, H = 60*S;
    const deck = this.#state.deck;
    this.#root.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    this.#root.append(svg);
    this.#svg = svg;
    this.#defs = document.createElementNS(svg.namespaceURI,'defs');
    svg.appendChild(this.#defs);
    this.#makeGradients();

    if(deck==='ext') this.#drawExterior(W,H,S);
    if(deck==='1') this.#drawDeck1(W,H,S);
    if(deck==='2') this.#drawDeck2(W,H,S);
    if(deck==='3') this.#drawDeck3(W,H,S);
    if(deck==='4') this.#drawDeck4(W,H,S);
    if(deck==='bridge') this.#drawBridge(W,H,S);

    this.#drawHUD(W,H,S);
  }

  #makeGradients(){
    const g = document.createElementNS(this.#svg.namespaceURI,'linearGradient');
    g.id = 'hullGrad'; g.setAttribute('x1','0'); g.setAttribute('y1','0'); g.setAttribute('x2','0'); g.setAttribute('y2','1');
    const s1 = document.createElementNS(g.namespaceURI,'stop'); s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','#7486a8');
    const s2 = document.createElementNS(g.namespaceURI,'stop'); s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#3a4a6a');
    g.append(s1,s2); this.#defs.appendChild(g);
  }

  // Exterior (hull + door)
  #drawExterior(W,H,S){
    const svg = this.#svg;
    const cx=W/2, cy=H/2;
    const hullW = 84*S, hullH = 22*S;

    const hull = document.createElementNS(svg.namespaceURI,'rect');
    hull.setAttribute('x', cx - hullW/2);
    hull.setAttribute('y', cy - hullH/2);
    hull.setAttribute('width', hullW);
    hull.setAttribute('height', hullH);
    hull.setAttribute('rx', 12*S);
    hull.setAttribute('class','hull');
    svg.appendChild(hull);

    const deck = document.createElementNS(svg.namespaceURI,'rect');
    deck.setAttribute('x', cx - (hullW-4*S)/2);
    deck.setAttribute('y', cy - (hullH-6*S)/2);
    deck.setAttribute('width', hullW-4*S);
    deck.setAttribute('height', hullH-6*S);
    deck.setAttribute('class','deck');
    svg.appendChild(deck);

    const doorW = 6*S, doorH = 8*S;
    const doorX = cx + hullW/2 - doorW - 1.5*S;
    const doorY = cy + hullH/2 - doorH - 2*S;

    const door = document.createElementNS(svg.namespaceURI,'rect');
    door.setAttribute('x', doorX);
    door.setAttribute('y', doorY);
    door.setAttribute('width', doorW);
    door.setAttribute('height', doorH);
    door.setAttribute('class','door clickable');
    door.addEventListener('click', ()=>{
      this.#state.doorOpen = !this.#state.doorOpen;
      this.#emit('door',{open:this.#state.doorOpen});
      this.#render();
    });
    svg.appendChild(door);

    if(this.#state.doorOpen){
      const open = document.createElementNS(svg.namespaceURI,'rect');
      open.setAttribute('x', doorX - doorW*0.9);
      open.setAttribute('y', doorY);
      open.setAttribute('width', doorW);
      open.setAttribute('height', doorH);
      open.setAttribute('class','door');
      open.setAttribute('transform', `rotate(-12 ${doorX} ${doorY})`);
      svg.appendChild(open);
    }

    this.#text(cx, cy - hullH/2 - 6, 'Cruise Ship (Exterior)', 'label');
    const enterBtn = this.#button(cx, cy + hullH/2 + 6*S, 20*S, 6*S, 'Enter Ship', ()=>this.enter());
    svg.appendChild(enterBtn);
  }

  // Deck 1
  #drawDeck1(W,H,S){
    const svg = this.#svg; const cx=W/2, cy=H/2; const pad=6*S; const deckW=90*S, deckH=42*S;
    const frame = this.#roundedRect(cx-deckW/2, cy-deckH/2, deckW, deckH, 4*S, 'room'); svg.appendChild(frame);
    this.#text(cx, cy-deckH/2-5, 'Deck 1 — Pool & Cafe', 'label');

    const poolW=40*S, poolH=16*S; const poolX = cx - poolW/2; const poolY = cy + deckH/2 - poolH - pad;
    svg.appendChild(this.#roundedRect(poolX, poolY, poolW, poolH, 3*S,'water'));
    svg.appendChild(this.#roundedRect(poolX+2*S, poolY+2*S, poolW-4*S, poolH-4*S, 2*S,'poolwater'));
    this.#text(poolX+poolW/2, poolY-3, 'Swimming Pool', 'small');

    const cafeW=deckW-2*pad, cafeH=14*S; const cafeX=cx-cafeW/2; const cafeY=cy - cafeH/2;
    const cafe = this.#roundedRect(cafeX, cafeY, cafeW, cafeH, 2*S, 'room'); svg.appendChild(cafe);
    this.#text(cx, cafeY-2, 'Cafe', 'small');
    const counter = this.#roundedRect(cafeX+2*S, cafeY+2*S, cafeW-4*S, 3*S, S, 'counter'); svg.appendChild(counter);

    const foods = [
      {name:'Coffee', x: -16*S},
      {name:'Croissant', x: -8*S},
      {name:'Sandwich', x: 0},
      {name:'Juice', x: 8*S},
      {name:'Cake', x: 16*S},
    ];
    foods.forEach(f=>{
      const plate = this.#roundedRect(cx + f.x - 1.1*S, cafeY+2.2*S, 2.2*S, 1*S, .5*S, 'button clickable');
      plate.addEventListener('click', ()=> this.#addFood(f.name,3));
      svg.appendChild(plate);
      this.#text(cx+f.x, cafeY+5*S, f.name, 'small');
    });

    for(let i=0;i<4;i++){
      const tx = cafeX + 6*S + i*10*S, ty = cafeY + cafeH - 4*S;
      svg.appendChild(this.#roundedRect(tx, ty, 6*S, 2*S, .8*S, 'table'));
    }

    const exitBtn = this.#button(cx - 18*S, cy + deckH/2 + 4*S, 14*S, 5*S, 'Exit', ()=>this.exit()); svg.appendChild(exitBtn);
    const to2 = this.#button(cx + 6*S, cy + deckH/2 + 4*S, 22*S, 5*S, 'Go to Deck 2', ()=>this.setDeck('2')); svg.appendChild(to2);
  }

  // Deck 2
  #drawDeck2(W,H,S){
    const svg=this.#svg; const cx=W/2, cy=H/2; const deckW=92*S, deckH=44*S;
    svg.appendChild(this.#roundedRect(cx-deckW/2, cy-deckH/2, deckW, deckH, 4*S, 'room'));
    this.#text(cx, cy-deckH/2-5, 'Deck 2 — Third/Second Class + Spa', 'label');

    const corW=10*S; svg.appendChild(this.#roundedRect(cx-corW/2, cy-deckH/2+3*S, corW, deckH-6*S, S, 'deck'));

    const roomW = 12*S, roomH = 8*S, gap=1.2*S;
    const leftX = cx - (deckW/2) + 3*S; const rightX = cx + gap; const startY = cy - deckH/2 + 4*S;
    const makeRoom = (x,y,label)=>{ const r=this.#roundedRect(x, y, roomW, roomH, S, 'room'); svg.appendChild(r); this.#text(x+roomW/2, y-1.2*S, label, 'small'); svg.appendChild(this.#roundedRect(x+1*S, y+1.2*S, roomW-2*S, 2*S, .6*S,'bed')); };

    for(let i=0;i<4;i++){
      makeRoom(leftX, startY + i*(roomH+gap), `3rd-${i+1}`);
      makeRoom(rightX + corW, startY + i*(roomH+gap), `3rd-${i+5}`);
    }
    for(let i=0;i<4;i++){
      const y = startY + 4*(roomH+gap) + 2*S + i*(roomH+gap);
      makeRoom(leftX, y, `2nd-${i+1}`);
      makeRoom(rightX + corW, y, `2nd-${i+5}`);
    }

    const spaW=deckW-10*S, spaH=10*S; const spaX=cx-spaW/2; const spaY=cy + deckH/2 - spaH - 3*S;
    svg.appendChild(this.#roundedRect(spaX, spaY, spaW, spaH, 2*S, 'spa'));
    this.#text(cx, spaY-2, 'Spa', 'small');
    for(let i=0;i<3;i++){
      const tubX = cx - 12*S + i*12*S; const tubY = spaY + 2*S;
      svg.appendChild(this.#roundedRect(tubX, tubY, 8*S, 6*S, 3*S, 'hotwater'));
    }

    const to1 = this.#button(cx - 18*S, cy + deckH/2 + 4*S, 22*S, 5*S, 'Deck 1', ()=>this.setDeck('1')); svg.appendChild(to1);
    const to3 = this.#button(cx + 6*S, cy + deckH/2 + 4*S, 22*S, 5*S, 'Deck 3', ()=>this.setDeck('3')); svg.appendChild(to3);
  }

  // Deck 3
  #drawDeck3(W,H,S){
    const svg=this.#svg; const cx=W/2, cy=H/2; const deckW=92*S, deckH=44*S;
    svg.appendChild(this.#roundedRect(cx-deckW/2, cy-deckH/2, deckW, deckH, 4*S, 'room'));
    this.#text(cx, cy-deckH/2-5, 'Deck 3 — First Class + Captain Quarters', 'label');
    const corW=10*S; svg.appendChild(this.#roundedRect(cx-corW/2, cy-deckH/2+3*S, corW, deckH-6*S, S, 'deck'));

    const suiteW = 16*S, suiteH=10*S, gap=2*S; const leftX = cx - (92*S)/2 + 3*S; const rightX = cx + gap; const startY=cy - deckH/2 + 6*S;
    const makeSuite = (x,y,label)=>{ const r=this.#roundedRect(x, y, suiteW, suiteH, 1.4*S, 'room'); svg.appendChild(r); this.#text(x+suiteW/2, y-1.2*S, label, 'small'); svg.appendChild(this.#roundedRect(x+1.5*S, y+1.8*S, suiteW-3*S, 2.4*S, .8*S,'bed')); };
    for(let i=0;i<3;i++){
      makeSuite(leftX, startY + i*(suiteH+gap), `1st-${i+1}`);
      makeSuite(rightX + corW, startY + i*(suiteH+gap), `1st-${i+4}`);
    }

    const capW=deckW-10*S, capH=9*S; const capX=cx-capW/2; const capY=cy + deckH/2 - capH - 4*S;
    const block = this.#roundedRect(capX, capY, capW, capH, 1.4*S, 'room'); svg.appendChild(block);
    this.#text(cx, capY-2, "Captain's Study & Bedroom", 'small');
    svg.appendChild(this.#roundedRect(capX + 2*S, capY + 2*S, capW/2 - 3*S, capH - 4*S, 1.2*S, 'helm'));
    svg.appendChild(this.#roundedRect(capX + capW/2 + 1*S, capY + 2*S, capW/2 - 3*S, capH - 4*S, 1.2*S, 'bed'));

    const to2 = this.#button(cx - 18*S, cy + deckH/2 + 4*S, 22*S, 5*S, 'Deck 2', ()=>this.setDeck('2')); svg.appendChild(to2);
    const to4 = this.#button(cx + 6*S, cy + deckH/2 + 4*S, 22*S, 5*S, 'Deck 4', ()=>this.setDeck('4')); svg.appendChild(to4);
  }

  // Deck 4 - Promenade & Arcade
  #drawDeck4(W,H,S){
    const svg=this.#svg; const cx=W/2, cy=H/2; const deckW=92*S, deckH=44*S;
    svg.appendChild(this.#roundedRect(cx-deckW/2, cy-deckH/2, deckW, deckH, 4*S, 'room'));
    this.#text(cx, cy-deckH/2-5, 'Deck 4 — Promenade & Arcade', 'label');

    const walkH=12*S; const walkY = cy - deckH/2 + 4*S;
    svg.appendChild(this.#roundedRect(cx-deckW/2+3*S, walkY, deckW-6*S, walkH, 2*S, 'deck'));
    this.#text(cx, walkY-2, 'Promenade', 'small');

    const arcW=deckW-10*S, arcH=14*S; const arcX=cx-arcW/2; const arcY=walkY + walkH + 3*S;
    const arcade = this.#roundedRect(arcX, arcY, arcW, arcH, 2*S, 'room'); svg.appendChild(arcade);
    this.#text(cx, arcY-2, 'Arcade', 'small');

    const games = [
      {name:'Soda', x:-12*S},
      {name:'Pretzel', x:0},
      {name:'Toy', x:12*S},
    ];
    games.forEach(g=>{
      const slot = this.#roundedRect(cx + g.x - 2*S, arcY+2*S, 4*S, 6*S, 1*S, 'button clickable');
      slot.addEventListener('click', ()=> this.#addFood(g.name,2));
      svg.appendChild(slot);
      this.#text(cx+g.x, arcY+9*S, g.name, 'small');
    });

    const to3 = this.#button(cx - 18*S, cy + deckH/2 + 4*S, 22*S, 5*S, 'Deck 3', ()=>this.setDeck('3')); svg.appendChild(to3);
    const toB = this.#button(cx + 6*S, cy + deckH/2 + 4*S, 22*S, 5*S, 'Bridge', ()=>this.setDeck('bridge')); svg.appendChild(toB);
  }

  // Bridge
  #drawBridge(W,H,S){
    const svg=this.#svg; const cx=W/2, cy=H/2; const deckW=70*S, deckH=26*S;
    svg.appendChild(this.#roundedRect(cx-deckW/2, cy-deckH/2, deckW, deckH, 3*S, 'room'));
    this.#text(cx, cy-deckH/2-5, 'Bridge — Helm & Navigation', 'label');
    svg.appendChild(this.#roundedRect(cx-deckW/2+2*S, cy-deckH/2+2*S, deckW-4*S, 6*S, 1.2*S, 'glass'));
    const helm = this.#roundedRect(cx-10*S, cy-2*S, 20*S, 6*S, 1.2*S, 'helm clickable');
    helm.addEventListener('click', ()=> this.#emit('helm',{take:true}));
    svg.appendChild(helm);
    this.#text(cx, cy+1*S, 'Take the Helm', 'small');

    const to4 = this.#button(cx, cy + deckH/2 + 4*S, 22*S, 5*S, 'Deck 4', ()=>this.setDeck('4')); svg.appendChild(to4);
  }

  // HUD
  #drawHUD(W,H,S){
    const svg=this.#svg; const pad=3*S;
    const invW=36*S, invH=10*S; const invX=pad, invY=H - invH - pad;
    svg.appendChild(this.#roundedRect(invX, invY, invW, invH, 1.2*S, 'deck'));
    this.#text(invX + 6*S, invY - 2, 'Inventory', 'small');
    const slotW = 8*S, slotH=6*S; let i=0;
    this.#inventory.forEach(item=>{
      const x = invX + 2*S + i*(slotW+1.2*S); const y = invY + 2*S;
      const slot = this.#roundedRect(x, y, slotW, slotH, .8*S, 'room clickable');
      slot.addEventListener('click', ()=> this.#consume(item.name));
      svg.appendChild(slot);
      this.#text(x+slotW/2, y+2.2*S, item.name, 'small');
      this.#text(x+slotW/2, y+4.4*S, `uses: ${item.uses}`, 'small');
      i++;
    });

    const tabs = [
      {k:'ext', label:'Exterior'},
      {k:'1', label:'Deck 1'},
      {k:'2', label:'Deck 2'},
      {k:'3', label:'Deck 3'},
      {k:'4', label:'Deck 4'},
      {k:'bridge', label:'Bridge'},
    ];
    const tw=16*S, th=6*S; const tx=W - (tw + pad); let ty=pad;
    tabs.forEach(t=>{
      const r = this.#roundedRect(tx, ty, tw, th, .8*S, 'button clickable');
      r.addEventListener('click', ()=> this.setDeck(t.k));
      this.#svg.appendChild(r);
      this.#text(tx + tw/2, ty + th/2 + 1, t.label, 'small');
      ty += th + .8*S;
    });
  }

  #roundedRect(x,y,w,h,r,cls){ const ns=this.#svg.namespaceURI; const el=document.createElementNS(ns,'rect'); el.setAttribute('x',x); el.setAttribute('y',y); el.setAttribute('width',w); el.setAttribute('height',h); el.setAttribute('rx',r); el.setAttribute('class',cls||''); return el; }
  #text(x,y,str,cls){ const ns=this.#svg.namespaceURI; const t=document.createElementNS(ns,'text'); t.setAttribute('x',x); t.setAttribute('y',y); t.setAttribute('text-anchor','middle'); t.setAttribute('class',cls||'label'); t.textContent=str; this.#svg.appendChild(t); return t; }
  #button(x,y,w,h,label,onClick){ const g=document.createElementNS(this.#svg.namespaceURI,'g'); const rect=this.#roundedRect(x-w/2, y-h/2, w, h, h/3, 'button clickable'); g.appendChild(rect); const t=this.#text(x, y+2, label, 'small'); g.addEventListener('click', onClick); return g; }
}

customElements.define('cruise-ship-item', CruiseShipItem);
