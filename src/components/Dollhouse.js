import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

import Store from '../Store';

const DRACO_DECODER_PATH = 'https://static.mused.org/spaceshare/draco1.5.6/';
const PLACEHOLDER_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x777777, transparent: true, opacity: 0.6 });

export default class Dollhouse {
  constructor() {
    const {
      scene,
      loadingManager,
      space,
      cubeRenderTarget,
      isMobile,
    } = Store.getState();

    this.gltf = null;
    this.defaultMaterials = [];
    this.cubeMaterial = null;
    this.transformControls = null;
    this.isDisplayingCubeRenderTarget = false;
    this.initialTransitionOpacity = 0.2;
    this.transitionInterval = null;

    const loader = new GLTFLoader(loadingManager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    loader.setDRACOLoader(dracoLoader);

    const meshUrl = typeof space?.mesh === 'string' && space.mesh.length > 0
      ? space.mesh
      : null;

    if (meshUrl) {
      loader.load(
        meshUrl,
        (gltf) => this.onLoad(gltf),
        undefined,
        (error) => {
          console.error('An error occurred while loading the dollhouse model:', error);
          this.loadFallbackModel();
        },
      );
    } else {
      this.loadFallbackModel();
    }

    if (!isMobile && cubeRenderTarget) {
      this.cubeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        envMap: cubeRenderTarget.texture,
      });
    }

    this.initTransformControls();
  }

  loadFallbackModel() {
    console.warn('Falling back to generated dollhouse preview.');

    const { space } = Store.getState();

    const fallbackGroup = new THREE.Group();
    fallbackGroup.name = 'GeneratedDollhouse';

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    fallbackGroup.add(ambientLight);

    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    fallbackGroup.add(floor);

    const wallGeometry = new THREE.PlaneGeometry(4, 2.5);
    const backWall = new THREE.Mesh(wallGeometry, PLACEHOLDER_MATERIAL.clone());
    backWall.position.set(0, 1.25, -2);
    fallbackGroup.add(backWall);

    const frontWall = new THREE.Mesh(wallGeometry, PLACEHOLDER_MATERIAL.clone());
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, 1.25, 2);
    fallbackGroup.add(frontWall);

    const sideWallLeft = new THREE.Mesh(wallGeometry, PLACEHOLDER_MATERIAL.clone());
    sideWallLeft.rotation.y = Math.PI / 2;
    sideWallLeft.position.set(-2, 1.25, 0);
    fallbackGroup.add(sideWallLeft);

    const sideWallRight = new THREE.Mesh(wallGeometry, PLACEHOLDER_MATERIAL.clone());
    sideWallRight.rotation.y = -Math.PI / 2;
    sideWallRight.position.set(2, 1.25, 0);
    fallbackGroup.add(sideWallRight);

    const pillarGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 12);
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      metalness: 0.1,
      roughness: 0.6,
    });
    const pillarPositions = [
      [-1.5, 1.25, -1.5],
      [1.5, 1.25, -1.5],
      [-1.5, 1.25, 1.5],
      [1.5, 1.25, 1.5],
    ];
    pillarPositions.forEach(([x, y, z]) => {
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial.clone());
      pillar.position.set(x, y, z);
      fallbackGroup.add(pillar);
    });

    // Optionally visualize nodes so navigation still works.
    const nodes = space?.space_data?.nodes || [];
    if (nodes.length) {
      const nodeGroup = new THREE.Group();
      nodeGroup.name = 'GeneratedDollhouseNodes';

      const nodeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const nodeMaterial = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.45,
      });

      const positions = nodes.map((node) => new THREE.Vector3(
        node.position.x,
        node.position.y,
        node.position.z,
      ));
      const center = new THREE.Vector3();
      positions.forEach((position) => center.add(position));
      center.divideScalar(positions.length || 1);

      const scaleFactor = 1 / Math.max(...positions.map((position) => position.distanceTo(center))) || 1;

      nodes.forEach((node, index) => {
        const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
        const position = positions[index].clone().sub(center).multiplyScalar(scaleFactor);
        mesh.position.copy(position);
        mesh.position.y = Math.max(mesh.position.y, 0.6);
        mesh.name = `fallback-node-${node.uuid}`;
        nodeGroup.add(mesh);
      });

      fallbackGroup.add(nodeGroup);
    }

    this.onLoad({ scene: fallbackGroup });
  }

  onLoad(gltf) {
    const { app, scene, space } = Store.getState();

    this.gltf = gltf;

    const dollhouseSettings = space?.space_data?.sceneSettings?.dollhouse || {
      offsetPosition: { x: 0, y: 0, z: 0 },
      offsetRotation: { x: 0, y: 0, z: 0 },
      scale: 1,
    };

    const position = new THREE.Vector3(
      dollhouseSettings.offsetPosition.x,
      dollhouseSettings.offsetPosition.y,
      dollhouseSettings.offsetPosition.z,
    );
    const rotation = new THREE.Euler(
      dollhouseSettings.offsetRotation.x,
      dollhouseSettings.offsetRotation.y,
      dollhouseSettings.offsetRotation.z,
    );
    const scale = dollhouseSettings.scale;

    gltf.scene.position.copy(position);
    gltf.scene.rotation.copy(rotation);
    if (typeof scale === 'number') {
      gltf.scene.scale.setScalar(scale);
    } else if (scale && typeof scale === 'object') {
      gltf.scene.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
    }

    gltf.scene.dollhouse = this;
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.dollhouse = this;
        this.defaultMaterials.push(child.material.clone());
      }
    });

    scene.add(gltf.scene);
    this.updateTransparency();

    if (app?.spaceCustom?.noDollhouseOccluders) {
      this.hide();
    }
  }

  handleToggleDebugMode() {
    this.updateTransparency();
  }

  handleToggleViewMode() {
    this.updateTransparency();
  }

  show() {
    if (!this.gltf?.scene) {
      console.warn('Dollhouse not loaded yet.');
      return;
    }

    this.gltf.scene.visible = true;
    this.gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.visible = true;
      }
    });
    this.showOccluders();
  }

  hide(options = { hideOccluders: false }) {
    if (!this.gltf?.scene) {
      console.warn('Dollhouse not loaded yet.');
      return;
    }

    this.gltf.scene.visible = false;
    this.gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.visible = false;
      }
    });

    if (options.hideOccluders) {
      this.hideOccluders();
    }
  }

  hideOccluders() {
    if (!this.gltf?.scene) {
      console.warn('Dollhouse not loaded yet.');
      return;
    }

    const occluders = [];
    this.gltf.scene.traverse((child) => {
      if (child.name === 'occluder') {
        occluders.push(child);
      }
    });
    occluders.forEach((occluder) => {
      occluder.visible = false;
    });
  }

  showOccluders() {
    if (!this.gltf?.scene) {
      return;
    }

    this.gltf.scene.traverse((child) => {
      if (child.name === 'occluder') {
        child.visible = true;
      }
    });
  }

  toggleVisibility() {
    if (!this.gltf?.scene) {
      console.warn('Dollhouse not loaded yet.');
      return;
    }

    this.gltf.scene.visible = !this.gltf.scene.visible;
  }

  updateTransparency() {
    if (!this.gltf?.scene) {
      return;
    }

    const {
      debugMode,
      viewMode,
      app,
    } = Store.getState();

    const transparent = viewMode === 'FPV' && !debugMode;
    const renderOrder = viewMode === 'ORBIT' || debugMode ? 2 : 1;

    const occluders = [];
    this.gltf.scene.traverse((child) => {
      if (child.name === 'occluder') {
        occluders.push(child);
      }
    });
    occluders.forEach((occluder) => {
      if (occluder.parent) {
        occluder.parent.remove(occluder);
      }
    });

    this.gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true;
        child.material.opacity = transparent ? 0 : 1;
        child.material.wireframe = debugMode;
        child.material.side = THREE.FrontSide;
        child.renderOrder = renderOrder;
        child.isDollhouse = true;

        if (viewMode === 'ORBIT') {
          child.material.depthWrite = true;
          child.material.depthTest = true;
        }
      }
    });

    if (viewMode === 'FPV' && !debugMode) {
      if (!app?.spaceCustom?.noDollhouseOccluders) {
        this.addOccluders();
      }
    }

    if (viewMode === 'ORBIT' && this.isDisplayingCubeRenderTarget) {
      this.restoreDefaultMaterials();
    }
  }

  addOccluders() {
    if (!this.gltf?.scene) {
      return;
    }

    const { viewMode, debugMode, app } = Store.getState();
    const renderOrder = viewMode === 'ORBIT' || debugMode ? 2 : 1;

    if (app?.spaceCustom?.noDollhouseOccluders) {
      return;
    }

    this.gltf.scene.traverse((child) => {
      if (child.isMesh) {
        const occluderMat = new THREE.MeshBasicMaterial({
          colorWrite: false,
          transparent: true,
        });

        const occluder = new THREE.Mesh(child.geometry, occluderMat);
        occluder.name = 'occluder';
        occluder.position.copy(child.position);
        occluder.rotation.copy(child.rotation);
        occluder.scale.copy(child.scale);
        occluder.quaternion.copy(child.quaternion);
        occluder.updateMatrix();
        child.parent.add(occluder);
        occluder.renderOrder = renderOrder + 1;
      }
    });
  }

  showForNavigation() {
    const { app, isMobile } = Store.getState();

    if (isMobile || app?.spaceCustom?.noDollhouseOccluders) {
      return;
    }

    if (!this.cubeMaterial || !this.gltf?.scene) {
      console.warn('Dollhouse not ready for navigation preview.');
      return;
    }

    this.isDisplayingCubeRenderTarget = true;
    this.updateTransparency();

    const occluders = [];
    this.gltf.scene.traverse((child) => {
      if (child.name === 'occluder') {
        occluders.push(child);
      }
    });
    occluders.forEach((occluder) => {
      if (occluder.parent) {
        occluder.parent.remove(occluder);
      }
    });

    this.gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material = this.cubeMaterial;
        child.material.opacity = this.initialTransitionOpacity;
        child.material.needsUpdate = true;
        child.material.side = THREE.FrontSide;
        child.renderOrder = 10;
      }
    });

    this.transitionMaterials();
  }

  restoreDefaultMaterials() {
    if (!this.gltf?.scene) {
      return;
    }

    let index = 0;
    this.gltf.scene.traverse((child) => {
      if (child.isMesh && this.defaultMaterials[index]) {
        child.material = this.defaultMaterials[index];
        child.material.opacity = 0;
        child.material.needsUpdate = true;
        index += 1;
      }
    });

    this.isDisplayingCubeRenderTarget = false;
  }

  transitionMaterials() {
    if (!this.gltf?.scene) {
      return;
    }

    if (this.transitionInterval) {
      clearInterval(this.transitionInterval);
    }

    const duration = 400;
    const initialOpacity = this.initialTransitionOpacity;
    const targetOpacity = 0;
    const opacityStep = (targetOpacity - initialOpacity) / (duration / 16);
    let currentOpacity = initialOpacity;

    this.transitionInterval = setInterval(() => {
      currentOpacity += opacityStep;
      this.gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.material.opacity = currentOpacity;
        }
      });

      if (currentOpacity <= targetOpacity) {
        clearInterval(this.transitionInterval);
        this.transitionInterval = null;
        this.addOccluders();
      }
    }, 16);
  }

  initTransformControls() {
    const { camera, canvas, scene } = Store.getState();

    if (!camera || !canvas || !scene) {
      return;
    }

    this.transformControls = new TransformControls(camera, canvas);
    this.transformControls.addEventListener('change', () => {
      if (this.transformControls.object) {
        const worldPosition = new THREE.Vector3();
        this.transformControls.object.getWorldPosition(worldPosition);
        const rotation = this.transformControls.object.rotation;
        const scale = this.transformControls.object.scale;
        console.log('Dollhouse Position:', worldPosition.x, worldPosition.y, worldPosition.z);
        console.log('Dollhouse Rotation:', rotation.x, rotation.y, rotation.z);
        console.log('Dollhouse Scale:', scale.x, scale.y, scale.z);
      }
    });

    this.transformControls.addEventListener('dragging-changed', (event) => {
      const { app } = Store.getState();
      if (app?.rig?.orbitControls) {
        app.rig.orbitControls.enabled = !event.value;
      }
    });

    scene.add(this.transformControls);

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (event) => {
        switch (event.key) {
          case 'q':
            this.attachToTransformControls();
            break;
          case 'w':
            this.transformControls.setMode('translate');
            break;
          case 'e':
            this.transformControls.setMode('rotate');
            break;
          case 'r':
            this.transformControls.setMode('scale');
            break;
          default:
            break;
        }
      });
    }
  }

  attachToTransformControls() {
    if (this.gltf?.scene && this.transformControls) {
      this.transformControls.attach(this.gltf.scene);
    }
  }

  detachFromTransformControls() {
    if (this.transformControls) {
      this.transformControls.detach();
    }
  }

  update() {
    // Placeholder for future per-frame updates.
  }
}
