import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/loaders/GLTFLoader.js";

window.THREE = THREE;
THREE.GLTFLoader = GLTFLoader;
THREE.OrbitControls = OrbitControls;

let scene;
let camera;
let renderer;
let controls;
let raycaster;
let mouse;
const interactableObjects = [];
let infoPanelTimeout;

const uiLayer = document.getElementById("ui-layer") || document.body;
const infoPanel = document.getElementById("info-panel");

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.6, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById("webgl-output").appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 1, 0);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  addLighting();
  addEnvironment();
  createDollhouseView();
  addMattertags();
  addHotspots();
  addMeasurementTool(
    new THREE.Vector3(-1, 0.01, -1.5),
    new THREE.Vector3(1.5, 0.01, -1.5)
  );
  addFloorPlan();
  setupVR();

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("click", onPointerInteraction);
  window.addEventListener("touchend", onTouchInteraction);

  renderer.setAnimationLoop(renderScene);
}

function addLighting() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.6);
  directional.position.set(6, 10, 4);
  directional.castShadow = true;
  scene.add(directional);
}

function addEnvironment() {
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.9,
    metalness: 0.05,
  });
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    groundMaterial
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const centerpiece = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.8, 0.4, 32),
    new THREE.MeshStandardMaterial({ color: 0x8ca8ff, roughness: 0.4 })
  );
  base.position.y = 0.2;
  centerpiece.add(base);

  const structure = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.6, 2.5),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.05,
    })
  );
  structure.position.y = 1.2;
  centerpiece.add(structure);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.9, 1.1, 4),
    new THREE.MeshStandardMaterial({ color: 0xff7b6b, roughness: 0.45 })
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 2.3;
  centerpiece.add(roof);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.8, 1),
    new THREE.MeshStandardMaterial({
      color: 0xaad9ff,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.6,
    })
  );
  glass.position.set(0, 1.1, 1.25);
  centerpiece.add(glass);

  centerpiece.position.set(0, 0, 0);
  scene.add(centerpiece);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(5, 0.05, 16, 100),
    new THREE.MeshBasicMaterial({ color: 0x6f7de0 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.01;
  scene.add(ring);
}

function createDollhouseView() {
  const dollhouse = new THREE.Group();

  const shellMaterial = new THREE.MeshBasicMaterial({
    color: 0x4c5ac0,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
  });

  const shell = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 5), shellMaterial);
  shell.position.y = 1.5;
  dollhouse.add(shell);

  const interior = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.6, 3.2),
    new THREE.MeshBasicMaterial({
      color: 0xcbd4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    })
  );
  interior.position.y = 1.1;
  dollhouse.add(interior);

  dollhouse.position.set(0, 0, -4.5);
  scene.add(dollhouse);

  return dollhouse;
}

function addMattertags() {
  createMattertag(
    new THREE.Vector3(1.2, 1.4, 0.9),
    "Main gallery entrance: click to learn more about this space."
  );
  createMattertag(
    new THREE.Vector3(-1.1, 1.2, -0.8),
    "Lighting system: adjustable LED array for highlighting exhibits."
  );
}

function createMattertag(position, infoText) {
  const geometry = new THREE.SphereGeometry(0.12, 24, 24);
  const material = new THREE.MeshBasicMaterial({ color: 0xff5555 });
  const tag = new THREE.Mesh(geometry, material);
  tag.position.copy(position);
  scene.add(tag);

  registerInteractable(tag, () => {
    showInfo(infoText);
  });

  return tag;
}

function addHotspots() {
  createHotspot(
    new THREE.Vector3(2.5, 0.3, 0),
    {
      position: new THREE.Vector3(2.5, 1.6, 2.5),
      lookAt: new THREE.Vector3(0, 1, 0),
      message: "Navigated to the east wing viewpoint.",
    }
  );

  createHotspot(
    new THREE.Vector3(-2.5, 0.3, 0),
    {
      position: new THREE.Vector3(-2.5, 1.6, 2.5),
      lookAt: new THREE.Vector3(0, 1, 0),
      message: "Navigated to the west wing viewpoint.",
    }
  );
}

function createHotspot(position, options = {}) {
  const hotspot = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0x37ff8b })
  );
  hotspot.position.copy(position);
  scene.add(hotspot);

  registerInteractable(hotspot, () => {
    const destination = options.position || camera.position.clone();
    const lookAt = options.lookAt || new THREE.Vector3(0, 1, 0);
    smoothMoveCamera(destination, lookAt);
    if (options.message) {
      showInfo(options.message);
    }
  });

  return hotspot;
}

function smoothMoveCamera(destination, lookAt, duration = 1000) {
  const startPosition = camera.position.clone();
  const startTarget = controls ? controls.target.clone() : lookAt.clone();
  const endPosition = destination.clone();
  const endTarget = lookAt.clone();
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const smoothStep = t * t * (3 - 2 * t);

    camera.position.lerpVectors(startPosition, endPosition, smoothStep);
    if (controls) {
      controls.target.lerpVectors(startTarget, endTarget, smoothStep);
    } else {
      camera.lookAt(lookAt);
    }

    if (t < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function addMeasurementTool(startPoint, endPoint) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    startPoint.clone(),
    endPoint.clone(),
  ]);
  const material = new THREE.LineBasicMaterial({ color: 0x0066ff });
  const line = new THREE.Line(geometry, material);
  scene.add(line);

  const distance = startPoint.distanceTo(endPoint);
  const label = createMeasurementLabel(`${distance.toFixed(2)} m`);
  const midpoint = new THREE.Vector3()
    .copy(startPoint)
    .add(endPoint)
    .multiplyScalar(0.5);
  label.position.copy(midpoint);
  scene.add(label);
}

function createMeasurementLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  context.fillStyle = "rgba(13, 17, 23, 0.85)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.font = "48px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    transparent: true,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.8, 0.9, 1);
  return sprite;
}

function addFloorPlan() {
  const floorPlan = document.createElement("div");
  floorPlan.id = "floor-plan";

  const label = document.createElement("span");
  label.textContent = "Floor Plan";
  floorPlan.appendChild(label);

  const floorPlanSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">
      <rect x="5" y="5" width="210" height="210" rx="18" fill="#f4f7ff" stroke="#274690" stroke-width="4" />
      <rect x="36" y="36" width="70" height="60" fill="none" stroke="#274690" stroke-width="3" />
      <rect x="120" y="36" width="70" height="90" fill="none" stroke="#274690" stroke-width="3" />
      <rect x="36" y="116" width="154" height="70" fill="none" stroke="#274690" stroke-width="3" />
      <line x1="111" y1="36" x2="111" y2="186" stroke="#274690" stroke-width="2" stroke-dasharray="6 8" />
      <line x1="36" y1="106" x2="190" y2="106" stroke="#274690" stroke-width="2" stroke-dasharray="6 8" />
      <circle cx="80" cy="80" r="8" fill="#ff5555" />
      <circle cx="160" cy="90" r="8" fill="#37ff8b" />
      <text x="80" y="68" text-anchor="middle" font-size="12" fill="#274690">Tag</text>
      <text x="160" y="78" text-anchor="middle" font-size="12" fill="#274690">Hotspot</text>
    </svg>
  `;

  const img = document.createElement("img");
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    floorPlanSvg
  )}`;
  img.alt = "Sample floor plan blueprint";
  floorPlan.appendChild(img);

  uiLayer.appendChild(floorPlan);
}

function setupVR() {
  if (!navigator.xr) {
    return;
  }

  const button = document.createElement("button");
  button.className = "ui-button";
  button.textContent = "Enter VR";
  button.addEventListener("click", async () => {
    try {
      const session = await navigator.xr.requestSession("immersive-vr");
      renderer.xr.enabled = true;
      renderer.xr.setSession(session);
      showInfo("VR session started. Put on your headset.");
    } catch (error) {
      console.error("Unable to start VR session", error);
      showInfo("VR session could not be started.");
    }
  });

  uiLayer.appendChild(button);
}

function registerInteractable(object, callback) {
  if (!object.userData) {
    object.userData = {};
  }
  object.userData.onSelect = callback;
  if (!interactableObjects.includes(object)) {
    interactableObjects.push(object);
  }
}

function onPointerInteraction(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  triggerRaycast();
}

function onTouchInteraction(event) {
  if (!event.changedTouches || event.changedTouches.length === 0) {
    return;
  }
  const touch = event.changedTouches[0];
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
  triggerRaycast();
}

function triggerRaycast() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactableObjects, true);

  if (intersects.length > 0) {
    let selected = intersects[0].object;
    while (selected && !selected.userData.onSelect && selected.parent) {
      selected = selected.parent;
    }
    if (selected && typeof selected.userData.onSelect === "function") {
      selected.userData.onSelect();
    }
  }
}

function showInfo(message) {
  if (!infoPanel) {
    alert(message);
    return;
  }
  infoPanel.textContent = message;
  infoPanel.classList.add("visible");
  clearTimeout(infoPanelTimeout);
  infoPanelTimeout = setTimeout(() => {
    infoPanel.classList.remove("visible");
  }, 3200);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function renderScene() {
  if (controls) {
    controls.update();
  }
  renderer.render(scene, camera);
}

window.addEventListener("DOMContentLoaded", init);
