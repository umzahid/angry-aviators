import {
  LEVELS,
  BIRD_TYPES,
  CHARACTER_INFO,
  GROUND_Y,
  SLING
} from './levels.js';
import {
  drawBackground,
  drawForeground,
  drawSlingBack,
  drawSlingFront,
  drawSlingPouch,
  drawBird,
  drawPig,
  drawBlock,
  drawMenuScene,
  drawVignetteFlash,
  roundRect
} from './art.js';
import { Sound } from './audio.js';

const M = window.Matter;
if (!M) throw new Error('Physics engine failed to load.');

const { Engine, Composite, Bodies, Body, Events, Sleeping, Vector } = M;

const W = 1600;
const H = 900;
const RENDER_SCALE = 1.5;
const STEP_MS = 1000 / 60;
const MAX_DRAG = 136;
const LAUNCH_FACTOR = 0.196;
const SAVE_KEY = 'angryAviators.save.v1';

const MATERIALS = {
  wood: {
    name: 'wood',
    density: 0.00125,
    friction: 0.62,
    frictionStatic: 1,
    restitution: 0.04,
    health: 58,
    score: 500
  },
  ice: {
    name: 'ice',
    density: 0.00075,
    friction: 0.38,
    frictionStatic: 0.7,
    restitution: 0.1,
    health: 26,
    score: 400
  },
  stone: {
    name: 'stone',
    density: 0.0025,
    friction: 0.8,
    frictionStatic: 1,
    restitution: 0.025,
    health: 150,
    score: 800
  },
  tnt: {
    name: 'tnt',
    density: 0.0013,
    friction: 0.55,
    frictionStatic: 1,
    restitution: 0.05,
    health: 24,
    score: 1000
  }
};

const BIRD_POWER = { red: 1, chuck: 1.12, bomb: 1.32, blues: 0.66 };

const $ = (selector) => document.querySelector(selector);

const dom = {
  stage: $('#stage'),
  menuCanvas: $('#menuCanvas'),
  gameCanvas: $('#gameCanvas'),
  menuScreen: $('#menuScreen'),
  levelScreen: $('#levelScreen'),
  gameScreen: $('#gameScreen'),
  modalLayer: $('#modalLayer'),
  pauseModal: $('#pauseModal'),
  howModal: $('#howModal'),
  resultModal: $('#resultModal'),
  menuVersion: $('#menuVersion'),
  playSub: $('#playSub'),
  menuStarStrip: $('#menuStarStrip'),
  menuSaveSummary: $('#menuSaveSummary'),
  levelGrid: $('#levelGrid'),
  totalStars: $('#totalStars'),
  btnPlay: $('#btnPlay'),
  btnLevels: $('#btnLevels'),
  btnHow: $('#btnHow'),
  btnLevelsBack: $('#btnLevelsBack'),
  btnCloseHow: $('#btnCloseHow'),
  btnHowDone: $('#btnHowDone'),
  birdGuide: $('#birdGuide'),
  pauseBtn: $('#pauseBtn'),
  gameHomeBtn: $('#gameHomeBtn'),
  btnResume: $('#btnResume'),
  btnRestart: $('#btnRestart'),
  btnPauseLevels: $('#btnPauseLevels'),
  audioPauseBtn: $('#audioPauseBtn'),
  audioMenuBtn: $('#audioMenuBtn'),
  hudAudioBtn: $('#hudAudioBtn'),
  hudLevelNo: $('#hudLevelNo'),
  hudLevelName: $('#hudLevelName'),
  scoreValue: $('#scoreValue'),
  birdQueue: $('#birdQueue'),
  pigCounter: $('#pigCounter'),
  toast: $('#toast'),
  toastText: $('#toastText'),
  toastIcon: $('#toastIcon'),
  abilityCard: $('#abilityCard'),
  abilityName: $('#abilityName'),
  abilityHint: $('#abilityHint'),
  gameBottomHint: $('.game-bottom-hint'),
  resultRibbon: $('#resultRibbon'),
  resultKicker: $('#resultKicker'),
  resultTitle: $('#resultTitle'),
  resultStars: $('#resultStars'),
  resultMessage: $('#resultMessage'),
  resultScore: $('#resultScore'),
  resultBest: $('#resultBest'),
  resultBirds: $('#resultBirds'),
  btnResultNext: $('#btnResultNext'),
  btnResultReplay: $('#btnResultReplay'),
  btnResultLevels: $('#btnResultLevels')
};

const menuCtx = dom.menuCanvas.getContext('2d');
const gameCtx = dom.gameCanvas.getContext('2d');

let save = null;
let screen = 'menu';
let game = null;
let modalMode = null;
let lastResult = null;
let toastTimer = null;
let lastPigSound = 0;
let accumulated = 0;
let lastFrame = performance.now();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatScore(value) {
  return Math.max(0, Math.round(value)).toLocaleString('en-US');
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function emptySave() {
  return {
    version: 1,
    unlocked: 1,
    levels: {},
    settings: { sound: true }
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw);
    const next = emptySave();
    next.unlocked = clamp(Number.parseInt(parsed.unlocked, 10) || 1, 1, LEVELS.length);
    if (parsed.settings && typeof parsed.settings.sound === 'boolean') {
      next.settings.sound = parsed.settings.sound;
    }
    if (parsed.levels && typeof parsed.levels === 'object') {
      for (const level of LEVELS) {
        const entry = parsed.levels[level.id];
        if (!entry) continue;
        next.levels[level.id] = {
          stars: clamp(Number.parseInt(entry.stars, 10) || 0, 0, 3),
          score: Math.max(0, Number.parseInt(entry.score, 10) || 0)
        };
      }
    }
    return next;
  } catch {
    return emptySave();
  }
}

function persistSave() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Progress is a nice-to-have; never stall the game over storage.
  }
}

function totalStars() {
  return Object.values(save.levels).reduce((sum, entry) => sum + (entry.stars || 0), 0);
}

function starsFor(level, score) {
  if (!level) return 0;
  let stars = 1;
  if (score >= level.starScores[1]) stars = 2;
  if (score >= level.starScores[2]) stars = 3;
  return stars;
}

function nextPlayableIndex() {
  const maxUnlocked = clamp(save.unlocked - 1, 0, LEVELS.length - 1);
  for (let index = 0; index <= maxUnlocked; index += 1) {
    if ((save.levels[LEVELS[index].id]?.stars || 0) === 0) return index;
  }
  return maxUnlocked;
}

function completedLevelCount() {
  return LEVELS.filter((level) => (save.levels[level.id]?.stars || 0) > 0).length;
}

function fitStage() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / W, vh / H);
  const x = (vw - W * scale) / 2;
  const y = (vh - H * scale) / 2;
  dom.stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
}

function switchScreen(next) {
  screen = next;
  dom.menuScreen.classList.toggle('hidden', next !== 'menu');
  dom.levelScreen.classList.toggle('hidden', next !== 'levels');
  dom.gameScreen.classList.toggle('hidden', next !== 'game');
  dom.menuCanvas.classList.toggle('hidden', next === 'game');
  dom.gameCanvas.classList.toggle('hidden', next !== 'game');
  document.body.classList.toggle('in-game', next === 'game');
  if (next !== 'game') hideAbility();
}

function updateAudioUI() {
  const on = Sound.enabled;
  dom.audioMenuBtn.classList.toggle('is-muted', !on);
  dom.hudAudioBtn.classList.toggle('is-muted', !on);
  dom.audioMenuBtn.setAttribute('aria-label', on ? 'Mute sound' : 'Enable sound');
  dom.hudAudioBtn.setAttribute('aria-label', on ? 'Mute sound' : 'Enable sound');
  dom.audioPauseBtn.classList.toggle('is-muted', !on);
  dom.audioPauseBtn.querySelector('.toggle-label').textContent = on ? 'SOUND ON' : 'SOUND OFF';
  dom.audioPauseBtn.querySelector('.toggle-dot').setAttribute('aria-hidden', 'true');
}

function toggleAudio() {
  const enabled = Sound.toggle();
  save.settings.sound = enabled;
  if (enabled) {
    Sound.init();
    Sound.startMusic();
  }
  updateAudioUI();
  persistSave();
}

function showToast(message, duration = 3600, icon = '!') {
  window.clearTimeout(toastTimer);
  dom.toastText.textContent = message;
  dom.toastIcon.textContent = icon;
  dom.toast.classList.add('show');
  toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove('show');
  }, duration);
}

function hideToast() {
  window.clearTimeout(toastTimer);
  dom.toast.classList.remove('show');
}

function showAbility(type) {
  const meta = BIRD_TYPES[type];
  if (!meta) return;
  dom.abilityName.textContent = meta.ability;
  dom.abilityHint.textContent = `${meta.name} · tap anywhere or press Space`;
  dom.abilityCard.classList.remove('hidden');
}

function hideAbility() {
  dom.abilityCard.classList.add('hidden');
}

function updateHudIdentity() {
  if (!game) return;
  dom.hudLevelNo.textContent = `LEVEL ${String(game.index + 1).padStart(2, '0')}`;
  dom.hudLevelName.textContent = game.level.name;
}

function updateScoreHud() {
  if (!game) return;
  dom.scoreValue.textContent = formatScore(game.displayScore);
}

function updatePigHud() {
  if (!game) return;
  dom.pigCounter.textContent = `PIGS ${game.pigsRemaining}`;
}

const birdPortraitCache = new Map();

function birdPortrait(type) {
  if (birdPortraitCache.has(type)) return birdPortraitCache.get(type);
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  drawBird(ctx, type, 80, 82, 47, -0.06, { perched: false, time: 1200 });
  const data = canvas.toDataURL('image/png');
  birdPortraitCache.set(type, data);
  return data;
}

function updateFlockUI() {
  if (!game) return;
  const types = [];
  if (game.currentBird) types.push({ type: game.currentBird.type, current: true });
  for (const type of game.birdPlan) types.push({ type, current: false });
  dom.birdQueue.innerHTML = types
    .map(
      ({ type, current }) =>
        `<span class="bird-token has-portrait${current ? ' current' : ''}" data-type="${type}" title="${BIRD_TYPES[type].name}" style="background-image:url('${birdPortrait(type)}')"></span>`
    )
    .join('');
  updatePigHud();
}

function buildHowTo() {
  dom.birdGuide.innerHTML = CHARACTER_INFO.map((info) => {
    const bird = BIRD_TYPES[info.type];
    return `<div class="bird-chip">
      <span class="chip-avatar has-portrait" style="--chip-color:${bird.color};background-image:url('${birdPortrait(info.type)}')"></span>
      <span class="chip-copy">
        <strong>${info.title}</strong>
        <small>${bird.ability} · ${bird.abilityShort}</small>
      </span>
    </div>`;
  }).join('');
}

function levelThumbMarkup(index) {
  return `<canvas class="level-thumb" width="380" height="250" data-level="${index}" aria-hidden="true"></canvas>`;
}

function drawLevelThumbs() {
  const canvases = dom.levelGrid.querySelectorAll('.level-thumb');
  for (const canvas of canvases) {
    const index = Number.parseInt(canvas.dataset.level, 10);
    const level = LEVELS[index];
    if (!level) continue;
    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    for (const block of level.blocks) {
      const diagonal = Math.hypot(block.w, block.h) * 0.14;
      minX = Math.min(minX, block.x - block.w / 2 - diagonal);
      maxX = Math.max(maxX, block.x + block.w / 2 + diagonal);
      minY = Math.min(minY, block.y - block.h / 2 - diagonal);
    }
    for (const pigDef of level.pigs) {
      minX = Math.min(minX, pigDef.x - pigDef.r);
      maxX = Math.max(maxX, pigDef.x + pigDef.r);
      minY = Math.min(minY, pigDef.y - pigDef.r);
    }
    const width = maxX - minX;
    const height = GROUND_Y - minY;
    const scale = Math.min((cw - 34) / Math.max(width, 1), (ch - 30) / Math.max(height, 1), 0.92);
    const ox = (cw - width * scale) / 2 - minX * scale;
    const oy = ch - 10 - GROUND_Y * scale;

    // Ground line and contact shadows.
    const grassColor = level.theme === 'night' ? '#35523e' : level.theme === 'dusk' ? '#6c7046' : level.theme === 'golden' ? '#a99845' : '#6ba542';
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = grassColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(12, ch - 9);
    ctx.lineTo(cw - 12, ch - 9);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(38, 39, 28, 0.22)';
    for (const block of level.blocks) {
      const w = block.w * 0.52;
      ctx.beginPath();
      ctx.ellipse(block.x, GROUND_Y + 5, Math.max(8, w), 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const pigDef of level.pigs) {
      ctx.beginPath();
      ctx.ellipse(pigDef.x, GROUND_Y + 5, pigDef.r * 0.9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const sorted = level.blocks
      .map((block, i) => ({ ...block, i }))
      .sort((a, b) => a.y - b.y);
    for (const block of sorted) {
      drawBlock(
        ctx,
        {
          x: block.x,
          y: block.y,
          w: block.w,
          h: block.h,
          angle: block.angle || 0,
          mat: block.mat
        },
        { damage: 0, id: 100 + index * 20 + block.i, time: 0 }
      );
    }
    for (const pigDef of level.pigs) {
      drawPig(ctx, pigDef.x, pigDef.y, pigDef.r, {
        kind: pigDef.kind,
        time: 0,
        blink: 0
      });
    }
    ctx.restore();
  }
}

function buildLevelGrid() {
  const next = nextPlayableIndex();
  dom.totalStars.textContent = String(totalStars());
  dom.levelGrid.innerHTML = LEVELS.map((level, index) => {
    const unlocked = index < save.unlocked;
    const record = save.levels[level.id] || { stars: 0, score: 0 };
    const isNext = unlocked && index === next && (record.stars || 0) === 0;
    const stars = [0, 1, 2]
      .map((i) => `<span class="${i < record.stars ? 'earned' : ''}">★</span>`)
      .join('');
    return `<button class="level-card${unlocked ? '' : ' locked'}${isNext ? ' is-next' : ''}" type="button" data-index="${index}" data-theme="${level.theme}" aria-label="${unlocked ? level.name : 'Locked level'}, ${record.stars} of 3 stars">
      <span class="card-sky"></span>
      <span class="card-sun"></span>
      <span class="card-cloud one"></span>
      <span class="card-cloud two"></span>
      <span class="card-hill"></span>
      <span class="card-hill b"></span>
      ${levelThumbMarkup(index)}
      <span class="card-ground"></span>
      <span class="card-shade"></span>
      <span class="card-level">${String(index + 1).padStart(2, '0')}</span>
      <span class="card-rank">${level.pigCount} PIG${level.pigCount === 1 ? '' : 'S'}</span>
      <span class="card-name">${level.name}</span>
      <span class="card-stars">${stars}</span>
      <span class="card-lock">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7.7a5 5 0 0 1 10 0V10" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4.4" y="10" width="15.2" height="11" rx="2.2" fill="currentColor" stroke="none"/></svg>
      </span>
    </button>`;
  }).join('');
  drawLevelThumbs();
}

function updateMenuCopy() {
  const total = totalStars();
  const completed = completedLevelCount();
  const next = nextPlayableIndex();
  dom.menuStarStrip.textContent = `★ ${total} / 36`;
  dom.menuSaveSummary.textContent = total === 0
    ? 'A twelve-level slingshot adventure'
    : `${completed} of 12 fortresses cleared · ${total} stars earned`;
  if (completed === 0) {
    dom.playSub.textContent = 'Start the adventure';
  } else if (completed === LEVELS.length) {
    dom.playSub.textContent = 'Replay the final fortress';
  } else {
    dom.playSub.textContent = `Continue at level ${next + 1} · ${LEVELS[next].name}`;
  }
}

function showMenu() {
  closeModal();
  disposeGame();
  switchScreen('menu');
  Sound.setMusicDuck(1);
  updateMenuCopy();
  document.activeElement?.blur();
}

function showLevelSelect() {
  closeModal();
  disposeGame();
  switchScreen('levels');
  buildLevelGrid();
  Sound.setMusicDuck(1);
  document.activeElement?.blur();
}

function openHowTo() {
  hideToast();
  modalMode = 'how';
  dom.modalLayer.classList.remove('hidden');
  dom.pauseModal.classList.add('hidden');
  dom.resultModal.classList.add('hidden');
  dom.howModal.classList.remove('hidden');
  Sound.setMusicDuck(0.5);
}

function closeModal() {
  if (!modalMode) {
    dom.modalLayer.classList.add('hidden');
    return;
  }
  const wasPause = modalMode === 'pause';
  modalMode = null;
  dom.modalLayer.classList.add('hidden');
  dom.pauseModal.classList.add('hidden');
  dom.howModal.classList.add('hidden');
  dom.resultModal.classList.add('hidden');
  if (wasPause && game) {
    game.paused = false;
    Sound.setMusicDuck(1);
    document.activeElement?.blur();
  } else if (screen === 'menu' || screen === 'levels') {
    Sound.setMusicDuck(1);
  }
}

function openPause() {
  if (!game || modalMode || !['ready', 'aiming', 'flying', 'between', 'winning'].includes(game.phase)) {
    return;
  }
  if (game.phase === 'aiming') cancelAim();
  game.paused = true;
  modalMode = 'pause';
  hideAbility();
  dom.modalLayer.classList.remove('hidden');
  dom.howModal.classList.add('hidden');
  dom.resultModal.classList.add('hidden');
  dom.pauseModal.classList.remove('hidden');
  updateAudioUI();
  Sound.setMusicDuck(0.45);
}

function resumeGame() {
  if (modalMode !== 'pause') return;
  modalMode = null;
  dom.modalLayer.classList.add('hidden');
  dom.pauseModal.classList.add('hidden');
  if (game) game.paused = false;
  if (game && game.phase === 'flying') {
    const bird = game.activeBirds.find((item) => item && !item.game.abilityUsed);
    if (bird) showAbility(bird.game.type);
  }
  Sound.setMusicDuck(1);
  document.activeElement?.blur();
}

function beginTransitionToLevel(index) {
  closeModal();
  startLevel(index);
}

function startLevel(index, options = {}) {
  if (!Number.isInteger(index) || index < 0 || index >= LEVELS.length) return;
  closeModal();
  hideToast();
  disposeGame();
  switchScreen('game');
  Sound.setMusicDuck(1);
  const level = LEVELS[index];

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1;
  engine.positionIterations = 10;
  engine.velocityIterations = 8;
  engine.constraintIterations = 4;

  const world = engine.world;
  const ground = Bodies.rectangle(W / 2, GROUND_Y + 100, 2200, 200, {
    isStatic: true,
    friction: 0.95,
    label: 'ground'
  });
  ground.game = { kind: 'ground', material: 'stone' };
  Composite.add(world, ground);

  const blocks = level.blocks.map((definition) => {
    const props = MATERIALS[definition.mat];
    const body = Bodies.rectangle(definition.x, definition.y, definition.w, definition.h, {
      angle: definition.angle || 0,
      density: props.density,
      friction: props.friction,
      frictionStatic: props.frictionStatic,
      frictionAir: 0.003,
      restitution: props.restitution,
      slop: 0.03,
      label: 'block',
      chamfer: { radius: Math.min(3, Math.min(definition.w, definition.h) / 5) }
    });
    body.game = {
      kind: 'block',
      material: definition.mat,
      w: definition.w,
      h: definition.h,
      health: props.health,
      maxHealth: props.health,
      score: props.score,
      dead: false,
      flash: 0
    };
    Composite.add(world, body);
    return body;
  });

  const pigs = level.pigs.map((definition) => {
    const isKing = definition.kind === 'king';
    const body = Bodies.circle(definition.x, definition.y, definition.r, {
      density: isKing ? 0.0019 : 0.0012,
      friction: 0.8,
      frictionStatic: 1,
      frictionAir: 0.008,
      restitution: 0.14,
      slop: 0.03,
      label: 'pig'
    });
    Body.setInertia(body, Infinity);
    body.game = {
      kind: 'pig',
      r: definition.r,
      king: isKing,
      health: isKing ? 260 : 38,
      maxHealth: isKing ? 260 : 38,
      score: isKing ? 9000 : 5000,
      dead: false,
      flash: 0,
      squash: 0,
      phase: Math.random() * 8
    };
    Composite.add(world, body);
    return body;
  });

  game = {
    index,
    level,
    engine,
    world,
    ground,
    blocks,
    pigs,
    activeBirds: [],
    birdPlan: level.birds.slice(),
    currentBird: null,
    phase: 'ready',
    paused: false,
    time: 0,
    steps: 0,
    score: 0,
    displayScore: 0,
    pigsRemaining: pigs.length,
    shotsTaken: 0,
    pendingRemoval: [],
    explosionQueue: [],
    particles: [],
    popups: [],
    rings: [],
    trail: [],
    shake: 0,
    flash: 0,
    betweenTimer: 0,
    winTimer: 0,
    lastStretch: 0,
    drag: null,
    handler: null,
    confettiSpawned: false,
    abilityFlash: 0
  };

  game.handler = (event) => onCollisionStart(event, game);
  // Let the freshly placed towers find their footing before a shot is possible.
  for (let i = 0; i < 24; i += 1) Engine.update(engine, STEP_MS);
  Events.on(engine, 'collisionStart', game.handler);

  updateHudIdentity();
  updateScoreHud();
  dom.gameBottomHint.classList.remove('faded');
  loadNextBird();
  updateFlockUI();
  updatePigHud();
  game.displayScore = 0;
  dom.scoreValue.textContent = '0';
  hideAbility();
  showToast(
    `${level.name}: drag the bird back, then release to fly.`,
    4300,
    '!'
  );
  document.activeElement?.blur();
  if (!options.silent) Sound.setMusicDuck(1);
}

function disposeGame() {
  if (!game) return;
  if (game.handler && game.engine) Events.off(game.engine, 'collisionStart', game.handler);
  if (game.engine) {
    Composite.clear(game.engine.world, false, true);
    Engine.clear(game.engine);
  }
  game = null;
  hideAbility();
}

function loadNextBird() {
  if (!game) return false;
  if (game.birdPlan.length === 0) {
    game.currentBird = null;
    updateFlockUI();
    return false;
  }
  const type = game.birdPlan.shift();
  game.currentBird = {
    type,
    x: SLING.x,
    y: SLING.y,
    angle: -0.04,
    blinkPhase: Math.random() * 10
  };
  game.phase = 'ready';
  hideAbility();
  updateFlockUI();
  return true;
}

function beginBetween() {
  if (!game || game.phase !== 'flying') return;
  game.phase = 'between';
  game.betweenTimer = game.birdPlan.length > 0 ? 950 : 2300;
  hideAbility();
  if (!game.currentBird && game.birdPlan.length === 0) {
    showToast('The flock is empty... hold your breath.', 1900, '…');
  }
}

function beginWin() {
  if (!game) return;
  if (['winning', 'won', 'lost'].includes(game.phase)) return;
  game.phase = 'winning';
  game.winTimer = 1500;
  game.paused = false;
  hideAbility();
  Sound.win();
  showToast('FORTRESS CLEARED!', 1700, '★');
}

function finishWin() {
  if (!game) return;
  const leftoverBirds = (game.currentBird ? 1 : 0) + game.birdPlan.length;
  const bonus = leftoverBirds * 10000;
  game.score += bonus;
  game.displayScore = game.score;
  updateScoreHud();
  const stars = starsFor(game.level, game.score);
  const previous = save.levels[game.level.id] || { stars: 0, score: 0 };
  if (bonus > 0) {
    game.popups.push({
      x: 780,
      y: 470,
      text: `+${formatScore(bonus)} BIRD BONUS`,
      life: 1.6,
      maxLife: 1.6,
      color: '#fff1af',
      scale: 0.8
    });
  }
  const bestScore = Math.max(previous.score || 0, game.score);
  save.levels[game.level.id] = {
    stars: Math.max(previous.stars || 0, stars),
    score: bestScore
  };
  save.unlocked = clamp(Math.max(save.unlocked, game.index + 2), 1, LEVELS.length);
  persistSave();
  const isFinal = game.index === LEVELS.length - 1;
  const allStars = totalStars();
  lastResult = {
    win: true,
    levelIndex: game.index,
    nextIndex: isFinal ? null : game.index + 1,
    score: game.score,
    best: bestScore,
    stars,
    birdsLeft: leftoverBirds,
    isFinal,
    allStars
  };
  game.phase = 'won';
  game.paused = true;
  modalMode = 'result';
  spawnConfetti();
  showResult(lastResult);
}

function showResult(result) {
  if (!result) return;
  dom.modalLayer.classList.remove('hidden');
  dom.pauseModal.classList.add('hidden');
  dom.howModal.classList.add('hidden');
  dom.resultModal.classList.remove('hidden');
  dom.resultModal.classList.toggle('loss', !result.win);
  dom.resultScore.textContent = formatScore(result.score);
  dom.resultBest.textContent = formatScore(result.best);
  dom.resultBirds.textContent = String(result.birdsLeft);
  dom.resultStars.innerHTML = [0, 1, 2]
    .map(
      (index) => `<span class="result-star ${result.win && index < result.stars ? 'earned' : 'lost'}">★</span>`
    )
    .join('');

  if (result.win) {
    dom.resultRibbon.textContent = result.isFinal ? 'KINGDOM CLEARED' : 'LEVEL CLEARED';
    dom.resultKicker.textContent = result.isFinal
      ? 'EVERY LAST FORTRESS HAS FALLEN'
      : 'THE PIGS NEVER STOOD A CHANCE';
    dom.resultTitle.textContent = result.isFinal
      ? (result.allStars >= 36 ? 'LEGENDARY!' : 'KING PIG DOWN!')
      : result.stars === 3
        ? 'TOTAL CARNAGE!'
        : result.stars === 2
          ? 'NICE SHOOTING!'
          : 'FORTRESS FELLED!';
    dom.resultMessage.textContent = result.isFinal
      ? 'The castle is rubble, the crown is in the mud, and the flock is getting dinner.'
      : result.stars === 3
        ? 'Maximum stars. Minimum mercy. The pigs are considering a career change.'
        : result.stars === 2
          ? 'Excellent aim. A few more saved birds and the third star is yours.'
          : 'A win is a win. The pigs are already rebuilding, the cheeky little things.';
    const nextMain = dom.btnResultNext.querySelector('.btn-main');
    const nextSub = dom.btnResultNext.querySelector('.btn-sub');
    if (result.isFinal) {
      nextMain.textContent = 'BACK TO LEVELS';
      nextSub.textContent = `${result.allStars} of 36 stars collected`;
    } else {
      nextMain.textContent = 'NEXT LEVEL';
      nextSub.textContent = `Level ${result.nextIndex + 1} awaits`;
    }
  } else {
    dom.resultRibbon.textContent = 'OUT OF BIRDS';
    dom.resultKicker.textContent = 'THE PIGS ARE DOING A LITTLE DANCE';
    dom.resultTitle.textContent = 'THEY SURVIVED!';
    dom.resultMessage.textContent = 'The fortress is still standing and the pigs are feeling smug. Line up another shot.';
    dom.btnResultNext.querySelector('.btn-main').textContent = 'TRY AGAIN';
    dom.btnResultNext.querySelector('.btn-sub').textContent = 'Another shot at glory';
  }

  Sound.setMusicDuck(0.35);
  if (result.win) {
    let index = 0;
    const starTimer = setInterval(() => {
      if (modalMode !== 'result' || index >= result.stars) {
        clearInterval(starTimer);
        return;
      }
      Sound.star();
      index += 1;
    }, 360);
  }
}

function loseLevel() {
  if (!game || game.phase === 'won' || game.phase === 'lost') return;
  game.phase = 'lost';
  game.paused = true;
  game.activeBirds = [];
  hideAbility();
  hideToast();
  const previous = save.levels[game.level.id] || { stars: 0, score: 0 };
  const best = Math.max(previous.score || 0, game.score);
  if (game.score > (previous.score || 0)) {
    save.levels[game.level.id] = { stars: previous.stars || 0, score: game.score };
    persistSave();
  }
  lastResult = {
    win: false,
    levelIndex: game.index,
    nextIndex: null,
    score: game.score,
    best,
    stars: 0,
    birdsLeft: 0,
    isFinal: false
  };
  modalMode = 'result';
  Sound.lose();
  showResult(lastResult);
}

function addScore(amount, x, y, label = null) {
  if (!game || amount <= 0) return;
  game.score += amount;
  if (x !== undefined && y !== undefined) {
    game.popups.push({
      x,
      y,
      text: label || `+${formatScore(amount)}`,
      life: 1.15,
      maxLife: 1.15,
      color: label ? '#fff1b0' : '#ffe27a',
      scale: label ? 0.75 : 1
    });
  }
}

function addParticles(list) {
  if (!game) return;
  for (const particle of list) {
    if (game.particles.length > 560) break;
    game.particles.push(particle);
  }
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function burstBlock(body) {
  if (!game) return;
  const { x, y } = body.position;
  const mat = body.game.material;
  const particles = [];
  if (mat === 'ice') {
    for (let i = 0; i < 16; i += 1) {
      particles.push({
        kind: 'shard',
        x: x + randomBetween(-18, 18),
        y: y + randomBetween(-18, 18),
        vx: randomBetween(-230, 230),
        vy: randomBetween(-300, 80),
        size: randomBetween(4, 11),
        color: i % 3 === 0 ? '#e6fcff' : i % 3 === 1 ? '#9fe4f7' : '#6fc3e5',
        rot: Math.random() * 6,
        vr: randomBetween(-12, 12),
        grav: 900,
        life: randomBetween(0.5, 1),
        maxLife: 1,
        drag: 0.2
      });
    }
    game.shake = Math.max(game.shake, 4);
  } else if (mat === 'stone') {
    for (let i = 0; i < 11; i += 1) {
      particles.push({
        kind: 'chunk',
        x: x + randomBetween(-20, 20),
        y: y + randomBetween(-20, 20),
        vx: randomBetween(-170, 170),
        vy: randomBetween(-240, 60),
        size: randomBetween(5, 13),
        color: i % 3 === 0 ? '#c3c6be' : i % 3 === 1 ? '#8e958e' : '#6f7873',
        rot: Math.random() * 6,
        vr: randomBetween(-8, 8),
        grav: 950,
        life: randomBetween(0.45, 0.9),
        maxLife: 0.9,
        drag: 0.24
      });
    }
    for (let i = 0; i < 8; i += 1) {
      particles.push({
        kind: 'dust',
        x: x + randomBetween(-25, 25),
        y: y + randomBetween(-20, 20),
        vx: randomBetween(-80, 80),
        vy: randomBetween(-90, 20),
        size: randomBetween(12, 26),
        color: 'rgba(176, 173, 160, 0.55)',
        rot: 0,
        vr: 0,
        grav: -30,
        life: randomBetween(0.5, 1.1),
        maxLife: 1.1,
        drag: 0.2
      });
    }
    game.shake = Math.max(game.shake, 7);
  } else if (mat === 'tnt') {
    game.flash = Math.max(game.flash, 0.8);
    game.shake = Math.max(game.shake, 18);
  } else {
    for (let i = 0; i < 12; i += 1) {
      particles.push({
        kind: 'splinter',
        x: x + randomBetween(-22, 22),
        y: y + randomBetween(-15, 15),
        vx: randomBetween(-190, 190),
        vy: randomBetween(-280, 50),
        size: randomBetween(4, 12),
        color: i % 4 === 0 ? '#d39a5b' : i % 3 === 0 ? '#a56a39' : '#75451f',
        rot: Math.random() * 6,
        vr: randomBetween(-14, 14),
        grav: 920,
        life: randomBetween(0.5, 1.05),
        maxLife: 1.05,
        drag: 0.16
      });
    }
    for (let i = 0; i < 4; i += 1) {
      particles.push({
        kind: 'dust',
        x: x + randomBetween(-20, 20),
        y: y + randomBetween(-16, 16),
        vx: randomBetween(-50, 50),
        vy: randomBetween(-50, 10),
        size: randomBetween(10, 20),
        color: 'rgba(110, 74, 43, 0.4)',
        rot: 0,
        vr: 0,
        grav: -20,
        life: randomBetween(0.4, 0.8),
        maxLife: 0.8,
        drag: 0.2
      });
    }
    game.shake = Math.max(game.shake, 5);
  }
  addParticles(particles);
}

function burstPig(body) {
  if (!game) return;
  const { x, y } = body.position;
  const particles = [];
  for (let i = 0; i < 18; i += 1) {
    particles.push({
      kind: i % 5 === 0 ? 'star' : 'poof',
      x: x + randomBetween(-12, 12),
      y: y + randomBetween(-12, 12),
      vx: randomBetween(-150, 150),
      vy: randomBetween(-190, 50),
      size: randomBetween(5, 13),
      color: i % 5 === 0 ? '#ffd35a' : i % 3 === 0 ? '#a9d76a' : '#7db84d',
      rot: Math.random() * 6,
      vr: randomBetween(-8, 8),
      grav: i % 5 === 0 ? 500 : 260,
      life: randomBetween(0.45, 1),
      maxLife: 1,
      drag: 0.2
    });
  }
  for (let i = 0; i < 5; i += 1) {
    particles.push({
      kind: 'feather',
      x,
      y: y - 6,
      vx: randomBetween(-60, 90),
      vy: randomBetween(-180, -60),
      size: randomBetween(7, 12),
      color: i % 2 ? '#c6e8a2' : '#87c85c',
      rot: Math.random() * 6,
      vr: randomBetween(-4, 4),
      grav: 150,
      life: randomBetween(1.2, 2),
      maxLife: 2,
      drag: 0.12
    });
  }
  addParticles(particles);
  game.shake = Math.max(game.shake, body.game.king ? 16 : 6);
}

function destroyBody(body, cause = 'impact') {
  if (!game || !body || !body.game || body.game.dead) return;
  const info = body.game;
  info.dead = true;
  game.pendingRemoval.push(body);

  if (info.kind === 'block') {
    burstBlock(body);
    addScore(info.score, body.position.x, body.position.y - 18);
    if (info.material === 'tnt') {
      game.explosionQueue.push({
        x: body.position.x,
        y: body.position.y,
        radius: 248,
        damage: 84,
        power: 1.1,
        queuedAt: game.time + 70
      });
    }
  } else if (info.kind === 'pig') {
    game.pigsRemaining = Math.max(0, game.pigsRemaining - 1);
    addScore(info.score, body.position.x, body.position.y - 36);
    burstPig(body);
    Sound.pigPop();
    updatePigHud();
    if (info.king) {
      game.flash = Math.max(game.flash, 0.32);
      game.shake = Math.max(game.shake, 13);
    }
    if (game.pigsRemaining === 0) {
      const now = performance.now();
      if (now - lastPigSound > 120) {
        lastPigSound = now;
        Sound.unlock();
      }
    }
  }
}

function damageBody(body, amount, cause = 'impact') {
  if (!game || !body || !body.game || body.game.dead) return;
  const info = body.game;
  if (info.kind !== 'block' && info.kind !== 'pig') return;
  if (amount <= 0.4) return;
  info.health -= amount;
  info.flash = Math.min(1, (info.flash || 0) + 0.22 + amount / 90);
  if (info.kind === 'pig') {
    info.squash = Math.min(1, info.squash + amount / 55);
    const now = performance.now();
    if (now - lastPigSound > 65) {
      lastPigSound = now;
      Sound.pigHit();
    }
  }
  if (info.health <= 0) destroyBody(body, cause);
}

function impactDamage(target, source, speed) {
  if (!target.game || !source.game) return 0;
  if (target.game.kind !== 'block' && target.game.kind !== 'pig') return 0;
  if (source.game.kind === 'bird') {
    const power = BIRD_POWER[source.game.type] || 1;
    if (target.game.kind === 'pig') return Math.max(0, speed - 1.6) * 3.25 * power;
    return Math.max(0, speed - 1.6) * 3.1 * power;
  }
  if (source.game.kind === 'ground') {
    if (target.game.kind === 'pig') return speed > 6.5 ? (speed - 6.5) * 2.3 : 0;
    return speed > 10.5 ? (speed - 10.5) * 1.3 : 0;
  }
  if (source.game.kind === 'block') {
    const massFactor = clamp(Math.sqrt(source.mass / 1.6), 0.6, 2.7);
    if (target.game.kind === 'pig') return Math.max(0, speed - 2.4) * 1.55 * massFactor;
    return Math.max(0, speed - 3.2) * 0.8 * massFactor;
  }
  if (source.game.kind === 'pig') {
    if (target.game.kind === 'block') return Math.max(0, speed - 3.8) * 0.35;
    return 0;
  }
  return 0;
}

function onCollisionStart(event, currentGame) {
  if (!game || game !== currentGame || !game.engine) return;
  for (const pair of event.pairs) {
    const a = pair.bodyA;
    const b = pair.bodyB;
    if (!a.game || !b.game) continue;
    const speed = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
    if (speed < 2) continue;

    const damageA = impactDamage(a, b, speed);
    const damageB = impactDamage(b, a, speed);

    if (damageA > 0.7) {
      if (a.game.kind === 'block') Sound.impact(a.game.material, speed / 17);
      damageBody(a, damageA, 'collision');
    }
    if (damageB > 0.7) {
      if (b.game.kind === 'block') Sound.impact(b.game.material, speed / 17);
      damageBody(b, damageB, 'collision');
    }

    if ((damageA > 3 || damageB > 3) && speed > 6) {
      const birdHit = a.game.kind === 'bird' || b.game.kind === 'bird';
      if (birdHit) {
        game.shake = Math.max(game.shake, clamp(speed * 0.32, 2.5, 10));
        if (Math.random() > 0.56) {
          const x = (a.position.x + b.position.x) / 2;
          const y = (a.position.y + b.position.y) / 2;
          addParticles([{
            kind: 'feather',
            x,
            y,
            vx: randomBetween(-60, 90),
            vy: randomBetween(-130, -40),
            size: randomBetween(5, 9),
            color: '#f7e6c8',
            rot: Math.random() * 6,
            vr: randomBetween(-5, 5),
            grav: 180,
            life: randomBetween(0.7, 1.3),
            maxLife: 1.3,
            drag: 0.15
          }]);
        }
      }
    }
  }
}

function processExplosions() {
  if (!game || game.explosionQueue.length === 0) return;
  const waiting = [];
  const ready = [];
  for (const explosion of game.explosionQueue) {
    if (game.time >= (explosion.queuedAt || 0)) ready.push(explosion);
    else waiting.push(explosion);
  }
  game.explosionQueue = waiting;
  let guard = 0;
  while (ready.length && guard < 18) {
    guard += 1;
    const explosion = ready.shift();
    detonate(explosion.x, explosion.y, explosion.radius, explosion.damage, explosion.power);
    // A chained TNT crate may have queued another blast while we were here.
    if (game.explosionQueue.length) {
      const nowReady = [];
      const stillWaiting = [];
      for (const queued of game.explosionQueue) {
        if (game.time >= (queued.queuedAt || 0)) nowReady.push(queued);
        else stillWaiting.push(queued);
      }
      ready.push(...nowReady);
      game.explosionQueue = stillWaiting;
    }
  }
}

function detonate(x, y, radius = 230, damage = 92, power = 1) {
  if (!game) return;
  game.shake = Math.max(game.shake, 20);
  game.flash = Math.max(game.flash, 0.62);
  Sound.explode(1);

  const ring = { x, y, radius: 12, maxRadius: radius, life: 0.55, maxLife: 0.55, color: 'rgba(255, 219, 133, 0.9)' };
  game.rings.push(ring);
  game.rings.push({ ...ring, maxRadius: radius * 0.62, life: 0.38, maxLife: 0.38, color: 'rgba(255, 249, 209, 0.8)' });

  const blastParticles = [];
  for (let i = 0; i < 34; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(120, 620);
    blastParticles.push({
      kind: i % 4 === 0 ? 'spark' : i % 3 === 0 ? 'dust' : 'chunk',
      x: x + randomBetween(-10, 10),
      y: y + randomBetween(-10, 10),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      size: randomBetween(3, 13),
      color: i % 4 === 0 ? '#ffdf7e' : i % 3 === 0 ? 'rgba(98, 72, 49, 0.55)' : i % 2 === 0 ? '#f0a63d' : '#6e4d31',
      rot: Math.random() * 6,
      vr: randomBetween(-8, 8),
      grav: i % 4 === 0 ? 220 : 750,
      life: randomBetween(0.3, 0.9),
      maxLife: 0.9,
      drag: 0.18,
      glow: i % 4 === 0
    });
  }
  addParticles(blastParticles);
  game.particles.push({
    kind: 'flashball',
    x,
    y,
    vx: 0,
    vy: 0,
    size: 30,
    color: '#fff8ce',
    rot: 0,
    vr: 0,
    grav: 0,
    life: 0.2,
    maxLife: 0.2,
    drag: 1
  });

  const affected = [...game.blocks, ...game.pigs, ...game.activeBirds];
  for (const body of affected) {
    if (!body || !body.game || body.game.dead) continue;
    const dx = body.position.x - x;
    const dy = body.position.y - y;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) continue;
    const falloff = Math.max(0.12, 1 - dist / radius);
    if (body.isSleeping) Sleeping.set(body, false);
    const force = 0.038 * falloff * power * body.mass;
    Body.applyForce(body, body.position, {
      x: (dx / (dist || 1)) * force,
      y: (dy / (dist || 1)) * force - body.mass * 0.006 * falloff
    });
    if (body.game.kind !== 'bird') {
      damageBody(body, damage * falloff, 'explosion');
    }
  }
}

function flushRemovals() {
  if (!game) return;
  const removal = game.pendingRemoval;
  if (!removal.length) return;
  for (const body of removal) {
    if (!body) continue;
    if (game.world) Composite.remove(game.world, body);
  }
  game.blocks = game.blocks.filter((body) => !body.game?.dead);
  game.pigs = game.pigs.filter((body) => !body.game?.dead);
  game.activeBirds = game.activeBirds.filter((body) => !body.game?.dead);
  game.pendingRemoval = [];
}

function checkOutOfBounds() {
  if (!game) return;
  for (const body of [...game.blocks]) {
    if (body.position.y > 980 || body.position.x < -140 || body.position.x > 1760) {
      if (!body.game.dead) {
        body.game.dead = true;
        game.pendingRemoval.push(body);
      }
    }
  }
  for (const body of [...game.pigs]) {
    if (body.position.y > 980 || body.position.x < -120 || body.position.x > 1730) {
      if (!body.game.dead) destroyBody(body, 'fall');
    }
  }
  for (const bird of [...game.activeBirds]) {
    if (bird.position.y > 975 || bird.position.x < -90 || bird.position.x > 1720) {
      retireBird(bird, true);
    }
  }
}

function retireBird(body, silent = false) {
  if (!game || !body || !game.activeBirds.includes(body)) return;
  const index = game.activeBirds.indexOf(body);
  if (index >= 0) game.activeBirds.splice(index, 1);
  if (game.world) Composite.remove(game.world, body);
  if (!silent) {
    addParticles([
      {
        kind: 'feather',
        x: body.position.x,
        y: body.position.y,
        vx: randomBetween(-40, 60),
        vy: randomBetween(-120, -20),
        size: randomBetween(5, 9),
        color: '#f2dfbd',
        rot: Math.random() * 5,
        vr: randomBetween(-4, 4),
        grav: 170,
        life: 1.1,
        maxLife: 1.1,
        drag: 0.12
      }
    ]);
  }
  const anyAbility = game.activeBirds.some((bird) => !bird.game.abilityUsed);
  if (!anyAbility) hideAbility();
}

function updateBirds(stepMs) {
  if (!game || game.phase !== 'flying') return;
  for (const bird of [...game.activeBirds]) {
    if (!bird || !bird.game) continue;
    bird.game.flightTime = (bird.game.flightTime || 0) + stepMs;
    const speed = Body.getSpeed(bird);
    const trail = bird.game.trail || (bird.game.trail = []);
    if (speed > 3 && game.steps % 2 === 0) {
      trail.push({ x: bird.position.x, y: bird.position.y });
      if (trail.length > 8) trail.shift();
    } else if (speed < 2.2 && trail.length) {
      trail.length = 0;
    }
    if (bird.game.flightTime > 9500) {
      retireBird(bird);
      continue;
    }
    if (bird.game.flightTime > 600 && speed < 1.6) {
      bird.game.restTime = (bird.game.restTime || 0) + stepMs;
    } else {
      bird.game.restTime = 0;
    }
    if ((bird.game.restTime || 0) > 1050) {
      retireBird(bird);
    }
  }
  if (game.activeBirds.length === 0 && game.phase === 'flying') {
    beginBetween();
  }
}

function updateTimers(stepMs) {
  if (!game) return;
  if (game.phase === 'winning') {
    game.winTimer -= stepMs;
    if (game.winTimer <= 0) finishWin();
    return;
  }
  if (game.phase === 'between') {
    game.betweenTimer -= stepMs;
    if (game.betweenTimer <= 0) {
      if (game.pigsRemaining <= 0) {
        beginWin();
      } else if (game.birdPlan.length > 0) {
        loadNextBird();
      } else {
        loseLevel();
      }
    }
  }
}

function simulate(stepMs) {
  if (!game || game.paused) return;
  game.steps += 1;
  Engine.update(game.engine, stepMs);
  game.time += stepMs;
  processExplosions();
  flushRemovals();
  checkOutOfBounds();
  if (game.phase !== 'winning' && game.phase !== 'won' && game.phase !== 'lost') {
    if (game.pigsRemaining <= 0) beginWin();
  }
  if (game.phase === 'flying') updateBirds(stepMs);
  updateTimers(stepMs);
  for (const body of [...game.blocks, ...game.pigs]) {
    if (body.game.flash > 0) body.game.flash = Math.max(0, body.game.flash - stepMs / 160);
    if (body.game.squash > 0) body.game.squash = Math.max(0, body.game.squash - stepMs / 320);
  }
  if (game.phase === 'winning' && game.pigsRemaining === 0 && !game.confettiSpawned) {
    // A small flutter before the result screen.
    game.confettiSpawned = true;
  }
}

function updateEffects(dtMs) {
  if (!game) return;
  const dt = dtMs / 1000;
  game.displayScore += (game.score - game.displayScore) * Math.min(1, dt * 8.5);
  if (Math.abs(game.score - game.displayScore) < 1) game.displayScore = game.score;
  updateScoreHud();

  game.shake *= Math.exp(-6.8 * dt);
  if (game.shake < 0.1) game.shake = 0;
  game.flash = Math.max(0, game.flash - dt * 1.4);
  game.abilityFlash = Math.max(0, game.abilityFlash - dt * 2.2);

  for (const particle of game.particles) {
    particle.life -= dt;
    const drag = particle.drag ?? 0.1;
    particle.vx *= 1 - drag * dt * 8;
    particle.vy = (particle.vy || 0) + (particle.grav ?? 700) * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.rot = (particle.rot || 0) + (particle.vr || 0) * dt;
    if (particle.kind === 'feather') {
      particle.vx += Math.sin((game.time + particle.x) * 0.004) * 14 * dt;
    }
  }
  game.particles = game.particles.filter((particle) => particle.life > 0);

  for (const popup of game.popups) {
    popup.life -= dt;
    popup.y -= 44 * dt;
  }
  game.popups = game.popups.filter((popup) => popup.life > 0);

  for (const ring of game.rings) {
    ring.life -= dt;
    ring.radius += (ring.maxRadius - ring.radius) * Math.min(1, dt * 8);
  }
  game.rings = game.rings.filter((ring) => ring.life > 0);

  for (const body of game.activeBirds) {
    if (body.game.trail) {
      for (const point of body.game.trail) point.age = (point.age || 0) + dt;
    }
  }
}

function spawnConfetti() {
  if (!game) return;
  const colors = ['#ffd35b', '#ef6a4b', '#74c35e', '#65c7ea', '#fff2cf', '#e59b4c'];
  const particles = [];
  for (let i = 0; i < 130; i += 1) {
    particles.push({
      kind: 'confetti',
      x: randomBetween(220, 1380),
      y: randomBetween(-180, -10),
      vx: randomBetween(-70, 70),
      vy: randomBetween(40, 240),
      size: randomBetween(5, 11),
      color: colors[i % colors.length],
      rot: Math.random() * 6,
      vr: randomBetween(-6, 6),
      grav: 120,
      life: randomBetween(2.5, 5),
      maxLife: 5,
      drag: 0.1
    });
  }
  addParticles(particles);
}

function getBirdPull() {
  if (!game || !game.currentBird) return null;
  const bird = game.currentBird;
  const dx = bird.x - SLING.x;
  const dy = bird.y - SLING.y;
  const length = Math.hypot(dx, dy);
  if (length < 2) return null;
  return {
    x: (-dx / length) * Math.min(MAX_DRAG, length) * LAUNCH_FACTOR,
    y: (-dy / length) * Math.min(MAX_DRAG, length) * LAUNCH_FACTOR,
    length
  };
}

function aimFromPointer(point) {
  if (!game || !game.currentBird) return;
  const anchor = SLING;
  let dx = point.x - anchor.x;
  let dy = point.y - anchor.y;
  if (dx > 14) dx = 14;
  const length = Math.hypot(dx, dy);
  if (length > MAX_DRAG) {
    dx = (dx / length) * MAX_DRAG;
    dy = (dy / length) * MAX_DRAG;
  }
  const minY = 480;
  const maxY = GROUND_Y - 38;
  let px = anchor.x + dx;
  let py = anchor.y + dy;
  if (py < minY) py = minY;
  if (py > maxY) py = maxY;
  px = clamp(px, anchor.x - MAX_DRAG, anchor.x + 14);
  game.currentBird.x = px;
  game.currentBird.y = py;
  game.currentBird.angle = Math.atan2(anchor.y - py, anchor.x - px);
  const pull = Math.hypot(px - anchor.x, py - anchor.y);
  const now = performance.now();
  if (pull > 12 && now - (game.lastStretch || 0) > 130) {
    game.lastStretch = now;
    Sound.stretch(Math.min(1, pull / MAX_DRAG));
  }
}

function cancelAim() {
  if (!game) return;
  game.drag = null;
  document.body.classList.remove('is-dragging');
  if (game.currentBird && ['aiming', 'ready'].includes(game.phase)) {
    game.currentBird.x = SLING.x;
    game.currentBird.y = SLING.y;
    game.currentBird.angle = -0.04;
    game.phase = 'ready';
  }
}

function pointerToStage(event) {
  const rect = dom.gameCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * W,
    y: ((event.clientY - rect.top) / rect.height) * H
  };
}

function onPointerDown(event) {
  if (screen !== 'game' || !game || game.paused || modalMode) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  if (!dom.gameCanvas.contains(event.target)) return;
  const point = pointerToStage(event);

  if (game.phase === 'flying') {
    useAbility();
    return;
  }
  if (game.phase !== 'ready' || !game.currentBird) return;
  const bird = game.currentBird;
  const nearBird = distance(point.x, point.y, bird.x, bird.y) < 150;
  const inSlingArea = point.x < 430 && point.y > 380 && point.y < 800;
  if (!nearBird && !inSlingArea) return;

  event.preventDefault();
  game.phase = 'aiming';
  game.drag = { pointerId: event.pointerId };
  dom.gameCanvas.setPointerCapture?.(event.pointerId);
  document.body.classList.add('is-dragging');
  aimFromPointer(point);
}

function onPointerMove(event) {
  if (!game || !game.drag || event.pointerId !== game.drag.pointerId) return;
  event.preventDefault();
  aimFromPointer(pointerToStage(event));
}

function onPointerUp(event) {
  if (!game || !game.drag || event.pointerId !== game.drag.pointerId) return;
  event.preventDefault();
  const bird = game.currentBird;
  game.drag = null;
  document.body.classList.remove('is-dragging');
  if (!bird || game.phase !== 'aiming') return;
  const pullX = bird.x - SLING.x;
  const pullY = bird.y - SLING.y;
  const pull = Math.hypot(pullX, pullY);
  if (pull < 18 || pullX > -8) {
    cancelAim();
    showToast('Pull further back to load the slingshot.', 1800, '↔');
    return;
  }
  const speed = Math.min(MAX_DRAG, pull) * LAUNCH_FACTOR;
  const vx = (-pullX / pull) * speed;
  const vy = (-pullY / pull) * speed;
  launchCurrent(vx, vy);
}

function launchCurrent(vx, vy) {
  if (!game || !game.currentBird) return;
  const bird = game.currentBird;
  const type = bird.type;
  const meta = BIRD_TYPES[type];
  const startX = bird.x;
  const startY = bird.y;
  game.currentBird = null;
  game.phase = 'flying';
  game.shotsTaken += 1;
  game.drag = null;
  document.body.classList.remove('is-dragging');
  hideToast();
  dom.gameBottomHint.classList.add('faded');
  updateFlockUI();

  const body = Bodies.circle(startX, startY, meta.radius, {
    density: meta.density,
    friction: 0.4,
    frictionAir: 0.0015,
    frictionStatic: 0.6,
    restitution: 0.38,
    slop: 0.02,
    label: 'bird'
  });
  body.game = {
    kind: 'bird',
    type,
    abilityUsed: false,
    flightTime: 0,
    restTime: 0,
    trail: []
  };
  Body.setVelocity(body, { x: vx, y: vy });
  Body.setAngularVelocity(body, clamp(vx * 0.008, -0.18, 0.18));
  Composite.add(game.world, body);
  game.activeBirds.push(body);
  game.trail = [];

  showAbility(type);
  game.abilityFlash = 1;
  game.shake = Math.max(game.shake, 2);
  Sound.launch();
  addParticles([
    {
      kind: 'dust',
      x: startX,
      y: startY + 8,
      vx: randomBetween(-40, 30),
      vy: randomBetween(-30, 20),
      size: 18,
      color: 'rgba(255, 237, 200, 0.5)',
      rot: 0,
      vr: 0,
      grav: -20,
      life: 0.45,
      maxLife: 0.45,
      drag: 0.2
    },
    {
      kind: 'feather',
      x: startX,
      y: startY,
      vx: randomBetween(-50, 30),
      vy: randomBetween(-100, -30),
      size: 7,
      color: '#f1dbbc',
      rot: 2,
      vr: -2,
      grav: 160,
      life: 1.2,
      maxLife: 1.2,
      drag: 0.15
    }
  ]);
}

function useAbility() {
  if (!game || game.phase !== 'flying' || game.paused || modalMode) return;
  const bird = game.activeBirds.find((body) => body && !body.game.abilityUsed);
  if (!bird) return;
  const type = bird.game.type;
  bird.game.abilityUsed = true;
  hideAbility();
  game.abilityFlash = 1;

  if (type === 'red') {
    Sound.ability('red');
    const speed = Body.getSpeed(bird);
    const velocity = bird.velocity;
    const norm = Math.hypot(velocity.x, velocity.y) || 1;
    Body.setVelocity(bird, {
      x: velocity.x + (velocity.x / norm) * 6 + 2.5,
      y: velocity.y + (velocity.y / norm) * 3 - 2.1
    });
    game.rings.push({ x: bird.position.x, y: bird.position.y, radius: 10, maxRadius: 110, life: 0.4, maxLife: 0.4, color: 'rgba(255, 121, 82, 0.85)' });
    game.shake = Math.max(game.shake, 7);
    for (const body of [...game.blocks, ...game.pigs]) {
      const dx = body.position.x - bird.position.x;
      const dy = body.position.y - bird.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 130 && dist > 0) {
        if (body.isSleeping) Sleeping.set(body, false);
        const f = (1 - dist / 130) * 0.014 * body.mass * (speed > 6 ? 1 : 0.5);
        Body.applyForce(body, body.position, { x: (dx / dist) * f, y: (dy / dist) * f - body.mass * 0.002 });
      }
    }
  } else if (type === 'chuck') {
    Sound.ability('chuck');
    const velocity = bird.velocity;
    const norm = Math.hypot(velocity.x, velocity.y) || 1;
    const boost = 12.5;
    Body.setVelocity(bird, {
      x: velocity.x + (velocity.x / norm) * boost,
      y: velocity.y + (velocity.y / norm) * boost
    });
    for (let i = 0; i < 10; i += 1) {
      game.particles.push({
        kind: 'spark',
        x: bird.position.x - (velocity.x / norm) * i * 7,
        y: bird.position.y - (velocity.y / norm) * i * 7,
        vx: -velocity.x * 0.08 + randomBetween(-40, 40),
        vy: -velocity.y * 0.08 + randomBetween(-40, 40),
        size: randomBetween(3, 7),
        color: '#ffe99b',
        rot: 0,
        vr: 0,
        grav: 0,
        life: 0.3,
        maxLife: 0.3,
        drag: 0.15,
        glow: true
      });
    }
    game.rings.push({ x: bird.position.x, y: bird.position.y, radius: 10, maxRadius: 90, life: 0.3, maxLife: 0.3, color: 'rgba(255, 230, 109, 0.9)' });
    game.shake = Math.max(game.shake, 5);
  } else if (type === 'bomb') {
    detonate(bird.position.x, bird.position.y, 225, 105, 1.25);
    retireBird(bird, true);
    game.abilityFlash = 1;
  } else if (type === 'blues') {
    Sound.ability('blues');
    const velocity = bird.velocity;
    const speed = Math.max(9, Math.hypot(velocity.x, velocity.y));
    const baseAngle = Math.atan2(velocity.y, velocity.x);
    const perpendicular = { x: -Math.sin(baseAngle), y: Math.cos(baseAngle) };
    const origin = { x: bird.position.x, y: bird.position.y };
    retireBird(bird, true);
    game.activeBirds = game.activeBirds.filter((item) => item !== bird);
    const blues = [];
    for (const offset of [-1, 0, 1]) {
      const angle = baseAngle + offset * 0.17;
      const body = Bodies.circle(
        origin.x + perpendicular.x * offset * 16,
        origin.y + perpendicular.y * offset * 16,
        15,
        {
          density: 0.0032,
          friction: 0.4,
          frictionAir: 0.0015,
          restitution: 0.42,
          slop: 0.02,
          label: 'bird'
        }
      );
      body.game = {
        kind: 'bird',
        type: 'blues',
        abilityUsed: true,
        flightTime: 0,
        restTime: 0,
        trail: []
      };
      Body.setVelocity(body, {
        x: Math.cos(angle) * speed * 1.08,
        y: Math.sin(angle) * speed * 1.08
      });
      Body.setAngularVelocity(body, offset * 0.06);
      Composite.add(game.world, body);
      game.activeBirds.push(body);
      blues.push(body);
    }
    game.rings.push({ x: origin.x, y: origin.y, radius: 8, maxRadius: 75, life: 0.3, maxLife: 0.3, color: 'rgba(137, 225, 255, 0.9)' });
    game.shake = Math.max(game.shake, 3);
  }
  game.shake = Math.max(game.shake, 3);
}

function drawShadow(ctx, x, groundY, width, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#21351f';
  ctx.beginPath();
  ctx.ellipse(x, groundY + 6, width, Math.max(5, width * 0.16), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx) {
  if (!game) return;
  for (const particle of game.particles) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = particle.kind === 'dust' ? alpha * 0.8 : alpha;
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rot || 0);
    const size = particle.size;
    if (particle.kind === 'dust' || particle.kind === 'poof') {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, size * (1.15 - alpha * 0.35), 0, Math.PI * 2);
      ctx.fill();
    } else if (particle.kind === 'shard') {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.moveTo(-size * 0.6, -size * 0.5);
      ctx.lineTo(size * 0.7, -size * 0.1);
      ctx.lineTo(-size * 0.1, size * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (particle.kind === 'feather') {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(91, 63, 39, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-size * 0.8, 0);
      ctx.lineTo(size * 0.8, 0);
      ctx.stroke();
    } else if (particle.kind === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = Math.max(1.5, size * 0.22);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.lineTo(size, 0);
      ctx.stroke();
    } else if (particle.kind === 'star') {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const radius = i % 2 === 0 ? size : size * 0.45;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else if (particle.kind === 'confetti') {
      ctx.fillStyle = particle.color;
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
    } else if (particle.kind === 'flashball') {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 110);
      g.addColorStop(0, 'rgba(255, 252, 216, 0.92)');
      g.addColorStop(0.35, 'rgba(255, 200, 78, 0.55)');
      g.addColorStop(1, 'rgba(255, 139, 42, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 110, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = particle.color;
      if (particle.kind === 'chunk' || particle.kind === 'splinter') {
        ctx.fillRect(-size / 2, -size / 3, size, size * 0.66);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (particle.glow) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha *= 0.5;
      ctx.fillStyle = '#ffe9a2';
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function renderGame(now) {
  if (!game) return;
  const ctx = gameCtx;
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const shakeX = game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;
  const shakeY = game.shake > 0 ? (Math.random() - 0.5) * game.shake : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawBackground(ctx, game.level.theme, now, { seed: game.level.id });

  // Ground shadows for every piece of the fortress.
  for (const body of game.blocks) {
    if (body.game?.dead) continue;
    const info = body.game;
    const width = (info.w * Math.abs(Math.cos(body.angle)) + info.h * Math.abs(Math.sin(body.angle))) * 0.36;
    const heightAbove = GROUND_Y - body.position.y;
    const alpha = clamp(0.16 - heightAbove / 4600, 0.03, 0.16);
    drawShadow(ctx, body.position.x, GROUND_Y, Math.max(width, 12), alpha);
  }
  for (const body of game.pigs) {
    if (body.game?.dead) continue;
    const heightAbove = GROUND_Y - body.position.y;
    drawShadow(ctx, body.position.x, GROUND_Y, body.game.r * 0.9, clamp(0.17 - heightAbove / 4500, 0.04, 0.17));
  }
  for (const body of game.activeBirds) {
    const heightAbove = GROUND_Y - body.position.y;
    if (heightAbove > 0) drawShadow(ctx, body.position.x, GROUND_Y, 23, clamp(0.14 - heightAbove / 5000, 0.02, 0.14));
  }

  // Slingshot and loaded bird.
  const loaded = !!game.currentBird;
  const birdPoint = loaded ? { x: game.currentBird.x, y: game.currentBird.y } : null;
  drawSlingBack(ctx, SLING, birdPoint);
  if (loaded) {
    const bird = game.currentBird;
    drawSlingFront(ctx, SLING, birdPoint, true);
    drawSlingPouch(ctx, birdPoint);
    drawBird(ctx, bird.type, bird.x, bird.y, BIRD_TYPES[bird.type].radius, bird.angle, {
      perched: true,
      time: now + (bird.blinkPhase || 0) * 1000
    });
  } else {
    drawSlingFront(ctx, SLING, null, false);
  }

  // Aim trajectory.
  if (game.phase === 'aiming' && game.currentBird) {
    const pull = getBirdPull();
    if (pull) {
      let x = game.currentBird.x;
      let y = game.currentBird.y;
      let vx = pull.x;
      let vy = pull.y;
      const gravity = 0.2778;
      const dots = [];
      for (let step = 1; step <= 190; step += 1) {
        vx *= 0.9985;
        vy += gravity;
        x += vx;
        y += vy;
        if (step % 3 === 0) dots.push({ x, y, step });
        if (y > GROUND_Y - 2 || x > W + 80) break;
      }
      for (let i = 0; i < dots.length; i += 1) {
        const dot = dots[i];
        const alpha = 0.82 * (1 - i / (dots.length + 6));
        const radius = Math.max(1.7, 4 - i * 0.055);
        ctx.save();
        ctx.fillStyle = 'rgba(53, 34, 20, 0.22)';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius + 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 248, 218, ${alpha})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      const last = dots[dots.length - 1];
      if (last) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 246, 208, 0.9)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(last.x, Math.min(GROUND_Y - 5, last.y), 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(64, 42, 25, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(last.x - 5, Math.min(GROUND_Y - 5, last.y) - 5);
        ctx.lineTo(last.x + 5, Math.min(GROUND_Y - 5, last.y) + 5);
        ctx.moveTo(last.x + 5, Math.min(GROUND_Y - 5, last.y) - 5);
        ctx.lineTo(last.x - 5, Math.min(GROUND_Y - 5, last.y) + 5);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Fortress.
  const blocks = [...game.blocks].filter((body) => !body.game.dead).sort((a, b) => a.position.y - b.position.y);
  for (const body of blocks) {
    const info = body.game;
    drawBlock(
      ctx,
      {
        x: body.position.x,
        y: body.position.y,
        w: info.w,
        h: info.h,
        angle: body.angle,
        mat: info.material
      },
      { damage: 1 - info.health / info.maxHealth, id: body.id, time: now }
    );
    if (info.flash > 0.01) {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      ctx.globalAlpha = Math.min(0.5, info.flash * 0.55);
      ctx.fillStyle = '#fff5d1';
      roundRect(ctx, -info.w / 2, -info.h / 2, info.w, info.h, 3);
      ctx.fill();
      ctx.restore();
    }
  }

  for (const body of game.pigs) {
    if (body.game.dead) continue;
    const info = body.game;
    drawPig(ctx, body.position.x, body.position.y, info.r, {
      kind: info.king ? 'king' : 'pig',
      damage: 1 - info.health / info.maxHealth,
      squash: info.squash,
      time: now + info.phase * 1000
    });
    if (info.flash > 0.01) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.3, info.flash * 0.4);
      ctx.fillStyle = '#fff7d1';
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, info.r * 1.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Bird trails and birds.
  for (const body of game.activeBirds) {
    if (body.game.trail) {
      for (let i = 0; i < body.game.trail.length; i += 1) {
        const point = body.game.trail[i];
        const alpha = ((i + 1) / body.game.trail.length) * 0.16;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = BIRD_TYPES[body.game.type]?.color || '#ffffff';
        ctx.beginPath();
        ctx.ellipse(point.x, point.y, 7 + i * 0.45, 4 + i * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    drawBird(ctx, body.game.type, body.position.x, body.position.y, body.game.type === 'blues' && body.circleRadius < 17 ? 15 : BIRD_TYPES[body.game.type].radius, body.angle, {
      perched: false,
      fuseLit: body.game.type === 'bomb',
      time: now
    });
  }

  // Explosion rings.
  for (const ring of game.rings) {
    const alpha = clamp(ring.life / ring.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha * 0.75;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 5 * alpha + 1;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawForeground(ctx, game.level.theme, now, { seed: game.level.id, alpha: 0.58 });
  drawParticles(ctx);

  for (const popup of game.popups) {
    const alpha = clamp(popup.life / popup.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(popup.x, popup.y);
    ctx.scale(popup.scale || 1, popup.scale || 1);
    ctx.font = `400 31px "Luckiest Guy", "Nunito", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(66, 39, 22, 0.88)';
    ctx.lineWidth = 7;
    ctx.strokeText(popup.text, 0, 0);
    ctx.fillStyle = popup.color;
    ctx.fillText(popup.text, 0, 0);
    ctx.restore();
  }

  // An ability is ready: a soft halo around the airborne hero.
  if (game.phase === 'flying') {
    for (const bird of game.activeBirds) {
      if (bird.game.abilityUsed) continue;
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.009);
      ctx.save();
      ctx.globalAlpha = 0.18 + pulse * 0.1;
      ctx.strokeStyle = '#ffe38a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bird.position.x, bird.position.y, BIRD_TYPES[bird.game.type].radius + 10 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
  drawVignetteFlash(ctx, game.flash);
}

function renderMenu(now) {
  menuCtx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  menuCtx.clearRect(0, 0, W, H);
  drawMenuScene(menuCtx, now);
}

function frame(now) {
  const dt = Math.min(50, now - lastFrame);
  lastFrame = now;

  if (screen === 'game' && game) {
    if (!game.paused) {
      accumulated += dt;
      let steps = 0;
      while (accumulated >= STEP_MS && steps < 5) {
        simulate(STEP_MS);
        accumulated -= STEP_MS;
        steps += 1;
        if (!game) break;
      }
    } else {
      accumulated = 0;
    }
    if (game) {
      if (!game.paused || modalMode === 'result') updateEffects(dt);
      updateScoreHud();
      renderGame(now);
    }
  } else {
    accumulated = 0;
    renderMenu(now);
  }

  requestAnimationFrame(frame);
}

function bindEvents() {
  dom.btnPlay.addEventListener('click', () => beginTransitionToLevel(nextPlayableIndex()));
  dom.btnLevels.addEventListener('click', showLevelSelect);
  dom.btnHow.addEventListener('click', openHowTo);
  dom.btnLevelsBack.addEventListener('click', showMenu);
  dom.btnCloseHow.addEventListener('click', closeModal);
  dom.btnHowDone.addEventListener('click', closeModal);
  dom.btnLevelsBack.addEventListener('mouseenter', () => Sound.hover());
  dom.btnPlay.addEventListener('mouseenter', () => Sound.hover());
  dom.pauseBtn.addEventListener('click', openPause);
  dom.gameHomeBtn.addEventListener('click', openPause);
  dom.btnResume.addEventListener('click', resumeGame);
  dom.btnRestart.addEventListener('click', () => {
    if (!game) return;
    const index = game.index;
    closeModal();
    startLevel(index);
  });
  dom.btnPauseLevels.addEventListener('click', showLevelSelect);
  dom.audioMenuBtn.addEventListener('click', toggleAudio);
  dom.hudAudioBtn.addEventListener('click', toggleAudio);
  dom.audioPauseBtn.addEventListener('click', toggleAudio);
  dom.abilityCard.addEventListener('click', useAbility);
  dom.btnResultNext.addEventListener('click', () => {
    if (!lastResult) return;
    if (!lastResult.win) {
      startLevel(lastResult.levelIndex);
      return;
    }
    if (lastResult.isFinal) {
      showLevelSelect();
    } else {
      startLevel(lastResult.nextIndex);
    }
  });
  dom.btnResultReplay.addEventListener('click', () => {
    if (!lastResult) return;
    startLevel(lastResult.levelIndex);
  });
  dom.btnResultLevels.addEventListener('click', showLevelSelect);

  dom.levelGrid.addEventListener('click', (event) => {
    const card = event.target.closest('.level-card');
    if (!card) return;
    const index = Number.parseInt(card.dataset.index, 10);
    if (!Number.isInteger(index)) return;
    if (index >= save.unlocked) {
      card.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-5px) rotate(-0.4deg)' },
          { transform: 'translateX(5px) rotate(0.4deg)' },
          { transform: 'translateX(0)' }
        ],
        { duration: 260, easing: 'ease-out' }
      );
      return;
    }
    startLevel(index);
  });

  dom.gameCanvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: false });
  window.addEventListener('pointercancel', () => {
    if (game?.drag) cancelAim();
  });
  window.addEventListener('resize', fitStage);
  window.addEventListener('orientationchange', fitStage);

  dom.modalLayer.addEventListener('click', (event) => {
    if (event.target !== dom.modalLayer) return;
    if (modalMode === 'pause') resumeGame();
    if (modalMode === 'how') closeModal();
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.closest('#abilityCard')) return;
    Sound.click();
  });

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'm') {
      toggleAudio();
      return;
    }
    if (key === 'escape') {
      if (modalMode === 'pause') {
        resumeGame();
      } else if (modalMode === 'how') {
        closeModal();
      } else if (modalMode === 'result') {
        return;
      } else if (screen === 'game') {
        openPause();
      } else if (screen === 'levels') {
        showMenu();
      }
      return;
    }
    if (event.code === 'Space') {
      if (screen === 'game' && game && !game.paused && !modalMode && game.phase === 'flying') {
        event.preventDefault();
        useAbility();
      }
    }
  });

  window.addEventListener('blur', () => {
    if (game && game.phase === 'aiming') cancelAim();
  });
}

async function init() {
  try {
    await Promise.all([
      document.fonts.load('16px "Luckiest Guy"'),
      document.fonts.load('700 16px "Nunito"'),
      document.fonts.load('800 16px "Nunito"')
    ]);
  } catch {
    // Fall back gracefully to system fonts.
  }

  save = loadSave();
  Sound.enabled = save.settings.sound;
  Sound.arm();

  buildHowTo();
  buildLevelGrid();
  updateMenuCopy();
  updateAudioUI();
  fitStage();
  bindEvents();
  switchScreen('menu');
  updateMenuCopy();

  if (window.desktop?.getVersion) {
    try {
      const version = await window.desktop.getVersion();
      dom.menuVersion.textContent = version;
    } catch {
      dom.menuVersion.textContent = '1.0.1';
    }
  } else {
    dom.menuVersion.textContent = '1.0.1';
  }

  lastFrame = performance.now();
  requestAnimationFrame(frame);
}

init().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<div class="noscript">The flock hit turbulence while starting.<br><small>${String(error.message || error)}</small></div>`;
});
