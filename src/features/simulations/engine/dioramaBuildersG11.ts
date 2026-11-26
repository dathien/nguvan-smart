import * as THREE from 'three';
import { Scene3DPreset } from '../types';
import { BuiltDioramaScene } from './dioramaBuildersG10';
import { createBuildingFire, createHandheldFire } from '../effects/RealisticFire';
import { EnvironmentalEffectsManager } from '../effects/EnvironmentalEffects';
import {
  attachLabelAnchor,
  createAnimatedOceanSurface,
  createArticulatedFigure,
  createBambooCluster,
  createCloudCluster,
  createCurvedVietnameseRoof,
  createDioramaBase,
  createDioramaTexture,
  createLayeredTree,
  createLimestoneKarstMountain,
  createThatchedCottage,
  createTiledHouse,
  createWindingRiver,
  createWoodenBoat,
  tagHotspotGroup,
} from './dioramaPrimitives';

export function buildGrade11Diorama(preset: Scene3DPreset): BuiltDioramaScene | null {
  const root = new THREE.Group();
  const effects = new EnvironmentalEffectsManager();

  // 11. Vợ nhặt — Famine village lane, wooden cart with spoked wheels, thatched cottage with warm oil lamp, meal mat & red flag of hope
  if (preset === 'famine-village') {
    root.add(
      createDioramaBase({
        width: 12.0,
        depth: 10.6,
        floorKind: 'meadow-earth',
        floorColor: 0xc8bca8,
        plinthColor: 0x877d70,
        terrainRelief: 0.12,
      })
    );

    // Winding dirt lane into xóm ngụ cư
    const { group: lane } = createWindingRiver({
      points: [
        [-3.4, 4.6],
        [-3.0, 1.2],
        [-2.5, -2.4],
        [-2.2, -4.6],
      ],
      width: 1.7,
      waterColor: 0xb6a389,
      bankColor: 0x9b8e78,
    });
    tagHotspotGroup(lane, 'hs-11-1');
    root.add(lane);

    // Thatched cottage with warm interior oil lamp
    const cottage = createThatchedCottage(1.12, true);
    cottage.position.set(1.5, 0, -1.9);
    root.add(cottage);

    const lampLight = new THREE.PointLight(0xffa94d, 8, 12);
    lampLight.position.set(1.5, 1.5, -0.35);
    root.add(lampLight);

    // Tràng + sculpted wooden handcart ("xe bò kéo thóc") with wheels
    const trangGroup = new THREE.Group();
    const trang = createArticulatedFigure({ robeColor: 0x57534e, accentColor: 0xa16207, scale: 1.05, headgear: 'none' });
    const cartWood = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.86 });
    const cartBed = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 0.78), cartWood);
    cartBed.position.set(-1.15, 0.42, 0.2);
    const wheelL = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 18), cartWood);
    wheelL.position.set(-1.15, 0.3, 0.62);
    const wheelR = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 18), cartWood);
    wheelR.position.set(-1.15, 0.3, -0.22);
    trangGroup.add(trang, cartBed, wheelL, wheelR);
    trangGroup.position.set(-1.35, 0, 1.65);
    trangGroup.rotation.y = 0.55;
    tagHotspotGroup(trangGroup, 'hs-11-2');
    root.add(trangGroup);

    // Người vợ nhặt in traditional conical hat
    const voNhat = createArticulatedFigure({
      robeColor: 0x78716c,
      accentColor: 0xe7e5e4,
      scale: 0.96,
      headgear: 'hat-non',
    });
    voNhat.position.set(0.45, 0, 1.5);
    voNhat.rotation.y = -0.35;
    tagHotspotGroup(voNhat, 'hs-11-3');
    root.add(voNhat);

    // Bà cụ Tứ & woven sedge mat with steaming pot of "chè khoán" (cháo cám)
    const mealGroup = new THREE.Group();
    const baCuTu = createArticulatedFigure({
      robeColor: 0x44403c,
      accentColor: 0xd97706,
      hairColor: 0xe2e8f0,
      pose: 'seated',
      headgear: 'turban',
      scale: 0.94,
    });
    baCuTu.position.set(2.15, 0, 0.45);
    const mat = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 0.04, 1.25),
      new THREE.MeshStandardMaterial({ color: 0xdcc7a1, roughness: 0.9 })
    );
    mat.position.set(1.9, 0.03, 1.25);
    const pot = new THREE.Mesh(
      new THREE.LatheGeometry(
        [new THREE.Vector2(0.14, 0), new THREE.Vector2(0.24, 0.14), new THREE.Vector2(0.18, 0.28)],
        14
      ),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.72 })
    );
    pot.position.set(1.9, 0.05, 1.25);
    mealGroup.add(baCuTu, mat, pot);
    tagHotspotGroup(mealGroup, 'hs-11-4');
    root.add(mealGroup);

    // Horizon red flag of hope (rises boldly in Stage 3)
    const flagGroup = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 2.9, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c3a21 })
    );
    pole.position.y = 1.45;
    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.74, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.4 })
    );
    flag.position.set(0.6, 2.48, 0);
    flagGroup.add(pole, flag);
    flagGroup.position.set(3.8, 0, -3.2);
    tagHotspotGroup(flagGroup, 'hs-11-5');
    root.add(flagGroup);

    const bamboo = createBambooCluster(1.1);
    bamboo.position.set(-4.3, 0, -2.8);
    root.add(bamboo);
    effects.collectWindCanopiesFromRoot(root);

    return {
      root,
      backdropColor: 0xece9e4,
      effects,
      update: (t, stageIndex, params) => {
        const hope = (params.hopeLight ?? 65) / 100;
        lampLight.intensity = (stageIndex === 1 ? 13 : 6.5) * hope;
        const targetFlagScale = stageIndex === 2 ? 1.08 : 0.45;
        flagGroup.scale.setScalar(flagGroup.scale.x + (targetFlagScale - flagGroup.scale.x) * 0.08);
        flag.rotation.y = Math.sin(t * 3.2) * 0.16;
        effects.updateAmbient(t, 0.8);
      },
      dispose: () => effects.dispose(),
    };
  }

  // 12. Chí Phèo — Làng Vũ Đại: abandoned brick kiln, riverside hut & bowl of onion porridge, banana grove, Bá Kiến estate & winding river
  if (preset === 'vu-dai-village') {
    root.add(
      createDioramaBase({
        width: 12.4,
        depth: 10.8,
        floorKind: 'meadow-earth',
        floorColor: 0xb7c99e,
        plinthColor: 0x829175,
        terrainRelief: 0.12,
      })
    );

    // Abandoned cylindrical brick kiln ("Lò gạch cũ") with vaulted arch
    const kilnGroup = new THREE.Group();
    const brickMat = new THREE.MeshStandardMaterial({
      map: createDioramaTexture('stone-brick', 3, 2),
      color: 0xa85d44,
      roughness: 0.88,
    });
    const kilnBody = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.38, 2.2, 18), brickMat);
    kilnBody.position.y = 1.1;
    kilnBody.castShadow = true;
    const kilnRim = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.12, 8, 18), brickMat);
    kilnRim.rotation.x = Math.PI / 2;
    kilnRim.position.y = 2.18;
    const archDark = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 14, 0, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x111827 })
    );
    archDark.position.set(0, 0.38, 1.28);
    kilnGroup.add(kilnBody, kilnRim, archDark);
    kilnGroup.position.set(-3.7, 0, -2.6);
    tagHotspotGroup(kilnGroup, 'hs-12-1');
    root.add(kilnGroup);

    // Chí Phèo's thatched riverside hut + warm steaming bowl of onion porridge ("Bát cháo hành")
    const hutGroup = new THREE.Group();
    const hut = createThatchedCottage(0.9, false);
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.15, 0.16, 14),
      new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xd97706, emissiveIntensity: 0.35 })
    );
    bowl.position.set(0.35, 0.14, 1.55);
    const chiPheo = createArticulatedFigure({
      robeColor: 0x78350f,
      accentColor: 0xd6d3d1,
      pose: 'seated',
      headgear: 'none',
      scale: 0.96,
    });
    chiPheo.position.set(-0.55, 0, 1.6);
    hutGroup.add(hut, bowl, chiPheo);
    hutGroup.position.set(0.2, 0, 1.2);
    tagHotspotGroup(hutGroup, 'hs-12-2');
    root.add(hutGroup);

    // Moonlit riverside banana/bamboo grove & Thị Nở
    const groveGroup = new THREE.Group();
    const b1 = createLayeredTree(0x16803c, 1.05);
    b1.position.set(-3.0, 0, 1.5);
    const bam = createBambooCluster(1.0);
    bam.position.set(-3.9, 0, 2.3);
    const thiNo = createArticulatedFigure({
      robeColor: 0x57534e,
      accentColor: 0x15803d,
      scale: 0.94,
      headgear: 'turban',
    });
    thiNo.position.set(-2.1, 0, 2.1);
    thiNo.rotation.y = 0.85;
    groveGroup.add(b1, bam, thiNo);
    tagHotspotGroup(groveGroup, 'hs-12-3');
    root.add(groveGroup);

    // Bá Kiến's grand 3-bay brick tiled estate
    const baKienHouse = createTiledHouse(1.08, 0xf0e3cb);
    baKienHouse.position.set(3.2, 0, -2.2);
    baKienHouse.rotation.y = -0.25;
    tagHotspotGroup(baKienHouse, 'hs-12-4');
    root.add(baKienHouse);

    // Winding village river along the front bank (GLSL RealisticWater)
    const { group: river, waterMaterial } = createWindingRiver({
      points: [
        [-5.8, 4.3],
        [-1.8, 3.8],
        [2.2, 4.2],
        [5.8, 3.6],
      ],
      width: 1.5,
      waterColor: 0x2a88ad,
      bankColor: 0x7c9c66,
    });
    if (waterMaterial instanceof THREE.ShaderMaterial) {
      effects.registerWater(waterMaterial);
    }
    root.add(river);
    effects.collectWindCanopiesFromRoot(root);

    return {
      root,
      backdropColor: 0xe6edf4,
      effects,
      update: (t) => {
        bowl.position.y = 0.14 + Math.sin(t * 2.5) * 0.025;
        effects.updateAmbient(t, 0.85);
      },
      dispose: () => effects.dispose(),
    };
  }

  // 13. Tràng giang — Expansive animated rolling river, solitary wooden boat, drifting dry twig, lonely sandbar islet, silver clouds & dusk bird
  if (preset === 'trang-giang-river') {
    root.add(
      createDioramaBase({
        width: 12.4,
        depth: 10.8,
        floorKind: 'water-ripple',
        floorColor: 0x3b6e94,
        plinthColor: 0x26384d,
      })
    );

    const riverSurface = createAnimatedOceanSurface(12.2, 10.6, 0x427aa1);
    root.add(riverSurface.mesh);

    // Solitary wooden boat drifting slowly
    const boat = createWoodenBoat(2.25, 0x6b4423, 0xb45309, false, true);
    boat.position.set(-1.95, 0.09, 1.55);
    boat.rotation.y = 0.28;
    tagHotspotGroup(boat, 'hs-13-1');
    root.add(boat);

    // Drifting dry twig ("Củi một cành khô lạc mấy dòng")
    const twigGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e3a17, roughness: 0.92 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.068, 1.4, 7), woodMat);
    stem.rotation.z = Math.PI / 2;
    const fork1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.55, 6), woodMat);
    fork1.position.set(0.24, 0.05, 0.18);
    fork1.rotation.set(0.6, 0, Math.PI / 3);
    const fork2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.42, 6), woodMat);
    fork2.position.set(-0.28, 0.04, -0.14);
    fork2.rotation.set(-0.5, 0, -Math.PI / 3);
    twigGroup.add(stem, fork1, fork2);
    twigGroup.position.set(1.6, 0.12, 2.45);
    tagHotspotGroup(twigGroup, 'hs-13-2');
    root.add(twigGroup);

    // Lonely sandbar islet ("Lơ thơ cồn nhỏ gió đìu hiu")
    const isletGroup = new THREE.Group();
    const sandGeo = new THREE.SphereGeometry(1.75, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.35);
    sandGeo.scale(1.25, 0.32, 0.9);
    const sand = new THREE.Mesh(
      sandGeo,
      new THREE.MeshStandardMaterial({ color: 0xd9c28c, roughness: 0.92, flatShading: true })
    );
    sand.position.set(3.0, 0.02, -0.95);
    const reed = createBambooCluster(0.68);
    reed.position.set(2.9, 0.22, -1.0);
    isletGroup.add(sand, reed);
    tagHotspotGroup(isletGroup, 'hs-13-3');
    root.add(isletGroup);

    // Layered silver clouds ("Lớp lớp mây cao đùn núi bạc") & solitary dusk bird
    const skyGroup = new THREE.Group();
    const c1 = createCloudCluster(1.25, 0.88);
    c1.position.set(-2.1, 3.85, -3.1);
    const c2 = createCloudCluster(1.4, 0.85);
    c2.position.set(0.6, 4.15, -3.4);
    const c3 = createCloudCluster(1.1, 0.82);
    c3.position.set(2.9, 3.75, -3.0);

    // Sculpted V-wing dusk bird silhouette
    const birdGroup = new THREE.Group();
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.16), wingMat);
    wingL.position.set(-0.2, 0.06, 0);
    wingL.rotation.z = 0.26;
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.16), wingMat);
    wingR.position.set(0.2, 0.06, 0);
    wingR.rotation.z = -0.26;
    birdGroup.add(wingL, wingR);
    birdGroup.position.set(0.4, 3.15, -1.7);
    skyGroup.add(c1, c2, c3, birdGroup);
    tagHotspotGroup(skyGroup, 'hs-13-4');
    root.add(skyGroup);

    effects.registerCloud(c1, 0.22, 0.45, 0);
    effects.registerCloud(c2, 0.18, 0.5, 1.4);
    effects.registerCloud(c3, 0.25, 0.42, 2.8);
    effects.registerWater(riverSurface.waterMaterial);
    effects.collectWindCanopiesFromRoot(root);

    return {
      root,
      backdropColor: 0xe4ecf5,
      fogDensity: 0.011,
      effects,
      update: (t) => {
        riverSurface.updateWaves(t, 0.055);
        boat.position.y = 0.09 + Math.sin(t * 1.6) * 0.045;
        boat.rotation.z = Math.sin(t * 1.4) * 0.04;
        twigGroup.position.x = 1.6 + Math.sin(t * 0.75) * 0.45;
        twigGroup.rotation.y = Math.sin(t * 0.65) * 0.35;
        birdGroup.position.x = Math.sin(t * 0.85) * 1.5;
        wingL.rotation.z = 0.25 + Math.sin(t * 5) * 0.22;
        wingR.rotation.z = -0.25 - Math.sin(t * 5) * 0.22;
        effects.updateAmbient(t, 0.85);
      },
      dispose: () => effects.dispose(),
    };
  }

  // 14. Ai đã đặt tên cho dòng sông? — Organic winding Perfume River from Trường Sơn karst to Châu Hóa curve & Tràng Tiền bridge in Huế
  if (preset === 'perfume-river-terrain') {
    root.add(
      createDioramaBase({
        width: 12.4,
        depth: 10.8,
        floorKind: 'meadow-earth',
        floorColor: 0x9ec48f,
        plinthColor: 0x718d7a,
        terrainRelief: 0.16,
      })
    );

    // Graceful S-curved Perfume River ribbon across the entire diorama (GLSL RealisticWater)
    const { group: riverGroup, waterMaterial } = createWindingRiver({
      points: [
        [-4.9, -2.6],
        [-2.2, -0.6],
        [0.4, 0.9],
        [2.6, 1.7],
        [5.2, 2.3],
      ],
      width: 1.85,
      waterColor: 0x0ea5e9,
      bankColor: 0x6ea05b,
    });
    if (waterMaterial instanceof THREE.ShaderMaterial) {
      effects.registerWater(waterMaterial);
    }
    root.add(riverGroup);

    // Trường Sơn karst mountain range + red đỗ quyên forest blossoms
    const upperGroup = new THREE.Group();
    const peak1 = createLimestoneKarstMountain({ height: 3.3, radius: 1.9, rockColor: 0x456b52, mossColor: 0x1e603b, seed: 4 }).group;
    peak1.position.set(-3.9, 0, -2.8);
    const flowerTree = createLayeredTree(0x15803d, 1.05, 0xef4444);
    flowerTree.position.set(-2.1, 0, -3.2);
    upperGroup.add(peak1, flowerTree);
    tagHotspotGroup(upperGroup, 'hs-14-1');
    root.add(upperGroup);

    // Suburban pine hills & Châu Hóa poetic bend
    const subGroup = new THREE.Group();
    const pine1 = createLayeredTree(0x0f766e, 1.18);
    pine1.position.set(-0.5, 0, -1.6);
    const pine2 = createLayeredTree(0x14532d, 0.98);
    pine2.position.set(1.0, 0, -2.1);
    subGroup.add(pine1, pine2);
    tagHotspotGroup(subGroup, 'hs-14-2');
    root.add(subGroup);

    // Iconic multi-arch silver Tràng Tiền Bridge spanning Perfume River in Huế
    const bridgeGroup = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5, roughness: 0.32 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 3.2), steelMat);
    deck.position.set(2.5, 0.52, 1.7);
    bridgeGroup.add(deck);
    for (let i = -1; i <= 1; i++) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.055, 8, 18, Math.PI), steelMat);
      arch.rotation.y = Math.PI / 2;
      arch.position.set(2.5, 0.56, 1.7 + i * 0.92);
      bridgeGroup.add(arch);
    }
    tagHotspotGroup(bridgeGroup, 'hs-14-3');
    root.add(bridgeGroup);

    // Huế royal garden pavilion with curved violet-tinted tiled roof
    const hueHouse = createTiledHouse(0.76, 0xf5ecff);
    hueHouse.position.set(3.6, 0, -1.8);
    hueHouse.rotation.y = -0.45;
    tagHotspotGroup(hueHouse, 'hs-14-4');
    root.add(hueHouse);
    effects.collectWindCanopiesFromRoot(root);

    const morningCol = new THREE.Color(0x0ea5e9);
    const noonCol = new THREE.Color(0xd97706);
    const duskCol = new THREE.Color(0x7c3aed);
    const blendCol = new THREE.Color();

    return {
      root,
      backdropColor: 0xe7f3fb,
      effects,
      update: (t, _stage, params) => {
        const ratio = (params.timeOfDayHue ?? 50) / 100;
        if (ratio < 0.5) {
          blendCol.copy(morningCol).lerp(noonCol, ratio * 2 * 0.48);
        } else {
          blendCol.copy(morningCol).lerp(duskCol, (ratio - 0.5) * 2 * 0.68);
        }
        if (waterMaterial instanceof THREE.ShaderMaterial) {
          waterMaterial.uniforms.uShallowColor.value.copy(blendCol);
          waterMaterial.uniforms.uDeepColor.value.copy(blendCol).multiplyScalar(0.65);
        }
        effects.updateAmbient(t, 0.9);
      },
      dispose: () => effects.dispose(),
    };
  }

  // 15. Vĩnh biệt Cửu Trùng Đài — Monumental multi-tier curved-eave palace tower in dramatic theatrical firelight
  if (preset === 'cuu-trung-dai-stage') {
    root.add(
      createDioramaBase({
        width: 11.8,
        depth: 10.4,
        floorKind: 'wood-plank',
        floorColor: 0x9b7a5a,
        plinthColor: 0x241e2c,
        cutawayWalls: true,
        wallColor: 0x2a2136,
        wallHeight: 4.5,
      })
    );

    // Multi-tiered Cửu Trùng Đài with authentic curved Vietnamese gilded eaves (ZERO pyramid cones!)
    const towerGroup = new THREE.Group();
    const redWood = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.6 });
    const stoneMat = new THREE.MeshStandardMaterial({ map: createDioramaTexture('stone-brick', 3, 2), roughness: 0.82 });

    const tier1 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 2.9), stoneMat);
    tier1.position.y = 0.36;
    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.15, 2.15), redWood);
    tier2.position.y = 1.28;
    const roof1 = createCurvedVietnameseRoof({ width: 4.3, depth: 3.1, height: 0.72, roofColor: 0xc27816, ridgeColor: 0xf59e0b });
    roof1.position.y = 1.84;
    const tier3 = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.92, 1.5), redWood);
    tier3.position.y = 2.65;
    const roof2 = createCurvedVietnameseRoof({ width: 2.95, depth: 2.15, height: 0.68, roofColor: 0xd98a1e, ridgeColor: 0xfde047 });
    roof2.position.y = 3.08;

    // Real GLSL BuildingFire blazing on Cửu Trùng Đài in climax stage (ZERO cone flames!)
    const palaceFire = effects.registerFire(
      createBuildingFire({
        plumeOffsets: [
          [-1.15, 1.9, 0.65],
          [0.0, 2.35, 0.55],
          [1.15, 2.0, 0.5],
        ],
        scale: 1.05,
        lightIntensity: 20,
      })
    );

    towerGroup.add(tier1, tier2, roof1, tier3, roof2, palaceFire.group);
    towerGroup.position.set(0, 0, -1.7);
    tagHotspotGroup(towerGroup, 'hs-15-1');
    attachLabelAnchor(towerGroup, 'hs-15-1', 0, 3.8, 0);
    root.add(towerGroup);

    const vuNhuTo = createArticulatedFigure({
      robeColor: 0xfef3c7,
      accentColor: 0x991b1b,
      pose: 'heroic',
      headgear: 'bun',
      prop: 'scroll',
      scale: 1.08,
    });
    vuNhuTo.position.set(-1.6, 0, 1.5);
    vuNhuTo.rotation.y = 0.45;
    tagHotspotGroup(vuNhuTo, 'hs-15-2');
    attachLabelAnchor(vuNhuTo, 'hs-15-2', 0, 2.1, 0);
    root.add(vuNhuTo);

    const danThiem = createArticulatedFigure({
      robeColor: 0x9f1239,
      accentColor: 0xfde68a,
      pose: 'bowing',
      headgear: 'bun',
      scale: 1.0,
    });
    danThiem.position.set(1.4, 0, 1.6);
    danThiem.rotation.y = -0.6;
    tagHotspotGroup(danThiem, 'hs-15-3');
    attachLabelAnchor(danThiem, 'hs-15-3', 0, 1.9, 0);
    root.add(danThiem);

    const crowdGroup = new THREE.Group();
    const r1 = createArticulatedFigure({ robeColor: 0x475569, accentColor: 0xb45309, prop: 'torch', scale: 0.94 });
    const rebelTorchFire = effects.registerFire(
      createHandheldFire({ width: 0.34, height: 0.55, lightIntensity: 9, emberCount: 10, smokeCount: 4 })
    );
    const rTip = r1.userData.torchTipAnchor as THREE.Object3D | undefined;
    if (rTip) rTip.add(rebelTorchFire.group);
    r1.position.set(3.2, 0, 2.9);
    r1.rotation.y = -2.2;
    const r2 = createArticulatedFigure({ robeColor: 0x334155, accentColor: 0x991b1b, scale: 0.92 });
    r2.position.set(4.1, 0, 2.2);
    r2.rotation.y = -2.4;
    crowdGroup.add(r1, r2);
    tagHotspotGroup(crowdGroup, 'hs-15-4');
    attachLabelAnchor(crowdGroup, 'hs-15-4', 3.55, 2.0, 2.6);
    root.add(crowdGroup);

    return {
      root,
      backdropColor: 0x1a1727,
      ambientIntensity: 0.45,
      directionalIntensity: 0.68,
      effects,
      setQuality: (tier) => effects.setQuality(tier),
      update: (t, stageIndex, params, dt = 0.016) => {
        const power = (params.dramaIntensity ?? 75) / 100;
        const burning = stageIndex >= 2;
        palaceFire.update(dt, t, burning, power * 1.2);
        rebelTorchFire.update(dt, t, stageIndex >= 1, 0.95);
      },
      dispose: () => effects.dispose(),
    };
  }

  // 17. Thuyền và biển — Rolling blue sea waves, billowing sailboat, glowing horizon sun & twin unity rings
  if (preset === 'boat-sea-waves') {
    root.add(
      createDioramaBase({
        width: 12.0,
        depth: 10.6,
        floorKind: 'water-ripple',
        floorColor: 0x0284c7,
        plinthColor: 0x0c4a6e,
      })
    );

    const ocean = createAnimatedOceanSurface(11.8, 10.4, 0x0384c6);
    root.add(ocean.mesh);

    const boat = createWoodenBoat(2.6, 0xf8fafc, 0x0369a1, true, false);
    boat.position.set(0.3, 0.1, 0.85);
    tagHotspotGroup(boat, 'hs-17-1');
    root.add(boat);

    // Curved seafoam wave crests
    const waveGroup = new THREE.Group();
    const crestMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.32 });
    for (let i = 0; i < 4; i++) {
      const crest = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 8, 18, Math.PI * 0.55), crestMat);
      crest.rotation.x = Math.PI / 2;
      crest.position.set(-2.6 + i * 1.75, 0.12, 2.5 - (i % 2) * 2.1);
      waveGroup.add(crest);
    }
    tagHotspotGroup(waveGroup, 'hs-17-2');
    root.add(waveGroup);

    const horizonGroup = new THREE.Group();
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.76, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.78 })
    );
    sun.position.set(2.4, 3.2, -3.4);
    horizonGroup.add(sun);
    tagHotspotGroup(horizonGroup, 'hs-17-3');
    root.add(horizonGroup);

    const heartGroup = new THREE.Group();
    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.085, 12, 28),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.35 })
    );
    ringA.position.set(-1.1, 2.25, -1.8);
    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.085, 12, 28),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35 })
    );
    ringB.position.set(-0.45, 2.25, -1.8);
    heartGroup.add(ringA, ringB);
    tagHotspotGroup(heartGroup, 'hs-17-4');
    root.add(heartGroup);

    return {
      root,
      backdropColor: 0xe6f3fc,
      update: (t, stageIndex, params) => {
        const amp = (params.waveMotion ?? 55) / 100;
        ocean.updateWaves(t, 0.04 + amp * 0.08);
        boat.position.y = 0.1 + Math.sin(t * 2.1) * 0.14 * amp;
        boat.rotation.z = Math.sin(t * 1.8) * 0.08 * amp;
        const targetX = stageIndex === 2 ? 1.55 : 0.3;
        boat.position.x += (targetX - boat.position.x) * 0.06;
        heartGroup.rotation.y = Math.sin(t * 0.8) * 0.3;
      },
    };
  }

  // 20. Hăm-lét ("Sống, hay không sống") — Gothic Elsinore stone arches, solitary spotlight Hamlet, crimson curtain & Ophelia
  if (preset === 'hamlet-stage') {
    root.add(
      createDioramaBase({
        width: 11.4,
        depth: 10.0,
        floorKind: 'stone-brick',
        floorColor: 0x64748b,
        plinthColor: 0x1e293b,
        cutawayWalls: true,
        wallColor: 0x334155,
        wallHeight: 4.5,
      })
    );

    const hallGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({
      map: createDioramaTexture('stone-brick', 2, 3),
      color: 0x526176,
      roughness: 0.82,
    });
    for (const x of [-3.4, -1.2, 1.0]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.1, 0.55), stoneMat);
      pillar.position.set(x, 2.05, -4.3);
      pillar.castShadow = true;
      hallGroup.add(pillar);
    }
    for (const ax of [-2.3, -0.1]) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.2, 8, 18, Math.PI), stoneMat);
      arch.position.set(ax, 3.15, -4.3);
      hallGroup.add(arch);
    }
    tagHotspotGroup(hallGroup, 'hs-20-1');
    root.add(hallGroup);

    const hamlet = createArticulatedFigure({
      robeColor: 0x0f172a,
      accentColor: 0x60a5fa,
      pose: 'standing',
      headgear: 'none',
      scale: 1.12,
    });
    hamlet.position.set(-0.4, 0, 0.85);
    hamlet.rotation.y = 0.25;
    tagHotspotGroup(hamlet, 'hs-20-2');
    root.add(hamlet);

    const spot = new THREE.PointLight(0x93c5fd, 13, 15);
    spot.position.set(-0.4, 3.8, 0.85);
    root.add(spot);

    const curtainGroup = new THREE.Group();
    const drape = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 3.45, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.72 })
    );
    drape.position.set(2.6, 1.72, -2.5);
    drape.castShadow = true;
    const claudius = createArticulatedFigure({
      robeColor: 0x991b1b,
      accentColor: 0xf59e0b,
      headgear: 'crown',
      scale: 0.96,
    });
    claudius.position.set(2.5, 0, -3.3);
    curtainGroup.add(drape, claudius);
    tagHotspotGroup(curtainGroup, 'hs-20-3');
    root.add(curtainGroup);

    const ophelia = createArticulatedFigure({
      robeColor: 0xe2e8f0,
      accentColor: 0x7c3aed,
      pose: 'holding-tray',
      headgear: 'bun',
      scale: 0.98,
    });
    ophelia.position.set(2.2, 0, 1.8);
    ophelia.rotation.y = -0.9;
    tagHotspotGroup(ophelia, 'hs-20-4');
    root.add(ophelia);

    return {
      root,
      backdropColor: 0x161d2e,
      ambientIntensity: 0.4,
      directionalIntensity: 0.55,
      update: (t, stageIndex, params) => {
        const focus = (params.spotlightFocus ?? 75) / 100;
        spot.intensity = (stageIndex === 1 ? 18 : 10) * focus;
        hamlet.rotation.y = 0.25 + Math.sin(t * 0.9) * 0.12;
      },
    };
  }

  return null;
}
