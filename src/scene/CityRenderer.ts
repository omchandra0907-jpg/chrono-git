/**
 * Three.js GPU InstancedMesh City Renderer.
 * High-performance 60 FPS rendering with smooth height lerping and neon palette.
 */

import * as THREE from 'three';
import { BuildingRect } from '../layout/treemap.ts';

const NEON_PALETTE: Record<string, number> = {
  ts: 0x00e5ff,   // Neon Cyan
  tsx: 0x00b0ff,  // Deep Sky
  js: 0xffd600,   // Electric Yellow
  jsx: 0xffab00,  // Amber
  c: 0x2979ff,    // Cobalt
  h: 0x3d5afe,    // Indigo
  py: 0x00e676,   // Emerald Green
  rs: 0xff6d00,   // Vivid Orange
  go: 0x00b8d4,   // Teal
  md: 0xb388ff,   // Soft Lavender
  json: 0xff4081, // Hot Pink
  yml: 0xff80ab,  // Rose
  yaml: 0xff80ab,
  default: 0x90a4ae, // Slate
};

export function getFileColor(path: string): number {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return NEON_PALETTE[ext] || NEON_PALETTE.default;
}

export class CityRenderer {
  public scene: THREE.Scene;
  public instancedMesh: THREE.InstancedMesh | null = null;
  private currentBuildings: BuildingRect[] = [];
  private dummy = new THREE.Object3D();
  private colorHelper = new THREE.Color();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupGround();
  }

  private setupGround() {
    // Cyberpunk grid ground
    const gridHelper = new THREE.GridHelper(300, 60, 0x00e5ff, 0x1f293d);
    gridHelper.position.y = -0.1;
    this.scene.add(gridHelper);

    // Reflective floor plane
    const planeGeo = new THREE.PlaneGeometry(350, 350);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x0d111a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(planeGeo, planeMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  public updateCity(
    buildings: BuildingRect[],
    changedFiles: string[] = []
  ) {
    this.currentBuildings = buildings;

    // Clean up previous mesh if present
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach((m) => m.dispose());
      } else {
        this.instancedMesh.material.dispose();
      }
      this.instancedMesh = null;
    }

    if (buildings.length === 0) return;

    // 1x1x1 unit box geometry centered at bottom (pivot at y = 0)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(0, 0.5, 0);

    const material = new THREE.MeshStandardMaterial({
      roughness: 0.25,
      metalness: 0.4,
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, buildings.length);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;

    const changedSet = new Set(changedFiles);

    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      const height = Math.max(1.0, Math.log2(b.weight + 1) * 3.5);

      this.dummy.position.set(b.x + b.width / 2, 0, b.z + b.depth / 2);
      this.dummy.scale.set(Math.max(0.2, b.width), height, Math.max(0.2, b.depth));
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

      // Color mapping with pulse on recently changed files
      const baseHex = getFileColor(b.path);
      this.colorHelper.setHex(baseHex);
      if (changedSet.has(b.path)) {
        this.colorHelper.offsetHSL(0, 0.2, 0.3); // Bright emissive highlight
      }
      this.instancedMesh.setColorAt(i, this.colorHelper);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    this.scene.add(this.instancedMesh);
  }

  public pickBuilding(
    camera: THREE.Camera,
    screenX: number,
    screenY: number,
    viewportWidth: number,
    viewportHeight: number
  ): BuildingRect | null {
    if (!this.instancedMesh) return null;

    this.mouse.x = (screenX / viewportWidth) * 2 - 1;
    this.mouse.y = -(screenY / viewportHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObject(this.instancedMesh);

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const id = intersects[0].instanceId;
      return this.currentBuildings[id] || null;
    }
    return null;
  }
}
