import * as THREE from 'three';
import { Scene3DPreset } from '../types';
import {
  createAnimatedOceanSurface,
  createArticulatedFigure,
  createBambooCluster,
  createCloudCluster,
  createDioramaBase,
  createDioramaTexture,
  createEdeLonghouse,
  createGreekColonnade,
  createLayeredTree,
  createLimestoneKarstMountain,
  createTiledHouse,
  createVietnameseTemple,
  createWindingRiver,
  createWoodenBoat,
  tagHotspotGroup,
} from './dioramaPrimitives';

export interface BuiltDioramaScene {
  root: THREE.Group;
  backdropColor: number;
  ambientIntensity?: number;
  directionalIntensity?: number;
  fogDensity?: number;
  update: (elapsedSec: number, stageIndex: number, params: Record<string, number>) => void;
}

export function buildGrade10Diorama(preset: Scene3DPreset): BuiltDioramaScene | null {
  const root = new THREE.Group();

  // 01. Thần Trụ Trời — 4-stage cosmogony: chaos -> pillar building -> sky separation -> shattering into mountains & valleys
  if (preset === 'myth-pillar') {
    root.add(
      createDioramaBase({
        width: 12.0,
        depth: 10.6,
        floorKind: 'meadow-earth',
        floorColor: 0xb9c7a6,
        plinthColor: 0x7b897a,
        terrainRelief: 0.22,
      })
    );

    // Primordial mist dome / celestial canopy rising in stages
    const skyGroup = new THREE.Group();
    const skyRim = new THREE.Mesh(
      new THREE.TorusGeometry(4.1, 0.22, 12, 40),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.3,
        roughness: 0.3,
      })
    );
    skyRim.rotation.x = Math.PI / 2;
    const skyDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(4.0, 4.15, 0.16, 36),
      new THREE.MeshStandardMaterial({
        color: 0xdbeafe,
        transparent: true,
        opacity: 0.65,
        roughness: 0.35,
      })
    );
    const sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 14),
      new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.9 })
    );
    sunOrb.position.set(1.8, 0.35, -1.2);
    const cloud1 = createCloudCluster(0.95, 0.8);
    cloud1.position.set(-1.9, 0.2, 0.8);
    const cloud2 = createCloudCluster(0.8, 0.75);
    cloud2.position.set(2.2, 0.25, 1.1);
    skyGroup.add(skyRim, skyDisc, sunOrb, cloud1, cloud2);
    skyGroup.position.y = 4.6;
    tagHotspotGroup(skyGroup, 'hs-01-3');
    root.add(skyGroup);

    // Segmented rocky stone-and-earth cosmic pillar (shatters into mountain chunks in stage 3!)
    const pillarGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({
      map: createDioramaTexture('limestone-rock', 2, 2),
      color: 0x8d8272,
      roughness: 0.88,
      flatShading: true,
    });
    const pillarBlocks: { mesh: THREE.Mesh; basePos: THREE.Vector3; scatterPos: THREE.Vector3 }[] = [];
    const blockSpecs: [number, number, [number, number, number]][] = [
      [0.62, 0.78, [-3.2, 0.38, -2.0]],
      [1.42, 0.78, [3.1, 0.42, -2.2]],
      [2.22, 0.78, [-2.7, 0.36, 2.3]],
      [3.02, 0.78, [2.8, 0.36, 2.4]],
      [3.82, 0.76, [0.5, 0.4, -3.1]],
    ];
    blockSpecs.forEach(([y, r, scatter], idx) => {
      const geo = new THREE.CylinderGeometry(r * 0.9, r * 1.06, 0.82, 10);
      const mesh = new THREE.Mesh(geo, stoneMat);
      mesh.position.set(0, y, 0);
      mesh.rotation.y = idx * 0.5;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      pillarGroup.add(mesh);
      pillarBlocks.push({
        mesh,
        basePos: new THREE.Vector3(0, y, 0),
        scatterPos: new THREE.Vector3(scatter[0], scatter[1], scatter[2]),
      });
    });
    tagHotspotGroup(pillarGroup, 'hs-01-2');
    root.add(pillarGroup);

    // Giant Deity Thần Trụ Trời lifting sky & carving earth
    const titan = createArticulatedFigure({
      robeColor: 0x7c3f1c,
      accentColor: 0xd97706,
      skinColor: 0xdcb08a,
      scale: 1.5,
      pose: 'heroic',
      headgear: 'bun',
    });
    titan.position.set(-2.3, 0.08, 1.3);
    titan.rotation.y = 0.7;
    tagHotspotGroup(titan, 'hs-01-1');
    root.add(titan);

    // Organic sculpted limestone mountain ridges & crater lake emerging in Stage 4 ("đất đá văng ra thành núi, biển")
    const landscapeGroup = new THREE.Group();
    const m1 = createLimestoneKarstMountain({ height: 2.35, radius: 1.45, rockColor: 0x5c7168, mossColor: 0x2f7048, seed: 2 }).group;
    m1.position.set(3.4, 0, -2.5);
    const m2 = createLimestoneKarstMountain({ height: 1.9, radius: 1.2, rockColor: 0x677971, mossColor: 0x3b8155, seed: 5 }).group;
    m2.position.set(-3.8, 0, -2.4);
    const lake = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.4, 0.1, 24),
      new THREE.MeshStandardMaterial({
        map: createDioramaTexture('water-ripple', 2, 2),
        color: 0x0ea5e9,
        roughness: 0.2,
      })
    );
    lake.position.set(2.8, 0.07, 2.3);
    const treeA = createLayeredTree(0x2f7d4d, 0.9);
    treeA.position.set(4.2, 0.05, 0.6);
    landscapeGroup.add(m1, m2, lake, treeA);
    tagHotspotGroup(landscapeGroup, 'hs-01-4');
    root.add(landscapeGroup);

    return {
      root,
      backdropColor: 0xe6eff8,
      fogDensity: 0.008,
      update: (t, stageIndex, params) => {
        const userLift = (params.pillarHeight ?? 70) / 100;
        const isChaos = stageIndex === 0;
        const isShattered = stageIndex >= 3;
        const targetSkyY = isChaos ? 2.5 : 3.4 + userLift * 1.9;
        skyGroup.position.y += (targetSkyY - skyGroup.position.y) * 0.08;
        skyGroup.rotation.y = t * 0.14;

        pillarBlocks.forEach((b, i) => {
          const target = isShattered
            ? b.scatterPos
            : new THREE.Vector3(0, b.basePos.y * (isChaos ? 0.35 : 0.62 + userLift * 0.45), 0);
          b.mesh.position.lerp(target, 0.08);
          b.mesh.rotation.z = isShattered ? 0.35 * (i % 2 === 0 ? 1 : -1) : 0;
        });

        const terrainScale = isShattered ? 1.05 : isChaos ? 0.45 : 0.78;
        landscapeGroup.scale.y += (terrainScale - landscapeGroup.scale.y) * 0.08;
        titan.position.y = 0.08 + Math.sin(t * 1.6) * 0.05;
      },
    };
  }

  // 02. Chuyện chức Phán sự đền Tản Viên — Authentic curved-eave temple, burning shrine, Minh Ti court & Ngô Tử Văn
  if (preset === 'temple-ghost') {
    root.add(
      createDioramaBase({
        width: 12.2,
        depth: 10.6,
        floorKind: 'stone-brick',
        floorColor: 0xd8dce3,
        plinthColor: 0x475569,
      })
    );

    // Traditional curved-eave Vietnamese temple with stone steps & incense burner
    const templeGroup = new THREE.Group();
    const temple = createVietnameseTemple(1.06, 0x9b3123);
    templeGroup.add(temple);

    // Dynamic layered flames for Stage 1 (Tử Văn đốt đền tà)
    const flameGroup = new THREE.Group();
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xff8c1a,
      emissive: 0xff3d00,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.9,
    });
    const flames: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.28 + (i % 2) * 0.1, 0.95 + (i % 3) * 0.25, 8), flameMat);
      fl.position.set(-0.9 + i * 0.6, 2.25 + (i % 2) * 0.3, 0.35);
      flames.push(fl);
      flameGroup.add(fl);
    }
    const fireLight = new THREE.PointLight(0xff6b00, 10, 14);
    fireLight.position.set(0, 2.8, 1.0);
    flameGroup.add(fireLight);
    templeGroup.add(flameGroup);
    templeGroup.position.set(0.1, 0, -2.3);
    tagHotspotGroup(templeGroup, 'hs-02-1');
    root.add(templeGroup);

    // Ngô Tử Văn — upright scholar holding flaming torch
    const tuVan = createArticulatedFigure({
      robeColor: 0x163859,
      accentColor: 0xe6a832,
      scale: 1.08,
      pose: 'heroic',
      headgear: 'khan-dong',
      prop: 'torch',
    });
    tuVan.position.set(-2.5, 0, 1.6);
    tuVan.rotation.y = 0.65;
    tagHotspotGroup(tuVan, 'hs-02-2');
    root.add(tuVan);

    // Thổ Công (benevolent guardian in warm amber) & Hồn ma họ Thôi (dark spectral general)
    const spiritsGroup = new THREE.Group();
    const thoCong = createArticulatedFigure({
      robeColor: 0xb45309,
      accentColor: 0xfef08a,
      scale: 0.98,
      pose: 'standing',
      headgear: 'khan-dong',
      prop: 'scroll',
    });
    thoCong.position.set(2.4, 0, 1.1);
    thoCong.rotation.y = -0.6;

    const ghost = createArticulatedFigure({
      robeColor: 0x1f2937,
      accentColor: 0xef4444,
      skinColor: 0xcbd5e1,
      scale: 1.05,
      pose: 'heroic',
      headgear: 'helmet',
    });
    ghost.position.set(3.8, 0.16, -0.4);
    ghost.rotation.y = -1.1;
    spiritsGroup.add(thoCong, ghost);
    tagHotspotGroup(spiritsGroup, 'hs-02-3');
    root.add(spiritsGroup);

    // Minh Ti justice dais & jade balance tablet (Stage 3-4)
    const courtGroup = new THREE.Group();
    const dais = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.34, 1.45),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72 })
    );
    dais.position.set(0, 0.17, 3.6);
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.74, 0.64),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.6 })
    );
    desk.position.set(0, 0.7, 3.6);
    const seal = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.22, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.55, roughness: 0.3 })
    );
    seal.position.set(0, 1.18, 3.6);
    courtGroup.add(dais, desk, seal);
    tagHotspotGroup(courtGroup, 'hs-02-4');
    root.add(courtGroup);

    // Sacred banyan & bamboo framing the temple courtyard
    const treeL = createLayeredTree(0x2d6a4f, 1.15);
    treeL.position.set(-4.3, 0, -2.8);
    const bamR = createBambooCluster(1.1);
    bamR.position.set(4.3, 0, -3.1);
    root.add(treeL, bamR);

    return {
      root,
      backdropColor: 0xe6ecf4,
      update: (t, stageIndex, params) => {
        const intensity = (params.flameIntensity ?? 70) / 100;
        const activeFire = stageIndex === 0 ? 1.15 * intensity : stageIndex === 1 ? 0.5 * intensity : 0.1;
        flames.forEach((f, idx) => {
          f.scale.set(
            Math.max(0.01, activeFire * (0.9 + Math.sin(t * 9 + idx) * 0.15)),
            Math.max(0.01, activeFire * (0.95 + Math.cos(t * 11 + idx) * 0.22)),
            Math.max(0.01, activeFire)
          );
        });
        fireLight.intensity = activeFire * 14;
        ghost.position.y = 0.2 + Math.sin(t * 2.4) * 0.14;
        ghost.visible = stageIndex < 3;
      },
    };
  }

  // 03. Chữ người tử tù — Dramatic chiaroscuro prison cell, Huấn Cao in wooden cangue & shackles, white silk scroll, bowing warden & clerk
  if (preset === 'prison-calligraphy') {
    root.add(
      createDioramaBase({
        width: 11.4,
        depth: 10.0,
        floorKind: 'prison-stone',
        floorColor: 0x5c6370,
        plinthColor: 0x111827,
        cutawayWalls: true,
        wallColor: 0x262c36,
        wallHeight: 4.5,
      })
    );

    // Prison iron-barred window & weathered stone wall
    const prisonWallGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.42 });
    const barFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.55, 0.18), frameMat);
    barFrame.position.set(-2.3, 2.95, -4.85);
    prisonWallGroup.add(barFrame);
    for (let i = -3; i <= 3; i++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.48, 8), frameMat);
      bar.position.set(-2.3 + i * 0.3, 2.95, -4.76);
      prisonWallGroup.add(bar);
    }
    // Subtle moonlight slit behind prison bars
    const moonBeam = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 1.3),
      new THREE.MeshBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.45 })
    );
    moonBeam.position.set(-2.3, 2.95, -4.74);
    prisonWallGroup.add(moonBeam);
    tagHotspotGroup(prisonWallGroup, 'hs-03-1');
    root.add(prisonWallGroup);

    // Rough prison wooden plank table with glowing white silk scroll ("tấm lụa bạch"), ink stone, zinc coins & flickering oil torch
    const tableGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      map: createDioramaTexture('wood-plank', 2, 1),
      color: 0x5a3922,
      roughness: 0.88,
    });
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 1.65), woodMat);
    top.position.y = 0.86;
    top.castShadow = true;
    top.receiveShadow = true;
    tableGroup.add(top);
    for (const lx of [-1.36, 1.36]) {
      for (const lz of [-0.66, 0.66]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.86, 0.14), woodMat);
        leg.position.set(lx, 0.43, lz);
        leg.castShadow = true;
        tableGroup.add(leg);
      }
    }

    // Crisp luminous white silk scroll ("tấm lụa bạch còn nguyên vẹn lần hồ") with ink calligraphy strokes
    const silkCanvas = document.createElement('canvas');
    silkCanvas.width = 256;
    silkCanvas.height = 128;
    const sctx = silkCanvas.getContext('2d');
    if (sctx) {
      sctx.fillStyle = '#fffdf7';
      sctx.fillRect(0, 0, 256, 128);
      sctx.strokeStyle = '#d6c6a5';
      sctx.lineWidth = 4;
      sctx.strokeRect(8, 8, 240, 112);
      // Expressive abstract square calligraphy brush strokes (no readable text)
      sctx.strokeStyle = '#111827';
      sctx.lineWidth = 7;
      sctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const cx = 56 + i * 72;
        sctx.beginPath();
        sctx.moveTo(cx - 18, 38);
        sctx.lineTo(cx + 18, 38);
        sctx.moveTo(cx, 28);
        sctx.lineTo(cx, 92);
        sctx.moveTo(cx - 16, 62);
        sctx.lineTo(cx + 16, 56);
        sctx.moveTo(cx - 14, 88);
        sctx.lineTo(cx + 20, 84);
        sctx.stroke();
      }
    }
    const silkTex = new THREE.CanvasTexture(silkCanvas);
    silkTex.colorSpace = THREE.SRGBColorSpace;
    const silk = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 0.035, 1.05),
      new THREE.MeshStandardMaterial({
        map: silkTex,
        color: 0xffffff,
        emissive: 0xfff7ed,
        emissiveIntensity: 0.24,
        roughness: 0.42,
      })
    );
    silk.position.set(-0.08, 0.96, 0);
    tableGroup.add(silk);

    // Ink basin ("chậu mực") & wooden brush rest
    const inkBasin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.1, 14),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.28 })
    );
    inkBasin.position.set(1.22, 0.98, 0.28);
    tableGroup.add(inkBasin);

    // Wall-mounted oil-soaked torch casting dramatic warm amber light
    const torchPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.35, 8), woodMat);
    torchPole.position.set(1.78, 1.25, -0.55);
    const torchFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.65, 10),
      new THREE.MeshStandardMaterial({
        color: 0xffb347,
        emissive: 0xff4500,
        emissiveIntensity: 2.2,
      })
    );
    torchFlame.position.set(1.78, 2.1, -0.55);
    const torchLight = new THREE.PointLight(0xff8c33, 18, 16, 1.6);
    torchLight.position.set(1.5, 2.35, -0.3);
    torchLight.castShadow = true;
    tableGroup.add(torchPole, torchFlame, torchLight);

    tableGroup.position.set(0.2, 0, 0.3);
    tagHotspotGroup(tableGroup, 'hs-03-3');
    root.add(tableGroup);

    // Huấn Cao — dignified upright prisoner in authentic wooden neck cangue ("gông gỗ"), iron shackles, writing with brush
    const huanCao = createArticulatedFigure({
      robeColor: 0xe5e0d5,
      accentColor: 0x78350f,
      scale: 1.12,
      pose: 'cangue-prisoner',
      headgear: 'bun',
      prop: 'brush',
    });
    huanCao.position.set(-0.3, 0, -1.15);
    huanCao.rotation.y = 0.08;
    tagHotspotGroup(huanCao, 'hs-03-2');
    root.add(huanCao);

    // Viên quản ngục (bowing humbly, holding zinc coins "đồng tiền kẽm") & Thầy thơ lại (holding ink tray)
    const staffGroup = new THREE.Group();
    const quanNguc = createArticulatedFigure({
      robeColor: 0x3f2e22,
      accentColor: 0xb45309,
      scale: 1.0,
      pose: 'bowing',
      headgear: 'khan-dong',
    });
    quanNguc.position.set(-1.3, 0, 1.85);
    quanNguc.rotation.y = 2.65;

    const thoLai = createArticulatedFigure({
      robeColor: 0x334155,
      accentColor: 0x94a3b8,
      scale: 0.94,
      pose: 'holding-tray',
      headgear: 'khan-dong',
    });
    thoLai.position.set(1.75, 0, 1.7);
    thoLai.rotation.y = -2.45;

    staffGroup.add(quanNguc, thoLai);
    tagHotspotGroup(staffGroup, 'hs-03-4');
    root.add(staffGroup);

    return {
      root,
      backdropColor: 0x121826,
      ambientIntensity: 0.32,
      directionalIntensity: 0.42,
      update: (t, stageIndex, params) => {
        const power = (params.torchIntensity ?? 80) / 100;
        const stageBoost = stageIndex === 0 ? 0.55 : stageIndex === 1 ? 1.2 : 1.05;
        const flicker = 0.9 + Math.sin(t * 14) * 0.09 + Math.cos(t * 21) * 0.06;
        torchLight.intensity = 18 * power * stageBoost * flicker;
        torchFlame.scale.set(0.95, 0.95 + Math.sin(t * 15) * 0.16, 0.95);
        // Subtle dignified brush motion when writing calligraphy
        huanCao.rotation.y = 0.08 + Math.sin(t * 1.4) * 0.04;
      },
    };
  }

  // 04. Đăm Săn chiến thắng Mtao Mxây — Authentic Tây Nguyên Ede longhouse, epic shield dance & bronze gong festival
  if (preset === 'longhouse-epic') {
    root.add(
      createDioramaBase({
        width: 12.2,
        depth: 10.6,
        floorKind: 'meadow-earth',
        floorColor: 0xbda378,
        plinthColor: 0x7c4a26,
        terrainRelief: 0.15,
      })
    );

    const longhouse = createEdeLonghouse(0.95);
    longhouse.position.set(-1.3, 0, -2.5);
    tagHotspotGroup(longhouse, 'hs-04-1');
    root.add(longhouse);

    // Đăm Săn — heroic Tây Nguyên warrior with brocade loincloth & bronze shield
    const damSan = createArticulatedFigure({
      robeColor: 0x991b1b,
      accentColor: 0xf59e0b,
      skinColor: 0xc98c63,
      scale: 1.14,
      pose: 'heroic',
      headgear: 'turban',
      prop: 'shield',
    });
    damSan.position.set(-0.9, 0, 1.5);
    damSan.rotation.y = 0.7;
    tagHotspotGroup(damSan, 'hs-04-2');
    root.add(damSan);

    // Mtao Mxây retreating defensively
    const mtao = createArticulatedFigure({
      robeColor: 0x292524,
      accentColor: 0x9ca3af,
      skinColor: 0xc98c63,
      scale: 1.04,
      pose: 'standing',
      headgear: 'turban',
      prop: 'shield',
    });
    mtao.position.set(1.9, 0, 1.0);
    mtao.rotation.y = -1.1;
    tagHotspotGroup(mtao, 'hs-04-3');
    root.add(mtao);

    // Festival firepit, ceremonial wine jars ("ché rượu cần") & bronze gongs ("chiêng đồng")
    const gongGroup = new THREE.Group();
    const gongMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.65, roughness: 0.3 });
    const rackWood = new THREE.MeshStandardMaterial({ color: 0x4e2d18, roughness: 0.85 });
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.6, 8), rackWood);
    postL.position.set(2.4, 0.8, 2.9);
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.6, 8), rackWood);
    postR.position.set(4.0, 0.8, 2.9);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.08), rackWood);
    bar.position.set(3.2, 1.54, 2.9);
    const gong = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 24), gongMat);
    gong.rotation.x = Math.PI / 2;
    gong.position.set(3.2, 0.96, 2.9);
    const jar = new THREE.Mesh(
      new THREE.LatheGeometry(
        [new THREE.Vector2(0.14, 0), new THREE.Vector2(0.26, 0.28), new THREE.Vector2(0.18, 0.56), new THREE.Vector2(0.14, 0.64)],
        14
      ),
      new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.5 })
    );
    jar.position.set(2.2, 0.02, 3.6);
    gongGroup.add(postL, postR, bar, gong, jar);
    tagHotspotGroup(gongGroup, 'hs-04-4');
    root.add(gongGroup);

    const tree1 = createLayeredTree(0x166534, 1.25);
    tree1.position.set(4.1, 0, -2.8);
    const tree2 = createLayeredTree(0x15803d, 1.05);
    tree2.position.set(-4.6, 0, 1.6);
    root.add(tree1, tree2);

    return {
      root,
      backdropColor: 0xf7efe0,
      update: (t, stageIndex, params) => {
        const rhythm = (params.epicRhythm ?? 65) / 100;
        const speed = 1.6 + rhythm * 2.8;
        if (stageIndex <= 1) {
          damSan.position.x = -0.9 + Math.sin(t * speed) * 0.65;
          damSan.position.y = Math.abs(Math.sin(t * speed * 1.4)) * 0.35;
          damSan.rotation.y = 0.7 + Math.sin(t * speed) * 0.45;
          mtao.position.x = 1.9 + Math.sin(t * speed * 0.8) * 0.32;
        } else {
          damSan.position.x += (0 - damSan.position.x) * 0.08;
          damSan.position.y = Math.sin(t * 2) * 0.05;
          mtao.visible = stageIndex < 2;
        }
        gong.rotation.z = Math.sin(t * 4) * 0.06;
      },
    };
  }

  // 05. Prô-mê-tê và loài người — Classical Greek colonnade, clay shaping & sacred flame of civilization
  if (preset === 'greek-fire') {
    root.add(
      createDioramaBase({
        width: 11.8,
        depth: 10.4,
        floorKind: 'stone-brick',
        floorColor: 0xe6e1d5,
        plinthColor: 0x64748b,
      })
    );

    const colonnade = createGreekColonnade(0.96);
    colonnade.position.set(0, 0, -2.5);
    tagHotspotGroup(colonnade, 'hs-05-1');
    root.add(colonnade);

    // Sacred Olympic Fire Altar
    const altarGroup = new THREE.Group();
    const altarBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.72, 1.05, 16),
      new THREE.MeshStandardMaterial({ color: 0xf1ece1, roughness: 0.5 })
    );
    altarBase.position.y = 0.525;
    const brazier = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.38, 0.28, 16),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.6, roughness: 0.35 })
    );
    brazier.position.y = 1.15;
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 0.95, 12),
      new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xff4d00, emissiveIntensity: 2.0 })
    );
    flame.position.y = 1.72;
    const fireGlow = new THREE.PointLight(0xff7722, 12, 14);
    fireGlow.position.set(0, 2.2, 0.2);
    altarGroup.add(altarBase, brazier, flame, fireGlow);
    altarGroup.position.set(0, 0, 0.6);
    tagHotspotGroup(altarGroup, 'hs-05-3');
    root.add(altarGroup);

    // Prometheus bringing sacred flame
    const prometheus = createArticulatedFigure({
      robeColor: 0xf8fafc,
      accentColor: 0x1d4ed8,
      scale: 1.12,
      pose: 'heroic',
      headgear: 'none',
      prop: 'torch',
    });
    prometheus.position.set(-2.3, 0, 1.5);
    prometheus.rotation.y = 0.7;
    tagHotspotGroup(prometheus, 'hs-05-2');
    root.add(prometheus);

    // Upright Humanity standing tall facing the stars
    const humanGroup = new THREE.Group();
    const h1 = createArticulatedFigure({ robeColor: 0xd97706, accentColor: 0xfef3c7, scale: 0.96, pose: 'standing' });
    h1.position.set(2.3, 0, 1.4);
    h1.rotation.y = -0.65;
    const h2 = createArticulatedFigure({ robeColor: 0x0f766e, accentColor: 0xfef3c7, scale: 0.92, pose: 'standing' });
    h2.position.set(3.2, 0, 2.1);
    h2.rotation.y = -0.8;
    humanGroup.add(h1, h2);
    tagHotspotGroup(humanGroup, 'hs-05-4');
    root.add(humanGroup);

    const olive = createLayeredTree(0x557b4c, 1.05);
    olive.position.set(-4.3, 0, -1.8);
    root.add(olive);

    return {
      root,
      backdropColor: 0xe8f1fc,
      update: (t, stageIndex, params) => {
        const glow = (params.fireGlow ?? 75) / 100;
        const boost = stageIndex >= 2 ? 1.25 : 0.7;
        flame.scale.set(0.95 * boost, (0.9 + Math.sin(t * 10) * 0.16) * boost, 0.95 * boost);
        fireGlow.intensity = 12 * glow * boost;
      },
    };
  }

  // 06. Gặp Ka-ríp và Xi-la (Ô-đi-xê) — Dynamic rolling sea waves, spiral Charybdis whirlpool, karst sea cliff Scylla & Odysseus ship
  if (preset === 'odyssey-strait') {
    root.add(
      createDioramaBase({
        width: 12.4,
        depth: 10.8,
        floorKind: 'water-ripple',
        floorColor: 0x0c5e8a,
        plinthColor: 0x0b2a42,
      })
    );

    const ocean = createAnimatedOceanSurface(12.2, 10.6, 0x0e6b9c);
    root.add(ocean.mesh);

    // Charybdis swirling multi-ring whirlpool
    const whirlGroup = new THREE.Group();
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.42 + i * 0.42, 0.085, 10, 32),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0xe0f2fe : 0x38bdf8,
          roughness: 0.25,
          transparent: true,
          opacity: 0.92 - i * 0.12,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1 + i * 0.03;
      rings.push(ring);
      whirlGroup.add(ring);
    }
    whirlGroup.position.set(-3.1, 0.05, 1.4);
    tagHotspotGroup(whirlGroup, 'hs-06-1');
    root.add(whirlGroup);

    // Scylla towering craggy karst sea cliff (ZERO sharp cone!)
    const scyllaCliff = createLimestoneKarstMountain({
      height: 3.7,
      radius: 2.0,
      rockColor: 0x3f4c59,
      mossColor: 0x334155,
      seed: 14,
      withCaveArch: true,
    }).group;
    scyllaCliff.position.set(3.4, 0, -1.9);
    scyllaCliff.rotation.y = -0.65;
    tagHotspotGroup(scyllaCliff, 'hs-06-2');
    root.add(scyllaCliff);

    // Odysseus wooden galley with billowing sail & heroic helmsman
    const shipGroup = new THREE.Group();
    const galley = createWoodenBoat(3.2, 0x6b3a1e, 0xfef3c7, true, false);
    const odysseus = createArticulatedFigure({
      robeColor: 0x991b1b,
      accentColor: 0xeab308,
      scale: 0.74,
      pose: 'heroic',
      headgear: 'helmet',
    });
    odysseus.position.set(-0.6, 0.26, 0);
    odysseus.rotation.y = Math.PI / 2;
    shipGroup.add(galley, odysseus);
    shipGroup.position.set(-0.2, 0.08, 1.2);
    tagHotspotGroup(shipGroup, 'hs-06-3');
    root.add(shipGroup);

    // Clear Ithaca horizon marker rock & golden sunlight beacon
    const beaconGroup = new THREE.Group();
    const farRock = createLimestoneKarstMountain({ height: 1.5, radius: 1.1, rockColor: 0x64748b, mossColor: 0x2f7d4d, seed: 8 }).group;
    farRock.position.set(-3.2, 0, -3.4);
    beaconGroup.add(farRock);
    tagHotspotGroup(beaconGroup, 'hs-06-4');
    root.add(beaconGroup);

    return {
      root,
      backdropColor: 0xdcebf7,
      fogDensity: 0.01,
      update: (t, stageIndex, params) => {
        const wave = (params.stormIntensity ?? 65) / 100;
        ocean.updateWaves(t, 0.04 + wave * 0.09);
        rings.forEach((r, idx) => {
          r.rotation.z = t * (2.4 - idx * 0.35) * (0.6 + wave);
        });
        const targetZ = stageIndex === 0 ? 2.6 : stageIndex === 1 ? 0.8 : -1.8;
        const targetX = stageIndex === 1 ? 0.55 : -0.15;
        shipGroup.position.z += (targetZ - shipGroup.position.z) * 0.05;
        shipGroup.position.x += (targetX - shipGroup.position.x) * 0.05;
        shipGroup.position.y = 0.08 + Math.sin(t * 2.4) * (0.07 + wave * 0.08);
        shipGroup.rotation.z = Math.sin(t * 2.1) * (0.04 + wave * 0.06);
      },
    };
  }

  // 07. HƯƠNG SƠN PHONG CẢNH (FLAGSHIP REFERENCE DIORAMA)
  // Natural limestone karst range + vaulted Động Hương Tích cave arch + authentic curved-eave pagoda +
  // winding Suối Yến stream with animated ripples + curved wooden sampan boat + layered riverside trees & bamboo!
  if (preset === 'huong-son-cave') {
    root.add(
      createDioramaBase({
        width: 12.6,
        depth: 11.0,
        floorKind: 'meadow-earth',
        floorColor: 0x9dc289,
        plinthColor: 0x67836e,
        terrainRelief: 0.16,
      })
    );

    // 1. Dãy núi đá vôi Hương Sơn (back-left & back-right sculpted limestone karst mountains — ZERO cones!)
    const mountainRangeGroup = new THREE.Group();
    const peakLeft = createLimestoneKarstMountain({
      height: 3.65,
      radius: 2.05,
      rockColor: 0x5c7276,
      mossColor: 0x2d6a4f,
      seed: 11,
    }).group;
    peakLeft.position.set(-3.6, 0, -2.9);

    const peakFarRight = createLimestoneKarstMountain({
      height: 2.95,
      radius: 1.75,
      rockColor: 0x62777a,
      mossColor: 0x357a57,
      seed: 23,
    }).group;
    peakFarRight.position.set(3.5, 0, -3.2);

    const cloudA = createCloudCluster(0.9, 0.78);
    cloudA.position.set(-2.9, 3.85, -2.5);
    const cloudB = createCloudCluster(0.75, 0.72);
    cloudB.position.set(2.9, 3.35, -2.8);

    mountainRangeGroup.add(peakLeft, peakFarRight, cloudA, cloudB);
    tagHotspotGroup(mountainRangeGroup, 'hs-07-1');
    root.add(mountainRangeGroup);

    // 2. Cửa động Hương Tích (sculpted central karst mountain with real recessed dark cave arch, stalactites, lantern & stone stairs)
    const { group: caveMountain, caveGroup } = createLimestoneKarstMountain({
      height: 3.35,
      radius: 2.1,
      rockColor: 0x54686c,
      mossColor: 0x286646,
      seed: 17,
      withCaveArch: true,
    });
    caveMountain.position.set(0.25, 0, -2.65);
    root.add(caveMountain);
    if (caveGroup) {
      tagHotspotGroup(caveGroup, 'hs-07-2');
    } else {
      tagHotspotGroup(caveMountain, 'hs-07-2');
    }

    // 3. Mái chùa cổ (authentic curved upturned-eave Vietnamese pagoda nestled cleanly on the left bank)
    const pagoda = createVietnameseTemple(0.76, 0x9e3827);
    pagoda.position.set(-2.95, 0.04, 1.35);
    pagoda.rotation.y = 0.55;
    tagHotspotGroup(pagoda, 'hs-07-3');
    root.add(pagoda);

    // 4. Dòng suối Yến (meandering organic spline river curving from cave foot down across the foreground!)
    const { group: riverGroup, curve: riverCurve, waterTexture } = createWindingRiver({
      points: [
        [2.6, -1.6],
        [1.4, 0.0],
        [2.1, 1.8],
        [0.4, 3.4],
        [-2.2, 4.4],
      ],
      width: 1.75,
      waterColor: 0x2299b8,
      bankColor: 0x79a462,
    });
    tagHotspotGroup(riverGroup, 'hs-07-4');
    root.add(riverGroup);

    // 5. Con thuyền vãn cảnh (natural wooden sampan boat with woven bamboo canopy & traveler gliding along Suối Yến)
    const boatGroup = new THREE.Group();
    const sampan = createWoodenBoat(2.15, 0x7b4a26, 0xfef3c7, false, true);
    const traveler = createArticulatedFigure({
      robeColor: 0x1e3a5f,
      accentColor: 0xd97706,
      scale: 0.52,
      pose: 'seated',
      headgear: 'hat-non',
    });
    traveler.position.set(0.45, 0.24, 0);
    traveler.rotation.y = -Math.PI / 2;
    boatGroup.add(sampan, traveler);
    const startPt = riverCurve.getPointAt(0.48);
    boatGroup.position.set(startPt.x, 0.09, startPt.z);
    tagHotspotGroup(boatGroup, 'hs-07-5');
    root.add(boatGroup);

    // 6. Cây cối ven suối (layered multi-tone trees, flowering apricot/mai blossoms & graceful bamboo groves)
    const vegetationGroup = new THREE.Group();
    const t1 = createLayeredTree(0x2d7a47, 1.12, 0xfef08a);
    t1.position.set(4.3, 0.04, -0.3);
    const t2 = createLayeredTree(0x1f6b43, 0.92);
    t2.position.set(4.5, 0.04, 2.2);
    const bam1 = createBambooCluster(1.05);
    bam1.position.set(3.4, 0.04, 0.9);
    const bam2 = createBambooCluster(0.88);
    bam2.position.set(-0.35, 0.04, 1.45);
    vegetationGroup.add(t1, t2, bam1, bam2);
    tagHotspotGroup(vegetationGroup, 'hs-07-6');
    root.add(vegetationGroup);

    // Foreground framing tree on far-left edge (non-hotspot backdrop framing)
    const frameTree = createLayeredTree(0x2e7d47, 0.95);
    frameTree.position.set(-4.9, 0.04, 3.2);
    root.add(frameTree);

    const boatPt = new THREE.Vector3();
    const boatTan = new THREE.Vector3();

    return {
      root,
      backdropColor: 0xe4f1f8,
      fogDensity: 0.009,
      update: (t, stageIndex, params) => {
        const mist = (params.mountainMist ?? 45) / 100;
        // Continuous gentle water ripple flow along Suối Yến
        waterTexture.offset.y = -(t * 0.24) % 1;

        // Boat glides smoothly along real Suối Yến spline curve!
        const baseU = stageIndex === 0 ? 0.62 : stageIndex === 1 ? 0.44 : 0.28;
        const u = Math.max(0.14, Math.min(0.84, baseU + Math.sin(t * 0.35) * 0.1));
        riverCurve.getPointAt(u, boatPt);
        riverCurve.getTangentAt(u, boatTan);
        boatGroup.position.x += (boatPt.x - boatGroup.position.x) * 0.06;
        boatGroup.position.z += (boatPt.z - boatGroup.position.z) * 0.06;
        boatGroup.position.y = 0.09 + Math.sin(t * 2.1) * 0.025;
        boatGroup.rotation.y = Math.atan2(boatTan.x, boatTan.z) + Math.PI / 2;

        // Floating mist clouds & gentle breeze in riverside bamboo
        cloudA.position.x = -2.9 + Math.sin(t * 0.4) * 0.45;
        cloudB.position.x = 2.9 + Math.cos(t * 0.35) * 0.4;
        cloudA.scale.setScalar(0.65 + mist * 0.55);
        cloudB.scale.setScalar(0.55 + mist * 0.5);
        bam1.rotation.z = Math.sin(t * 1.4) * 0.04;
        bam2.rotation.z = Math.cos(t * 1.6) * 0.035;
      },
    };
  }

  // 08. Thơ duyên — Golden autumn lane, tamarind canopy with paired songbirds, drifting clouds & two poetic silhouettes
  if (preset === 'autumn-garden') {
    root.add(
      createDioramaBase({
        width: 11.8,
        depth: 10.4,
        floorKind: 'meadow-earth',
        floorColor: 0xb4ca8c,
        plinthColor: 0x998c6f,
        terrainRelief: 0.14,
      })
    );

    // Winding golden village path
    const { group: pathGroup } = createWindingRiver({
      points: [
        [-4.2, 3.6],
        [-1.2, 1.8],
        [1.2, 0.2],
        [3.6, -2.6],
      ],
      width: 1.45,
      waterColor: 0xd9c297,
      bankColor: 0x93b673,
    });
    tagHotspotGroup(pathGroup, 'hs-08-2');
    root.add(pathGroup);

    // Autumn tamarind tree with perched paired songbirds ("Con chim xanh biếc")
    const treeGroup = new THREE.Group();
    const meTree = createLayeredTree(0x4d8b31, 1.45, 0xf59e0b);
    meTree.position.set(-2.3, 0, -1.6);
    const birdMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.45 });
    const bird1 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), birdMat);
    bird1.position.set(-1.7, 2.35, -1.1);
    const bird2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), birdMat);
    bird2.position.set(-1.45, 2.42, -1.05);
    treeGroup.add(meTree, bird1, bird2);
    tagHotspotGroup(treeGroup, 'hs-08-1');
    root.add(treeGroup);

    // "Anh" and "Em" walking peacefully along the autumn lane
    const coupleGroup = new THREE.Group();
    const anh = createArticulatedFigure({ robeColor: 0x1e3a5f, accentColor: 0xfef3c7, scale: 0.98 });
    anh.position.set(-0.5, 0.06, 1.3);
    anh.rotation.y = 0.65;
    const em = createArticulatedFigure({ robeColor: 0xe11d48, accentColor: 0xfde68a, scale: 0.92, headgear: 'hat-non' });
    em.position.set(0.55, 0.06, 0.85);
    em.rotation.y = 0.55;
    coupleGroup.add(anh, em);
    tagHotspotGroup(coupleGroup, 'hs-08-3');
    root.add(coupleGroup);

    // Drifting golden autumn clouds & warm dusk sun
    const skyGroup = new THREE.Group();
    const c1 = createCloudCluster(0.95, 0.85);
    c1.position.set(2.4, 3.6, -2.5);
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 16, 14),
      new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.85 })
    );
    sun.position.set(3.4, 3.1, -3.4);
    skyGroup.add(c1, sun);
    tagHotspotGroup(skyGroup, 'hs-08-4');
    root.add(skyGroup);

    const sideTree = createLayeredTree(0xd97706, 1.05, 0xfbbf24);
    sideTree.position.set(3.8, 0, 1.4);
    root.add(sideTree);

    return {
      root,
      backdropColor: 0xfcf4e3,
      update: (t, stageIndex, params) => {
        const breeze = (params.breezeSpeed ?? 55) / 100;
        meTree.rotation.z = Math.sin(t * (1.2 + breeze)) * 0.03;
        c1.position.x = 2.4 + Math.sin(t * 0.5 * (0.5 + breeze)) * 0.6;
        const closeness = stageIndex >= 2 ? 0.36 : 0.72;
        anh.position.x = -closeness;
        em.position.x = closeness;
      },
    };
  }

  // 09. Dưới bóng hoàng lan — Warm 3-bay ancestral tiled house, blooming yellow ylang-ylang tree, grandma & Thanh–Nga
  if (preset === 'hoang-lan-garden') {
    root.add(
      createDioramaBase({
        width: 12.0,
        depth: 10.6,
        floorKind: 'tile-grid',
        floorColor: 0xf2e7d3,
        plinthColor: 0xbca98e,
      })
    );

    const house = createTiledHouse(1.06, 0xf6ead5);
    house.position.set(-1.3, 0, -2.3);
    tagHotspotGroup(house, 'hs-09-1');
    root.add(house);

    // Tall fragrant Hoàng Lan tree adorned with golden blossoms
    const hoangLan = createLayeredTree(0x1f6e43, 1.52, 0xfacc15);
    hoangLan.position.set(2.8, 0, -1.3);
    tagHotspotGroup(hoangLan, 'hs-09-2');
    root.add(hoangLan);

    // Bà (kindly grandmother on porch)
    const ba = createArticulatedFigure({
      robeColor: 0x5c3a21,
      accentColor: 0xd97706,
      hairColor: 0xe2e8f0,
      scale: 0.94,
      pose: 'standing',
      headgear: 'turban',
    });
    ba.position.set(-1.3, 0.24, -0.55);
    tagHotspotGroup(ba, 'hs-09-3');
    root.add(ba);

    // Thanh & Nga standing gently beneath the yellow blossoms
    const duoGroup = new THREE.Group();
    const thanh = createArticulatedFigure({ robeColor: 0xf8fafc, accentColor: 0x334155, scale: 1.0 });
    thanh.position.set(1.5, 0, 1.8);
    thanh.rotation.y = 0.5;
    const nga = createArticulatedFigure({ robeColor: 0xfef3c7, accentColor: 0x15803d, scale: 0.94, headgear: 'bun' });
    nga.position.set(2.6, 0, 1.6);
    nga.rotation.y = -0.55;
    duoGroup.add(thanh, nga);
    tagHotspotGroup(duoGroup, 'hs-09-4');
    root.add(duoGroup);

    // Floating fragrant golden pollen/blossom particles
    const petals: THREE.Mesh[] = [];
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 0.35 });
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), petalMat);
      p.position.set(1.8 + (i % 4) * 0.75, 1.2 + (i % 3) * 0.7, -0.6 + Math.floor(i / 4) * 0.9);
      petals.push(p);
      root.add(p);
    }

    const bam = createBambooCluster(0.95);
    bam.position.set(-4.4, 0, 1.6);
    root.add(bam);

    return {
      root,
      backdropColor: 0xfaf6eb,
      update: (t, _stage, params) => {
        const scent = (params.scentGlow ?? 65) / 100;
        petals.forEach((p, i) => {
          p.visible = i / petals.length <= scent;
          p.position.y = 0.6 + ((t * 0.32 + i * 0.4) % 2.4);
          p.position.x = 2.0 + Math.sin(t + i) * 0.8;
        });
        hoangLan.rotation.z = Math.sin(t * 0.9) * 0.025;
      },
    };
  }

  return null;
}
