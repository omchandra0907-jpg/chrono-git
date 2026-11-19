/**
 * Camera Controller: Smooth Orbiting & Click-to-Focus Inspector.
 */

import * as THREE from 'three';

export class CameraRig {
  public camera: THREE.PerspectiveCamera;
  public target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public distance: number = 120;
  public azimuth: number = Math.PI / 4;
  public elevation: number = Math.PI / 4;
  public isDragging: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };

  constructor(fov: number, aspect: number, near: number, far: number) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.updateCameraPosition();
  }

  public updateCameraPosition() {
    this.elevation = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.elevation));
    const x = this.target.x + this.distance * Math.cos(this.elevation) * Math.sin(this.azimuth);
    const y = this.target.y + this.distance * Math.sin(this.elevation);
    const z = this.target.z + this.distance * Math.cos(this.elevation) * Math.cos(this.azimuth);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  public onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  public onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;

    this.azimuth -= deltaX * 0.008;
    this.elevation += deltaY * 0.008;

    this.updateCameraPosition();
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  public onMouseUp() {
    this.isDragging = false;
  }

  public onWheel(e: WheelEvent) {
    e.preventDefault();
    this.distance += e.deltaY * 0.08;
    this.distance = Math.max(20, Math.min(300, this.distance));
    this.updateCameraPosition();
  }

  public focusOn(x: number, z: number, dist: number = 60) {
    this.target.set(x, 0, z);
    this.distance = dist;
    this.updateCameraPosition();
  }
}
