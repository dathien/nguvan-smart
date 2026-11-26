import * as THREE from 'three';
import { Scene3DPreset } from '../types';
import { BuiltDioramaScene } from './dioramaBuildersG10';
import { EnvironmentalEffectsManager } from '../effects/EnvironmentalEffects';
import {
  createAnimatedOceanSurface,
  createArticulatedFigure,
  createBambooCluster,
  createCloudCluster,
  createDioramaBase,
  createDioramaTexture,
  createLayeredTree,
  createLimestoneKarstMountain,
  createThatchedCottage,
  createTiledHouse,
  createVietnameseTemple,
  createWindingRiver,
  createWoodenBoat,
  tagHotspotGroup,
} from './dioramaPrimitives';

export function buildGrade12AndSkillDiorama(preset: Scene3DPreset): BuiltDioramaScene | null {
  const root = new THREE.Group();
  const effects = new EnvironmentalEffectsManager();

  // 21. Tây Tiến — Dramatic Northwest karst peaks & floating cloud veil, Pha Luông valley huts, winding Mã river + dugout canoe & Tây Tiến soldiers
  if (preset === 'tay-tien-mountains') {
    root.add(
      createDioramaBase({
        width: 12.4,
        depth: 10.8,
        floorKind: 'meadow-earth',
        floorColor: 0x95b58f,
        plinthColor: 0x576d5f,
        terrainRelief: 0.2,
      })
    );

    const peakGroup = new THREE.Group();
    const p1 = createLimestoneKarstMountain({
      height: 4.1,
      radius: 2.05,
      rockColor: 0x3b5848,
      mossColor: 0x255939,
      seed: 9,
      snowCapColor: 0xe2e8f0,
    }).group;
    p1.position.set(-3.2, 0, -2.5);
    const p2 = createLimestoneKarstMountain({
      height: 3.25,
      radius: 1.65,
      rockColor: 0x476862,
      mossColor: 0x2d6a4f,
      seed: 15,
      snowCapColor: 0xcbd5e1,
    }).group;
    p2.position.set(-0.9, 0, -3.3);
    const mistCloud = createCloudCluster(1.5, 0.78);
    mistCloud.position.set(-2.1, 2.75, -2.0);
    peakGroup.add(p1, p2, mistCloud);
    tagHotspotGroup(peakGroup, 'hs-21-1');
    root.add(peakGroup);

    // Pha Luông misty valley stilt cottages
    const valleyGroup = new THREE.Group();
    const h1 = createThatchedCottage(0.55, true);
    h1.position.set(1.4, 0, -2.1);
    const h2 = createThatchedCottage(0.48, false);
    h2.position.set(3.0, 0, -2.6);
    valleyGroup.add(h1, h2);
    tagHotspotGroup(valleyGroup, 'hs-21-2');
    root.add(valleyGroup);

    // Winding Mã River & Châu Mộc dugout canoe (GLSL RealisticWater)
    const riverContainer = new THREE.Group();
    const { group: riverRibbon, waterMaterial } = createWindingRiver({
      points: [
        [-5.8, 3.6],
        [-1.6, 2.9],
        [2.2, 3.4],
        [5.8, 2.7],
      ],
      width: 1.85,
      waterColor: 0x2379a3,
      bankColor: 0x6e9463,
    });
    if (waterMaterial instanceof THREE.ShaderMaterial) {
      effects.registerWater(waterMaterial);
    }
    const canoe = createWoodenBoat(2.1, 0x5c3a21, 0xd97706, false, false);
    canoe.position.set(2.3, 0.1, 3.3);
    riverContainer.add(riverRibbon, canoe);
    tagHotspotGroup(riverContainer, 'hs-21-3');
    root.add(riverContainer);

    // Tây Tiến soldiers marching proudly in helmets
    const soldiersGroup = new THREE.Group();
    const s1 = createArticulatedFigure({
      robeColor: 0x3f6212,
      accentColor: 0xd97706,
      pose: 'heroic',
      headgear: 'helmet',
      scale: 1.05,
    });
    s1.position.set(-1.55, 0.06, 0.9);
    s1.rotation.y = 0.6;
    const s2 = createArticulatedFigure({
      robeColor: 0x365314,
      accentColor: 0xca8a04,
      pose: 'standing',
      headgear: 'helmet',
      scale: 1.0,
    });
    s2.position.set(-2.85, 0.06, 1.55);
    s2.rotation.y = 0.5;
    soldiersGroup.add(s1, s2);
    tagHotspotGroup(soldiersGroup, 'hs-21-4');
    root.add(soldiersGroup);

    const t1 = createLayeredTree(0x14532d, 1.05);
    t1.position.set(4.2, 0, -0.4);
    root.add(t1);
    effects.registerCloud(mistCloud, 0.48, 0.5, 0);
    effects.collectWindCanopiesFromRoot(root);

    return {
      root,
      backdropColor: 0xe6eef6,
      fogDensity: 0.009,
      effects,
      update: (t, _stage, params) => {
        const mist = (params.mountainMist ?? 55) / 100;
        mistCloud.scale.setScalar(0.95 + mist * 0.75);
        canoe.position.y = 0.1 + Math.sin(t * 1.9) * 0.03;
        effects.updateAmbient(t, 0.9);
      },
      dispose: () => effects.dispose(),
    };
  }

  // 22. Xuân Tóc Đỏ cứu quốc — Clay tennis court, net & bouncing ball, satirical VIP grandstand & victory speech podium
  if (preset === 'tennis-court-satire') {
    root.add(
      createDioramaBase({
        width: 12.0,
        depth: 10.6,
        floorKind: 'tennis-clay',
        floorColor: 0xffffff,
        plinthColor: 0xa16207,
      })
    );

    const netGroup = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.88, 10), postMat);
    postL.position.set(0, 0.44, -2.8);
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.88, 10), postMat);
    postR.position.set(0, 0.44, 2.8);
    const net = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.7, 5.5),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.86 })
    );
    net.position.set(0, 0.42, 0);
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.35 })
    );
    ball.position.set(0, 1.4, 0);
    netGroup.add(postL, postR, net, ball);
    tagHotspotGroup(netGroup, 'hs-22-1');
    root.add(netGroup);

    const xuan = createArticulatedFigure({
      robeColor: 0xf8fafc,
      accentColor: 0xdc2626,
      hairColor: 0xdc2626,
      pose: 'heroic',
      headgear: 'none',
      prop: 'racket',
      scale: 1.08,
    });
    xuan.position.set(-2.0, 0, 1.0);
    xuan.rotation.y = Math.PI / 2;
    tagHotspotGroup(xuan, 'hs-22-2');
    root.add(xuan);

    const opponent = createArticulatedFigure({
      robeColor: 0x1d4ed8,
      accentColor: 0xfef3c7,
      pose: 'standing',
      headgear: 'none',
      prop: 'racket',
      scale: 1.0,
    });
    opponent.position.set(2.4, 0, -0.4);
    opponent.rotation.y = -Math.PI / 2;
    root.add(opponent);

    const standGroup = new THREE.Group();
    const standMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.1, 1.8), standMat);
    deck.position.set(0, 0.55, -3.9);
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 0.16, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x991b1b })
    );
    canopy.position.set(0, 2.85, -3.9);
    for (const px of [-2.9, 2.9]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.75, 8), standMat);
      col.position.set(px, 1.98, -3.1);
      standGroup.add(col);
    }
    const vip1 = createArticulatedFigure({ robeColor: 0x1e293b, accentColor: 0xf59e0b, scale: 0.85 });
    vip1.position.set(-1.1, 1.1, -3.8);
    const vip2 = createArticulatedFigure({ robeColor: 0x0f172a, accentColor: 0xe2e8f0, scale: 0.85 });
    vip2.position.set(0.9, 1.1, -3.8);
    standGroup.add(deck, canopy, vip1, vip2);
    tagHotspotGroup(standGroup, 'hs-22-3');
    root.add(standGroup);

    const crowdGroup = new THREE.Group();
    const podium = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.65, 1.25),
      new THREE.MeshStandardMaterial({ color: 0x15803d })
    );
    podium.position.set(2.8, 0.325, 2.4);
    const fan1 = createArticulatedFigure({ robeColor: 0x475569, accentColor: 0xfacc15, scale: 0.86 });
    fan1.position.set(4.1, 0, 2.2);
    const fan2 = createArticulatedFigure({ robeColor: 0x64748b, accentColor: 0xef4444, scale: 0.86 });
    fan2.position.set(3.6, 0, 3.4);
    crowdGroup.add(podium, fan1, fan2);
    tagHotspotGroup(crowdGroup, 'hs-22-4');
    root.add(crowdGroup);

    return {
      root,
      backdropColor: 0xfef8ec,
      update: (t, stageIndex) => {
        ball.position.x = Math.sin(t * 3.0) * 2.1;
        ball.position.y = 0.8 + Math.abs(Math.cos(t * 3.0)) * 1.1;
        const tx = stageIndex === 2 ? 2.8 : -2.0;
        const ty = stageIndex === 2 ? 0.65 : 0;
        const tz = stageIndex === 2 ? 2.4 : 1.0;
        xuan.position.x += (tx - xuan.position.x) * 0.06;
        xuan.position.y += (ty - xuan.position.y) * 0.06;
        xuan.position.z += (tz - xuan.position.z) * 0.06;
      },
    };
  }

  // 23. Mùa lá rụng trong vườn — Traditional 3-bay tiled ancestral house, ông Bằng, Tet table & shedding autumn trees
  if (preset === 'family-courtyard') {
    root.add(
      createDioramaBase({
        width: 11.8,
        depth: 10.6,
        floorKind: 'tile-grid',
        floorColor: 0xf3e8d8,
        plinthColor: 0xc2b29b,
      })
    );

    const house = createTiledHouse(1.06, 0xf6ead4);
    house.position.set(0, 0, -2.4);
    tagHotspotGroup(house, 'hs-23-1');
    root.add(house);

    const ongBang = createArticulatedFigure({
      robeColor: 0x451a03,
      accentColor: 0xd97706,
      hairColor: 0xe2e8f0,
      scale: 1.0,
      headgear: 'none',
    });
    ongBang.position.set(-1.6, 0, 1.0);
    ongBang.rotation.y = 0.45;
    tagHotspotGroup(ongBang, 'hs-23-2');
    root.add(ongBang);

    const tableGroup = new THREE.Group();
    const tbl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.92, 0.92, 0.1, 18),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 })
    );
    tbl.position.set(1.0, 0.65, 1.5);
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.22, 0.65, 12),
      new THREE.MeshStandardMaterial({ color: 0x5c3a21 })
    );
    leg.position.set(1.0, 0.325, 1.5);
    tableGroup.add(tbl, leg);
    tagHotspotGroup(tableGroup, 'hs-23-3');
    root.add(tableGroup);

    const gardenGroup = new THREE.Group();
    const chiHoai = createArticulatedFigure({
      robeColor: 0x15803d,
      accentColor: 0xfef3c7,
      scale: 0.96,
      headgear: 'bun',
    });
    chiHoai.position.set(2.6, 0, 1.4);
    chiHoai.rotation.y = -0.8;
    const tree1 = createLayeredTree(0xd97706, 1.35, 0xf59e0b);
    tree1.position.set(3.6, 0, -0.8);
    const tree2 = createLayeredTree(0x65a30d, 1.15);
    tree2.position.set(-3.8, 0, -0.4);
    gardenGroup.add(chiHoai, tree1, tree2);
    tagHotspotGroup(gardenGroup, 'hs-23-4');
    root.add(gardenGroup);

    const leaves: THREE.Mesh[] = [];
    const leafMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    for (let i = 0; i < 14; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.1), leafMat);
      leaf.position.set(-3 + (i % 5) * 1.5, 0.8 + (i % 4) * 0.7, -1 + (i % 3) * 1.4);
      leaves.push(leaf);
      root.add(leaf);
    }

    effects.collectWindCanopiesFromRoot(root);

    return {
      root,
      backdropColor: 0xfaf5eb,
      effects,
      update: (t, _stage, params) => {
        const density = (params.leafFall ?? 60) / 100;
        leaves.forEach((leaf, idx) => {
          leaf.visible = idx / leaves.length <= density;
          leaf.position.y = 2.8 - ((t * 0.55 + idx * 0.37) % 2.7);
          leaf.rotation.y = t + idx;
          leaf.rotation.z = Math.sin(t * 2 + idx) * 0.5;
        });
        effects.updateAmbient(t, 0.9);
      },
      dispose: () => effects.dispose(),
    };
  }

  // 24. Muối của rừng — Pristine spring canopy, ông Diểu, sculpted karst cliff with monkey family & blooming white Tử Huyền flowers
  if (preset === 'forest-journey') {
    root.add(
      createDioramaBase({
        width: 12.2,
        depth: 10.6,
        floorKind: 'meadow-earth',
        floorColor: 0x89b37c,
        plinthColor: 0x5c7356,
        terrainRelief: 0.16,
      })
    );

    const forestGroup = new THREE.Group();
    const f1 = createLayeredTree(0x14532d, 1.35);
    f1.position.set(-3.6, 0, -2.6);
    const f2 = createLayeredTree(0x166534, 1.2);
    f2.position.set(-1.4, 0, -3.2);
    const f3 = createBambooCluster(1.15);
    f3.position.set(-4.1, 0, 1.2);
    forestGroup.add(f1, f2, f3);
    tagHotspotGroup(forestGroup, 'hs-24-1');
    root.add(forestGroup);

    const ongDieu = createArticulatedFigure({
      robeColor: 0x78350f,
      accentColor: 0x4d7c0f,
      hairColor: 0xd6d3d1,
      scale: 1.02,
      headgear: 'none',
    });
    ongDieu.position.set(-1.4, 0.04, 1.6);
    ongDieu.rotation.y = 0.65;
    tagHotspotGroup(ongDieu, 'hs-24-2');
    root.add(ongDieu);

    const cliffGroup = new THREE.Group();
    const rock = createLimestoneKarstMountain({ height: 2.45, radius: 1.55, rockColor: 0x64748b, mossColor: 0x2d6a4f, seed: 19 }).group;
    rock.position.set(2.5, 0, -2.0);
    const monkeyMat = new THREE.MeshStandardMaterial({ color: 0x7c4a26, roughness: 0.78 });
    const m1 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 12), monkeyMat);
    m1.position.set(2.1, 1.9, -1.45);
    const m2 = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), monkeyMat);
    m2.position.set(2.6, 1.86, -1.35);
    const m3 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), monkeyMat);
    m3.position.set(2.35, 1.78, -1.2);
    cliffGroup.add(rock, m1, m2, m3);
    tagHotspotGroup(cliffGroup, 'hs-24-3');
    root.add(cliffGroup);

    const flowerGroup = new THREE.Group();
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef9c3,
      emissiveIntensity: 0.45,
      roughness: 0.35,
    });
    const stems: THREE.Group[] = [];
    for (let i = 0; i < 12; i++) {
      const fl = new THREE.Group();
      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), petalMat);
      head.position.y = 0.34;
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.32, 6),
        new THREE.MeshStandardMaterial({ color: 0x16a34a })
      );
      stalk.position.y = 0.16;
      fl.add(stalk, head);
      fl.position.set(0.6 + (i % 4) * 0.9, 0.04, 1.0 + Math.floor(i / 4) * 0.95);
      stems.push(fl);
      flowerGroup.add(fl);
    }
    tagHotspotGroup(flowerGroup, 'hs-24-4');
    root.add(flowerGroup);

    effects.collectWindCanopiesFromRoot(root);

    return {
      root,
      backdropColor: 0xf0f6eb,
      effects,
      update: (t, stageIndex, params) => {
        const bloom = ((params.blossomRatio ?? 70) / 100) * (stageIndex === 2 ? 1.15 : stageIndex === 1 ? 0.55 : 0.22);
        stems.forEach((s, i) => {
          s.scale.setScalar(0.28 + bloom * 0.92);
          s.rotation.z = Math.sin(t * 1.8 + i) * 0.08;
        });
        effects.updateAmbient(t, 0.85);
      },
      dispose: () => effects.dispose(),
    };
  }

  // 25. Đàn ghi ta của Lor-ca — Surreal Spanish guitar, red cape Lorca, resonant lilac soundwaves & moon over stone well
  if (preset === 'lorca-guitar-symbol') {
    root.add(
      createDioramaBase({
        width: 11.4,
        depth: 10.2,
        floorKind: 'stone-brick',
        floorColor: 0x3b3556,
        plinthColor: 0x1e1b3a,
      })
    );

    const guitarGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.42, metalness: 0.12 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.55 });
    const lowerBout = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.34, 24), woodMat);
    lowerBout.rotation.x = Math.PI / 2;
    lowerBout.position.y = 1.2;
    const upperBout = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.34, 24), woodMat);
    upperBout.rotation.x = Math.PI / 2;
    upperBout.position.y = 2.22;
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.36, 18), darkWood);
    hole.rotation.x = Math.PI / 2;
    hole.position.y = 1.95;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.85, 0.16), darkWood);
    neck.position.y = 3.55;
    guitarGroup.add(lowerBout, upperBout, hole, neck);
    guitarGroup.rotation.z = -0.18;
    tagHotspotGroup(guitarGroup, 'hs-25-1');
    root.add(guitarGroup);

    const lorca = createArticulatedFigure({
      robeColor: 0x991b1b,
      accentColor: 0xf59e0b,
      pose: 'heroic',
      headgear: 'none',
      scale: 1.08,
    });
    lorca.position.set(-2.6, 0, 1.4);
    lorca.rotation.y = 0.7;
    tagHotspotGroup(lorca, 'hs-25-2');
    root.add(lorca);

    const waveGroup = new THREE.Group();
    const waveMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.82,
    });
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.7 + i * 0.52, 0.055, 10, 32), waveMat);
      r.rotation.x = Math.PI / 2;
      r.position.set(2.3, 0.25 + i * 0.2, 1.4);
      rings.push(r);
      waveGroup.add(r);
    }
    tagHotspotGroup(waveGroup, 'hs-25-3');
    root.add(waveGroup);

    const moonGroup = new THREE.Group();
    const well = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.05, 0.75, 18),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
    );
    well.position.set(0.4, 0.375, -2.6);
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.25 })
    );
    moon.position.set(0.4, 3.6, -2.6);
    const moonLight = new THREE.PointLight(0xfde047, 9, 14);
    moonLight.position.set(0.4, 3.6, -2.0);
    moonGroup.add(well, moon, moonLight);
    tagHotspotGroup(moonGroup, 'hs-25-4');
    root.add(moonGroup);

    return {
      root,
      backdropColor: 0x18142c,
      ambientIntensity: 0.45,
      directionalIntensity: 0.65,
      update: (t, _stage, params) => {
        const res = (params.guitarResonance ?? 75) / 100;
        guitarGroup.position.y = Math.sin(t * 1.5) * 0.1;
        rings.forEach((r, idx) => {
          const s = 0.85 + Math.sin(t * 2.4 - idx * 0.8) * 0.16 * res;
          r.scale.setScalar(s);
        });
      },
    };
  }

  // 26. Hải khẩu linh từ — Coastal rocky headland with authentic curved-eave sea shrine, Nguyễn Thị Bích Châu & royal ship on animated sea
  if (preset === 'sea-shrine') {
    root.add(
      createDioramaBase({
        width: 12.2,
        depth: 10.8,
        floorKind: 'water-ripple',
        floorColor: 0x2672a4,
        plinthColor: 0x1a3659,
      })
    );

    const ocean = createAnimatedOceanSurface(12.0, 10.6, 0x2674a6);
    root.add(ocean.mesh);

    // Organic sculpted rocky headland island
    const islandGeo = new THREE.CylinderGeometry(3.2, 3.7, 0.65, 18);
    const island = new THREE.Mesh(
      islandGeo,
      new THREE.MeshStandardMaterial({ map: createDioramaTexture('limestone-rock', 3, 2), color: 0xb9b4a8, roughness: 0.88 })
    );
    island.position.set(1.8, 0.3, -1.8);
    island.receiveShadow = true;
    root.add(island);

    const shrine = createVietnameseTemple(0.92, 0x9f3726);
    shrine.position.set(1.8, 0.6, -1.8);
    shrine.rotation.y = -0.35;
    tagHotspotGroup(shrine, 'hs-26-1');
    root.add(shrine);

    const bichChau = createArticulatedFigure({
      robeColor: 0x9a3412,
      accentColor: 0xfef08a,
      pose: 'holding-tray',
      headgear: 'crown',
      prop: 'scroll',
      scale: 1.0,
    });
    bichChau.position.set(-0.5, 0.6, -0.35);
    bichChau.rotation.y = -0.45;
    tagHotspotGroup(bichChau, 'hs-26-2');
    root.add(bichChau);

    const ship = createWoodenBoat(2.8, 0x7f1d1d, 0xf59e0b, true, false);
    ship.position.set(-2.6, 0.1, 2.3);
    ship.rotation.y = 0.4;
    tagHotspotGroup(ship, 'hs-26-3');
    root.add(ship);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.075, 12, 30),
      new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.9 })
    );
    halo.position.set(2.3, 3.85, -2.0);
    tagHotspotGroup(halo, 'hs-26-4');
    root.add(halo);

    return {
      root,
      backdropColor: 0xe6f1fa,
      update: (t, stageIndex, params) => {
        const wave = ((params.seaWave ?? 55) / 100) * (stageIndex === 1 ? 1.4 : 0.65);
        ocean.updateWaves(t, 0.04 + wave * 0.06);
        ship.position.y = 0.1 + Math.sin(t * 2.4) * 0.12 * wave;
        ship.rotation.z = Math.sin(t * 2.0) * 0.08 * wave;
        halo.rotation.y = t * 0.8;
      },
    };
  }

  // 27. Giấu của (Lão hà tiện) — Classical French comedy stage, gold coin chest, panicking Harpagon, garden corner & Valère
  if (preset === 'comedy-stage-miser') {
    root.add(
      createDioramaBase({
        width: 11.6,
        depth: 10.2,
        floorKind: 'wood-plank',
        floorColor: 0xe8d8be,
        plinthColor: 0x78350f,
        cutawayWalls: true,
        wallColor: 0xfaf3e3,
        wallHeight: 4.1,
      })
    );

    const chestGroup = new THREE.Group();
    const chestBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.62, 0.74),
      new THREE.MeshStandardMaterial({ color: 0x6b3a1e, roughness: 0.62 })
    );
    chestBody.position.set(-1.9, 0.31, 1.4);
    chestBody.castShadow = true;
    const goldCoins = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.16, 0.58),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.68, roughness: 0.25 })
    );
    goldCoins.position.set(-1.9, 0.65, 1.4);
    chestGroup.add(chestBody, goldCoins);
    tagHotspotGroup(chestGroup, 'hs-27-1');
    root.add(chestGroup);

    const harpagon = createArticulatedFigure({
      robeColor: 0x1e293b,
      accentColor: 0xd97706,
      pose: 'heroic',
      headgear: 'none',
      scale: 1.08,
    });
    harpagon.position.set(0.2, 0, 0.6);
    tagHotspotGroup(harpagon, 'hs-27-2');
    root.add(harpagon);

    const gardenGroup = new THREE.Group();
    const hedge = createLayeredTree(0x166534, 1.18);
    hedge.position.set(-2.9, 0, -2.1);
    gardenGroup.add(hedge);
    tagHotspotGroup(gardenGroup, 'hs-27-3');
    root.add(gardenGroup);

    const staffGroup = new THREE.Group();
    const valere = createArticulatedFigure({ robeColor: 0x1d4ed8, accentColor: 0xf8fafc, scale: 1.0 });
    valere.position.set(2.5, 0, 1.4);
    valere.rotation.y = -0.9;
    staffGroup.add(valere);
    tagHotspotGroup(staffGroup, 'hs-27-4');
    root.add(staffGroup);

    return {
      root,
      backdropColor: 0xf6f0e4,
      update: (t, stageIndex) => {
        if (stageIndex === 1) {
          harpagon.rotation.y = Math.sin(t * 5) * 0.65;
          chestGroup.visible = false;
        } else {
          harpagon.rotation.y = Math.sin(t * 1.2) * 0.2;
          chestGroup.visible = true;
        }
      },
    };
  }

  // 28. Nhân vật quan trọng (Quan thanh tra) — Ornate Mayor's parlor, boasting Khlestakov, bowing officials & admiring ladies
  if (preset === 'comedy-stage-inspector') {
    root.add(
      createDioramaBase({
        width: 11.6,
        depth: 10.2,
        floorKind: 'tile-grid',
        floorColor: 0xf5f7fb,
        plinthColor: 0x1e3a8a,
        cutawayWalls: true,
        wallColor: 0xeff3fb,
        wallHeight: 4.2,
        splitWoodZone: true,
      })
    );

    const salonGroup = new THREE.Group();
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.68 });
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.95), sofaMat);
    sofaBase.position.set(-2.6, 0.24, -2.5);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.56, 0.24), sofaMat);
    sofaBack.position.set(-2.6, 0.64, -2.88);
    const portrait = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.8, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.38 })
    );
    portrait.position.set(-2.6, 2.4, -4.85);
    salonGroup.add(sofaBase, sofaBack, portrait);
    tagHotspotGroup(salonGroup, 'hs-28-1');
    root.add(salonGroup);

    const khlestakov = createArticulatedFigure({
      robeColor: 0x1d4ed8,
      accentColor: 0xf59e0b,
      pose: 'heroic',
      headgear: 'none',
      scale: 1.12,
    });
    khlestakov.position.set(0, 0, 0.4);
    tagHotspotGroup(khlestakov, 'hs-28-2');
    root.add(khlestakov);

    const officialsGroup = new THREE.Group();
    const mayor = createArticulatedFigure({ robeColor: 0x1e293b, accentColor: 0xeab308, pose: 'bowing', scale: 1.0 });
    mayor.position.set(-2.0, 0, 1.5);
    mayor.rotation.y = 0.8;
    const judge = createArticulatedFigure({ robeColor: 0x334155, accentColor: 0xd97706, pose: 'bowing', scale: 0.95 });
    judge.position.set(-2.9, 0, 0.4);
    judge.rotation.y = 1.1;
    officialsGroup.add(mayor, judge);
    tagHotspotGroup(officialsGroup, 'hs-28-3');
    root.add(officialsGroup);

    const ladiesGroup = new THREE.Group();
    const anna = createArticulatedFigure({ robeColor: 0xe11d48, accentColor: 0xfef3c7, headgear: 'bun', scale: 0.96 });
    anna.position.set(2.3, 0, 1.3);
    anna.rotation.y = -0.8;
    const maria = createArticulatedFigure({ robeColor: 0xec4899, accentColor: 0xf8fafc, headgear: 'bun', scale: 0.9 });
    maria.position.set(3.2, 0, 0.3);
    maria.rotation.y = -1.1;
    ladiesGroup.add(anna, maria);
    tagHotspotGroup(ladiesGroup, 'hs-28-4');
    root.add(ladiesGroup);

    return {
      root,
      backdropColor: 0xeaf0f8,
      update: (t, stageIndex, params) => {
        const boast = (params.boastLevel ?? 70) / 100;
        const scaleBoost = 1 + (stageIndex === 1 ? 0.16 * boast : 0);
        khlestakov.scale.setScalar(1.12 * scaleBoost);
        khlestakov.rotation.y = Math.sin(t * 2.2) * 0.45;
      },
    };
  }

  // 30. Trên xuồng cứu nạn (Life of Pi) — Animated Pacific ocean swells, curved white-orange lifeboat, Richard Parker, tethered raft & Pi
  if (preset === 'lifeboat-ocean') {
    root.add(
      createDioramaBase({
        width: 12.4,
        depth: 10.8,
        floorKind: 'water-ripple',
        floorColor: 0x0369a1,
        plinthColor: 0x0c4a6e,
      })
    );

    const ocean = createAnimatedOceanSurface(12.2, 10.6, 0x0474ae);
    root.add(ocean.mesh);

    const boatGroup = new THREE.Group();
    const lifeboat = createWoodenBoat(3.9, 0xf8fafc, 0xea580c, false, false);
    const tarp = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.22, 1.05),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.72 })
    );
    tarp.position.set(-1.05, 0.48, 0);
    boatGroup.add(lifeboat, tarp);
    boatGroup.position.set(-0.7, 0.1, 0);
    tagHotspotGroup(boatGroup, 'hs-30-1');
    root.add(boatGroup);

    // Sculpted Bengal Tiger Richard Parker crouched on bow tarp
    const tigerGroup = new THREE.Group();
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.62 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.56, 6, 12), orangeMat);
    body.rotation.z = Math.PI / 2;
    body.position.set(-1.32, 0.74, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), orangeMat);
    head.position.set(-0.82, 0.84, 0);
    for (const sx of [-1.45, -1.25, -1.08]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 6, 14), stripeMat);
      band.rotation.y = Math.PI / 2;
      band.position.set(sx, 0.74, 0);
      tigerGroup.add(band);
    }
    tigerGroup.add(body, head);
    tagHotspotGroup(tigerGroup, 'hs-30-2');
    root.add(tigerGroup);

    const raftGroup = new THREE.Group();
    const raftDeck = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 0.14, 1.3),
      new THREE.MeshStandardMaterial({ map: createDioramaTexture('wood-plank', 2, 1), color: 0xca8a04, roughness: 0.78 })
    );
    raftDeck.position.y = 0.08;
    const pi = createArticulatedFigure({
      robeColor: 0xe0f2fe,
      accentColor: 0xea580c,
      pose: 'seated',
      headgear: 'none',
      scale: 0.9,
    });
    pi.position.set(0, 0.12, 0);
    pi.rotation.y = -Math.PI / 2;
    raftGroup.add(raftDeck, pi);
    raftGroup.position.set(2.7, 0.1, 1.0);
    tagHotspotGroup(raftGroup, 'hs-30-3');
    root.add(raftGroup);

    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7 })
    );
    rope.rotation.z = Math.PI / 2;
    rope.rotation.y = -0.35;
    rope.position.set(1.4, 0.28, 0.55);
    root.add(rope);

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 18, 14),
      new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.85 })
    );
    sun.position.set(0.4, 3.1, -3.5);
    tagHotspotGroup(sun, 'hs-30-4');
    root.add(sun);

    return {
      root,
      backdropColor: 0xe6f3fc,
      update: (t, _stage, params) => {
        const swell = (params.oceanSwell ?? 60) / 100;
        ocean.updateWaves(t, 0.04 + swell * 0.08);
        const bob = Math.sin(t * 2.0) * 0.14 * swell;
        boatGroup.position.y = 0.1 + bob;
        boatGroup.rotation.z = Math.sin(t * 1.7) * 0.07 * swell;
        tigerGroup.position.y = bob;
        raftGroup.position.y = 0.1 + Math.sin(t * 2.0 - 0.9) * 0.14 * swell;
      },
    };
  }

  // 35. Xung đột trong kịch (Bi kịch & Hài kịch) — Classical proscenium velvet arch, glowing conflict crystal, Tragedy vs Comedy actors
  if (preset === 'drama-conflict-stage') {
    root.add(
      createDioramaBase({
        width: 11.8,
        depth: 10.2,
        floorKind: 'wood-plank',
        floorColor: 0xc29b70,
        plinthColor: 0x1e1b3a,
        cutawayWalls: true,
        wallColor: 0x262138,
        wallHeight: 4.5,
      })
    );

    const archGroup = new THREE.Group();
    const curtainMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.72 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5, roughness: 0.32 });
    const leftC = new THREE.Mesh(new THREE.BoxGeometry(1.15, 4.1, 0.45), curtainMat);
    leftC.position.set(-4.6, 2.05, -4.2);
    const rightC = new THREE.Mesh(new THREE.BoxGeometry(1.15, 4.1, 0.45), curtainMat);
    rightC.position.set(4.6, 2.05, -4.2);
    const topC = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.75, 0.52), curtainMat);
    topC.position.set(0, 3.9, -4.2);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.12, 0.56), goldMat);
    trim.position.set(0, 3.52, -4.2);
    archGroup.add(leftC, rightC, topC, trim);
    tagHotspotGroup(archGroup, 'hs-35-4');
    root.add(archGroup);

    const conflictCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.68, 0),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.85,
        roughness: 0.25,
      })
    );
    conflictCore.position.set(0, 2.0, 0);
    tagHotspotGroup(conflictCore, 'hs-35-1');
    root.add(conflictCore);

    const tragedyActor = createArticulatedFigure({
      robeColor: 0x7f1d1d,
      accentColor: 0xfef3c7,
      pose: 'heroic',
      headgear: 'crown',
      scale: 1.1,
    });
    tragedyActor.position.set(-2.3, 0, 1.1);
    tragedyActor.rotation.y = 0.85;
    tagHotspotGroup(tragedyActor, 'hs-35-2');
    root.add(tragedyActor);

    const comedyActor = createArticulatedFigure({
      robeColor: 0x1d4ed8,
      accentColor: 0xfacc15,
      pose: 'standing',
      headgear: 'none',
      scale: 1.08,
    });
    comedyActor.position.set(2.3, 0, 1.1);
    comedyActor.rotation.y = -0.85;
    tagHotspotGroup(comedyActor, 'hs-35-3');
    root.add(comedyActor);

    const moodLight = new THREE.PointLight(0xf59e0b, 12, 16);
    moodLight.position.set(0, 3.6, 1.2);
    root.add(moodLight);

    return {
      root,
      backdropColor: 0x1a172c,
      ambientIntensity: 0.45,
      directionalIntensity: 0.7,
      update: (t, stageIndex, params) => {
        const mood = (params.stageMood ?? 30) / 100;
        conflictCore.rotation.y = t * 1.1;
        conflictCore.position.y = 2.0 + Math.sin(t * 2) * 0.12;
        if (stageIndex === 1 || mood < 0.4) {
          moodLight.color.setHex(0xf97316);
        } else {
          moodLight.color.setHex(0x60a5fa);
        }
      },
    };
  }

  return null;
}
