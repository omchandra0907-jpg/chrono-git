/**
 * Glassmorphic HUD Timeline Overlay & Commit Inspector.
 */

export interface HudCallbacks {
  onCommitChange: (index: number) => void;
  onPlayToggle: (playing: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onLoadRepo: (ownerRepo: string) => void;
}

export class HudOverlay {
  private container: HTMLDivElement;
  private slider: HTMLInputElement;
  private playBtn: HTMLButtonElement;
  private tooltip: HTMLDivElement;
  private isPlaying: boolean = false;
  private speed: number = 1.0;
  private callbacks: HudCallbacks;

  constructor(callbacks: HudCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.id = 'chrono-hud';
    this.injectStyles();

    this.container.innerHTML = `
      <div class="hud-header glass-panel">
        <div class="hud-title">🏙️ <strong>chrono-git</strong> <span class="tag">3D Time-Machine</span></div>
        <div class="hud-repo-input">
          <input type="text" id="repo-input" placeholder="owner/repo (or load sample)" value="torvalds/linux-subset" />
          <button id="btn-load">Load</button>
        </div>
      </div>

      <div class="hud-tooltip glass-panel" id="hud-tooltip" style="display: none;"></div>

      <div class="hud-commit-card glass-panel" id="commit-card">
        <div class="commit-header">
          <span class="commit-hash" id="commit-hash">#0000000</span>
          <span class="commit-date" id="commit-date">2026-11-24</span>
        </div>
        <div class="commit-msg" id="commit-msg">Initial commit</div>
        <div class="commit-meta">
          <span class="commit-author" id="commit-author">Author</span>
          <span class="diff-stat"><span class="stat-add" id="stat-add">+0</span> <span class="stat-del" id="stat-del">-0</span></span>
        </div>
      </div>

      <div class="hud-footer glass-panel">
        <button id="btn-play" class="control-btn">▶</button>
        <button id="btn-prev" class="control-btn">⏮</button>
        <input type="range" id="timeline-slider" min="0" max="0" value="0" />
        <button id="btn-next" class="control-btn">⏭</button>
        <button id="btn-speed" class="control-btn speed-btn">1x</button>
      </div>
    `;

    document.body.appendChild(this.container);

    this.slider = this.container.querySelector('#timeline-slider') as HTMLInputElement;
    this.playBtn = this.container.querySelector('#btn-play') as HTMLButtonElement;
    this.tooltip = this.container.querySelector('#hud-tooltip') as HTMLDivElement;

    this.bindEvents();
  }

  private injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #chrono-hud {
        position: fixed;
        inset: 0;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #e2e8f0;
        user-select: none;
      }
      .glass-panel {
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        pointer-events: auto;
      }
      .hud-header {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
      }
      .hud-title {
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tag {
        font-size: 0.75rem;
        background: rgba(0, 229, 255, 0.2);
        color: #00e5ff;
        padding: 2px 8px;
        border-radius: 12px;
        border: 1px solid rgba(0, 229, 255, 0.4);
      }
      .hud-repo-input input {
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
      }
      .hud-repo-input button {
        background: #00e5ff;
        color: #0b1120;
        border: none;
        font-weight: bold;
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
      }
      .hud-commit-card {
        position: absolute;
        top: 90px;
        left: 20px;
        width: 320px;
        padding: 16px;
      }
      .commit-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: #94a3b8;
        margin-bottom: 8px;
      }
      .commit-hash {
        color: #00e5ff;
        font-family: monospace;
      }
      .commit-msg {
        font-weight: 600;
        font-size: 0.95rem;
        margin-bottom: 10px;
        line-height: 1.4;
      }
      .commit-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
      }
      .stat-add { color: #10b981; }
      .stat-del { color: #ef4444; }
      .hud-footer {
        position: absolute;
        bottom: 25px;
        left: 50%;
        transform: translateX(-50%);
        width: min(720px, 90vw);
        height: 60px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 20px;
      }
      .control-btn {
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .control-btn:hover {
        background: rgba(51, 65, 85, 0.9);
      }
      #timeline-slider {
        flex: 1;
        accent-color: #00e5ff;
        cursor: pointer;
      }
      .hud-tooltip {
        position: absolute;
        padding: 8px 12px;
        font-size: 0.85rem;
        pointer-events: none;
        z-index: 100;
      }
    `;
    document.head.appendChild(style);
  }

  private bindEvents() {
    this.slider.addEventListener('input', () => {
      this.callbacks.onCommitChange(parseInt(this.slider.value, 10));
    });

    this.playBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      this.playBtn.textContent = this.isPlaying ? '⏸' : '▶';
      this.callbacks.onPlayToggle(this.isPlaying);
    });

    const prevBtn = this.container.querySelector('#btn-prev') as HTMLButtonElement;
    prevBtn.addEventListener('click', () => {
      const cur = parseInt(this.slider.value, 10);
      if (cur > 0) {
        this.slider.value = (cur - 1).toString();
        this.callbacks.onCommitChange(cur - 1);
      }
    });

    const nextBtn = this.container.querySelector('#btn-next') as HTMLButtonElement;
    nextBtn.addEventListener('click', () => {
      const cur = parseInt(this.slider.value, 10);
      const max = parseInt(this.slider.max, 10);
      if (cur < max) {
        this.slider.value = (cur + 1).toString();
        this.callbacks.onCommitChange(cur + 1);
      }
    });

    const speedBtn = this.container.querySelector('#btn-speed') as HTMLButtonElement;
    speedBtn.addEventListener('click', () => {
      if (this.speed === 1.0) this.speed = 2.0;
      else if (this.speed === 2.0) this.speed = 4.0;
      else this.speed = 1.0;
      speedBtn.textContent = `${this.speed}x`;
      this.callbacks.onSpeedChange(this.speed);
    });

    const loadBtn = this.container.querySelector('#btn-load') as HTMLButtonElement;
    const repoInput = this.container.querySelector('#repo-input') as HTMLInputElement;
    loadBtn.addEventListener('click', () => {
      if (repoInput.value.trim()) {
        this.callbacks.onLoadRepo(repoInput.value.trim());
      }
    });
  }

  public setMaxCommits(count: number) {
    this.slider.max = (Math.max(0, count - 1)).toString();
  }

  public setCommit(index: number, commit: any) {
    this.slider.value = index.toString();
    const hashEl = this.container.querySelector('#commit-hash') as HTMLElement;
    const dateEl = this.container.querySelector('#commit-date') as HTMLElement;
    const msgEl = this.container.querySelector('#commit-msg') as HTMLElement;
    const authorEl = this.container.querySelector('#commit-author') as HTMLElement;
    const addEl = this.container.querySelector('#stat-add') as HTMLElement;
    const delEl = this.container.querySelector('#stat-del') as HTMLElement;

    hashEl.textContent = commit.hash;
    dateEl.textContent = commit.date;
    msgEl.textContent = commit.message;
    authorEl.textContent = commit.author;
    addEl.textContent = `+${commit.additions || 0}`;
    delEl.textContent = `-${commit.deletions || 0}`;
  }

  public showTooltip(x: number, y: number, text: string) {
    this.tooltip.style.left = `${x + 15}px`;
    this.tooltip.style.top = `${y + 15}px`;
    this.tooltip.innerHTML = text;
    this.tooltip.style.display = 'block';
  }

  public hideTooltip() {
    this.tooltip.style.display = 'none';
  }
}

/* Timeline scrubber transport bar */

/* Playback rate multiplier controls */

/* Building inspection metadata display */
