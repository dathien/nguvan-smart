import * as THREE from 'three';
import { QualityTier, Scene3DPreset } from '../types';
import {
  createBuildingFire,
  createCampfire,
  createHandheldFire,
  createTorchFire,
} from '../effects/RealisticFire';
import {
  DustDebrisEffect,
  EnvironmentalEffectsManager,
  LIGHTING_MOODS,
  LightingMoodPreset,
} from '../effects/EnvironmentalEffects';
import {
  attachLabelAnchor,
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
  createVaultedSkyDome,
  createVietnameseTemple,
  createWindingRiver,
  createWoodenBoat,
  markProtectedArea,
  tagHotspotGroup,
} from './dioramaPrimitives';

export interface BuiltDioramaScene {
  root: THREE.Group;
  backdropColor: number;
  ambientIntensity?: number;
  directionalIntensity?: number;
  fogDensity?: number;
  effects?: EnvironmentalEffectsManager;
  getStageMood?: (stageIndex: number) => LightingMoodPreset | null;
  setQuality?: (tier: QualityTier) => void;
  update: (elapsedSec: number, stageIndex: number, params: Record<string, number>, dt?: number) => void;
  dispose?: () => void;
}

export function buildGrade10Diorama(preset: Scene3DPreset): BuiltDioramaScene | null {
  const root = new THREE.Group();
  const effects = new EnvironmentalEffectsManager();

  // =========================================================================
  // 01. THẦN TRỤ TRỜI — 4-stage interactive cosmogony diorama:
  //   Stage 0: Trời đất chưa phân chia (dark primordial chaos mist, giant emerging)
  //   Stage 1: Thần xây cột chống trời (digging earth/piling stone, tall stone pillar rises lifting vaulted sky dome)
  //   Stage 2: Trời đất phân cách (bright vaulted celestial dome high above vast earth linked by towering stone pillar)
  //   Stage 3: Phá cột hình thành địa hình (pillar shatters outward with flying dust/boulders forming karst ranges & crater sea)
  // =========================================================================
  if (preset === 'myth-pillar') {
    root.add(
      createDioramaBase({
        width: 12.6,
        depth: 11.0,
        floorKind: 'meadow-earth',
        floorColor: 0xaab998,
        plinthColor: 0x6b776c,
        terrainRelief: 0.24,
      })
    );

    // 1. Natural vaulted atmospheric celestial sky dome (ZERO blue ring!) — hs-01-1
    const sky = createVaultedSkyDome(5.8);
    sky.group.position.set(0, 3.6, 0);
    sky.clouds.forEach((cl, i) => effects.registerCloud(cl, 0.28 + i * 0.06, 0.42, i * 1.9));
    tagHotspotGroup(sky.group, 'hs-01-1');
    attachLabelAnchor(sky.group, 'hs-01-1', 0.2, 2.35, -0.4);
    root.add(sky.group);

    // 2. Towering segmented rugged stone-and-earth cosmic pillar (7 rough-hewn strata blocks) — hs-01-2
    const pillarGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({
      map: createDioramaTexture('limestone-rock', 2, 2),
      color: 0x877b6a,
      roughness: 0.9,
      flatShading: true,
    });
    const pillarBaseMound = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.55, 0.46, 12),
      new THREE.MeshStandardMaterial({ color: 0x766957, roughness: 0.94, flatShading: true })
    );
    pillarBaseMound.position.y = 0.22;
    pillarBaseMound.receiveShadow = true;
    pillarGroup.add(pillarBaseMound);

    const pillarBlocks: {
      mesh: THREE.Mesh;
      baseY: number;
      scatterPos: THREE.Vector3;
      rotSign: number;
    }[] = [];

    const blockSpecs: [number, number, [number, number, number]][] = [
      [0.65, 0.88, [-3.3, 0.36, -2.1]],
      [1.36, 0.84, [3.2, 0.42, -2.2]],
      [2.06, 0.8, [-2.9, 0.34, 2.4]],
      [2.76, 0.76, [3.1, 0.38, 2.5]],
      [3.46, 0.72, [0.4, 0.4, -3.2]],
      [4.14, 0.68, [-1.4, 0.36, -2.9]],
      [4.8, 0.66, [2.1, 0.34, 0.8]],
    ];

    blockSpecs.forEach(([y, r, scatter], idx) => {
      const geo = new THREE.CylinderGeometry(r * 0.9, r * 1.08, 0.74, 9);
      const mesh = new THREE.Mesh(geo, stoneMat);
      mesh.position.set(0, y, 0);
      mesh.rotation.y = idx * 0.62;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      pillarGroup.add(mesh);
      pillarBlocks.push({
        mesh,
        baseY: y,
        scatterPos: new THREE.Vector3(scatter[0], scatter[1], scatter[2]),
        rotSign: idx % 2 === 0 ? 1 : -1,
      });
    });

    tagHotspotGroup(pillarGroup, 'hs-01-2');
    const pillarAnchor = attachLabelAnchor(pillarGroup, 'hs-01-2', 0, 2.8, 0);
    root.add(pillarGroup);

    // 3. Giant Deity Thần Trụ Trời digging earth & lifting the sky — hs-01-3
    const titan = createArticulatedFigure({
      robeColor: 0x7c3f1c,
      accentColor: 0xd97706,
      skinColor: 0xd6a57e,
      scale: 1.56,
      pose: 'heroic',
      headgear: 'bun',
    });
    titan.position.set(-2.35, 0.08, 1.35);
    titan.rotation.y = 0.72;
    tagHotspotGroup(titan, 'hs-01-3');
    attachLabelAnchor(titan, 'hs-01-3', 0, 2.15, 0);
    root.add(titan);

    // 4. Sculpted mountain ridges, valley depressions & crater sea emerging in Stage 4 — hs-01-4
    const landscapeGroup = new THREE.Group();
    const m1 = createLimestoneKarstMountain({
      height: 2.55,
      radius: 1.55,
      rockColor: 0x5c7168,
      mossColor: 0x2f7048,
      seed: 2,
    }).group;
    m1.position.set(3.55, 0, -2.55);

    const m2 = createLimestoneKarstMountain({
      height: 2.05,
      radius: 1.28,
      rockColor: 0x677971,
      mossColor: 0x3b8155,
      seed: 5,
    }).group;
    m2.position.set(-3.95, 0, -2.45);

    const m3 = createLimestoneKarstMountain({
      height: 1.45,
      radius: 1.0,
      rockColor: 0x6f7f75,
      mossColor: 0x3c7d52,
      seed: 12,
    }).group;
    m3.position.set(4.15, 0, 0.55);

    // Crater depression / primordial sea where earth was dug to build the pillar
    const seaMat = createAnimatedOceanSurface(3.1, 2.5, 0x0ea5e9);
    const seaRim = new THREE.Mesh(
      new THREE.RingGeometry(1.18, 1.68, 28),
      new THREE.MeshStandardMaterial({ color: 0x8d826c, roughness: 0.94, side: THREE.DoubleSide })
    );
    seaRim.rotation.x = -Math.PI / 2;
    seaRim.position.set(2.85, 0.06, 2.45);

    const lakeCircle = new THREE.Mesh(new THREE.CircleGeometry(1.42, 28), seaMat.waterMaterial);
    lakeCircle.rotation.x = -Math.PI / 2;
    lakeCircle.position.set(2.85, 0.085, 2.45);
    effects.registerWater(seaMat.waterMaterial);

    const treeA = createLayeredTree(0x2f7d4d, 0.92);
    treeA.position.set(4.55, 0.05, 1.8);
    landscapeGroup.add(m1, m2, m3, seaRim, lakeCircle, treeA);
    tagHotspotGroup(landscapeGroup, 'hs-01-4');
    attachLabelAnchor(landscapeGroup, 'hs-01-4', 3.45, 2.25, -1.5);
    root.add(landscapeGroup);

    // Primordial chaos dust & Stage 4 shattering rock dust particle cloud
    const dust = effects.registerDust(new DustDebrisEffect(64, 4.9, 3.8, 0xcabaa2));
    root.add(dust.points);

    effects.collectWindCanopiesFromRoot(root);
    const tmpTarget = new THREE.Vector3();

    return {
      root,
      backdropColor: 0x3a4254,
      fogDensity: 0.014,
      effects,
      getStageMood: (st) =>
        st === 0 ? LIGHTING_MOODS['primordial-chaos'] : LIGHTING_MOODS['primordial-clear'],
      setQuality: (tier) => effects.setQuality(tier),
      update: (t, stageIndex, params) => {
        const userLift = (params.pillarHeight ?? 75) / 100;
        const mistDensity = (params.mistDensity ?? 35) / 100;
        const isChaos = stageIndex === 0;
        const isBuilding = stageIndex === 1;
        const isSeparated = stageIndex === 2;
        const isShattered = stageIndex >= 3;

        // Smooth sky dome elevation & primordial chaos-to-clear shader shift
        const targetSkyY = isChaos ? 1.85 : isBuilding ? 2.75 + userLift * 1.4 : 4.2 + userLift * 1.1;
        sky.group.position.y += (targetSkyY - sky.group.position.y) * 0.08;
        sky.domeMat.uniforms.uTime.value = t;
        const targetChaos = isChaos ? 0.92 : isBuilding ? 0.25 : 0.0;
        sky.domeMat.uniforms.uChaosMix.value +=
          (targetChaos - sky.domeMat.uniforms.uChaosMix.value) * 0.08;
        sky.sunMesh.visible = !isChaos;

        // Towering stone pillar builds up in Stage 1-2, shatters outward into mountains in Stage 3
        const heightScale = isChaos ? 0.16 : isBuilding ? 0.56 + userLift * 0.42 : 0.78 + userLift * 0.34;
        pillarBlocks.forEach((b, idx) => {
          if (isShattered) {
            tmpTarget.copy(b.scatterPos);
          } else {
            const visibleInBuild = !isChaos && (!isBuilding || idx <= Math.ceil(userLift * 6));
            const targetY = visibleInBuild ? b.baseY * heightScale : 0.25;
            tmpTarget.set(0, targetY, 0);
          }
          b.mesh.position.lerp(tmpTarget, 0.08);
          b.mesh.scale.setScalar(isChaos && idx > 0 ? 0.01 : 1);
          const targetRotZ = isShattered ? 0.42 * b.rotSign : 0;
          b.mesh.rotation.z += (targetRotZ - b.mesh.rotation.z) * 0.08;
        });
        pillarBaseMound.visible = !isChaos;
        pillarAnchor.position.y = isShattered ? 0.8 : Math.min(4.6, 2.2 + userLift * 1.8);

        // Mountains & crater lake rise dramatically in Stage 4 ("đất đá văng ra hóa thành núi non")
        const terrainScale = isShattered ? 1.06 : isSeparated ? 0.62 : isBuilding ? 0.35 : 0.12;
        landscapeGroup.scale.y += (terrainScale - landscapeGroup.scale.y) * 0.08;
        landscapeGroup.visible = !isChaos;

        // Subtle giant lifting motion
        titan.position.y = 0.08 + Math.sin(t * 1.5) * 0.04;

        // Dust particle mood: heavy primordial swirl in Stage 0, explosive debris burst in Stage 3
        if (isChaos) {
          dust.update(t, 'swirl', 0.55 + mistDensity * 0.45);
        } else if (isShattered) {
          dust.update(t, 'burst', 0.75);
        } else {
          dust.update(t, 'idle', mistDensity * 0.42);
        }

        effects.updateAmbient(t, 0.8);
      },
      dispose: () => effects.dispose(),
    };
  }

  // =========================================================================
  // 02. CHUYỆN CHỨC PHÁN SỰ ĐỀN TẢN VIÊN — Authentic curved-eave temple with
  //     REAL GLSL BuildingFire + Smoke + Embers + DynamicFireLight ONLY in Stage 0 (Đốt đền)!
  //     Extinguished cleanly in Stages 1–3!
  // =========================================================================
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

    const templeGroup = new THREE.Group();
    const temple = createVietnameseTemple(1.06, 0x9b3123);
    templeGroup.add(temple);

    // Real GLSL BuildingFire (multi-plume natural fire + rising smoke + glowing embers + dynamic orange light)
    const templeFire = effects.registerFire(
      createBuildingFire({
        plumeOffsets: [
          [-1.05, 1.75, 0.45],
          [0.0, 2.05, 0.62],
          [1.05, 1.82, 0.4],
          [-0.45, 2.65, -0.1],
        ],
        scale: 1.05,
        lightIntensity: 24,
      })
    );
    templeGroup.add(templeFire.group);
    templeGroup.position.set(0.1, 0, -2.35);
    tagHotspotGroup(templeGroup, 'hs-02-1');
    attachLabelAnchor(templeGroup, 'hs-02-1', 0, 3.65, 0.1);
    root.add(templeGroup);

    // Ngô Tử Văn — upright scholar carrying real GLSL TorchFire
    const tuVan = createArticulatedFigure({
      robeColor: 0x163859,
      accentColor: 0xe6a832,
      scale: 1.08,
      pose: 'heroic',
      headgear: 'khan-dong',
      prop: 'torch',
    });
    const scholarTorchFire = effects.registerFire(
      createHandheldFire({ width: 0.34, height: 0.56, lightIntensity: 9, emberCount: 10, smokeCount: 4 })
    );
    const tipNode = tuVan.userData.torchTipAnchor as THREE.Object3D | undefined;
    if (tipNode) tipNode.add(scholarTorchFire.group);
    tuVan.position.set(-2.65, 0, 1.55);
    tuVan.rotation.y = 0.65;
    tagHotspotGroup(tuVan, 'hs-02-2');
    attachLabelAnchor(tuVan, 'hs-02-2', 0, 2.15, 0);
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
    thoCong.position.set(2.45, 0, 1.15);
    thoCong.rotation.y = -0.6;

    const ghost = createArticulatedFigure({
      robeColor: 0x1f2937,
      accentColor: 0xef4444,
      skinColor: 0xcbd5e1,
      scale: 1.05,
      pose: 'heroic',
      headgear: 'helmet',
    });
    ghost.position.set(3.85, 0.16, -0.35);
    ghost.rotation.y = -1.1;
    spiritsGroup.add(thoCong, ghost);
    tagHotspotGroup(spiritsGroup, 'hs-02-3');
    attachLabelAnchor(spiritsGroup, 'hs-02-3', 3.05, 2.1, 0.45);
    root.add(spiritsGroup);

    // Minh Ti justice dais & jade seal (Stages 2–3)
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
    attachLabelAnchor(courtGroup, 'hs-02-4', 0, 1.5, 3.6);
    root.add(courtGroup);

    const treeL = createLayeredTree(0x2d6a4f, 1.15);
    treeL.position.set(-4.35, 0, -2.8);
    const bamR = createBambooCluster(1.1);
    bamR.position.set(4.35, 0, -3.1);
    root.add(treeL, bamR);
    effects.collectWindCanopiesFromRoot(root);

    return {
      root,
      backdropColor: 0x262938,
      effects,
      getStageMood: (st) =>
        st === 0 ? LIGHTING_MOODS['temple-fire'] : LIGHTING_MOODS['temple-day'],
      setQuality: (tier) => effects.setQuality(tier),
      update: (t, stageIndex, params, dt = 0.016) => {
        const power = (params.lanternGlow ?? params.flameIntensity ?? 75) / 100;
        // Fire burns vividly ONLY in Stage 0 (Đốt đền trừ tà); cleanly extinguished in Stages 1–3!
        const isBurning = stageIndex === 0;
        templeFire.update(dt, t, isBurning, 0.75 + power * 0.55);
        scholarTorchFire.update(dt, t, stageIndex === 0, 0.9);
        ghost.position.y = 0.2 + Math.sin(t * 2.4) * 0.12;
        ghost.visible = stageIndex < 3;
        effects.updateAmbient(t, 0.9);
      },
      dispose: () => effects.dispose(),
    };
  }

  // =========================================================================
  // 03. CHỮ NGƯỜI TỬ TÙ — Atmospheric chiaroscuro prison cell lit richly by
  //     REAL GLSL TorchFire + DynamicFireLight, with ALL 7 separated hotspots:
  //     hs-03-1 Buồng giam · hs-03-2 Tấm lụa trắng · hs-03-3 Huấn Cao ·
  //     hs-03-4 Viên quản ngục · hs-03-5 Thầy thơ lại · hs-03-6 Bó đuốc · hs-03-7 Gông và xiềng
  // =========================================================================
  if (preset === 'prison-calligraphy') {
    root.add(
      createDioramaBase({
        width: 11.6,
        depth: 10.2,
        floorKind: 'prison-stone',
        floorColor: 0x676f7d,
        plinthColor: 0x151c2c,
        cutawayWalls: true,
        wallColor: 0x2f3745,
        wallHeight: 4.5,
      })
    );

    // 1. Buồng giam (stone wall, iron-barred window, subtle moonlit slit) — hs-03-1
    const prisonWallGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.42 });
    const barFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.6, 0.18), frameMat);
    barFrame.position.set(-2.5, 2.95, -4.95);
    prisonWallGroup.add(barFrame);
    for (let i = -3; i <= 3; i++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.52, 8), frameMat);
      bar.position.set(-2.5 + i * 0.31, 2.95, -4.86);
      prisonWallGroup.add(bar);
    }
    const moonBeam = new THREE.Mesh(
      new THREE.PlaneGeometry(2.15, 1.35),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.34 })
    );
    moonBeam.position.set(-2.5, 2.95, -4.84);
    prisonWallGroup.add(moonBeam);
    tagHotspotGroup(prisonWallGroup, 'hs-03-1');
    attachLabelAnchor(prisonWallGroup, 'hs-03-1', -2.5, 3.85, -4.7);
    root.add(prisonWallGroup);

    // Rough prison wooden plank table (base structure)
    const tableWood = new THREE.MeshStandardMaterial({
      map: createDioramaTexture('wood-plank', 2, 1),
      color: 0x623f27,
      roughness: 0.86,
    });
    const tableBase = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.15, 1.7), tableWood);
    top.position.set(0.15, 0.86, 0.3);
    top.castShadow = true;
    top.receiveShadow = true;
    tableBase.add(top);
    for (const lx of [-1.25, 1.55]) {
      for (const lz of [-0.38, 0.98]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.86, 0.14), tableWood);
        leg.position.set(lx, 0.43, lz);
        leg.castShadow = true;
        tableBase.add(leg);
      }
    }
    root.add(tableBase);

    // 2. Tấm lụa trắng ("tấm lụa bạch còn nguyên vẹn lần hồ") — hs-03-2
    const silkGroup = new THREE.Group();
    const silkCanvas = document.createElement('canvas');
    silkCanvas.width = 256;
    silkCanvas.height = 128;
    const sctx = silkCanvas.getContext('2d');
    if (sctx) {
      sctx.fillStyle = '#fffef9';
      sctx.fillRect(0, 0, 256, 128);
      sctx.strokeStyle = '#d6c6a5';
      sctx.lineWidth = 4;
      sctx.strokeRect(8, 8, 240, 112);
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
      new THREE.BoxGeometry(2.45, 0.036, 1.08),
      new THREE.MeshStandardMaterial({
        map: silkTex,
        color: 0xffffff,
        emissive: 0xfff7ed,
        emissiveIntensity: 0.3,
        roughness: 0.38,
      })
    );
    silk.position.set(0.08, 0.96, 0.3);
    silkGroup.add(silk);
    markProtectedArea(silkGroup, 14);
    tagHotspotGroup(silkGroup, 'hs-03-2');
    attachLabelAnchor(silkGroup, 'hs-03-2', 0.08, 1.02, 0.3);
    root.add(silkGroup);

    // 3. Huấn Cao (dignified upright prisoner writing calligraphy) — hs-03-3
    //    & 7. Gông và xiềng (separate clickable/labeled sub-group) — hs-03-7
    const huanCao = createArticulatedFigure({
      robeColor: 0xe7e2d7,
      accentColor: 0x78350f,
      scale: 1.14,
      pose: 'cangue-prisoner',
      headgear: 'bun',
      prop: 'brush',
    });
    huanCao.position.set(-0.35, 0, -1.25);
    huanCao.rotation.y = 0.08;
    tagHotspotGroup(huanCao, 'hs-03-3');
    attachLabelAnchor(huanCao, 'hs-03-3', 0, 2.1, 0);

    const cangueSub = huanCao.userData.cangueGroup as THREE.Group | undefined;
    if (cangueSub) {
      tagHotspotGroup(cangueSub, 'hs-03-7');
      attachLabelAnchor(cangueSub, 'hs-03-7', -0.45, 1.48, 0.1);
    }
    root.add(huanCao);

    // 4. Viên quản ngục (bowing humbly holding zinc coins "đồng tiền kẽm") — hs-03-4
    const quanNguc = createArticulatedFigure({
      robeColor: 0x4b3628,
      accentColor: 0xd97706,
      scale: 1.02,
      pose: 'bowing',
      headgear: 'khan-dong',
      prop: 'zinc-coins',
    });
    quanNguc.position.set(-1.85, 0, 2.05);
    quanNguc.rotation.y = 2.55;
    tagHotspotGroup(quanNguc, 'hs-03-4');
    attachLabelAnchor(quanNguc, 'hs-03-4', 0, 1.88, 0);
    root.add(quanNguc);

    // 5. Thầy thơ lại (trembling respectfully holding ink basin "chậu mực") — hs-03-5
    const thoLai = createArticulatedFigure({
      robeColor: 0x3b485b,
      accentColor: 0xcbd5e1,
      scale: 0.96,
      pose: 'holding-tray',
      headgear: 'khan-dong',
      prop: 'ink-basin',
    });
    thoLai.position.set(2.05, 0, 1.75);
    thoLai.rotation.y = -2.42;
    tagHotspotGroup(thoLai, 'hs-03-5');
    attachLabelAnchor(thoLai, 'hs-03-5', 0, 1.92, 0);
    root.add(thoLai);

    // 6. Bó đuốc tẩm dầu — REAL GLSL TorchFire + DynamicFireLight + Smoke + Embers! — hs-03-6
    const torchGroup = new THREE.Group();
    const standBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.14, 12),
      new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.85 })
    );
    standBase.position.y = 0.07;
    const torchPole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 1.75, 10), tableWood);
    torchPole.position.y = 0.94;
    const oilWrap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.085, 0.26, 12),
      new THREE.MeshStandardMaterial({ color: 0x261d17, roughness: 0.94 })
    );
    oilWrap.position.y = 1.82;

    const torchFire = effects.registerFire(
      createTorchFire({
        width: 0.62,
        height: 1.08,
        emberCount: 22,
        smokeCount: 12,
        lightIntensity: 24,
        lightDistance: 17,
        lightColor: 0xff9438,
      })
    );
    torchFire.group.position.set(0, 1.88, 0);
    torchGroup.add(standBase, torchPole, oilWrap, torchFire.group);
    torchGroup.position.set(2.1, 0, -0.55);
    tagHotspotGroup(torchGroup, 'hs-03-6');
    // Rock-solid static anchor on torch socket (NEVER jumps with flickering flame!)
    attachLabelAnchor(torchGroup, 'hs-03-6', 0, 1.96, 0);
    root.add(torchGroup);

    // Soft warm bounce light over the white silk so faces & calligraphy are always crystal clear
    const silkFill = new THREE.PointLight(0xffcb8c, 6.5, 9, 1.5);
    silkFill.position.set(0.0, 2.35, 0.5);
    root.add(silkFill);

    return {
      root,
      backdropColor: 0x182032,
      ambientIntensity: 0.48,
      directionalIntensity: 0.58,
      effects,
      getStageMood: () => LIGHTING_MOODS['torch-prison'],
      setQuality: (tier) => effects.setQuality(tier),
      update: (t, stageIndex, params, dt = 0.016) => {
        const power = (params.torchIntensity ?? 80) / 100;
        const stageBoost = stageIndex === 0 ? 0.65 : stageIndex === 1 ? 1.15 : 1.02;
        torchFire.update(dt, t, true, power * stageBoost);
        silkFill.intensity = 5.5 * power * stageBoost;
        // Subtle dignified brush motion
        huanCao.rotation.y = 0.08 + Math.sin(t * 1.25) * 0.035;
      },
      dispose: () => effects.dispose(),
    };
  }

  // =========================================================================
  // 04. ĐĂM SĂN CHIẾN THẮNG MTAO MXÂY — 9 stage-scoped separated hotspots:
  //     hs-04-1 Nhà dài Ê-đê · hs-04-2 Cầu thang gỗ · hs-04-3 Đăm Săn ·
  //     hs-04-4 Mtao Mxây · hs-04-5 Chiếc khiên · hs-04-6 Miếng trầu (Stage 1 ONLY!) ·
  //     hs-04-7 Hơ Nhị · hs-04-8 Cồng chiêng · hs-04-9 Dân làng
  // =========================================================================
  if (preset === 'longhouse-epic') {
    root.add(
      createDioramaBase({
        width: 12.6,
        depth: 11.0,
        floorKind: 'meadow-earth',
        floorColor: 0xbda378,
        plinthColor: 0x7c4a26,
        terrainRelief: 0.15,
      })
    );

    // 1. Nhà dài Ê-đê & 2. Cầu thang gỗ (independently tagged!)
    const longhouse = createEdeLonghouse(0.96);
    longhouse.position.set(-1.35, 0, -2.55);
    tagHotspotGroup(longhouse, 'hs-04-1');
    attachLabelAnchor(longhouse, 'hs-04-1', -0.4, 3.0, 0);

    const stairSub = longhouse.userData.stairGroup as THREE.Group | undefined;
    if (stairSub) {
      tagHotspotGroup(stairSub, 'hs-04-2');
      attachLabelAnchor(stairSub, 'hs-04-2', 3.0, 0.72, 0.3);
    }
    root.add(longhouse);

    // 3. Đăm Săn & 5. Chiếc khiên (independently tagged!)
    const damSan = createArticulatedFigure({
      robeColor: 0x991b1b,
      accentColor: 0xf59e0b,
      skinColor: 0xc98c63,
      scale: 1.14,
      pose: 'heroic',
      headgear: 'turban',
      prop: 'shield',
    });
    damSan.position.set(-1.15, 0, 1.55);
    damSan.rotation.y = 0.7;
    tagHotspotGroup(damSan, 'hs-04-3');
    attachLabelAnchor(damSan, 'hs-04-3', 0, 2.08, 0);

    const shieldSub = damSan.userData.shieldGroup as THREE.Group | undefined;
    if (shieldSub) {
      tagHotspotGroup(shieldSub, 'hs-04-5');
      attachLabelAnchor(shieldSub, 'hs-04-5', -0.3, -0.1, 0.15);
    }
    root.add(damSan);

    // 4. Mtao Mxây (visible in Stages 0 & 1)
    const mtao = createArticulatedFigure({
      robeColor: 0x292524,
      accentColor: 0x9ca3af,
      skinColor: 0xc98c63,
      scale: 1.04,
      pose: 'standing',
      headgear: 'turban',
      prop: 'shield',
    });
    mtao.position.set(2.05, 0, 1.05);
    mtao.rotation.y = -1.1;
    tagHotspotGroup(mtao, 'hs-04-4');
    attachLabelAnchor(mtao, 'hs-04-4', 0, 2.02, 0);
    root.add(mtao);

    // 6. Miếng trầu (betel leaf quid glowing softly — visible ONLY in Stage 1!)
    const betelGroup = new THREE.Group();
    const leafGeo = new THREE.SphereGeometry(0.18, 12, 10);
    leafGeo.scale(1.45, 0.55, 0.9);
    const betelLeaf = new THREE.Mesh(
      leafGeo,
      new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        emissive: 0x15803d,
        emissiveIntensity: 0.45,
        roughness: 0.42,
      })
    );
    const limeDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfde047, emissiveIntensity: 0.4 })
    );
    limeDot.position.set(0.05, 0.07, 0);
    betelGroup.add(betelLeaf, limeDot);
    betelGroup.position.set(0.15, 1.65, 0.15);
    tagHotspotGroup(betelGroup, 'hs-04-6');
    // Static anchor at arc midpoint so label stays steady while betel arcs between Hơ Nhị and Đăm Săn
    const betelAnchorHost = new THREE.Object3D();
    betelAnchorHost.position.set(0.15, 1.85, 0.15);
    betelAnchorHost.userData.labelAnchorId = 'hs-04-6';
    root.add(betelGroup, betelAnchorHost);

    // 7. Hơ Nhị standing gracefully on the longhouse front porch / greeting in courtyard (Stages 1–3)
    const hoNhi = createArticulatedFigure({
      robeColor: 0x7f1d1d,
      accentColor: 0xfbbf24,
      skinColor: 0xd9a782,
      scale: 0.94,
      pose: 'standing',
      headgear: 'bun',
    });
    hoNhi.position.set(1.05, 0.72, -1.78);
    hoNhi.rotation.y = 0.25;
    tagHotspotGroup(hoNhi, 'hs-04-7');
    attachLabelAnchor(hoNhi, 'hs-04-7', 0, 1.98, 0);
    root.add(hoNhi);

    // 8. Cồng chiêng & ché rượu cần (Stages 2–3)
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
    tagHotspotGroup(gongGroup, 'hs-04-8');
    attachLabelAnchor(gongGroup, 'hs-04-8', 3.2, 1.75, 2.9);
    root.add(gongGroup);

    // 9. Dân làng (villagers rallying & celebrating in Stages 2–3)
    const villagersGroup = new THREE.Group();
    const villagerSpecs: [number, number, number, number][] = [
      [-3.25, 2.6, 0.8, 0x7c2d12],
      [-2.35, 3.35, 0.55, 0x0f766e],
      [-1.35, 3.65, 0.25, 0x92400e],
      [0.85, 3.45, -0.45, 0x1e3a5f],
    ];
    villagerSpecs.forEach(([vx, vz, ry, col]) => {
      const v = createArticulatedFigure({
        robeColor: col,
        accentColor: 0xf59e0b,
        skinColor: 0xc98c63,
        scale: 0.88,
        pose: 'standing',
        headgear: 'turban',
      });
      v.position.set(vx, 0, vz);
      v.rotation.y = ry;
      villagersGroup.add(v);
    });
    tagHotspotGroup(villagersGroup, 'hs-04-9');
    attachLabelAnchor(villagersGroup, 'hs-04-9', -2.35, 1.9, 3.2);
    root.add(villagersGroup);

    // Festival Campfire (lit warmly during Stage 3 celebration!)
    const campfire = effects.registerFire(createCampfire({ width: 0.85, height: 1.25, lightIntensity: 16 }));
    campfire.group.position.set(0.3, 0.02, 2.25);
    root.add(campfire.group);

    const tree1 = createLayeredTree(0x166534, 1.25);
    tree1.position.set(4.2, 0, -2.8);
    const tree2 = createLayeredTree(0x15803d, 1.05);
    tree2.position.set(-4.75, 0, 1.5);
    root.add(tree1, tree2);
    effects.collectWindCanopiesFromRoot(root);

    return {
      root,
      backdropColor: 0xf7efe0,
      effects,
      setQuality: (tier) => effects.setQuality(tier),
      update: (t, stageIndex, params, dt = 0.016) => {
        const sun = (params.sunAngle ?? 75) / 100;
        const speed = 2.0 + sun * 1.4;

        // Stage-scoped object visibility strictly matching story & labels!
        mtao.visible = stageIndex <= 1;
        betelGroup.visible = stageIndex === 1;
        betelAnchorHost.visible = stageIndex === 1;
        hoNhi.visible = stageIndex >= 1;
        gongGroup.visible = stageIndex >= 2;
        villagersGroup.visible = stageIndex >= 2;
        campfire.group.visible = stageIndex === 3;
        campfire.update(dt, t, stageIndex === 3, 1.05);

        if (stageIndex === 0) {
          damSan.position.set(-1.15, 0, 1.55);
          damSan.rotation.y = 0.72 + Math.sin(t * 1.5) * 0.08;
          mtao.position.set(1.95, 0.42, -1.65); // descending wooden stair!
          mtao.rotation.y = -0.5;
        } else if (stageIndex === 1) {
          // Epic shield dance & Hơ Nhị tossing the betel quid
          damSan.position.x = -1.0 + Math.sin(t * speed) * 0.55;
          damSan.position.y = Math.abs(Math.sin(t * speed * 1.3)) * 0.28;
          damSan.position.z = 1.45;
          damSan.rotation.y = 0.7 + Math.sin(t * speed) * 0.42;
          mtao.position.set(2.05 + Math.sin(t * speed * 0.8) * 0.28, 0, 1.05);
          mtao.rotation.y = -1.1;

          // Smooth betel arc from Hơ Nhị on porch to Đăm Săn
          const arc = (t * 0.65) % 1;
          betelGroup.position.set(
            THREE.MathUtils.lerp(1.05, -0.75, arc),
            1.65 + Math.sin(arc * Math.PI) * 0.75,
            THREE.MathUtils.lerp(-1.5, 1.25, arc)
          );
          betelGroup.rotation.y = t * 3.5;
          hoNhi.position.set(1.05, 0.72, -1.78);
        } else {
          // Community rally & victory festival
          damSan.position.x += (-0.45 - damSan.position.x) * 0.08;
          damSan.position.y = Math.sin(t * 2) * 0.03;
          damSan.position.z += (1.1 - damSan.position.z) * 0.08;
          damSan.rotation.y = 0.15;
          hoNhi.position.set(0.65, 0, 0.85);
          hoNhi.rotation.y = -0.3;
        }

        gong.rotation.z = Math.sin(t * 4) * 0.06;
        effects.updateAmbient(t, 0.9);
      },
      dispose: () => effects.dispose(),
    };
  }

  // =========================================================================
  // 05. PRÔ-MÊ-TÊ VÀ LOÀI NGƯỜI — Classical Greek myth setting with:
  //     - Dedicated clay-and-water sculpting bench/mound & water amphora (`hs-05-1` — NEVER on temple roof!)
  //     - Upright sculpted humans (`hs-05-2`)
  //     - REAL GLSL TorchFire brazier + HandheldFire (`hs-05-3` anchored to static brazier emitter!)
  //     - Prometheus (`hs-05-4`)
  // =========================================================================
  if (preset === 'greek-fire') {
    root.add(
      createDioramaBase({
        width: 12.0,
        depth: 10.6,
        floorKind: 'stone-brick',
        floorColor: 0xe6e1d5,
        plinthColor: 0x64748b,
      })
    );

    // Classical Greek colonnade as scenic backdrop (NOT tagged as clay!)
    const colonnade = createGreekColonnade(0.95);
    colonnade.position.set(0, 0, -3.0);
    root.add(colonnade);

    // 1. Đất sét và nước tạo hình — Dedicated clay sculpting mound, water basin, amphora & clay figurines (`hs-05-1`)
    const clayGroup = new THREE.Group();
    const stonePedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.32, 0.34, 16),
      new THREE.MeshStandardMaterial({ color: 0xcfc7b8, roughness: 0.88 })
    );
    stonePedestal.position.y = 0.17;
    stonePedestal.receiveShadow = true;

    const clayMat = new THREE.MeshStandardMaterial({ color: 0xa4633d, roughness: 0.92, flatShading: true });
    const clayMound = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 1), clayMat);
    clayMound.scale.set(1.25, 0.62, 1.1);
    clayMound.position.set(-0.28, 0.52, 0.15);
    clayMound.castShadow = true;

    // Small sculpted clay creatures & nascent figurine on the clay table
    const clayFig = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.34, 6, 10), clayMat);
    clayFig.position.set(0.32, 0.58, 0.25);
    const clayHead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), clayMat);
    clayHead.position.set(0.32, 0.88, 0.25);

    // Greek terracotta water amphora & shimmering water basin beside the clay
    const basinRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.36, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.72 })
    );
    basinRim.position.set(0.28, 0.44, -0.45);
    const basinWaterMat = createAnimatedOceanSurface(0.7, 0.7, 0x0ea5e9).waterMaterial;
    const basinWater = new THREE.Mesh(new THREE.CircleGeometry(0.38, 16), basinWaterMat);
    basinWater.rotation.x = -Math.PI / 2;
    basinWater.position.set(0.28, 0.56, -0.45);
    effects.registerWater(basinWaterMat);

    const amphora = new THREE.Mesh(
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.1, 0),
          new THREE.Vector2(0.24, 0.26),
          new THREE.Vector2(0.12, 0.54),
          new THREE.Vector2(0.16, 0.68),
        ],
        14
      ),
      new THREE.MeshStandardMaterial({ color: 0xc2592c, roughness: 0.62 })
    );
    amphora.position.set(-0.62, 0.34, -0.42);
    amphora.castShadow = true;

    clayGroup.add(stonePedestal, clayMound, clayFig, clayHead, basinRim, basinWater, amphora);
    clayGroup.position.set(-3.15, 0, 1.55);
    tagHotspotGroup(clayGroup, 'hs-05-1');
    attachLabelAnchor(clayGroup, 'hs-05-1', 0, 1.05, 0);
    root.add(clayGroup);

    // 2. Dáng đứng thẳng của con người (`hs-05-2`)
    const humanGroup = new THREE.Group();
    const h1 = createArticulatedFigure({ robeColor: 0xd97706, accentColor: 0xfef3c7, scale: 0.98, pose: 'standing' });
    h1.position.set(2.35, 0, 1.45);
    h1.rotation.y = -0.65;
    const h2 = createArticulatedFigure({ robeColor: 0x0f766e, accentColor: 0xfef3c7, scale: 0.94, pose: 'standing' });
    h2.position.set(3.25, 0, 2.05);
    h2.rotation.y = -0.82;
    humanGroup.add(h1, h2);
    tagHotspotGroup(humanGroup, 'hs-05-2');
    attachLabelAnchor(humanGroup, 'hs-05-2', 2.75, 2.08, 1.65);
    root.add(humanGroup);

    // 3. Ngọn lửa Prô-mê-tê — REAL GLSL Sacred Brazier Fire + Embers + DynamicFireLight (`hs-05-3`)
    const altarGroup = new THREE.Group();
    const altarBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.72, 1.05, 16),
      new THREE.MeshStandardMaterial({ color: 0xf1ece1, roughness: 0.5 })
    );
    altarBase.position.y = 0.525;
    altarBase.castShadow = true;
    const brazier = new THREE.Mesh(
      new THREE.CylinderGeometry(0.64, 0.38, 0.28, 16),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.62, roughness: 0.34 })
    );
    brazier.position.y = 1.15;

    const sacredFire = effects.registerFire(
      createTorchFire({
        width: 0.85,
        height: 1.42,
        emberCount: 28,
        smokeCount: 8,
        lightIntensity: 18,
        lightDistance: 16,
        lightColor: 0xff8c26,
      })
    );
    sacredFire.group.position.set(0, 1.24, 0);
    altarGroup.add(altarBase, brazier, sacredFire.group);
    altarGroup.position.set(0.15, 0, 0.65);
    tagHotspotGroup(altarGroup, 'hs-05-3');
    // Static anchor pinned directly to the fire emitter bowl (never jitters with flame!)
    attachLabelAnchor(altarGroup, 'hs-05-3', 0, 1.48, 0);
    root.add(altarGroup);

    // 4. Thần Prô-mê-tê holding REAL GLSL HandheldFire torch (`hs-05-4`)
    const prometheus = createArticulatedFigure({
      robeColor: 0xf8fafc,
      accentColor: 0x1d4ed8,
      scale: 1.14,
      pose: 'heroic',
      headgear: 'none',
      prop: 'torch',
    });
    const handFire = effects.registerFire(
      createHandheldFire({ width: 0.38, height: 0.66, lightIntensity: 10, emberCount: 14, smokeCount: 4 })
    );
    const pTip = prometheus.userData.torchTipAnchor as THREE.Object3D | undefined;
    if (pTip) pTip.add(handFire.group);
    prometheus.position.set(-1.65, 0, -0.3);
    prometheus.rotation.y = 0.62;
    tagHotspotGroup(prometheus, 'hs-05-4');
    attachLabelAnchor(prometheus, 'hs-05-4', 0, 2.2, 0);
    root.add(prometheus);

    const olive = createLayeredTree(0x557b4c, 1.05);
    olive.position.set(-4.45, 0, -1.9);
    root.add(olive);
    effects.collectWindCanopiesFromRoot(root);

    return {
      root,
      backdropColor: 0xe8f1fc,
      effects,
      setQuality: (tier) => effects.setQuality(tier),
      update: (t, stageIndex, params, dt = 0.016) => {
        const glow = (params.fireBrightness ?? params.fireGlow ?? 85) / 100;
        const fireStrength = stageIndex === 0 ? 0.35 : stageIndex === 1 ? 0.72 : 1.25;
        sacredFire.update(dt, t, true, glow * fireStrength);
        handFire.update(dt, t, stageIndex >= 1, glow * (stageIndex >= 2 ? 1.15 : 0.75));
        // Upright humans emerge prominently from Stage 1 onward
        const hScale = stageIndex === 0 ? 0.55 : 1.0;
        humanGroup.scale.y += (hScale - humanGroup.scale.y) * 0.08;
        effects.updateAmbient(t, 0.85);
      },
      dispose: () => effects.dispose(),
    };
  }

  // =========================================================================
  // 06. GẶP KA-RÍP VÀ XI-LA (Ô-ĐI-XÊ) — GLSL OceanWaves, whirlpool, Scylla cliff & Odysseus ship
  // =========================================================================
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
    effects.registerWater(ocean.waterMaterial);
    root.add(ocean.mesh);

    // Charybdis swirling multi-ring whirlpool (`hs-06-2`)
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
      ring.position.y = 0.12 + i * 0.03;
      rings.push(ring);
      whirlGroup.add(ring);
    }
    whirlGroup.position.set(-3.15, 0.05, 1.35);
    tagHotspotGroup(whirlGroup, 'hs-06-2');
    attachLabelAnchor(whirlGroup, 'hs-06-2', 0, 0.65, 0);
    root.add(whirlGroup);

    // Scylla towering craggy karst sea cliff (`hs-06-3`)
    const scyllaCliff = createLimestoneKarstMountain({
      height: 3.7,
      radius: 2.0,
      rockColor: 0x3f4c59,
      mossColor: 0x334155,
      seed: 14,
      withCaveArch: true,
    }).group;
    scyllaCliff.position.set(3.45, 0, -1.85);
    scyllaCliff.rotation.y = -0.65;
    tagHotspotGroup(scyllaCliff, 'hs-06-3');
    attachLabelAnchor(scyllaCliff, 'hs-06-3', 0, 3.6, 0);
    root.add(scyllaCliff);

    // Odysseus wooden galley (`hs-06-1`)
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
    tagHotspotGroup(shipGroup, 'hs-06-1');
    attachLabelAnchor(shipGroup, 'hs-06-1', 0, 2.2, 0);
    root.add(shipGroup);

    const farRock = createLimestoneKarstMountain({
      height: 1.5,
      radius: 1.1,
      rockColor: 0x64748b,
      mossColor: 0x2f7d4d,
      seed: 8,
    }).group;
    farRock.position.set(-3.2, 0, -3.4);
    tagHotspotGroup(farRock, 'hs-06-4');
    attachLabelAnchor(farRock, 'hs-06-4', 0, 1.55, 0);
    root.add(farRock);

    return {
      root,
      backdropColor: 0xdcebf7,
      fogDensity: 0.01,
      effects,
      update: (t, stageIndex, params) => {
        const wave = (params.waveStrength ?? params.stormIntensity ?? 70) / 100;
        ocean.updateWaves(t, 0.045 + wave * 0.085);
        rings.forEach((r, idx) => {
          r.rotation.z = t * (2.4 - idx * 0.35) * (0.6 + wave);
        });
        const prog = params.shipProgress !== undefined ? params.shipProgress / 100 : null;
        const targetZ =
          prog !== null ? 3.2 - prog * 5.2 : stageIndex === 0 ? 2.6 : stageIndex === 1 ? 0.8 : -1.8;
        const targetX = stageIndex === 1 ? 0.55 : -0.15;
        shipGroup.position.z += (targetZ - shipGroup.position.z) * 0.06;
        shipGroup.position.x += (targetX - shipGroup.position.x) * 0.06;
        shipGroup.position.y = 0.08 + Math.sin(t * 2.4) * (0.06 + wave * 0.06);
        shipGroup.rotation.z = Math.sin(t * 2.1) * (0.04 + wave * 0.05);
      },
      dispose: () => effects.dispose(),
    };
  }

  // =========================================================================
  // 07. HƯƠNG SƠN PHONG CẢNH (FLAGSHIP LANDSCAPE DIORAMA)
  //     Limestone karst range, vaulted Động Hương Tích cave arch, curved-eave pagoda,
  //     GLSL RealisticWater Suối Yến stream, sampan boat, canopy-only swaying trees & bamboo!
  // =========================================================================
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

    // 1. Dãy núi đá vôi (`hs-07-1`)
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
    effects.registerCloud(cloudA, 0.36, 0.45, 0.2);
    effects.registerCloud(cloudB, 0.32, 0.4, 2.1);

    mountainRangeGroup.add(peakLeft, peakFarRight, cloudA, cloudB);
    tagHotspotGroup(mountainRangeGroup, 'hs-07-1');
    attachLabelAnchor(mountainRangeGroup, 'hs-07-1', -3.5, 3.7, -2.8);
    root.add(mountainRangeGroup);

    // 2. Cửa động (`hs-07-2`)
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
      attachLabelAnchor(caveGroup, 'hs-07-2', 0, 1.55, 1.7);
    } else {
      tagHotspotGroup(caveMountain, 'hs-07-2');
      attachLabelAnchor(caveMountain, 'hs-07-2', 0, 1.55, 1.4);
    }

    // 3. Mái chùa (`hs-07-3`)
    const pagoda = createVietnameseTemple(0.76, 0x9e3827);
    pagoda.position.set(-2.95, 0.04, 1.35);
    pagoda.rotation.y = 0.55;
    tagHotspotGroup(pagoda, 'hs-07-3');
    attachLabelAnchor(pagoda, 'hs-07-3', 0, 2.8, 0);
    root.add(pagoda);

    // 4. Dòng suối (`hs-07-4`) — real GLSL RealisticWater ribbon!
    const { group: riverGroup, curve: riverCurve, waterMaterial } = createWindingRiver({
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
    if (waterMaterial instanceof THREE.ShaderMaterial) {
      effects.registerWater(waterMaterial);
    }
    tagHotspotGroup(riverGroup, 'hs-07-4');
    attachLabelAnchor(riverGroup, 'hs-07-4', -0.9, 0.45, 3.85);
    root.add(riverGroup);

    // 5. Con thuyền (`hs-07-5`)
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
    attachLabelAnchor(boatGroup, 'hs-07-5', 0, 1.05, 0);
    root.add(boatGroup);

    // 6. Cây cối (`hs-07-6`) — canopy-only wind animation (trunks grounded!)
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
    attachLabelAnchor(vegetationGroup, 'hs-07-6', 4.25, 2.35, 0.35);
    root.add(vegetationGroup);

    const frameTree = createLayeredTree(0x2e7d47, 0.95);
    frameTree.position.set(-4.9, 0.04, 3.2);
    root.add(frameTree);
    effects.collectWindCanopiesFromRoot(root);

    const boatPt = new THREE.Vector3();
    const boatTan = new THREE.Vector3();

    return {
      root,
      backdropColor: 0xe4f1f8,
      fogDensity: 0.009,
      effects,
      update: (t, stageIndex, params) => {
        const mist = (params.mountainMist ?? 45) / 100;
        const baseU = stageIndex === 0 ? 0.62 : stageIndex === 1 ? 0.44 : 0.28;
        const u = Math.max(0.14, Math.min(0.84, baseU + Math.sin(t * 0.32) * 0.09));
        riverCurve.getPointAt(u, boatPt);
        riverCurve.getTangentAt(u, boatTan);
        boatGroup.position.x += (boatPt.x - boatGroup.position.x) * 0.06;
        boatGroup.position.z += (boatPt.z - boatGroup.position.z) * 0.06;
        boatGroup.position.y = 0.09 + Math.sin(t * 2.0) * 0.022;
        boatGroup.rotation.y = Math.atan2(boatTan.x, boatTan.z) + Math.PI / 2;

        cloudA.scale.setScalar(0.65 + mist * 0.55);
        cloudB.scale.setScalar(0.55 + mist * 0.5);
        effects.updateAmbient(t, 0.95);
      },
      dispose: () => effects.dispose(),
    };
  }

  // =========================================================================
  // 08. THƠ DUYÊN — Golden autumn lane, tamarind canopy-only sway, drifting clouds & couple
  // =========================================================================
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
    attachLabelAnchor(pathGroup, 'hs-08-2', -2.5, 0.4, 2.7);
    root.add(pathGroup);

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
    attachLabelAnchor(treeGroup, 'hs-08-1', -2.2, 2.95, -1.5);
    root.add(treeGroup);

    const coupleGroup = new THREE.Group();
    const anh = createArticulatedFigure({ robeColor: 0x1e3a5f, accentColor: 0xfef3c7, scale: 0.98 });
    anh.position.set(-0.5, 0.06, 1.3);
    anh.rotation.y = 0.65;
    const em = createArticulatedFigure({ robeColor: 0xe11d48, accentColor: 0xfde68a, scale: 0.92, headgear: 'hat-non' });
    em.position.set(0.55, 0.06, 0.85);
    em.rotation.y = 0.55;
    coupleGroup.add(anh, em);
    tagHotspotGroup(coupleGroup, 'hs-08-3');
    attachLabelAnchor(coupleGroup, 'hs-08-3', 0, 2.05, 1.1);
    root.add(coupleGroup);

    const skyGroup = new THREE.Group();
    const c1 = createCloudCluster(0.95, 0.85);
    c1.position.set(2.4, 3.6, -2.5);
    effects.registerCloud(c1, 0.45, 0.55, 0);
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 16, 14),
      new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.85 })
    );
    sun.position.set(3.4, 3.1, -3.4);
    skyGroup.add(c1, sun);
    tagHotspotGroup(skyGroup, 'hs-08-4');
    attachLabelAnchor(skyGroup, 'hs-08-4', 2.8, 3.65, -2.9);
    root.add(skyGroup);

    const sideTree = createLayeredTree(0xd97706, 1.05, 0xfbbf24);
    sideTree.position.set(3.8, 0, 1.4);
    root.add(sideTree);
    effects.collectWindCanopiesFromRoot(root);

    return {
      root,
      backdropColor: 0xfcf4e3,
      effects,
      update: (t, stageIndex, params) => {
        const breeze = (params.breezeSpeed ?? 55) / 100;
        const closeness = stageIndex >= 2 ? 0.36 : 0.72;
        anh.position.x = -closeness;
        em.position.x = closeness;
        effects.updateAmbient(t, 0.5 + breeze * 0.9);
      },
      dispose: () => effects.dispose(),
    };
  }

  // =========================================================================
  // 09. DƯỚI BÓNG HOÀNG LAN — Ancestral tiled house, golden ylang-ylang canopy sway, grandma & Thanh–Nga
  // =========================================================================
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
    attachLabelAnchor(house, 'hs-09-1', 0, 2.75, 0);
    root.add(house);

    const hoangLan = createLayeredTree(0x1f6e43, 1.52, 0xfacc15);
    hoangLan.position.set(2.8, 0, -1.3);
    tagHotspotGroup(hoangLan, 'hs-09-2');
    attachLabelAnchor(hoangLan, 'hs-09-2', 0, 2.95, 0);
    root.add(hoangLan);

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
    attachLabelAnchor(ba, 'hs-09-3', 0, 1.98, 0);
    root.add(ba);

    const duoGroup = new THREE.Group();
    const thanh = createArticulatedFigure({ robeColor: 0xf8fafc, accentColor: 0x334155, scale: 1.0 });
    thanh.position.set(1.5, 0, 1.8);
    thanh.rotation.y = 0.5;
    const nga = createArticulatedFigure({ robeColor: 0xfef3c7, accentColor: 0x15803d, scale: 0.94, headgear: 'bun' });
    nga.position.set(2.6, 0, 1.6);
    nga.rotation.y = -0.55;
    duoGroup.add(thanh, nga);
    tagHotspotGroup(duoGroup, 'hs-09-4');
    attachLabelAnchor(duoGroup, 'hs-09-4', 2.05, 2.02, 1.7);
    root.add(duoGroup);

    const petals: THREE.Mesh[] = [];
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 0.35 });
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), petalMat);
      p.position.set(1.8 + (i % 4) * 0.75, 1.2 + (i % 3) * 0.7, -0.6 + Math.floor(i / 4) * 0.9);
      petals.push(p);
      root.add(p);
    }

    const bam = createBambooCluster(0.95);
    bam.position.set(-4.4, 0, 1.6);
    root.add(bam);
    effects.collectWindCanopiesFromRoot(root);

    return {
      root,
      backdropColor: 0xfaf6eb,
      effects,
      update: (t, _stage, params) => {
        const scent = (params.scentGlow ?? 65) / 100;
        petals.forEach((p, i) => {
          p.visible = i / petals.length <= scent;
          p.position.y = 0.6 + ((t * 0.32 + i * 0.4) % 2.4);
          p.position.x = 2.0 + Math.sin(t + i) * 0.8;
        });
        effects.updateAmbient(t, 0.85);
      },
      dispose: () => effects.dispose(),
    };
  }

  return null;
}
