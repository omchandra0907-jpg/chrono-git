import * as THREE from 'three';
import { CameraRig } from './scene/CameraRig.ts';
import { CityRenderer } from './scene/CityRenderer.ts';
import { squarify } from './layout/treemap.ts';
import { HudOverlay } from './ui/HudOverlay.ts';
import { fetchGitHubRepoHistory } from './data/githubClient.ts';
import { CompactRepoHistory } from './data/gitParser.ts';

// Bundled starter repo history
const STARTER_HISTORY: CompactRepoHistory = {
  commits: [
    {
      hash: 'a1b2c3d',
      author: 'omchandra0907-jpg',
      date: '2026-10-26 14:15',
      message: 'feat: initial architecture & core structures',
      additions: 120,
      deletions: 0,
      changedFiles: ['README.md', 'src/main.c', 'include/world.h'],
      files: {
        'README.md': 45,
        'src/main.c': 110,
        'include/world.h': 85,
      },
    },
    {
      hash: 'e4f5a6b',
      author: 'omchandra0907-jpg',
      date: '2026-10-28 17:30',
      message: 'feat: add falling sand and fluid physics engine',
      additions: 340,
      deletions: 12,
      changedFiles: ['src/physics.c', 'tests/test_physics.c'],
      files: {
        'README.md': 55,
        'src/main.c': 130,
        'include/world.h': 95,
        'src/physics.c': 320,
        'tests/test_physics.c': 80,
      },
    },
    {
      hash: 'c7d8e9f',
      author: 'omchandra0907-jpg',
      date: '2026-10-30 19:45',
      message: 'feat: implement chemical reactions & explosive chain rules',
      additions: 480,
      deletions: 25,
      changedFiles: ['src/physics.c', 'src/reactions.c', 'Makefile'],
      files: {
        'README.md': 85,
        'src/main.c': 160,
        'include/world.h': 110,
        'src/physics.c': 420,
        'src/reactions.c': 280,
        'tests/test_physics.c': 150,
        'Makefile': 40,
      },
    },
    {
      hash: '0a1b2c3',
      author: 'omchandra0907-jpg',
      date: '2026-11-02 12:10',
      message: 'feat: terminal raw mode half-block compositor and mouse drag',
      additions: 290,
      deletions: 15,
      changedFiles: ['src/render.c', 'src/input.c', 'include/terminal.h'],
      files: {
        'README.md': 110,
        'src/main.c': 180,
        'include/world.h': 110,
        'src/physics.c': 420,
        'src/reactions.c': 280,
        'src/render.c': 240,
        'src/input.c': 120,
        'include/terminal.h': 65,
        'tests/test_physics.c': 150,
        'Makefile': 55,
      },
    },
    {
      hash: 'f4e3d2c',
      author: 'omchandra0907-jpg',
      date: '2026-11-05 21:00',
      message: 'docs: complete reaction matrix, CI guardrails, and showcase demo',
      additions: 150,
      deletions: 10,
      changedFiles: ['README.md', '.github/workflows/ci.yml', 'samples/run_demo.sh'],
      files: {
        'README.md': 195,
        'src/main.c': 180,
        'include/world.h': 110,
        'src/physics.c': 420,
        'src/reactions.c': 280,
        'src/render.c': 240,
        'src/input.c': 120,
        'include/terminal.h': 65,
        'tests/test_physics.c': 150,
        '.github/workflows/ci.yml': 35,
        'samples/run_demo.sh': 20,
        'Makefile': 55,
      },
    },
  ],
};

class ChronoGitApp {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private cameraRig: CameraRig;
  private cityRenderer: CityRenderer;
  private hud: HudOverlay;
  private history: CompactRepoHistory = STARTER_HISTORY;
  private currentCommitIndex: number = 0;
  private isPlaying: boolean = false;
  private playSpeed: number = 1.0;
  private lastStepTime: number = 0;

  constructor() {
    const container = document.getElementById('canvas-container')!;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0f19);
    this.scene.fog = new THREE.FogExp2(0x0b0f19, 0.005);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.cameraRig = new CameraRig(45, width / height, 1, 1000);
    this.cityRenderer = new CityRenderer(this.scene);

    this.setupLighting();
    this.bindEvents();

    this.hud = new HudOverlay({
      onCommitChange: (idx) => this.setCommit(idx),
      onPlayToggle: (playing) => { this.isPlaying = playing; },
      onSpeedChange: (speed) => { this.playSpeed = speed; },
      onLoadRepo: (repo) => this.loadRepository(repo),
    });

    this.loadHistory(STARTER_HISTORY);
    this.animate(0);
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x00e5ff, 1.2);
    dirLight.position.set(80, 120, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    const secondaryLight = new THREE.DirectionalLight(0xff007f, 0.8);
    secondaryLight.position.set(-80, 90, -60);
    this.scene.add(secondaryLight);
  }

  private loadHistory(history: CompactRepoHistory) {
    this.history = history;
    this.hud.setMaxCommits(history.commits.length);
    this.setCommit(history.commits.length - 1);
  }

  public async loadRepository(ownerRepo: string) {
    try {
      const [owner, repo] = ownerRepo.split('/');
      if (owner && repo) {
        const hist = await fetchGitHubRepoHistory(owner, repo);
        this.loadHistory(hist);
      }
    } catch (err: any) {
      alert(`Could not load repo: ${err.message}. Retaining current snapshot.`);
    }
  }

  public setCommit(index: number) {
    if (index < 0 || index >= this.history.commits.length) return;
    this.currentCommitIndex = index;
    const commit = this.history.commits[index];
    this.hud.setCommit(index, commit);

    // Compute Treemap layout for active files
    const fileList = Object.entries(commit.files).map(([p, loc]) => ({
      path: p,
      name: p.split('/').pop() || p,
      weight: loc,
    }));

    const bounds = { x: -60, z: -60, width: 120, depth: 120 };
    const buildings = squarify(fileList, bounds, 1.2);

    this.cityRenderer.updateCity(buildings, commit.changedFiles);
  }

  private bindEvents() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.renderer.setSize(w, h);
      this.cameraRig.camera.aspect = w / h;
      this.cameraRig.camera.updateProjectionMatrix();
    });

    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', (e) => this.cameraRig.onMouseDown(e));
    window.addEventListener('mousemove', (e) => {
      this.cameraRig.onMouseMove(e);
      // Tooltip building picker
      const picked = this.cityRenderer.pickBuilding(
        this.cameraRig.camera,
        e.clientX,
        e.clientY,
        window.innerWidth,
        window.innerHeight
      );
      if (picked) {
        this.hud.showTooltip(
          e.clientX,
          e.clientY,
          `<strong>${picked.name}</strong><br><span style="color:#94a3b8">${picked.path}</span><br>Lines of Code: <strong>${picked.weight}</strong>`
        );
      } else {
        this.hud.hideTooltip();
      }
    });
    window.addEventListener('mouseup', () => this.cameraRig.onMouseUp());
    canvas.addEventListener('wheel', (e) => this.cameraRig.onWheel(e), { passive: false });

    canvas.addEventListener('click', (e) => {
      const picked = this.cityRenderer.pickBuilding(
        this.cameraRig.camera,
        e.clientX,
        e.clientY,
        window.innerWidth,
        window.innerHeight
      );
      if (picked) {
        this.cameraRig.focusOn(picked.x + picked.width / 2, picked.z + picked.depth / 2);
      }
    });
  }

  private animate(time: number) {
    requestAnimationFrame((t) => this.animate(t));

    // Playback timeline progression
    if (this.isPlaying) {
      const interval = 1200 / this.playSpeed;
      if (time - this.lastStepTime > interval) {
        this.lastStepTime = time;
        let next = this.currentCommitIndex + 1;
        if (next >= this.history.commits.length) next = 0;
        this.setCommit(next);
      }
    }

    this.renderer.render(this.scene, this.cameraRig.camera);
  }
}

new ChronoGitApp();
