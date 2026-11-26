import * as THREE from 'three';

export type DioramaTextureKind =
  | 'tile-grid'
  | 'wood-plank'
  | 'stone-brick'
  | 'water-ripple'
  | 'meadow-earth'
  | 'parchment'
  | 'tennis-clay'
  | 'limestone-rock'
  | 'curved-tile'
  | 'thatch'
  | 'prison-stone';

/**
 * Deterministic pseudo-random helper for organic rock, foliage, and terrain sculpting
 * (zero Math.random flickering across renders).
 */
export function seededNoise(x: number, y: number, seed = 1): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Procedural high-craft CanvasTexture generator — 100% offline, zero external URLs.
 */
export function createDioramaTexture(
  kind: DioramaTextureKind,
  repeatX = 4,
  repeatY = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  if (kind === 'tile-grid') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    const step = 32;
    for (let i = 0; i <= 256; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(203, 213, 225, 0.25)';
    for (let x = 0; x < 256; x += 64) {
      for (let y = 0; y < 256; y += 64) {
        ctx.fillRect(x + 2, y + 2, 28, 28);
      }
    }
  } else if (kind === 'wood-plank') {
    ctx.fillStyle = '#d7b588';
    ctx.fillRect(0, 0, 256, 256);
    const plankH = 32;
    for (let row = 0; row < 8; row++) {
      const y = row * plankH;
      const shade = row % 2 === 0 ? '#d2ad7d' : '#dec096';
      ctx.fillStyle = shade;
      ctx.fillRect(0, y, 256, plankH);
      ctx.strokeStyle = '#b98f5c';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(138, 96, 52, 0.22)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 3; g++) {
        ctx.beginPath();
        ctx.moveTo(0, y + 8 + g * 8);
        ctx.bezierCurveTo(80, y + 6 + g * 8, 170, y + 11 + g * 8, 256, y + 8 + g * 8);
        ctx.stroke();
      }
      const jointX = ((row * 97 + 44) % 210) + 20;
      ctx.strokeStyle = '#a87d4b';
      ctx.beginPath();
      ctx.moveTo(jointX, y);
      ctx.lineTo(jointX, y + plankH);
      ctx.stroke();
    }
  } else if (kind === 'stone-brick') {
    ctx.fillStyle = '#9aa5b4';
    ctx.fillRect(0, 0, 256, 256);
    const h = 32;
    const w = 64;
    for (let row = 0; row < 8; row++) {
      const offset = (row % 2) * (w / 2);
      for (let col = -1; col < 5; col++) {
        const x = col * w + offset;
        const y = row * h;
        const tone = 148 + ((row * 13 + col * 19) % 24);
        ctx.fillStyle = `rgb(${tone}, ${tone + 4}, ${tone + 10})`;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 2, y + 2, w - 4, 4);
      }
    }
  } else if (kind === 'prison-stone') {
    ctx.fillStyle = '#2d3138';
    ctx.fillRect(0, 0, 256, 256);
    const h = 32;
    const w = 64;
    for (let row = 0; row < 8; row++) {
      const offset = (row % 2) * (w / 2);
      for (let col = -1; col < 5; col++) {
        const x = col * w + offset;
        const y = row * h;
        const v = 46 + ((row * 11 + col * 17) % 18);
        ctx.fillStyle = `rgb(${v}, ${v + 2}, ${v + 5})`;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      }
    }
    // Subtle damp moss & moisture stains
    for (let i = 0; i < 36; i++) {
      const x = seededNoise(i, 1, 7) * 256;
      const y = seededNoise(i, 2, 7) * 256;
      const r = 8 + seededNoise(i, 3, 7) * 22;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(42, 66, 48, 0.22)' : 'rgba(15, 18, 24, 0.24)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'limestone-rock') {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#6e7c7e');
    grad.addColorStop(0.5, '#59676b');
    grad.addColorStop(1, '#475458');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    // Horizontal & diagonal geological karst strata
    for (let i = 0; i < 24; i++) {
      const y = (i / 24) * 256;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(220, 232, 235, 0.16)' : 'rgba(26, 36, 40, 0.28)';
      ctx.lineWidth = 2 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(85, y + Math.sin(i) * 8, 175, y - Math.cos(i) * 8, 256, y);
      ctx.stroke();
    }
    // Natural mossy patches & limestone veins
    for (let i = 0; i < 42; i++) {
      const x = seededNoise(i, 4, 3) * 256;
      const y = seededNoise(i, 5, 3) * 256;
      const rx = 6 + seededNoise(i, 6, 3) * 20;
      const ry = 3 + seededNoise(i, 7, 3) * 9;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(65, 108, 70, 0.28)' : 'rgba(215, 224, 226, 0.12)';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'water-ripple') {
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#1e88b5');
    grad.addColorStop(0.45, '#1979a8');
    grad.addColorStop(1, '#125c87');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    // Layered caustic wave ripples & sunlit shimmer
    for (let row = 0; row < 14; row++) {
      const y = row * 19 + 4;
      ctx.strokeStyle = row % 2 === 0 ? 'rgba(224, 247, 255, 0.42)' : 'rgba(125, 211, 252, 0.28)';
      ctx.lineWidth = row % 3 === 0 ? 2.6 : 1.6;
      ctx.beginPath();
      for (let x = 0; x <= 256; x += 16) {
        const wy = y + Math.sin((x / 256) * Math.PI * 4 + row * 1.1) * 4.5;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
    // Sparkling surface specular flecks
    for (let i = 0; i < 30; i++) {
      const x = seededNoise(i, 1, 9) * 256;
      const y = seededNoise(i, 2, 9) * 256;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'curved-tile') {
    ctx.fillStyle = '#993b2a';
    ctx.fillRect(0, 0, 256, 256);
    const tileW = 24;
    const tileH = 22;
    for (let row = 0; row < 13; row++) {
      const y = row * tileH;
      const shift = (row % 2) * (tileW / 2);
      for (let col = -1; col < 12; col++) {
        const x = col * tileW + shift;
        const shade = (row * 5 + col * 7) % 3 === 0 ? '#a84431' : (row + col) % 2 === 0 ? '#8c3323' : '#7b2c1f';
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.arc(x + tileW / 2, y + tileH / 2, tileW * 0.56, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'rgba(42, 16, 12, 0.38)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }
  } else if (kind === 'thatch') {
    ctx.fillStyle = '#b99352';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 240; i++) {
      const x = seededNoise(i, 1, 5) * 256;
      const y = seededNoise(i, 2, 5) * 256;
      const len = 18 + seededNoise(i, 3, 5) * 28;
      ctx.strokeStyle = i % 3 === 0 ? '#9c773a' : i % 2 === 0 ? '#cfa968' : '#85642e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (seededNoise(i, 4, 5) - 0.5) * 6, y + len);
      ctx.stroke();
    }
  } else if (kind === 'meadow-earth') {
    ctx.fillStyle = '#8db373';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 220; i++) {
      const x = seededNoise(i, 1, 11) * 256;
      const y = seededNoise(i, 2, 11) * 256;
      const r = 4 + seededNoise(i, 3, 11) * 14;
      ctx.fillStyle =
        i % 4 === 0
          ? 'rgba(104, 148, 76, 0.35)'
          : i % 4 === 1
          ? 'rgba(167, 198, 126, 0.32)'
          : i % 4 === 2
          ? 'rgba(128, 116, 86, 0.16)'
          : 'rgba(72, 118, 56, 0.22)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'tennis-clay') {
    ctx.fillStyle = '#c8643a';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 160; i++) {
      const x = seededNoise(i, 1, 13) * 256;
      const y = seededNoise(i, 2, 13) * 256;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(235, 145, 95, 0.2)' : 'rgba(150, 62, 32, 0.18)';
      ctx.fillRect(x, y, 4, 4);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, 220, 220);
    ctx.beginPath();
    ctx.moveTo(128, 18);
    ctx.lineTo(128, 238);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18, 128);
    ctx.lineTo(238, 128);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#f6eedc';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(161, 134, 96, 0.25)';
    ctx.lineWidth = 1;
    for (let y = 16; y < 256; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Recursively tags a group and every child mesh with `userData.hotspotId`
 * for accurate raycasting AND live Box3 label anchoring.
 */
export function tagHotspotGroup(obj: THREE.Object3D, hotspotId: string): void {
  obj.userData.hotspotId = hotspotId;
  obj.traverse((child) => {
    child.userData.hotspotId = hotspotId;
  });
}

/**
 * Signature vivid blue floor selection halo ring (dynamically scaled per selected object).
 */
export function createSelectionRing(radius = 0.95): THREE.Mesh {
  const geo = new THREE.RingGeometry(radius * 0.72, radius, 40);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x1d63ed,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.06;
  return mesh;
}

/**
 * Subtle dark soft oval contact shadow disc placed under major objects for crisp grounding.
 */
export function createContactShadow(rx = 1.0, rz = 1.0, opacity = 0.22): THREE.Mesh {
  const geo = new THREE.CircleGeometry(1, 24);
  geo.rotateX(-Math.PI / 2);
  geo.scale(rx, 1, rz);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(geo, mat);
  shadow.position.y = 0.018;
  return shadow;
}

export interface DioramaBaseOptions {
  width?: number;
  depth?: number;
  floorKind?: DioramaTextureKind;
  floorColor?: number;
  plinthColor?: number;
  cutawayWalls?: boolean;
  wallColor?: number;
  wallHeight?: number;
  splitWoodZone?: boolean;
  terrainRelief?: number;
}

/**
 * Clean architectural isometric plinth base with optional organic terrain relief
 * or clean cutaway interior studio walls.
 */
export function createDioramaBase(opts: DioramaBaseOptions = {}): THREE.Group {
  const {
    width = 11.4,
    depth = 10.2,
    floorKind = 'tile-grid',
    floorColor = 0xffffff,
    plinthColor = 0xdbe3ee,
    cutawayWalls = false,
    wallColor = 0xf4f5f7,
    wallHeight = 4.2,
    splitWoodZone = false,
    terrainRelief = 0,
  } = opts;

  const group = new THREE.Group();

  // Layered beveled plinth pedestal
  const plinthGeo = new THREE.BoxGeometry(width + 0.42, 0.56, depth + 0.42);
  const plinthMat = new THREE.MeshStandardMaterial({
    color: plinthColor,
    roughness: 0.85,
    metalness: 0.04,
  });
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.position.y = -0.34;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Thin crisp rim trim around top of plinth
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.48, 0.08, depth + 0.48),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65 })
  );
  trim.position.y = -0.05;
  group.add(trim);

  // Main ground slab (optionally gently sculpted with undulating terrain relief)
  const floorTex = createDioramaTexture(floorKind, Math.round(width / 2), Math.round(depth / 2));
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    color: floorColor,
    roughness: floorKind === 'water-ripple' ? 0.24 : 0.84,
    metalness: floorKind === 'water-ripple' ? 0.14 : 0.02,
  });

  if (terrainRelief > 0) {
    const segs = 28;
    const planeGeo = new THREE.PlaneGeometry(width, depth, segs, segs);
    planeGeo.rotateX(-Math.PI / 2);
    const pos = planeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const edgeFadeX = Math.max(0, 1 - Math.pow(Math.abs(x) / (width * 0.5), 4));
      const edgeFadeZ = Math.max(0, 1 - Math.pow(Math.abs(z) / (depth * 0.5), 4));
      const h =
        (Math.sin(x * 0.55) * Math.cos(z * 0.52) * 0.5 + Math.sin((x + z) * 0.35) * 0.5) *
        terrainRelief *
        edgeFadeX *
        edgeFadeZ;
      pos.setY(i, Math.max(0, h));
    }
    planeGeo.computeVertexNormals();
    const terrain = new THREE.Mesh(planeGeo, floorMat);
    terrain.position.y = 0.005;
    terrain.receiveShadow = true;
    group.add(terrain);
    // Solid fill slab beneath terrain relief
    const underSlab = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.12, depth),
      new THREE.MeshStandardMaterial({ color: plinthColor, roughness: 0.9 })
    );
    underSlab.position.y = -0.05;
    group.add(underSlab);
  } else {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), floorMat);
    floor.position.y = -0.04;
    floor.receiveShadow = true;
    group.add(floor);
  }

  // Optional warm split hardwood zone
  if (splitWoodZone) {
    const woodTex = createDioramaTexture('wood-plank', 2, 4);
    const woodFloor = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.36, 0.135, depth - 0.08),
      new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.72 })
    );
    woodFloor.position.set(-width * 0.315, -0.035, 0);
    woodFloor.receiveShadow = true;
    group.add(woodFloor);
  }

  // Optional crisp isometric L-shaped cutaway studio walls
  if (cutawayWalls) {
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.88,
      metalness: 0.02,
    });
    const wallT = 0.24;
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(width + wallT, wallHeight, wallT), wallMat);
    backWall.position.set(0, wallHeight / 2 - 0.02, -depth / 2 - wallT / 2 + 0.04);
    backWall.receiveShadow = true;
    group.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallHeight, depth + wallT), wallMat);
    leftWall.position.set(-width / 2 - wallT / 2 + 0.04, wallHeight / 2 - 0.02, 0);
    leftWall.receiveShadow = true;
    group.add(leftWall);

    // Subtle baseboard molding
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 });
    const baseBack = new THREE.Mesh(new THREE.BoxGeometry(width, 0.16, 0.06), baseMat);
    baseBack.position.set(0, 0.08, -depth / 2 + 0.05);
    const baseLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, depth), baseMat);
    baseLeft.position.set(-width / 2 + 0.05, 0.08, 0);
    group.add(baseBack, baseLeft);
  }

  return group;
}

/**
 * Organic sculpted limestone karst mountain built from displaced multi-lobe BufferGeometry
 * with rock strata, mossy ledges, boulders, and optional authentic vaulted cave entrance.
 * ZERO sharp pyramids / ConeGeometry!
 */
export interface LimestoneMountainOptions {
  height?: number;
  radius?: number;
  rockColor?: number;
  mossColor?: number;
  seed?: number;
  withCaveArch?: boolean;
  snowCapColor?: number;
}

export function createLimestoneKarstMountain(
  opts: LimestoneMountainOptions = {}
): { group: THREE.Group; caveGroup?: THREE.Group } {
  const {
    height = 3.2,
    radius = 1.9,
    rockColor = 0x5c6f73,
    mossColor = 0x2d6a4f,
    seed = 1,
    withCaveArch = false,
    snowCapColor,
  } = opts;

  const group = new THREE.Group();

  const rockTex = createDioramaTexture('limestone-rock', 2, 2);
  const rockMat = new THREE.MeshStandardMaterial({
    map: rockTex,
    color: rockColor,
    roughness: 0.9,
    metalness: 0.04,
    flatShading: true,
  });

  // Sculpt primary organic karst mass from displaced hemisphere-dome BufferGeometry
  const buildRockLobe = (rx: number, ry: number, rz: number, lSeed: number): THREE.Mesh => {
    const geo = new THREE.SphereGeometry(1, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.54);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const angle = Math.atan2(z, x);
      const elev = Math.max(0, y);
      // Karst limestone crags: steep flanks, stepped terraces, organic ridge crests
      const ridgeWave =
        1 +
        0.18 * Math.sin(angle * 3 + lSeed * 1.7) +
        0.12 * Math.cos(angle * 5 - lSeed * 2.3) +
        0.08 * Math.sin(elev * 8 + angle * 2 + lSeed);
      // Slight terracing along height
      const terrace = 1 - 0.06 * Math.sin(elev * Math.PI * 4);
      x *= rx * ridgeWave * terrace;
      z *= rz * ridgeWave * terrace;
      // Round-domed summit (authentic Vietnamese limestone karst, never needle-cone)
      y = Math.pow(elev, 0.82) * ry * (0.94 + 0.1 * Math.cos(angle * 2 + lSeed));
      if (y < 0.02) y = 0;
      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, rockMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Main karst dome + 2 asymmetric shoulder buttresses for natural silhouette
  const mainMass = buildRockLobe(radius, height, radius * 0.88, seed);
  group.add(mainMass);

  const shoulderL = buildRockLobe(radius * 0.68, height * 0.64, radius * 0.66, seed + 3.1);
  shoulderL.position.set(-radius * 0.58, 0, radius * 0.24);
  group.add(shoulderL);

  const shoulderR = buildRockLobe(radius * 0.62, height * 0.56, radius * 0.6, seed + 6.4);
  shoulderR.position.set(radius * 0.56, 0, -radius * 0.18);
  group.add(shoulderR);

  // Mossy foliage cushions perched naturally on upper rock ledges
  const mossMat = new THREE.MeshStandardMaterial({
    color: mossColor,
    roughness: 0.86,
    flatShading: true,
  });
  const mossCount = 7;
  for (let i = 0; i < mossCount; i++) {
    const a = (i / mossCount) * Math.PI * 2 + seed;
    const hRatio = 0.42 + (i % 3) * 0.18;
    const dist = radius * (1 - hRatio * 0.68) * 0.82;
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26 + (i % 3) * 0.1, 1), mossMat);
    bush.scale.set(1.3, 0.65, 1.15);
    bush.position.set(Math.cos(a) * dist, height * hRatio, Math.sin(a) * dist * 0.85);
    bush.castShadow = true;
    group.add(bush);
  }

  // Optional mist/cloud cap on high mountain tops (e.g. Tây Tiến)
  if (snowCapColor !== undefined) {
    const capMat = new THREE.MeshStandardMaterial({
      color: snowCapColor,
      roughness: 0.72,
      transparent: true,
      opacity: 0.78,
    });
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 0.32, 1), capMat);
      puff.scale.set(1.4, 0.45, 1.1);
      puff.position.set((i - 1) * radius * 0.35, height * 0.86 + (i % 2) * 0.12, (i % 2) * 0.2);
      group.add(puff);
    }
  }

  // Base karst scree boulders
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 1.8 + seed;
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24 + (i % 2) * 0.1, 0), rockMat);
    boulder.scale.set(1.2, 0.72, 1.0);
    boulder.position.set(Math.cos(a) * radius * 0.92, 0.14, Math.sin(a) * radius * 0.82);
    boulder.rotation.set(i * 0.4, i * 1.1, 0);
    group.add(boulder);
  }

  // Optional authentic sculpted Cave Mouth (Động Hương Tích / Limestone Grotto)
  let caveGroup: THREE.Group | undefined;
  if (withCaveArch) {
    caveGroup = new THREE.Group();
    const caveZ = radius * 0.72;

    // Vaulted rock archway frame
    const archMat = new THREE.MeshStandardMaterial({
      map: rockTex,
      color: 0x4b5c60,
      roughness: 0.92,
      flatShading: true,
    });
    const archTorus = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.28, 8, 16, Math.PI), archMat);
    archTorus.position.set(0, 0.56, caveZ);
    archTorus.castShadow = true;
    caveGroup.add(archTorus);

    // Side rock jambs grounding the cave arch
    for (const sx of [-0.74, 0.74]) {
      const jamb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 0), archMat);
      jamb.scale.set(0.95, 1.5, 1.1);
      jamb.position.set(sx, 0.34, caveZ + 0.04);
      caveGroup.add(jamb);
    }

    // Deep dark recessed cavern opening inside the cliff
    const cavityGeo = new THREE.CylinderGeometry(0.68, 0.74, 0.85, 14, 1, false, 0, Math.PI);
    cavityGeo.rotateZ(Math.PI / 2);
    cavityGeo.rotateY(Math.PI / 2);
    const darkCavity = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 18, 0, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x0b1219 })
    );
    darkCavity.position.set(0, 0.54, caveZ - 0.02);
    const darkBase = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 0.56),
      new THREE.MeshBasicMaterial({ color: 0x0b1219 })
    );
    darkBase.position.set(0, 0.28, caveZ - 0.02);
    caveGroup.add(darkCavity, darkBase);

    // Sculpted hanging limestone stalactites ("nhũ đá") along cave brow
    const stalMat = new THREE.MeshStandardMaterial({ color: 0x94a3a8, roughness: 0.72, flatShading: true });
    const stalOffsets = [-0.42, -0.18, 0.06, 0.32];
    stalOffsets.forEach((sx, idx) => {
      const len = 0.26 + (idx % 2) * 0.14;
      const stal = new THREE.Mesh(new THREE.ConeGeometry(0.06, len, 6), stalMat);
      stal.rotation.x = Math.PI;
      stal.position.set(sx, 1.12 - Math.abs(sx) * 0.28, caveZ + 0.12);
      caveGroup!.add(stal);
    });

    // Warm sanctuary glow inside cave mouth + mossy stone steps leading in
    const glowOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.8 })
    );
    glowOrb.position.set(0, 0.42, caveZ + 0.04);
    const caveLight = new THREE.PointLight(0xffb74d, 4.5, 6);
    caveLight.position.set(0, 0.58, caveZ + 0.35);
    caveGroup.add(glowOrb, caveLight);

    const stepMat = new THREE.MeshStandardMaterial({ color: 0xb6bec4, roughness: 0.85 });
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.18 + s * 0.14, 0.09, 0.28), stepMat);
      step.position.set(0, 0.18 - s * 0.06, caveZ + 0.26 + s * 0.26);
      step.receiveShadow = true;
      caveGroup.add(step);
    }

    group.add(caveGroup);
  }

  return { group, caveGroup };
}

/**
 * Legacy-compatible wrapper returning the organic karst mountain group directly
 * so no scene anywhere in the codebase ever uses a sharp cone!
 */
export function createSculptedMountain(
  height = 2.8,
  radius = 1.6,
  rockColor = 0x5f7470,
  capColor?: number
): THREE.Group {
  return createLimestoneKarstMountain({
    height,
    radius,
    rockColor,
    mossColor: 0x2f6e49,
    seed: Math.round(height * 10 + radius * 7),
    snowCapColor: capColor,
  }).group;
}

/**
 * Organic meandering river/stream built from a CatmullRomCurve3 spline ribbon
 * with raised natural grassy/stone banks, riverside boulders, subtle whitewater foam,
 * and scrollable water ripple texture for smooth flowing animation!
 */
export interface WindingRiverOptions {
  points: [number, number][];
  width?: number;
  waterColor?: number;
  bankColor?: number;
}

export function createWindingRiver(opts: WindingRiverOptions): {
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  waterTexture: THREE.CanvasTexture;
} {
  const { points, width = 1.65, waterColor = 0x2694bf, bankColor = 0x739c5d } = opts;
  const group = new THREE.Group();

  const curvePts = points.map(([x, z]) => new THREE.Vector3(x, 0.06, z));
  const curve = new THREE.CatmullRomCurve3(curvePts);
  const samples = 44;

  const buildRibbon = (halfW: number, yPos: number, bevelY = 0): THREE.BufferGeometry => {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const p = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const perpX = -tangent.z;
      const perpZ = tangent.x;
      // Gentle natural width variation
      const wMod = 1 + 0.12 * Math.sin(u * Math.PI * 3);
      const hw = halfW * wMod;

      positions.push(
        p.x - perpX * hw,
        yPos + bevelY,
        p.z - perpZ * hw,
        p.x + perpX * hw,
        yPos + bevelY,
        p.z + perpZ * hw
      );
      uvs.push(0, u * 4, 1, u * 4);

      if (i < samples) {
        const base = i * 2;
        indices.push(base, base + 2, base + 1);
        indices.push(base + 1, base + 2, base + 3);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  // Outer natural bank berm (slightly raised earth/grass margin)
  const bankGeo = buildRibbon(width * 0.66, 0.032);
  const bankMat = new THREE.MeshStandardMaterial({
    color: bankColor,
    roughness: 0.92,
  });
  const bankMesh = new THREE.Mesh(bankGeo, bankMat);
  bankMesh.receiveShadow = true;
  group.add(bankMesh);

  // Inner shimmering water surface
  const waterTexture = createDioramaTexture('water-ripple', 1.4, 3.6);
  const waterGeo = buildRibbon(width * 0.5, 0.075);
  const waterMat = new THREE.MeshStandardMaterial({
    map: waterTexture,
    color: waterColor,
    roughness: 0.16,
    metalness: 0.18,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // Riverbank pebbles & reeds along both sides
  const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x8e989e, roughness: 0.85, flatShading: true });
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x4d7c3f, roughness: 0.8 });
  for (let i = 2; i < samples; i += 4) {
    const u = i / samples;
    const p = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const perpX = -tangent.z;
    const perpZ = tangent.x;
    const side = i % 8 === 2 ? 1 : -1;
    const edgeDist = width * 0.56 + seededNoise(i, 1, 4) * 0.16;

    const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11 + (i % 3) * 0.03, 0), pebbleMat);
    pebble.scale.set(1.2, 0.55, 0.9);
    pebble.position.set(p.x + perpX * side * edgeDist, 0.06, p.z + perpZ * side * edgeDist);
    group.add(pebble);

    if (i % 8 === 2) {
      for (let r = 0; r < 3; r++) {
        const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.025, 0.38 + r * 0.07, 5), reedMat);
        blade.position.set(
          p.x - perpX * side * (edgeDist + 0.05) + (r - 1) * 0.06,
          0.2,
          p.z - perpZ * side * (edgeDist + 0.05)
        );
        blade.rotation.z = (r - 1) * 0.18;
        group.add(blade);
      }
    }
  }

  return { group, curve, waterTexture };
}

/**
 * Dynamic subdivided ocean/river surface whose vertices undulate gently in `updateOcean`.
 */
export function createAnimatedOceanSurface(
  width = 12.0,
  depth = 10.4,
  color = 0x1678a8
): {
  mesh: THREE.Mesh;
  updateWaves: (t: number, amplitude?: number) => void;
} {
  const waterTex = createDioramaTexture('water-ripple', 5, 4);
  const geo = new THREE.PlaneGeometry(width, depth, 28, 24);
  geo.rotateX(-Math.PI / 2);
  const baseY = new Float32Array(geo.attributes.position.count);

  const mat = new THREE.MeshStandardMaterial({
    map: waterTex,
    color,
    roughness: 0.2,
    metalness: 0.18,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.06;
  mesh.receiveShadow = true;

  const updateWaves = (t: number, amplitude = 0.08) => {
    waterTex.offset.x = (t * 0.06) % 1;
    waterTex.offset.y = (t * 0.035) % 1;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const wave =
        Math.sin(x * 0.9 + t * 1.8) * Math.cos(z * 0.7 - t * 1.3) * amplitude +
        Math.sin((x + z) * 0.55 + t * 2.2) * amplitude * 0.45;
      pos.setY(i, baseY[i] + wave);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };

  return { mesh, updateWaves };
}

/**
 * Sculpted authentic curved Vietnamese roof (`mái đao cong võng`) built with custom
 * displaced BufferGeometry — concave swooping slopes + upturned eaves + carved ridge beam!
 * ZERO pyramid cones!
 */
export function createCurvedVietnameseRoof(opts: {
  width?: number;
  depth?: number;
  height?: number;
  roofColor?: number;
  ridgeColor?: number;
}): THREE.Group {
  const { width = 3.2, depth = 2.4, height = 0.92, roofColor = 0x9b3a29, ridgeColor = 0xd9a05b } = opts;
  const group = new THREE.Group();

  const segX = 18;
  const segZ = 14;
  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const hw = width / 2;
  const hd = depth / 2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const nx = Math.abs(x) / hw; // 0..1
    const nz = Math.abs(z) / hd; // 0..1

    // Hip-and-gable roof profile with graceful concave curve ("mái võng")
    const ridgeLine = Math.max(0, 1 - Math.max(nz, Math.max(0, (nx - 0.35) / 0.65)));
    const concaveHeight = Math.pow(ridgeLine, 1.35) * height;
    // Signature Vietnamese upturned corner eaves ("đao cong")
    const cornerFactor = Math.pow(nx * nz, 2.4);
    const eaveLift = cornerFactor * height * 0.34;
    // Gentle saddle dip along main ridge
    const ridgeDip = (1 - nz) * (1 - nx) * 0.04;

    pos.setY(i, concaveHeight + eaveLift - ridgeDip);
  }
  geo.computeVertexNormals();

  const tileTex = createDioramaTexture('curved-tile', Math.max(2, Math.round(width)), Math.max(2, Math.round(depth)));
  const roofMat = new THREE.MeshStandardMaterial({
    map: tileTex,
    color: roofColor,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
  const roofMesh = new THREE.Mesh(geo, roofMat);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  group.add(roofMesh);

  // Dark wooden underside ceiling soffit
  const soffit = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.86, 0.06, depth * 0.84),
    new THREE.MeshStandardMaterial({ color: 0x4a2716, roughness: 0.85 })
  );
  soffit.position.y = 0.04;
  group.add(soffit);

  // Sculpted ridge beam ("bờ nóc") with upturned dragon finials ("đầu kìm")
  const ridgeMat = new THREE.MeshStandardMaterial({ color: ridgeColor, roughness: 0.52, metalness: 0.18 });
  const ridgeLen = width * 0.38;
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(ridgeLen, 0.1, 0.12), ridgeMat);
  ridge.position.y = height + 0.01;
  group.add(ridge);

  for (const sx of [-ridgeLen / 2, ridgeLen / 2]) {
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.24, 6), ridgeMat);
    finial.position.set(sx, height + 0.12, 0);
    finial.rotation.z = sx < 0 ? 0.35 : -0.35;
    group.add(finial);
  }

  return group;
}

/**
 * Authentic Traditional Vietnamese Temple / Pagoda ("Chùa / Đền cổ mái đao cong chồng diêm"):
 * Stepped stone terrace, red lacquered columns, gilded horizontal plaque, double curved tiled roofs,
 * stone steps, bronze incense burner, and warm hanging lanterns.
 */
export function createVietnameseTemple(scale = 1, roofTint = 0x9f3726): THREE.Group {
  const g = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    map: createDioramaTexture('stone-brick', 3, 2),
    color: 0xd9d2c5,
    roughness: 0.86,
  });
  const redWood = new THREE.MeshStandardMaterial({ color: 0x7c1f1a, roughness: 0.56 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x4b2615, roughness: 0.72 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe6a832, roughness: 0.38, metalness: 0.42 });

  // Stepped stone foundation platform
  const base1 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.24, 2.7), stoneMat);
  base1.position.y = 0.12;
  base1.receiveShadow = true;
  base1.castShadow = true;
  g.add(base1);

  const base2 = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.2, 2.3), stoneMat);
  base2.position.y = 0.34;
  base2.receiveShadow = true;
  g.add(base2);

  // Front stone stairs + sculpted side stone balustrades
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.12, 0.28), stoneMat);
    step.position.set(0, 0.34 - s * 0.11, 1.24 + s * 0.24);
    step.receiveShadow = true;
    g.add(step);
  }
  for (const sx of [-0.66, 0.66]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.76), stoneMat);
    rail.position.set(sx, 0.24, 1.48);
    rail.rotation.x = 0.26;
    g.add(rail);
  }

  // Carved sanctuary hall walls with wooden lattice doors ("cửa bức bàn")
  const hall = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 1.32, 1.55),
    new THREE.MeshStandardMaterial({ color: 0xf4ead6, roughness: 0.85 })
  );
  hall.position.set(0, 1.1, -0.14);
  hall.castShadow = true;
  hall.receiveShadow = true;
  g.add(hall);

  // Three carved red wooden doors across the sanctuary front
  for (const dx of [-0.64, 0, 0.64]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.96, 0.08), redWood);
    door.position.set(dx, 0.92, 0.65);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.1), goldMat);
    frame.position.set(dx, 1.14, 0.66);
    g.add(door, frame);
  }

  // Lacquered verandah pillars on stone plinth bases
  const pillarX = [-1.22, -0.45, 0.45, 1.22];
  for (const x of pillarX) {
    for (const z of [-0.94, 0.94]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 1.38, 12), redWood);
      col.position.set(x, 1.13, z);
      col.castShadow = true;
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.1, 10), stoneMat);
      foot.position.set(x, 0.48, z);
      g.add(col, foot);
    }
  }

  // Horizontal lacquered tie beam + gilded plaque ("Hoành phi")
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.14, 0.16), darkWood);
  beam.position.set(0, 1.78, 0.94);
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.3, 0.08), goldMat);
  plaque.position.set(0, 1.62, 0.99);
  g.add(beam, plaque);

  // Lower curved-eave roof tier
  const lowerRoof = createCurvedVietnameseRoof({
    width: 3.7,
    depth: 2.85,
    height: 0.78,
    roofColor: roofTint,
    ridgeColor: 0xdba159,
  });
  lowerRoof.position.y = 1.76;
  g.add(lowerRoof);

  // Upper clerestory ("cổ diêm") + upper curved-eave roof tier ("chồng diêm")
  const clerestory = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.46, 1.28), redWood);
  clerestory.position.y = 2.52;
  clerestory.castShadow = true;
  g.add(clerestory);

  const upperRoof = createCurvedVietnameseRoof({
    width: 2.55,
    depth: 1.92,
    height: 0.72,
    roofColor: roofTint,
    ridgeColor: 0xe6ad48,
  });
  upperRoof.position.y = 2.68;
  g.add(upperRoof);

  // Hanging red-gold courtyard lanterns under front eaves
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.95,
    roughness: 0.4,
  });
  for (const lx of [-0.92, 0.92]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 6), darkWood);
    cord.position.set(lx, 1.68, 1.15);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), lanternMat);
    lantern.scale.set(0.85, 1.15, 0.85);
    lantern.position.set(lx, 1.5, 1.15);
    g.add(cord, lantern);
  }

  // Bronze incense burner ("lư hương") in front of stairs
  const burner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.14, 0.34, 12),
    new THREE.MeshStandardMaterial({ color: 0x8c6239, metalness: 0.55, roughness: 0.42 })
  );
  burner.position.set(0, 0.22, 2.02);
  burner.castShadow = true;
  g.add(burner);

  g.add(createContactShadow(2.1, 1.7, 0.2));
  g.scale.setScalar(scale);
  return g;
}

/**
 * Authentic 3-bay Vietnamese tiled-roof house ("Nhà 3 gian mái ngói") with front porch,
 * wooden columns, shutters, sculpted gable roof with terracotta tiles & ridge beam.
 */
export function createTiledHouse(scale = 1, wallColor = 0xf4e8d2): THREE.Group {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.86 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c341d, roughness: 0.72 });
  const tileTex = createDioramaTexture('curved-tile', 4, 2);
  const roofMat = new THREE.MeshStandardMaterial({ map: tileTex, color: 0xb24a31, roughness: 0.74 });

  // Raised brick plinth & front verandah ("hiên")
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(3.45, 0.24, 2.35),
    new THREE.MeshStandardMaterial({ map: createDioramaTexture('stone-brick', 3, 2), color: 0xb88f74, roughness: 0.88 })
  );
  plinth.position.y = 0.12;
  plinth.receiveShadow = true;
  g.add(plinth);

  // Main house body
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.15, 1.44, 1.68), wallMat);
  body.position.set(0, 0.96, -0.18);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Porch pillars & wooden doors/shutters
  for (const px of [-1.45, -0.5, 0.5, 1.45]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 1.38, 10), woodMat);
    post.position.set(px, 0.92, 0.94);
    post.castShadow = true;
    g.add(post);
  }
  const mainDoor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.05, 0.08), woodMat);
  mainDoor.position.set(0, 0.76, 0.68);
  g.add(mainDoor);

  for (const wx of [-1.02, 1.02]) {
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.08), woodMat);
    winFrame.position.set(wx, 1.02, 0.68);
    const shutter = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.42, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.75 })
    );
    shutter.position.set(wx, 1.02, 0.7);
    g.add(winFrame, shutter);
  }

  // Sculpted extruded triangular gable roof (authentic Vietnamese "mái ngói hai dốc")
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-1.38, 0);
  roofShape.lineTo(0, 0.95);
  roofShape.lineTo(1.38, 0);
  roofShape.lineTo(1.22, -0.08);
  roofShape.lineTo(0, 0.78);
  roofShape.lineTo(-1.22, -0.08);
  roofShape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: 3.65,
    bevelEnabled: false,
  });
  roofGeo.translate(0, 0, -1.825);
  roofGeo.rotateY(Math.PI / 2);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.set(0, 1.62, 0.08);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  g.add(roofMesh);

  // Gable end-wall triangles filling both sides cleanly
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-0.84, 0);
  gableShape.lineTo(0, 0.82);
  gableShape.lineTo(0.84, 0);
  gableShape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 3.16, bevelEnabled: false });
  gableGeo.translate(0, 0, -1.58);
  gableGeo.rotateY(Math.PI / 2);
  const gableWall = new THREE.Mesh(gableGeo, wallMat);
  gableWall.position.set(0, 1.65, -0.18);
  g.add(gableWall);

  // Ridge beam on roof crest
  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(3.7, 0.1, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.7 })
  );
  ridge.position.set(0, 2.57, 0.08);
  g.add(ridge);

  g.add(createContactShadow(1.9, 1.35, 0.18));
  g.scale.setScalar(scale);
  return g;
}

/**
 * Authentic rural Vietnamese thatched cottage ("Nhà tranh vách đất") with sculpted layered straw roof,
 * bamboo rafters, low doorway, propped window shutter, and optional warm oil lamp glow.
 */
export function createThatchedCottage(scale = 1, warmLamp = false): THREE.Group {
  const g = new THREE.Group();
  const mudMat = new THREE.MeshStandardMaterial({ color: 0xc9b595, roughness: 0.94 });
  const thatchTex = createDioramaTexture('thatch', 3, 2);
  const thatchMat = new THREE.MeshStandardMaterial({ map: thatchTex, color: 0xba9654, roughness: 0.95 });
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x6b4b28, roughness: 0.85 });

  // Earthen mound base
  const mound = new THREE.Mesh(
    new THREE.BoxGeometry(2.85, 0.16, 2.05),
    new THREE.MeshStandardMaterial({ color: 0x9c886e, roughness: 0.96 })
  );
  mound.position.y = 0.08;
  mound.receiveShadow = true;
  g.add(mound);

  // Mud-and-bamboo cottage body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.48, 1.24, 1.66), mudMat);
  body.position.y = 0.78;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Exposed corner bamboo posts
  for (const bx of [-1.22, 1.22]) {
    for (const bz of [-0.82, 0.82]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 1.28, 8), bambooMat);
      post.position.set(bx, 0.78, bz);
      g.add(post);
    }
  }

  // Doorway + warm interior oil lamp light
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.92, 0.08),
    new THREE.MeshStandardMaterial({
      color: warmLamp ? 0xffb347 : 0x3b2616,
      emissive: warmLamp ? 0xea580c : 0x000000,
      emissiveIntensity: warmLamp ? 0.95 : 0,
    })
  );
  door.position.set(-0.24, 0.62, 0.83);
  g.add(door);

  // Propped-open bamboo window ("cửa liếp chống gậy")
  const winOpen = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.42, 0.06),
    new THREE.MeshStandardMaterial({
      color: warmLamp ? 0xfdba74 : 0x291c12,
      emissive: warmLamp ? 0xd97706 : 0x000000,
      emissiveIntensity: warmLamp ? 0.75 : 0,
    })
  );
  winOpen.position.set(0.66, 0.86, 0.83);
  const awning = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.44), thatchMat);
  awning.position.set(0.66, 1.04, 1.02);
  awning.rotation.x = 0.35;
  g.add(winOpen, awning);

  // Sculpted rounded thatched gable roof (thick organic overhanging straw eaves)
  const rShape = new THREE.Shape();
  rShape.moveTo(-1.26, -0.08);
  rShape.quadraticCurveTo(-0.55, 0.56, 0, 1.06);
  rShape.quadraticCurveTo(0.55, 0.56, 1.26, -0.08);
  rShape.lineTo(1.06, -0.16);
  rShape.lineTo(0, 0.78);
  rShape.lineTo(-1.06, -0.16);
  rShape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(rShape, { depth: 3.1, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 });
  roofGeo.translate(0, 0, -1.55);
  roofGeo.rotateY(Math.PI / 2);
  const roof = new THREE.Mesh(roofGeo, thatchMat);
  roof.position.set(0, 1.38, 0);
  roof.castShadow = true;
  roof.receiveShadow = true;
  g.add(roof);

  g.add(createContactShadow(1.6, 1.25, 0.18));
  g.scale.setScalar(scale);
  return g;
}

/**
 * Authentic Tây Nguyên Ê Đê Stilt Longhouse ("Nhà dài Ê Đê"):
 * Carved timber stilts, boat-curved overhanging thatch roof, front porch deck, carved wooden stair.
 */
export function createEdeLonghouse(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const darkTimber = new THREE.MeshStandardMaterial({ color: 0x4e2d18, roughness: 0.84 });
  const wallWood = new THREE.MeshStandardMaterial({ color: 0x6c4223, roughness: 0.86 });
  const thatchMat = new THREE.MeshStandardMaterial({
    map: createDioramaTexture('thatch', 4, 2),
    color: 0xa47d43,
    roughness: 0.94,
  });

  // Raised wooden floor deck on stilts
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 2.2), darkTimber);
  deck.position.y = 0.72;
  deck.castShadow = true;
  deck.receiveShadow = true;
  g.add(deck);

  for (const sx of [-2.4, -1.2, 0, 1.2, 2.4]) {
    for (const sz of [-0.88, 0.88]) {
      const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.74, 8), darkTimber);
      stilt.position.set(sx, 0.37, sz);
      stilt.castShadow = true;
      g.add(stilt);
    }
  }

  // Timber cabin body (leaving open front porch on the right)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.12, 1.82), wallWood);
  cabin.position.set(-0.55, 1.34, 0);
  cabin.castShadow = true;
  g.add(cabin);

  // Carved wooden entrance ladder ("cầu thang gỗ Ê Đê")
  const stair = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.1, 0.44), darkTimber);
  stair.position.set(2.95, 0.4, 0.25);
  stair.rotation.z = -0.68;
  g.add(stair);

  // Iconic boat-curved longhouse thatched roof sweeping low over the walls
  const segX = 18;
  const segZ = 12;
  const rGeo = new THREE.PlaneGeometry(5.9, 2.95, segX, segZ);
  rGeo.rotateX(-Math.PI / 2);
  const pos = rGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const nx = x / 2.95; // -1..1
    const nz = Math.abs(z) / 1.475; // 0..1
    const ridgeH = (1 - Math.pow(nz, 0.9)) * 1.48;
    // Slight upward sweep at both gable ends
    const bowLift = Math.pow(Math.abs(nx), 2.2) * (1 - nz) * 0.26;
    pos.setY(i, ridgeH + bowLift);
  }
  rGeo.computeVertexNormals();
  const roof = new THREE.Mesh(rGeo, thatchMat);
  roof.position.set(-0.22, 1.56, 0);
  roof.castShadow = true;
  roof.receiveShadow = true;
  g.add(roof);

  // Decorative woven red-gold brocade banner on front gable
  const brocade = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.72, 0.92),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 })
  );
  brocade.position.set(1.52, 1.5, 0);
  g.add(brocade);

  g.add(createContactShadow(3.0, 1.35, 0.2));
  g.scale.setScalar(scale);
  return g;
}

/**
 * Classical Greek Marble Colonnade & Pediment for Prometheus ("Prô-mê-tê và loài người").
 */
export function createGreekColonnade(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const marble = new THREE.MeshStandardMaterial({ color: 0xf1ece1, roughness: 0.48, metalness: 0.05 });
  const warmMarble = new THREE.MeshStandardMaterial({ color: 0xe2d8c5, roughness: 0.58 });

  // Three-step stylobate
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(4.4 - i * 0.3, 0.14, 2.5 - i * 0.22), warmMarble);
    step.position.y = 0.07 + i * 0.14;
    step.receiveShadow = true;
    g.add(step);
  }

  // 4 fluted Doric columns with torus base & abacus capital
  for (const x of [-1.45, -0.48, 0.48, 1.45]) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.25, 14), marble);
    shaft.position.set(x, 1.54, 0);
    shaft.castShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.42), marble);
    cap.position.set(x, 2.7, 0);
    const colBase = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.22, 0.1, 14), warmMarble);
    colBase.position.set(x, 0.46, 0);
    g.add(shaft, cap, colBase);
  }

  // Architrave + sculpted triangular pediment
  const architrave = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.28, 0.62), marble);
  architrave.position.y = 2.9;
  architrave.castShadow = true;
  g.add(architrave);

  const pedShape = new THREE.Shape();
  pedShape.moveTo(-2.05, 0);
  pedShape.lineTo(0, 0.72);
  pedShape.lineTo(2.05, 0);
  pedShape.closePath();
  const pedGeo = new THREE.ExtrudeGeometry(pedShape, { depth: 0.66, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 });
  pedGeo.translate(0, 0, -0.33);
  const pediment = new THREE.Mesh(pedGeo, marble);
  pediment.position.y = 3.04;
  pediment.castShadow = true;
  g.add(pediment);

  g.add(createContactShadow(2.2, 1.35, 0.18));
  g.scale.setScalar(scale);
  return g;
}

/**
 * Natural curved wooden boat / sampan ("Thuyền gỗ / Đò suối Yến / Thuyền vượt biển")
 * built with lofted curved bow & stern — NEVER a rectangular block!
 */
export function createWoodenBoat(
  length = 2.2,
  hullColor = 0x7c4a26,
  sailColor = 0xfef3c7,
  withSail = true,
  withCanopy = false
): THREE.Group {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: hullColor, roughness: 0.68 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x4a2914, roughness: 0.78 });

  // Sculpted curved sampan hull via ExtrudeGeometry along arched boat plan
  const boatShape = new THREE.Shape();
  const hl = length * 0.5;
  const hw = length * 0.17;
  boatShape.moveTo(-hl, 0);
  boatShape.quadraticCurveTo(-hl * 0.45, hw, 0, hw);
  boatShape.quadraticCurveTo(hl * 0.45, hw, hl, 0);
  boatShape.quadraticCurveTo(hl * 0.45, -hw, 0, -hw);
  boatShape.quadraticCurveTo(-hl * 0.45, -hw, -hl, 0);

  const hullGeo = new THREE.ExtrudeGeometry(boatShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 3,
  });
  hullGeo.rotateX(Math.PI / 2);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.26;
  hull.castShadow = true;
  hull.receiveShadow = true;
  g.add(hull);

  // Curved upturned bow & stern tips
  for (const sx of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.ConeGeometry(hw * 0.45, 0.36, 8), trimMat);
    tip.position.set(sx * (hl - 0.05), 0.34, 0);
    tip.rotation.z = -sx * 1.15;
    g.add(tip);
  }

  // Interior wooden bench thwarts
  for (const bx of [-hl * 0.35, 0, hl * 0.35]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, hw * 1.65), trimMat);
    bench.position.set(bx, 0.29, 0);
    g.add(bench);
  }

  // Rowing oar resting naturally along starboard
  const oarShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, length * 0.72, 6), trimMat);
  oarShaft.rotation.z = Math.PI / 2 - 0.22;
  oarShaft.rotation.y = 0.35;
  oarShaft.position.set(0.15, 0.32, hw * 1.15);
  g.add(oarShaft);

  // Optional woven bamboo passenger canopy ("mui thuyền")
  if (withCanopy) {
    const canopyGeo = new THREE.CylinderGeometry(hw * 0.92, hw * 0.95, length * 0.42, 12, 1, true, 0, Math.PI);
    canopyGeo.rotateZ(Math.PI / 2);
    const canopy = new THREE.Mesh(
      canopyGeo,
      new THREE.MeshStandardMaterial({
        map: createDioramaTexture('thatch', 2, 1),
        color: 0xc29b62,
        roughness: 0.9,
        side: THREE.DoubleSide,
      })
    );
    canopy.position.set(-0.08, 0.28, 0);
    canopy.castShadow = true;
    g.add(canopy);
  }

  // Optional curved billowing sail
  if (withSail) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.044, length * 0.95, 8), trimMat);
    mast.position.set(0.08, length * 0.55, 0);
    mast.castShadow = true;
    g.add(mast);

    const sailGeo = new THREE.PlaneGeometry(length * 0.56, length * 0.66, 8, 8);
    const sp = sailGeo.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const u = sp.getX(i) / (length * 0.28);
      const v = sp.getY(i) / (length * 0.33);
      const billow = Math.cos(u * Math.PI * 0.48) * Math.cos(v * Math.PI * 0.48) * 0.22;
      sp.setZ(i, billow);
    }
    sailGeo.computeVertexNormals();
    const sail = new THREE.Mesh(
      sailGeo,
      new THREE.MeshStandardMaterial({ color: sailColor, roughness: 0.62, side: THREE.DoubleSide })
    );
    sail.position.set(0.2, length * 0.6, 0);
    sail.rotation.y = Math.PI / 2;
    sail.castShadow = true;
    g.add(sail);
  }

  return g;
}

/**
 * Culturally expressive articulated 3D character with distinct Vietnamese, Ede, Greek,
 * or historical silhouette — including wooden neck cangue ("gông gỗ") & shackles for Huấn Cao!
 */
export interface CharacterOptions {
  robeColor?: number;
  accentColor?: number;
  skinColor?: number;
  hairColor?: number;
  scale?: number;
  pose?: 'standing' | 'bowing' | 'heroic' | 'seated' | 'holding-tray' | 'writing-brush' | 'cangue-prisoner';
  headgear?: 'none' | 'hat-non' | 'turban' | 'bun' | 'helmet' | 'crown' | 'khan-dong';
  prop?: 'none' | 'torch' | 'shield' | 'scroll' | 'racket' | 'spear' | 'brush' | 'oar';
}

export function createArticulatedFigure(opts: CharacterOptions = {}): THREE.Group {
  const {
    robeColor = 0x1e3a5f,
    accentColor = 0xd97706,
    skinColor = 0xf2cfb3,
    hairColor = 0x1e1b18,
    scale = 1,
    pose = 'standing',
    headgear = 'none',
    prop = 'none',
  } = opts;

  const group = new THREE.Group();
  const robeMat = new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.7 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.52 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.62 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.78 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.85 });

  // Grounded boots / feet & lower trousers
  const legH = pose === 'seated' ? 0.34 : 0.64;
  for (const sx of [-0.11, 0.11]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.062, legH, 10), shoeMat);
    leg.position.set(sx, legH / 2, pose === 'seated' ? 0.14 : 0);
    if (pose === 'seated') leg.rotation.x = Math.PI / 2.2;
    leg.castShadow = true;
    group.add(leg);
  }

  // Flowing sculpted robe / tunic with flared hem & lapel collar
  const robeY = pose === 'seated' ? 0.68 : 0.94;
  const robeH = pose === 'seated' ? 0.86 : 1.06;
  const robeGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.32, 0),
      new THREE.Vector2(0.27, robeH * 0.35),
      new THREE.Vector2(0.21, robeH * 0.75),
      new THREE.Vector2(0.23, robeH * 0.95),
      new THREE.Vector2(0.11, robeH),
    ],
    16
  );
  const torso = new THREE.Mesh(robeGeo, robeMat);
  torso.position.y = robeY - robeH * 0.5;
  torso.castShadow = true;
  torso.receiveShadow = true;
  if (pose === 'bowing') torso.rotation.x = 0.36;
  group.add(torso);

  // Waist sash & front decorative panel (áo dài / thổ cẩm / quan phục)
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.12, 16), accentMat);
  sash.position.set(0, robeY - 0.04, pose === 'bowing' ? 0.06 : 0);
  if (pose === 'bowing') sash.rotation.x = 0.36;
  group.add(sash);

  const frontLapel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.58, 0.06), accentMat);
  frontLapel.position.set(0, robeY - 0.18, 0.22);
  if (pose === 'bowing') {
    frontLapel.position.z = 0.26;
    frontLapel.rotation.x = 0.36;
  }
  group.add(frontLapel);

  // Neck + sculpted Head + hair cap
  const headY = pose === 'seated' ? 1.32 : pose === 'bowing' ? 1.5 : 1.66;
  const headZ = pose === 'bowing' ? 0.25 : 0;

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.14, 10), skinMat);
  neck.position.set(0, headY - 0.16, headZ * 0.7);
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 16), skinMat);
  head.position.set(0, headY, headZ);
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.208, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
  hair.position.set(0, headY + 0.02, headZ - 0.02);
  hair.rotation.x = -0.18;
  group.add(hair);

  // Distinct cultural headgear
  if (headgear === 'hat-non') {
    const non = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 0.24, 24),
      new THREE.MeshStandardMaterial({ color: 0xe6d3a7, roughness: 0.78 })
    );
    non.position.set(0, headY + 0.22, headZ);
    non.castShadow = true;
    group.add(non);
  } else if (headgear === 'turban' || headgear === 'khan-dong') {
    const wrap = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.065, 10, 22),
      new THREE.MeshStandardMaterial({ color: headgear === 'khan-dong' ? 0x1e293b : accentColor, roughness: 0.72 })
    );
    wrap.rotation.x = Math.PI / 2;
    wrap.position.set(0, headY + 0.1, headZ);
    group.add(wrap);
  } else if (headgear === 'bun') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), hairMat);
    bun.position.set(0, headY + 0.17, headZ - 0.12);
    group.add(bun);
  } else if (headgear === 'helmet') {
    const helm = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: 0x4d6b3c, roughness: 0.78 })
    );
    helm.position.set(0, headY + 0.05, headZ);
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.29, 0.31, 0.03, 18),
      new THREE.MeshStandardMaterial({ color: 0x3f5a30, roughness: 0.82 })
    );
    brim.position.set(0, headY + 0.05, headZ);
    group.add(helm, brim);
  } else if (headgear === 'crown') {
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.16, 0.17, 8),
      new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.58, roughness: 0.3 })
    );
    crown.position.set(0, headY + 0.2, headZ);
    group.add(crown);
  }

  // Articulated sleeves & forearms with hands
  const armY = pose === 'seated' ? 1.02 : 1.3;
  const makeArm = (side: -1 | 1, rotZ: number, rotX: number) => {
    const armG = new THREE.Group();
    armG.position.set(side * 0.27, armY, headZ * 0.5);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.088, 0.5, 10), robeMat);
    sleeve.position.y = -0.22;
    sleeve.castShadow = true;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), skinMat);
    hand.position.y = -0.5;
    armG.add(sleeve, hand);
    armG.rotation.z = rotZ;
    armG.rotation.x = rotX;
    return armG;
  };

  if (pose === 'heroic') {
    group.add(makeArm(-1, 0.5, -0.35));
    group.add(makeArm(1, -0.95, -0.55));
  } else if (pose === 'holding-tray' || pose === 'writing-brush') {
    group.add(makeArm(-1, 0.24, -0.82));
    group.add(makeArm(1, -0.24, -0.88));
  } else if (pose === 'bowing') {
    group.add(makeArm(-1, 0.28, -0.68));
    group.add(makeArm(1, -0.28, -0.68));
  } else if (pose === 'cangue-prisoner') {
    group.add(makeArm(-1, 0.3, -0.78));
    group.add(makeArm(1, -0.3, -0.92));

    // Authentic heavy wooden neck cangue ("gông gỗ chữ nhật cổ Huấn Cao")
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x714726, roughness: 0.86 });
    const cangueBarL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 1.05), woodMat);
    cangueBarL.position.set(-0.22, headY - 0.17, 0.05);
    const cangueBarR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 1.05), woodMat);
    cangueBarR.position.set(0.22, headY - 0.17, 0.05);
    const cangueFront = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.12), woodMat);
    cangueFront.position.set(0, headY - 0.17, 0.48);
    const cangueBack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.12), woodMat);
    cangueBack.position.set(0, headY - 0.17, -0.38);
    cangueBarL.castShadow = true;
    cangueBarR.castShadow = true;
    group.add(cangueBarL, cangueBarR, cangueFront, cangueBack);

    // Iron ankle shackles ("xiềng chân")
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.72, roughness: 0.4 });
    for (const sx of [-0.11, 0.11]) {
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.022, 8, 14), ironMat);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.set(sx, 0.16, 0);
      group.add(cuff);
    }
    const chain = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.03), ironMat);
    chain.position.set(0, 0.14, 0.05);
    group.add(chain);
  } else {
    group.add(makeArm(-1, 0.18, -0.1));
    group.add(makeArm(1, -0.18, -0.1));
  }

  // Cultural props
  if (prop === 'torch') {
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.04, 0.85, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c3a21 })
    );
    stick.position.set(0.55, armY + 0.14, 0.25);
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.36, 10),
      new THREE.MeshStandardMaterial({ color: 0xff9b26, emissive: 0xff4500, emissiveIntensity: 1.6 })
    );
    flame.position.set(0.55, armY + 0.66, 0.25);
    group.add(stick, flame);
  } else if (prop === 'shield') {
    const shield = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.06, 20),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.45, roughness: 0.42 })
    );
    shield.rotation.z = Math.PI / 2;
    shield.position.set(-0.48, armY - 0.1, 0.26);
    shield.castShadow = true;
    group.add(shield);
  } else if (prop === 'scroll') {
    const scroll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.56, 10),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 })
    );
    scroll.rotation.z = Math.PI / 2;
    scroll.position.set(0, armY - 0.14, 0.42);
    group.add(scroll);
  } else if (prop === 'brush') {
    const brushShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.018, 0.42, 8),
      new THREE.MeshStandardMaterial({ color: 0x92400e })
    );
    brushShaft.position.set(0.24, armY - 0.28, 0.44);
    brushShaft.rotation.x = 0.5;
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.028, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    tip.rotation.x = Math.PI + 0.5;
    tip.position.set(0.24, armY - 0.48, 0.52);
    group.add(brushShaft, tip);
  } else if (prop === 'racket') {
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.44, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    handle.position.set(0.52, armY + 0.14, 0.2);
    const hoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.025, 8, 18),
      new THREE.MeshStandardMaterial({ color: 0xd97706 })
    );
    hoop.position.set(0.52, armY + 0.52, 0.2);
    group.add(handle, hoop);
  }

  group.add(createContactShadow(0.36, 0.36, 0.22));
  group.scale.setScalar(scale);
  return group;
}

/**
 * Natural organic multi-branch tree with curved trunk, root flare, and 3-tone foliage clusters.
 */
export function createLayeredTree(
  foliageColor = 0x2f7d4d,
  scale = 1,
  blossomColor?: number
): THREE.Group {
  const g = new THREE.Group();
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x62432a, roughness: 0.92 });

  // Slightly curved tapered trunk with root flare
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.16, 1.35, 10), barkMat);
  trunk.position.y = 0.66;
  trunk.rotation.z = 0.04;
  trunk.castShadow = true;
  g.add(trunk);

  // Two forked limbs
  for (const [dir, h, tilt] of [
    [-1, 0.95, 0.48],
    [1, 1.05, -0.44],
  ] as [number, number, number][]) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.068, 0.65, 8), barkMat);
    branch.position.set(dir * 0.18, h, dir * 0.05);
    branch.rotation.z = tilt;
    branch.castShadow = true;
    g.add(branch);
  }

  // Three tonal shades for depth & sunlight gradient
  const baseCol = new THREE.Color(foliageColor);
  const darkCol = baseCol.clone().multiplyScalar(0.76);
  const lightCol = baseCol.clone().lerp(new THREE.Color(0xc8e6a0), 0.24);

  const mats = [
    new THREE.MeshStandardMaterial({ color: darkCol, roughness: 0.85, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: baseCol, roughness: 0.82, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: lightCol, roughness: 0.78, flatShading: true }),
  ];

  const clusters: [number, number, number, number, number][] = [
    [-0.32, 1.36, 0.12, 0.46, 0],
    [0.34, 1.42, -0.1, 0.44, 0],
    [0.02, 1.56, 0.22, 0.5, 1],
    [-0.14, 1.68, -0.18, 0.46, 1],
    [0.08, 1.92, 0.02, 0.42, 2],
  ];

  clusters.forEach(([x, y, z, r, mIdx]) => {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mats[mIdx]);
    puff.scale.set(1.16, 0.86, 1.12);
    puff.position.set(x, y, z);
    puff.castShadow = true;
    puff.receiveShadow = true;
    g.add(puff);
  });

  if (blossomColor !== undefined) {
    const blMat = new THREE.MeshStandardMaterial({
      color: blossomColor,
      emissive: blossomColor,
      emissiveIntensity: 0.14,
      roughness: 0.6,
    });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), blMat);
      b.position.set(Math.cos(a) * 0.48, 1.44 + (i % 3) * 0.22, Math.sin(a) * 0.44);
      g.add(b);
    }
  }

  g.add(createContactShadow(0.68, 0.68, 0.18));
  g.scale.setScalar(scale);
  return g;
}

/**
 * Graceful Vietnamese bamboo clump ("Khóm tre / Trúc xanh") for riversides & temple courtyards.
 */
export function createBambooCluster(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const stalkMat = new THREE.MeshStandardMaterial({ color: 0x558b2f, roughness: 0.65 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x38761d, roughness: 0.78, flatShading: true });

  const offsets: [number, number, number, number][] = [
    [0, 0, 2.2, 0.06],
    [-0.18, 0.1, 1.9, 0.14],
    [0.16, -0.08, 2.05, -0.12],
    [0.08, 0.18, 1.65, -0.08],
  ];
  offsets.forEach(([x, z, h, lean]) => {
    const culm = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.038, h, 7), stalkMat);
    culm.position.set(x, h / 2, z);
    culm.rotation.z = lean;
    culm.castShadow = true;
    g.add(culm);

    const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), leafMat);
    tuft.scale.set(1.4, 0.55, 1.2);
    tuft.position.set(x - Math.sin(lean) * h * 0.45, h * 0.92, z);
    g.add(tuft);
  });

  g.scale.setScalar(scale);
  return g;
}

/**
 * Soft drifting atmospheric cloud cluster for poetic mountain & river dioramas.
 */
export function createCloudCluster(scale = 1, opacity = 0.84): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    transparent: true,
    opacity,
  });
  const puffs: [number, number, number, number][] = [
    [-0.45, 0, 0, 0.38],
    [0, 0.12, 0.06, 0.48],
    [0.48, 0.02, -0.04, 0.36],
  ];
  puffs.forEach(([x, y, z, r]) => {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat);
    p.scale.set(1.3, 0.62, 1.0);
    p.position.set(x, y, z);
    g.add(p);
  });
  g.scale.setScalar(scale);
  return g;
}
