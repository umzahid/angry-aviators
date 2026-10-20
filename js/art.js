// Hand-drawn, code-generated artwork for Angry Aviators.
// Everything here is original vector art rendered with Canvas 2D.

export const WORLD_W = 1600;
export const WORLD_H = 900;
export const GROUND_Y = 790;

const TAU = Math.PI * 2;

export const PALETTES = {
  day: {
    skyTop: '#37a9dc',
    skyMid: '#87dcf4',
    skyLow: '#d8f7ff',
    sun: '#fff5c2',
    sunGlow: 'rgba(255, 246, 191, 0.45)',
    cloud: '#ffffff',
    cloudShade: '#d7f0f8',
    cloudAlpha: 0.9,
    haze: 'rgba(255,255,255,0.16)',
    hillFar: '#b6e6c9',
    hillMid: '#7ecda1',
    hillNear: '#4cac7a',
    treeFar: '#6cb88b',
    treeMid: '#36885d',
    treeDark: '#256a4a',
    trunk: '#6d4b34',
    grass: '#69bf44',
    grassLight: '#8bd85a',
    grassDark: '#3d8a33',
    dirt: '#8b5a35',
    dirtDark: '#60391f',
    dirtLight: '#a97145',
    bloom: '#fff3b0',
    bloomAlt: '#ff91a7',
    night: false,
    remoteBirds: '#3f7f9d'
  },
  golden: {
    skyTop: '#e88962',
    skyMid: '#f6bd7e',
    skyLow: '#ffedc0',
    sun: '#fff0a8',
    sunGlow: 'rgba(255, 221, 140, 0.55)',
    cloud: '#fff0d4',
    cloudShade: '#efc7a2',
    cloudAlpha: 0.78,
    haze: 'rgba(255, 229, 179, 0.18)',
    hillFar: '#d7bd8b',
    hillMid: '#a9ad6a',
    hillNear: '#7f934f',
    treeFar: '#a68f5d',
    treeMid: '#6f7d43',
    treeDark: '#505e34',
    trunk: '#5d4029',
    grass: '#b2a843',
    grassLight: '#d3c25a',
    grassDark: '#77772d',
    dirt: '#7c4e2e',
    dirtDark: '#55311d',
    dirtLight: '#9b6640',
    bloom: '#ffe8a0',
    bloomAlt: '#ff9c78',
    night: false,
    remoteBirds: '#94634f'
  },
  dusk: {
    skyTop: '#3d3568',
    skyMid: '#9a5b89',
    skyLow: '#f0a879',
    sun: '#ffdf9e',
    sunGlow: 'rgba(255, 178, 130, 0.38)',
    cloud: '#f3c3c4',
    cloudShade: '#b7809e',
    cloudAlpha: 0.58,
    haze: 'rgba(255, 180, 150, 0.12)',
    hillFar: '#746682',
    hillMid: '#58556e',
    hillNear: '#3f495a',
    treeFar: '#5a4e68',
    treeMid: '#3c3e53',
    treeDark: '#2c3042',
    trunk: '#443228',
    grass: '#657a49',
    grassLight: '#849754',
    grassDark: '#414d36',
    dirt: '#634330',
    dirtDark: '#432b20',
    dirtLight: '#80573b',
    bloom: '#f8d6a2',
    bloomAlt: '#e89cba',
    night: false,
    remoteBirds: '#675575'
  },
  night: {
    skyTop: '#0a1430',
    skyMid: '#1a3558',
    skyLow: '#3e627b',
    sun: '#f7f2d0',
    sunGlow: 'rgba(200, 227, 255, 0.28)',
    cloud: '#7c9bb7',
    cloudShade: '#4b6884',
    cloudAlpha: 0.36,
    haze: 'rgba(157, 202, 230, 0.10)',
    hillFar: '#244653',
    hillMid: '#1a353f',
    hillNear: '#12262e',
    treeFar: '#1d3942',
    treeMid: '#142a31',
    treeDark: '#0d1e24',
    trunk: '#2a231f',
    grass: '#335844',
    grassLight: '#47725a',
    grassDark: '#1e392c',
    dirt: '#4b3526',
    dirtDark: '#312016',
    dirtLight: '#5e4330',
    bloom: '#ffe8a8',
    bloomAlt: '#ffb7b0',
    night: true,
    remoteBirds: '#6e8fa8'
  }
};

const decorCache = new Map();

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function getDecor(key, theme) {
  if (decorCache.has(key)) return decorCache.get(key);
  const seed = hashString(key);
  const random = rng(seed);
  const clouds = [];
  const cloudCount = theme.night ? 5 : 8;
  for (let i = 0; i < cloudCount; i += 1) {
    clouds.push({
      x: random() * 1800 - 100,
      y: 70 + random() * 260,
      scale: 0.55 + random() * 0.8,
      speed: 2 + random() * 5.5,
      alpha: 0.5 + random() * 0.45
    });
  }
  const stars = [];
  if (theme.night || key.includes('dusk')) {
    for (let i = 0; i < 80; i += 1) {
      stars.push({
        x: random() * WORLD_W,
        y: 20 + random() * 500,
        r: 0.6 + random() * 1.5,
        phase: random() * TAU,
        speed: 0.5 + random()
      });
    }
  }
  const fireflies = [];
  if (theme.night || key.includes('dusk')) {
    for (let i = 0; i < 24; i += 1) {
      fireflies.push({
        x: 30 + random() * 1540,
        y: 420 + random() * 360,
        phase: random() * TAU,
        drift: 12 + random() * 22,
        r: 1.2 + random() * 1.8
      });
    }
  }
  const trees = [];
  const treeSpots = [
    [65, 0.85], [330, 0.58], [560, 0.7], [760, 0.5], [1515, 0.7], [1380, 0.5]
  ];
  for (const [x, s] of treeSpots) {
    trees.push({ x, scale: s, phase: random() * TAU });
  }
  const grass = [];
  for (let i = 0; i < 54; i += 1) {
    grass.push({
      x: random() * WORLD_W,
      h: 6 + random() * 14,
      lean: -5 + random() * 10,
      tone: random(),
      layer: random() > 0.45 ? 1 : 0
    });
  }
  const blooms = [];
  for (let i = 0; i < 18; i += 1) {
    blooms.push({
      x: random() * WORLD_W,
      y: GROUND_Y + 2 + random() * 11,
      r: 2 + random() * 3,
      color: random() > 0.5 ? 'alt' : 'main',
      stem: 5 + random() * 12
    });
  }
  const pebbles = [];
  for (let i = 0; i < 22; i += 1) {
    pebbles.push({
      x: random() * WORLD_W,
      y: GROUND_Y + 24 + random() * 80,
      w: 3 + random() * 9,
      h: 2 + random() * 4,
      alpha: 0.1 + random() * 0.15
    });
  }
  const decor = { clouds, stars, fireflies, trees, grass, blooms, pebbles };
  decorCache.set(key, decor);
  return decor;
}

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCloud(ctx, x, y, scale, alpha, palette) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = palette.cloudShade;
  ctx.beginPath();
  ctx.ellipse(2, 26, 104, 23, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = palette.cloud;
  ctx.beginPath();
  ctx.ellipse(-55, 8, 38, 28, 0, 0, TAU);
  ctx.ellipse(-18, -4, 48, 38, 0, 0, TAU);
  ctx.ellipse(30, 4, 55, 34, 0, 0, TAU);
  ctx.ellipse(76, 18, 34, 22, 0, 0, TAU);
  ctx.ellipse(4, 27, 82, 21, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha *= 0.35;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-25, -16, 34, 14, -0.18, 0, TAU);
  ctx.ellipse(26, -8, 38, 14, -0.1, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawHills(ctx, palette, variant = 0) {
  // Far, airy ridge.
  ctx.fillStyle = palette.hillFar;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(-40, GROUND_Y);
  ctx.bezierCurveTo(130, 600 - variant * 6, 320, 650, 500, 620);
  ctx.bezierCurveTo(690, 585, 800, 660, 990, 640);
  ctx.bezierCurveTo(1190, 615, 1320, 545, 1640, 625);
  ctx.lineTo(1640, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Middle ridge.
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = palette.hillMid;
  ctx.beginPath();
  ctx.moveTo(-40, GROUND_Y);
  ctx.bezierCurveTo(100, 705, 260, 655, 390, 678);
  ctx.bezierCurveTo(545, 705, 620, 615, 790, 642);
  ctx.bezierCurveTo(940, 667, 1050, 705, 1210, 655);
  ctx.bezierCurveTo(1370, 605, 1480, 690, 1650, 672);
  ctx.lineTo(1650, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Near ridge, darker.
  ctx.fillStyle = palette.hillNear;
  ctx.beginPath();
  ctx.moveTo(-40, GROUND_Y);
  ctx.bezierCurveTo(90, 745, 250, 702, 390, 728);
  ctx.bezierCurveTo(550, 758, 720, 695, 900, 725);
  ctx.bezierCurveTo(1130, 765, 1290, 710, 1650, 742);
  ctx.lineTo(1650, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawTree(ctx, x, baseY, scale, palette, phase, t, dark = false) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  const sway = Math.sin(t * 0.0007 + phase) * 1.6;

  ctx.strokeStyle = palette.trunk;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(1, -26, sway, -48);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(-14, -44);
  ctx.moveTo(2, -40);
  ctx.lineTo(17, -54);
  ctx.stroke();

  ctx.fillStyle = dark ? palette.treeDark : palette.treeMid;
  ctx.globalAlpha = 0.92;
  const blobs = [
    [-23, -62, 25], [3, -78, 30], [28, -60, 22], [-5, -50, 24], [18, -86, 18]
  ];
  ctx.beginPath();
  for (const [bx, by, br] of blobs) {
    ctx.moveTo(bx + br + sway, by);
    ctx.arc(bx + sway, by, br, 0, TAU);
  }
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = palette.treeFar;
  ctx.beginPath();
  ctx.ellipse(-12 + sway, -84, 14, 9, -0.4, 0, TAU);
  ctx.ellipse(22 + sway, -70, 9, 6, -0.3, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawBalloon(ctx, x, y, scale, palette, t) {
  const drift = Math.sin(t * 0.00014) * 24;
  const bob = Math.sin(t * 0.0011 + 1.2) * 5;
  ctx.save();
  ctx.translate(x + drift, y + bob);
  ctx.scale(scale, scale);
  ctx.globalAlpha = palette.night ? 0.65 : 0.82;

  // Ropes and basket.
  ctx.strokeStyle = 'rgba(84, 56, 36, 0.75)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-24, 20);
  ctx.lineTo(-14, 54);
  ctx.moveTo(24, 20);
  ctx.lineTo(14, 54);
  ctx.stroke();

  // Envelope.
  ctx.fillStyle = palette.night ? '#a95b55' : '#d75a42';
  ctx.strokeStyle = '#5a3423';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, -24, 44, 55, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -24, 42, 53, 0, 0, TAU);
  ctx.clip();
  ctx.fillStyle = palette.night ? '#e9c99d' : '#ffedc1';
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.ellipse(i * 18, -24, 7.5, 58, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.24)';
  ctx.beginPath();
  ctx.ellipse(-16, -48, 18, 26, -0.35, 0, TAU);
  ctx.fill();
  ctx.restore();

  // A hint of a passenger.
  ctx.fillStyle = '#709d45';
  ctx.strokeStyle = '#3f4b2a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 40, 9, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#78ad49';
  ctx.beginPath();
  ctx.moveTo(-7, 34);
  ctx.lineTo(-12, 27);
  ctx.lineTo(-2, 31);
  ctx.moveTo(7, 34);
  ctx.lineTo(12, 27);
  ctx.lineTo(2, 31);
  ctx.fill();
  ctx.fillStyle = '#9bcf5a';
  ctx.beginPath();
  ctx.ellipse(0, 43, 4.6, 3.5, 0, 0, TAU);
  ctx.fill();

  // Wicker basket.
  ctx.fillStyle = '#8f6132';
  ctx.strokeStyle = '#4b301b';
  ctx.lineWidth = 2;
  roundRect(ctx, -17, 48, 34, 20, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(64, 39, 20, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-12, 54);
  ctx.lineTo(12, 54);
  ctx.moveTo(-10, 61);
  ctx.lineTo(10, 61);
  ctx.stroke();

  if (palette.night) {
    ctx.fillStyle = 'rgba(255, 211, 113, 0.85)';
    ctx.beginPath();
    ctx.arc(0, 44, 3, 0, TAU);
    ctx.fill();
    const glow = ctx.createRadialGradient(0, 44, 0, 0, 44, 32);
    glow.addColorStop(0, 'rgba(255, 217, 132, 0.4)');
    glow.addColorStop(1, 'rgba(255, 217, 132, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-35, 10, 70, 70);
  }
  ctx.restore();
}

function drawWindmill(ctx, x, baseY, scale, palette, t) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  ctx.globalAlpha = palette.night ? 0.5 : 0.55;
  const body = palette.treeDark;
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-13, 0);
  ctx.lineTo(-8, -58);
  ctx.lineTo(8, -58);
  ctx.lineTo(13, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-11, -58);
  ctx.lineTo(0, -74);
  ctx.lineTo(11, -58);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.night ? 'rgba(255, 211, 122, 0.8)' : 'rgba(255, 242, 190, 0.45)';
  ctx.fillRect(-3, -41, 6, 8);
  ctx.fillRect(-3, -22, 6, 7);

  // Sails.
  ctx.save();
  ctx.translate(0, -66);
  ctx.rotate(t * 0.00012);
  ctx.strokeStyle = body;
  ctx.fillStyle = palette.night ? 'rgba(133, 156, 146, 0.38)' : 'rgba(233, 220, 178, 0.48)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const a = (i * Math.PI) / 2;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, -10);
    ctx.lineTo(12, -10);
    ctx.lineTo(12, -34);
    ctx.lineTo(2, -34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}

function drawBush(ctx, x, baseY, scale, palette, t, phase = 0) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  const sway = Math.sin(t * 0.001 + phase) * 1.2;
  ctx.fillStyle = palette.night ? '#173b2b' : '#3f7d45';
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.ellipse(-28 + sway, -14, 26, 20, -0.2, 0, TAU);
  ctx.ellipse(0 + sway, -24, 32, 26, 0.05, 0, TAU);
  ctx.ellipse(31 + sway, -12, 24, 18, 0.2, 0, TAU);
  ctx.ellipse(4 + sway, -8, 38, 18, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = palette.grassLight;
  ctx.beginPath();
  ctx.ellipse(-8 + sway, -32, 17, 9, -0.35, 0, TAU);
  ctx.ellipse(24 + sway, -20, 10, 7, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}


function drawSkyDetails(ctx, palette, decor, t, themeKey) {
  // Sun or moon.
  const sunX = 1220;
  const sunY = palette.night ? 160 : 205;
  const sunR = palette.night ? 54 : 76;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 4.6);
  glow.addColorStop(0, palette.sunGlow);
  glow.addColorStop(0.55, palette.sunGlow);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 5, sunY - sunR * 5, sunR * 10, sunR * 10);

  ctx.fillStyle = palette.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, TAU);
  ctx.fill();

  if (palette.night) {
    // Moon craters.
    ctx.fillStyle = 'rgba(170, 185, 170, 0.18)';
    ctx.beginPath();
    ctx.arc(sunX - 14, sunY - 12, 13, 0, TAU);
    ctx.arc(sunX + 17, sunY + 11, 9, 0, TAU);
    ctx.arc(sunX - 3, sunY + 24, 6, 0, TAU);
    ctx.fill();
    // Tiny warm village lights on the far hill.
    for (let i = 0; i < 8; i += 1) {
      const lx = 90 + i * 28 + (i % 3) * 16;
      const ly = 692 - (i % 4) * 7;
      ctx.fillStyle = `rgba(255, 211, 124, ${0.35 + (i % 3) * 0.12})`;
      ctx.beginPath();
      ctx.arc(lx, ly, 1.8, 0, TAU);
      ctx.fill();
    }
  } else {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#fff8d8';
    ctx.beginPath();
    ctx.ellipse(sunX - 12, sunY - 16, sunR * 0.55, sunR * 0.38, -0.4, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Stars for night.
  if (decor.stars.length) {
    ctx.save();
    for (const s of decor.stars) {
      const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.002 * s.speed + s.phase));
      ctx.fillStyle = `rgba(240, 248, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // A piggy scout balloon drifting through the valley.
  // Drawn after the clouds so its stripes stay crisp against the sky.

  // Drifting clouds.
  for (const c of decor.clouds) {
    const x = ((c.x + t * 0.004 * c.speed) % 1900) - 140;
    drawCloud(ctx, x, c.y, c.scale, c.alpha * 0.85, palette);
  }

  drawBalloon(ctx, 918, 282, 0.98, palette, t);

  // Distant birds in V formation.
  if (!palette.night) {
    ctx.save();
    ctx.strokeStyle = palette.remoteBirds;
    ctx.globalAlpha = 0.38;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    const flockX = ((t * 0.01) % 1900) - 100;
    for (let i = 0; i < 5; i += 1) {
      const bx = 340 + flockX * 0.15 + i * 16;
      const by = 150 + Math.abs(i - 2) * 9;
      ctx.beginPath();
      ctx.moveTo(bx - 7, by);
      ctx.quadraticCurveTo(bx - 2, by - 5, bx, by);
      ctx.quadraticCurveTo(bx + 2, by - 5, bx + 7, by);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Warm horizon haze.
  const haze = ctx.createLinearGradient(0, 470, 0, GROUND_Y);
  haze.addColorStop(0, 'rgba(255,255,255,0)');
  haze.addColorStop(0.72, palette.haze);
  haze.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 470, WORLD_W, 330);
}

function drawGround(ctx, palette, decor, t) {
  // Dirt body.
  const dirt = ctx.createLinearGradient(0, GROUND_Y, 0, WORLD_H);
  dirt.addColorStop(0, palette.dirtLight);
  dirt.addColorStop(0.22, palette.dirt);
  dirt.addColorStop(1, palette.dirtDark);
  ctx.fillStyle = dirt;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 8);
  for (let x = 0; x <= WORLD_W; x += 40) {
    ctx.lineTo(x, GROUND_Y + 7 + Math.sin(x * 0.024) * 2.1);
  }
  ctx.lineTo(WORLD_W, WORLD_H);
  ctx.lineTo(0, WORLD_H);
  ctx.closePath();
  ctx.fill();

  // Grass strip.
  const grass = ctx.createLinearGradient(0, GROUND_Y - 3, 0, GROUND_Y + 36);
  grass.addColorStop(0, palette.grassLight);
  grass.addColorStop(0.38, palette.grass);
  grass.addColorStop(1, palette.grassDark);
  ctx.fillStyle = grass;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 18);
  for (let x = 0; x <= WORLD_W; x += 28) {
    ctx.lineTo(x, GROUND_Y - 2 + Math.sin(x * 0.04) * 2.6);
  }
  ctx.lineTo(WORLD_W, GROUND_Y + 28);
  for (let x = WORLD_W; x >= 0; x -= 28) {
    ctx.lineTo(x, GROUND_Y + 20 + Math.sin(x * 0.05) * 4);
  }
  ctx.closePath();
  ctx.fill();

  // Dirt strata and pebbles.
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = palette.dirtDark;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const y = 835 + i * 17;
    ctx.beginPath();
    for (let x = -20; x <= WORLD_W + 40; x += 42) {
      const yy = y + Math.sin(x * 0.01 + i * 1.7) * 4;
      if (x === -20) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  for (const p of decor.pebbles) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = palette.dirtDark;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.w, p.h, 0.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // Grass blades along the lip.
  for (const g of decor.grass) {
    if (g.layer === 0) continue;
    const base = GROUND_Y - 1;
    ctx.strokeStyle = g.tone > 0.5 ? palette.grassLight : palette.grassDark;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(g.x, base + 3);
    ctx.quadraticCurveTo(g.x + g.lean * 0.3, base - g.h * 0.6, g.x + g.lean, base - g.h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Little flowers.
  for (const b of decor.blooms) {
    ctx.strokeStyle = palette.grassDark;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.quadraticCurveTo(b.x + 2, b.y - b.stem * 0.6, b.x + (b.x % 2 ? 3 : -3), b.y - b.stem);
    ctx.stroke();
    ctx.fillStyle = b.color === 'alt' ? palette.bloomAlt : palette.bloom;
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * TAU;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(a) * b.r, b.y - b.stem + Math.sin(a) * b.r, b.r * 0.8, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#e8a73c';
    ctx.beginPath();
    ctx.arc(b.x, b.y - b.stem, b.r * 0.55, 0, TAU);
    ctx.fill();
  }

  // Warm rim light on the grass, especially at sunset.
  if (palette.night) {
    ctx.fillStyle = 'rgba(120, 173, 160, 0.06)';
    ctx.fillRect(0, GROUND_Y, WORLD_W, WORLD_H - GROUND_Y);
  }
}

function drawFireflies(ctx, decor, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const f of decor.fireflies) {
    const a = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 0.0022 + f.phase));
    const x = f.x + Math.sin(t * 0.00045 + f.phase) * f.drift;
    const y = f.y + Math.cos(t * 0.0006 + f.phase * 1.7) * f.drift * 0.45;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 18);
    glow.addColorStop(0, `rgba(255, 237, 150, ${a * 0.8})`);
    glow.addColorStop(1, 'rgba(255, 229, 130, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 18, y - 18, 36, 36);
    ctx.fillStyle = `rgba(255, 250, 200, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, f.r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawBackground(ctx, themeKey, t, options = {}) {
  const palette = PALETTES[themeKey] || PALETTES.day;
  const decor = getDecor(options.seed || themeKey, palette);

  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y + 30);
  sky.addColorStop(0, palette.skyTop);
  sky.addColorStop(0.58, palette.skyMid);
  sky.addColorStop(1, palette.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  drawSkyDetails(ctx, palette, decor, t, themeKey);
  drawHills(ctx, palette);
  drawWindmill(ctx, 690, 731, 0.78, palette, t);
  drawFireflies(ctx, decor, t);

  // Background tree clusters, kept muted so they never fight the fortresses.
  ctx.save();
  ctx.globalAlpha = 0.72;
  for (const tree of decor.trees) {
    if (tree.x > 900 && tree.x < 1300) continue;
    drawTree(ctx, tree.x, 738 + (tree.x % 3) * 9, tree.scale * 0.9, palette, tree.phase, t, true);
  }
  ctx.restore();

  drawBush(ctx, 492, 797, 1.05, palette, t, 0.4);
  drawBush(ctx, 812, 797, 0.82, palette, t, 2.1);
  drawBush(ctx, 1535, 797, 0.94, palette, t, 4.4);

  drawGround(ctx, palette, decor, t);

  // A soft vignette gives the stage a storybook feel.
  if (!options.noVignette) {
    const vig = ctx.createRadialGradient(WORLD_W / 2, WORLD_H * 0.45, 280, WORLD_W / 2, WORLD_H * 0.52, 980);
    vig.addColorStop(0, 'rgba(10, 16, 22, 0)');
    vig.addColorStop(0.72, 'rgba(10, 16, 22, 0.04)');
    vig.addColorStop(1, palette.night ? 'rgba(4, 8, 16, 0.32)' : 'rgba(37, 24, 14, 0.18)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
  ctx.restore();
}

export function drawForeground(ctx, themeKey, t, options = {}) {
  const palette = PALETTES[themeKey] || PALETTES.day;
  const decor = getDecor(options.seed || themeKey, palette);
  ctx.save();
  // Low, dark grass silhouettes at the very front.
  ctx.globalAlpha = options.alpha ?? 0.72;
  ctx.fillStyle = palette.night ? '#12251f' : palette.grassDark;
  ctx.beginPath();
  ctx.moveTo(0, WORLD_H);
  ctx.lineTo(0, 872);
  for (let x = 0; x <= WORLD_W; x += 24) {
    const g = decor.grass[(x / 24) % decor.grass.length];
    ctx.quadraticCurveTo(x + 10, 846 + (g ? g.h : 4), x + 24, 872);
  }
  ctx.lineTo(WORLD_W, WORLD_H);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = palette.night ? '#1b332b' : palette.grassDark;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 34; i += 1) {
    const x = (i * 57 + 11) % WORLD_W;
    const h = 12 + ((i * 17) % 24);
    const sway = Math.sin(t * 0.001 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(x, 896);
    ctx.quadraticCurveTo(x + sway, 896 - h * 0.6, x + sway * 2, 896 - h);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawVignetteFlash(ctx, flash) {
  if (flash <= 0.001) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = `rgba(255, 238, 188, ${Math.min(0.46, flash * 0.5)})`;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.restore();
}

function drawSlingWood(ctx, sling) {
  const { x, baseY, anchorY = sling.y, scale = 1 } = sling;
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  // trunk up to the fork
  const topY = anchorY - baseY; // negative
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Base shadow + root.
  ctx.fillStyle = 'rgba(36, 24, 14, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 38, 11, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3a2417';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.moveTo(-4, 2);
  ctx.bezierCurveTo(-2, -26, 2, -84, -2, -132);
  ctx.stroke();
  ctx.strokeStyle = '#84552f';
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.bezierCurveTo(-2, -26, 2, -84, -2, -132);
  ctx.stroke();
  // fork arms
  for (const sign of [-1, 1]) {
    ctx.strokeStyle = '#3a2417';
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(-2, -126);
    ctx.quadraticCurveTo(sign * 25, -170, sign * 30, -218);
    ctx.stroke();
    ctx.strokeStyle = '#956137';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-2, -130);
    ctx.quadraticCurveTo(sign * 21, -172, sign * 26, -216);
    ctx.stroke();
  }
  // Leather wraps.
  ctx.strokeStyle = '#c74831';
  ctx.lineWidth = 7;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-8 + i * 5, -146 - i * 5);
    ctx.lineTo(7 + i * 5, -151 - i * 5);
    ctx.stroke();
  }
  // Knots and grain.
  ctx.strokeStyle = 'rgba(70, 38, 20, 0.5)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(-2, -54, 4, 9, 0.2, 0, TAU);
  ctx.ellipse(1, -92, 3, 6, -0.3, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

export function getSlingPoints(sling) {
  const { x, baseY, anchorY = sling.y, scale = 1 } = sling;
  return {
    backFork: { x: x + -28 * scale, y: baseY + (anchorY - baseY - 28) * scale },
    frontFork: { x: x + 28 * scale, y: baseY + (anchorY - baseY - 22) * scale },
    pouch: { x, y: anchorY }
  };
}

function drawBand(ctx, from, to, color, width, sag = 0) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(54, 26, 20, 0.78)';
  ctx.lineWidth = width + 5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo((from.x + to.x) / 2, (from.y + to.y) / 2 + sag, to.x, to.y);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo((from.x + to.x) / 2, (from.y + to.y) / 2 + sag, to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

export function drawSlingPouch(ctx, target) {
  if (!target) return;
  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.fillStyle = '#5b3520';
  roundRect(ctx, -14, -23, 28, 46, 9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(49, 27, 16, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  roundRect(ctx, -10, -19, 7, 36, 4);
  ctx.fill();
  ctx.restore();
}

export function drawSlingBack(ctx, sling, birdPoint) {
  drawSlingWood(ctx, sling);
  const pts = getSlingPoints(sling);
  const scale = sling.scale || 1;
  const target = birdPoint || { x: sling.x, y: sling.anchorY + 40 * scale };
  drawBand(ctx, pts.backFork, target, '#a83b2d', 10, 4);
}

export function drawSlingFront(ctx, sling, birdPoint, loaded = true) {
  const pts = getSlingPoints(sling);
  const scale = sling.scale || 1;
  const target = birdPoint || { x: sling.x, y: sling.anchorY + 40 * scale };
  drawBand(ctx, target, pts.frontFork, '#c9523d', 12, -2);
}

export function drawSlingIdle(ctx, x = 252, baseY = 790, anchorY = 596, scale = 1) {
  const sling = { x, baseY, anchorY, scale };
  drawSlingBack(ctx, sling, null);
  drawSlingFront(ctx, sling, null, false);
}

function colorGradient(ctx, x0, y0, x1, y1, color, light, dark) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, light);
  g.addColorStop(0.45, color);
  g.addColorStop(1, dark);
  return g;
}

function drawBirdEye(ctx, x, y, r, pupilX, pupilY, blink) {
  if (blink > 0.7) {
    ctx.strokeStyle = '#2a1b18';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y);
    ctx.quadraticCurveTo(x, y + 2, x + r * 0.7, y);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = '#2a1b18';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.15, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff9e8';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.83, r * 0.98, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2a211e';
  ctx.beginPath();
  ctx.ellipse(x + pupilX, y + pupilY, r * 0.37, r * 0.48, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(x + pupilX - r * 0.15, y + pupilY - r * 0.2, r * 0.13, 0, TAU);
  ctx.fill();
}

export function drawBird(ctx, type, x, y, r, angle = 0, options = {}) {
  const t = options.time || 0;
  const blink = options.blink ?? (0.5 + 0.5 * Math.sin(t * 0.001 + x * 0.1));
  const isBlink = blink > 0.965;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const s = r / 30;
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const outline = '#35201a';
  const lw = 2.4;

  if (type === 'red') {
    // Tail feathers.
    ctx.fillStyle = outline;
    ctx.beginPath();
    ctx.moveTo(-18, -5);
    ctx.lineTo(-46, -25);
    ctx.lineTo(-38, -3);
    ctx.lineTo(-50, 12);
    ctx.lineTo(-20, 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9f2f28';
    ctx.beginPath();
    ctx.moveTo(-21, -2);
    ctx.lineTo(-39, -17);
    ctx.lineTo(-32, -1);
    ctx.lineTo(-41, 8);
    ctx.lineTo(-22, 11);
    ctx.closePath();
    ctx.fill();

    // Body.
    ctx.fillStyle = colorGradient(ctx, -20, -30, 24, 30, '#dc4a3d', '#ef6d58', '#ae3229');
    ctx.strokeStyle = outline;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 31, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Head tuft.
    ctx.fillStyle = '#9f2f28';
    ctx.strokeStyle = outline;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(-9, -28);
    ctx.quadraticCurveTo(-14, -40, -2, -35);
    ctx.quadraticCurveTo(1, -44, 8, -32);
    ctx.quadraticCurveTo(14, -38, 15, -27);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Belly.
    const belly = ctx.createRadialGradient(-3, 15, 2, 0, 14, 22);
    belly.addColorStop(0, '#fff4d8');
    belly.addColorStop(1, '#f0c597');
    ctx.fillStyle = belly;
    ctx.beginPath();
    ctx.ellipse(1, 14, 20, 17, 0.04, 0, TAU);
    ctx.fill();

    // Cheek.
    ctx.fillStyle = 'rgba(255, 143, 110, 0.5)';
    ctx.beginPath();
    ctx.ellipse(19, 11, 7, 5, 0.2, 0, TAU);
    ctx.fill();

    // Eyes.
    drawBirdEye(ctx, -10, -7, 7.1, 1.5, 0.8, isBlink ? 1 : 0);
    drawBirdEye(ctx, 9, -7, 6.4, 1.3, 0.8, isBlink ? 1 : 0);

    // Brows.
    ctx.strokeStyle = outline;
    ctx.lineWidth = 4.3;
    ctx.beginPath();
    ctx.moveTo(-21, -20);
    ctx.lineTo(-3, -14);
    ctx.moveTo(20, -19);
    ctx.lineTo(4, -14);
    ctx.stroke();

    // Beak.
    ctx.fillStyle = '#f6a727';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(11, 3);
    ctx.lineTo(29, 7);
    ctx.lineTo(13, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e38518';
    ctx.beginPath();
    ctx.moveTo(13, 13);
    ctx.lineTo(29, 7);
    ctx.lineTo(17, 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 229, 153, 0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(16, 5);
    ctx.lineTo(23, 7);
    ctx.stroke();

    // Feet when perched.
    if (options.perched) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, 28);
      ctx.lineTo(-9, 35);
      ctx.moveTo(6, 28);
      ctx.lineTo(7, 35);
      ctx.stroke();
    }
  } else if (type === 'chuck') {
    // Tail.
    ctx.fillStyle = outline;
    ctx.beginPath();
    ctx.moveTo(-22, -6);
    ctx.lineTo(-46, -18);
    ctx.lineTo(-37, 1);
    ctx.lineTo(-46, 13);
    ctx.lineTo(-20, 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e3ad24';
    ctx.beginPath();
    ctx.moveTo(-23, -3);
    ctx.lineTo(-39, -12);
    ctx.lineTo(-32, 1);
    ctx.lineTo(-39, 9);
    ctx.lineTo(-22, 11);
    ctx.closePath();
    ctx.fill();

    // Pointy little body.
    ctx.fillStyle = colorGradient(ctx, -18, -24, 24, 24, '#ffd43b', '#ffe77a', '#e6ad1e');
    ctx.strokeStyle = outline;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(-26, -17);
    ctx.quadraticCurveTo(-8, -34, 15, -23);
    ctx.quadraticCurveTo(33, -9, 22, 10);
    ctx.quadraticCurveTo(10, 31, -16, 25);
    ctx.quadraticCurveTo(-31, 17, -26, -17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Spiky crest.
    ctx.fillStyle = '#e3ad24';
    ctx.strokeStyle = outline;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(-8, -25);
    ctx.lineTo(-16, -40);
    ctx.lineTo(1, -30);
    ctx.lineTo(6, -40);
    ctx.lineTo(14, -25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Belly.
    ctx.fillStyle = '#fff0b8';
    ctx.beginPath();
    ctx.ellipse(0, 13, 17, 12, 0.1, 0, TAU);
    ctx.fill();

    drawBirdEye(ctx, -8, -7, 6.4, 1.4, 0.7, isBlink ? 1 : 0);
    drawBirdEye(ctx, 8, -5, 5.6, 1.2, 0.7, isBlink ? 1 : 0);

    ctx.strokeStyle = outline;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, -18);
    ctx.lineTo(-2, -13);
    ctx.moveTo(17, -16);
    ctx.lineTo(3, -12);
    ctx.stroke();

    // Beak.
    ctx.fillStyle = '#f39a27';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 4);
    ctx.lineTo(27, 8);
    ctx.lineTo(10, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (options.perched) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-7, 27);
      ctx.lineTo(-8, 34);
      ctx.moveTo(6, 26);
      ctx.lineTo(7, 33);
      ctx.stroke();
    }
  } else if (type === 'bomb') {
    // Tail.
    ctx.fillStyle = outline;
    ctx.beginPath();
    ctx.moveTo(-22, 2);
    ctx.lineTo(-45, -8);
    ctx.lineTo(-41, 7);
    ctx.lineTo(-48, 20);
    ctx.lineTo(-21, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#25262f';
    ctx.beginPath();
    ctx.moveTo(-23, 5);
    ctx.lineTo(-39, -1);
    ctx.lineTo(-34, 9);
    ctx.lineTo(-40, 16);
    ctx.lineTo(-22, 14);
    ctx.closePath();
    ctx.fill();

    // Fuse.
    ctx.strokeStyle = '#d5c08a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(3, -30);
    ctx.bezierCurveTo(10, -46, 22, -42, 20, -53);
    ctx.stroke();
    if (options.fuseLit) {
      const flicker = 0.7 + 0.3 * Math.sin(t * 0.026);
      ctx.fillStyle = `rgba(255, 210, 72, ${flicker})`;
      ctx.beginPath();
      ctx.arc(21, -55, 6.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 117, 42, 0.85)';
      ctx.beginPath();
      ctx.arc(21, -55, 3.6, 0, TAU);
      ctx.fill();
    }

    // Body.
    ctx.fillStyle = colorGradient(ctx, -22, -28, 22, 27, '#3d3f4b', '#5e6170', '#24252d');
    ctx.strokeStyle = outline;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 30, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Belly patch.
    ctx.fillStyle = '#727788';
    ctx.beginPath();
    ctx.ellipse(3, 15, 17, 13, 0.03, 0, TAU);
    ctx.fill();

    drawBirdEye(ctx, -10, -6, 7, 1.5, 0.8, isBlink ? 1 : 0);
    drawBirdEye(ctx, 8, -6, 6.4, 1.3, 0.8, isBlink ? 1 : 0);

    ctx.strokeStyle = '#1c1d23';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(-21, -19);
    ctx.lineTo(-3, -14);
    ctx.moveTo(19, -18);
    ctx.lineTo(4, -14);
    ctx.stroke();

    // Beak.
    ctx.fillStyle = '#f2a431';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(10, 3);
    ctx.lineTo(29, 7);
    ctx.lineTo(12, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Angry little fuse cap.
    ctx.fillStyle = '#23242b';
    ctx.beginPath();
    ctx.ellipse(4, -29, 8, 4, 0, 0, TAU);
    ctx.fill();

    if (options.perched) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, 27);
      ctx.lineTo(-9, 34);
      ctx.moveTo(7, 27);
      ctx.lineTo(8, 34);
      ctx.stroke();
    }
  } else {
    // Blues.
    ctx.fillStyle = outline;
    ctx.beginPath();
    ctx.moveTo(-18, -2);
    ctx.lineTo(-36, -16);
    ctx.lineTo(-30, 1);
    ctx.lineTo(-35, 12);
    ctx.lineTo(-17, 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2b7da5';
    ctx.beginPath();
    ctx.moveTo(-19, 0);
    ctx.lineTo(-31, -9);
    ctx.lineTo(-26, 2);
    ctx.lineTo(-30, 8);
    ctx.lineTo(-18, 9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = colorGradient(ctx, -18, -25, 20, 24, '#55b9e9', '#8cdcf7', '#328db4');
    ctx.strokeStyle = outline;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(0, 0, 27, 28, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Small crest.
    ctx.fillStyle = '#2b7da5';
    ctx.strokeStyle = outline;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(-6, -26);
    ctx.lineTo(-12, -38);
    ctx.lineTo(1, -29);
    ctx.lineTo(6, -37);
    ctx.lineTo(11, -25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dff9ff';
    ctx.beginPath();
    ctx.ellipse(1, 14, 16, 13, 0, 0, TAU);
    ctx.fill();

    drawBirdEye(ctx, -8, -7, 6.3, 1.3, 0.8, isBlink ? 1 : 0);
    drawBirdEye(ctx, 8, -7, 5.8, 1.2, 0.8, isBlink ? 1 : 0);

    ctx.strokeStyle = outline;
    ctx.lineWidth = 3.7;
    ctx.beginPath();
    ctx.moveTo(-18, -18);
    ctx.lineTo(-2, -13);
    ctx.moveTo(17, -17);
    ctx.lineTo(3, -13);
    ctx.stroke();

    ctx.fillStyle = '#f5a02a';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(9, 4);
    ctx.lineTo(25, 8);
    ctx.lineTo(11, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (options.perched) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-7, 25);
      ctx.lineTo(-8, 32);
      ctx.moveTo(6, 25);
      ctx.lineTo(7, 32);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawPig(ctx, x, y, r, options = {}) {
  const t = options.time || 0;
  const isKing = options.kind === 'king';
  const blink = options.blink ?? (0.5 + 0.5 * Math.sin(t * 0.0012 + x * 0.2));
  const isBlink = blink > 0.97;
  const damage = options.damage || 0;
  const squash = options.squash || 0;
  ctx.save();
  ctx.translate(x, y + squash * r * 0.12);
  ctx.scale(1 + squash * 0.08, 1 - squash * 0.11);
  const s = r / 30;
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  const outline = '#2a3421';

  // Ears.
  ctx.fillStyle = '#6ba63c';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.1;
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sign * 13, -24);
    ctx.lineTo(sign * (isKing ? 30 : 24), -38);
    ctx.lineTo(sign * 25, -17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8fc455';
    ctx.beginPath();
    ctx.ellipse(sign * 17, -26, 5, 3.5, sign * 0.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#6ba63c';
  }

  // Royal cape sits behind the body.
  if (isKing) {
    ctx.fillStyle = '#b33737';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-24, 7);
    ctx.quadraticCurveTo(-38, 24, -32, 38);
    ctx.lineTo(32, 38);
    ctx.quadraticCurveTo(38, 24, 24, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 212, 165, 0.2)';
    ctx.beginPath();
    ctx.ellipse(-18, 22, 5, 12, 0.3, 0, TAU);
    ctx.fill();
  }

  // Body.
  const bodyGrad = ctx.createRadialGradient(-9, -11, 3, 0, 0, 36);
  bodyGrad.addColorStop(0, '#a9d867');
  bodyGrad.addColorStop(0.55, '#7fbc49');
  bodyGrad.addColorStop(1, '#5e9a35');
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.ellipse(0, 0, isKing ? 33 : 29, isKing ? 33 : 31, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();

  // Soft top highlight.
  ctx.fillStyle = 'rgba(255, 255, 220, 0.18)';
  ctx.beginPath();
  ctx.ellipse(-8, -12, 11, 7, -0.5, 0, TAU);
  ctx.fill();

  // Snout.
  ctx.fillStyle = '#9ed45c';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(1, 8, 14, 11, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#47632b';
  ctx.beginPath();
  ctx.ellipse(-5, 9, 2.6, 3.8, 0, 0, TAU);
  ctx.ellipse(7, 9, 2.6, 3.8, 0, 0, TAU);
  ctx.fill();

  // Eyes.
  const eyeY = -9;
  for (const [ex, er] of [[-9, 6.2], [9, 6.2]]) {
    if (isBlink) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex - 4, eyeY);
      ctx.quadraticCurveTo(ex, eyeY + 2.5, ex + 4, eyeY);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fdf7df';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, er, er * 1.12, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#28321f';
      ctx.beginPath();
      ctx.ellipse(ex + 1.3, eyeY + 1, 2.4, 3.1, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(ex + 0.6, eyeY - 1.2, 1.1, 0, TAU);
      ctx.fill();
    }
  }

  // Eyebrows appear as the pig gets cross.
  if (damage > 0.2) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-16, -20);
    ctx.lineTo(-4, -16);
    ctx.moveTo(16, -20);
    ctx.lineTo(4, -16);
    ctx.stroke();
  }

  // Mouth.
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (damage > 0.55) {
    ctx.arc(0, 20, 5, Math.PI, TAU);
  } else {
    ctx.arc(0, 16, 5, 0.18, Math.PI - 0.18);
  }
  ctx.stroke();
  if (!isBlink) {
    ctx.fillStyle = '#fffbe8';
    ctx.beginPath();
    ctx.moveTo(-2, 23);
    ctx.lineTo(4, 23);
    ctx.lineTo(3, 27);
    ctx.lineTo(-1, 27);
    ctx.closePath();
    ctx.fill();
  }

  // Cheeks.
  ctx.fillStyle = 'rgba(224, 110, 100, 0.22)';
  ctx.beginPath();
  ctx.ellipse(-19, 9, 6, 4, 0.1, 0, TAU);
  ctx.ellipse(20, 9, 6, 4, -0.1, 0, TAU);
  ctx.fill();

  // Damage scratches.
  if (damage > 0.1) {
    ctx.save();
    ctx.strokeStyle = `rgba(83, 38, 28, ${0.2 + damage * 0.4})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-20 + damage * 5, -23);
    ctx.lineTo(-15 + damage * 2, -17);
    ctx.moveTo(-17 + damage * 3, -19);
    ctx.lineTo(-21 + damage * 5, -12);
    if (damage > 0.55) {
      ctx.moveTo(22, -2);
      ctx.lineTo(16, 3);
      ctx.lineTo(21, 7);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (isKing) {
    // Gold crown.
    ctx.translate(0, -28);
    ctx.fillStyle = '#f7c945';
    ctx.strokeStyle = '#53351d';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-22, -1);
    ctx.lineTo(-23, -19);
    ctx.lineTo(-11, -11);
    ctx.lineTo(0, -25);
    ctx.lineTo(11, -11);
    ctx.lineTo(23, -19);
    ctx.lineTo(22, -1);
    ctx.quadraticCurveTo(0, 6, -22, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#df8d2b';
    ctx.beginPath();
    ctx.ellipse(0, -7, 3.5, 4.5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff0ae';
    ctx.beginPath();
    ctx.arc(-15, -9, 2.4, 0, TAU);
    ctx.arc(15, -9, 2.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-17, -15);
    ctx.lineTo(-8, -10);
    ctx.stroke();
  }

  ctx.restore();
}

function blockSeed(id) {
  return ((id || 1) * 1103515245 + 12345) >>> 0;
}

function crackLines(id, w, h, seed) {
  const random = rng(blockSeed(id) + seed * 97);
  const lines = [];
  const count = 2 + Math.floor(random() * 2);
  for (let i = 0; i < count; i += 1) {
    const x0 = -w / 2 + random() * w;
    let x = x0;
    let y = -h / 2 + 2;
    const points = [[x, y]];
    const steps = 3 + Math.floor(random() * 3);
    for (let j = 0; j < steps; j += 1) {
      x += (random() - 0.5) * w * 0.35;
      y += h / steps;
      points.push([x, y]);
    }
    lines.push(points);
  }
  return lines;
}

export function drawBlock(ctx, block, options = {}) {
  const { x, y, w, h, angle, mat } = block;
  const damage = options.damage || 0;
  const id = options.id || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle || 0);

  if (mat === 'tnt') {
    ctx.fillStyle = 'rgba(25, 16, 12, 0.18)';
    roundRect(ctx, -w / 2 + 3, -h / 2 + 5, w, h, 6);
    ctx.fill();
    ctx.fillStyle = '#b93b32';
    ctx.strokeStyle = '#3b241c';
    ctx.lineWidth = 3;
    roundRect(ctx, -w / 2, -h / 2, w, h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#62251f';
    ctx.fillRect(-w / 2 + 3, -h / 2 + 11, w - 6, 10);
    ctx.fillStyle = '#f4c844';
    ctx.font = '800 17px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TNT', 0, 4);
    // Fuse.
    ctx.strokeStyle = '#3b241c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, -h / 2);
    ctx.quadraticCurveTo(15, -h / 2 - 14, 8, -h / 2 - 20);
    ctx.stroke();
    const flicker = 0.6 + 0.4 * Math.sin((options.time || 0) * 0.024 + id);
    ctx.fillStyle = `rgba(255, 207, 78, ${flicker})`;
    ctx.beginPath();
    ctx.arc(8, -h / 2 - 22, 4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(-w / 2 + 4, -h / 2 + 25, w - 8, 2);
    ctx.restore();
    return;
  }

  // Shadow within the block.
  ctx.fillStyle = 'rgba(25, 16, 12, 0.16)';
  roundRect(ctx, -w / 2 + 2, -h / 2 + 4, w, h, 5);
  ctx.fill();

  if (mat === 'ice') {
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, 'rgba(213, 249, 255, 0.93)');
    g.addColorStop(0.42, 'rgba(136, 216, 240, 0.88)');
    g.addColorStop(1, 'rgba(95, 177, 213, 0.91)');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#4f91ae';
    ctx.lineWidth = 2;
    roundRect(ctx, -w / 2, -h / 2, w, h, 4);
    ctx.fill();
    ctx.stroke();

    // Glassy facet highlights.
    ctx.save();
    roundRect(ctx, -w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 3);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 3, h / 2);
    ctx.lineTo(w / 2 - 8, -h / 2);
    ctx.lineTo(w / 2 - 2, -h / 2);
    ctx.lineTo(-w / 2 + 10, h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i += 1) {
      const bx = -w / 2 + 10 + i * 17;
      const by = h / 2 - 6 - i * 9;
      ctx.beginPath();
      ctx.arc(bx, by, 1.8, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 4, -h / 2 + 4);
    ctx.lineTo(-w / 2 + Math.min(28, w * 0.38), -h / 2 + 4);
    ctx.stroke();
  } else if (mat === 'stone') {
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, '#b9beb7');
    g.addColorStop(0.44, '#969d97');
    g.addColorStop(1, '#717a76');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#4e5551';
    ctx.lineWidth = 2.4;
    roundRect(ctx, -w / 2, -h / 2, w, h, 4);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    roundRect(ctx, -w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 3);
    ctx.clip();
    ctx.strokeStyle = 'rgba(63, 71, 67, 0.32)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 7, -h / 2 + 8);
    ctx.lineTo(-w / 2 + 23, -h / 2 + 15);
    ctx.lineTo(-w / 2 + 12, h / 2 - 5);
    ctx.moveTo(w / 2 - 18, -h / 2 + 3);
    ctx.lineTo(w / 2 - 9, h / 2 - 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(-w / 4, -h / 4, w * 0.18, 2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(55, 60, 57, 0.25)';
    for (let i = 0; i < 4; i += 1) {
      const px = -w / 2 + 8 + ((i * 37 + id * 13) % Math.max(1, w - 12));
      const py = -h / 2 + 7 + ((i * 23 + id * 9) % Math.max(1, h - 12));
      ctx.beginPath();
      ctx.ellipse(px, py, 1.6, 1, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 5, -h / 2 + 5);
    ctx.lineTo(-w / 2 + Math.min(w * 0.35, 30), -h / 2 + 5);
    ctx.stroke();
  } else {
    // Wood.
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, '#c78b51');
    g.addColorStop(0.38, '#b2753f');
    g.addColorStop(1, '#8a542b');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#5e371c';
    ctx.lineWidth = 2.2;
    roundRect(ctx, -w / 2, -h / 2, w, h, 4);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    roundRect(ctx, -w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 3);
    ctx.clip();
    ctx.strokeStyle = 'rgba(91, 49, 21, 0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < Math.max(2, Math.floor(w / 35)); i += 1) {
      const gy = -h / 2 + 6 + (i * (h - 10)) / Math.max(2, Math.floor(w / 35));
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 3, gy);
      ctx.bezierCurveTo(-w / 4, gy - 3, 0, gy + 4, w / 2 - 3, gy - 1);
      ctx.stroke();
    }
    // A knot.
    if (w > 35 && h > 18) {
      ctx.strokeStyle = 'rgba(88, 45, 19, 0.42)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(-w * 0.2, h * 0.1, Math.min(7, w * 0.08), Math.min(4, h * 0.18), 0.1, 0, TAU);
      ctx.stroke();
    }
    // Nails.
    ctx.fillStyle = 'rgba(54, 36, 24, 0.55)';
    const nx = Math.min(10, w * 0.12);
    const ny = Math.min(8, h * 0.24);
    ctx.beginPath();
    ctx.arc(-w / 2 + nx, -h / 2 + ny, 1.4, 0, TAU);
    ctx.arc(w / 2 - nx, -h / 2 + ny, 1.4, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 225, 174, 0.32)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 4, -h / 2 + 4);
    ctx.lineTo(-w / 2 + Math.min(w - 8, 42), -h / 2 + 4);
    ctx.stroke();
  }

  // Damage cracks.
  if (damage > 0.18) {
    ctx.save();
    roundRect(ctx, -w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 3);
    ctx.clip();
    const lines = crackLines(id, w, h, Math.min(4, Math.floor(damage * 5)));
    ctx.strokeStyle = mat === 'ice' ? 'rgba(255,255,255,0.8)' : 'rgba(45, 31, 22, 0.62)';
    ctx.lineWidth = mat === 'ice' ? 1.8 : 1.4;
    for (const points of lines) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
      ctx.stroke();
    }
    if (damage > 0.55) {
      ctx.fillStyle = 'rgba(35, 23, 17, 0.2)';
      ctx.beginPath();
      ctx.ellipse(w * 0.2, h * 0.1, w * 0.18, h * 0.25, 0.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

export function drawBirdsQueueIcon(ctx, type, x, y, r, t) {
  drawBird(ctx, type, x, y, r, -0.08, { perched: false, time: t });
}

export function drawCrate(ctx, x, bottom, w, h, angle = 0) {
  ctx.save();
  ctx.translate(x, bottom - h / 2);
  ctx.rotate(angle);
  ctx.fillStyle = '#9a6335';
  ctx.strokeStyle = '#56351e';
  ctx.lineWidth = 3;
  roundRect(ctx, -w / 2, -h / 2, w, h, 3);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#6e4524';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 6, -h / 2 + 5);
  ctx.lineTo(w / 2 - 6, h / 2 - 5);
  ctx.moveTo(w / 2 - 6, -h / 2 + 5);
  ctx.lineTo(-w / 2 + 6, h / 2 - 5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 225, 168, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
  ctx.restore();
}

export function drawMenuScene(ctx, t) {
  const palette = PALETTES.day;
  drawBackground(ctx, 'day', t, { seed: 'menu-scene', noVignette: true });

  // A second, lush foreground hill behind the characters.
  ctx.fillStyle = 'rgba(82, 111, 51, 0.55)';
  ctx.beginPath();
  ctx.moveTo(760, GROUND_Y);
  ctx.bezierCurveTo(960, 690, 1120, 755, 1320, 716);
  ctx.bezierCurveTo(1420, 696, 1530, 704, 1660, 730);
  ctx.lineTo(1660, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Pigs to the right, peeking over a little barricade.
  const bob1 = Math.sin(t * 0.0011) * 3;
  const bob2 = Math.cos(t * 0.0013 + 1) * 2.5;
  drawPig(ctx, 1362, 734 + bob1, 54, { time: t });
  drawPig(ctx, 1492, 748 + bob2, 42, { time: t + 300 });
  drawPig(ctx, 1272, 756 + bob2 * 0.5, 33, { time: t + 700 });

  // A rough wooden barricade in front of them.
  drawCrate(ctx, 1370, 790, 132, 60, -0.025);
  drawCrate(ctx, 1492, 790, 98, 48, 0.03);
  drawCrate(ctx, 1270, 790, 62, 44, -0.04);
  ctx.save();
  ctx.strokeStyle = '#5d3a20';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(1212, 780);
  ctx.lineTo(1232, 720);
  ctx.stroke();
  ctx.fillStyle = '#b68b45';
  ctx.strokeStyle = '#5d3a20';
  ctx.lineWidth = 2.5;
  roundRect(ctx, 1206, 694, 54, 33, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5d3a20';
  ctx.font = '800 12px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NO BIRDS', 1233, 711);
  ctx.restore();

  // A big friendly slingshot, with Red waiting for takeoff.
  const sill = { x: 1142, baseY: 790, anchorY: 593, scale: 1.12 };
  const birdPoint = { x: 1120, y: 576 + Math.sin(t * 0.0014) * 3 };
  drawSlingBack(ctx, sill, birdPoint);
  drawSlingFront(ctx, sill, birdPoint, true);
  drawSlingPouch(ctx, birdPoint);
  drawBird(ctx, 'red', birdPoint.x, birdPoint.y, 39, -0.08 + Math.sin(t * 0.0013) * 0.025, {
    perched: true,
    time: t + 500
  });

  // Floating feathers.
  ctx.save();
  for (let i = 0; i < 6; i += 1) {
    const x = 1010 + ((i * 83 + t * 0.006) % 380);
    const y = 300 + ((i * 61 + t * 0.013) % 250);
    const a = Math.sin(t * 0.001 + i) * 0.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + i);
    ctx.globalAlpha = 0.22 + (i % 3) * 0.1;
    ctx.fillStyle = '#fff2dd';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 3, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  drawForeground(ctx, 'day', t, { alpha: 0.5, seed: 'menu-scene' });

  // Golden hour bloom on the right.
  const bloom = ctx.createRadialGradient(1250, 500, 60, 1250, 500, 520);
  bloom.addColorStop(0, 'rgba(255, 214, 134, 0.12)');
  bloom.addColorStop(1, 'rgba(255, 214, 134, 0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(700, 0, 900, 900);
}

export function drawIconStar(ctx, x, y, r, filled, color = '#ffd45c') {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? color : 'rgba(255, 238, 197, 0.2)';
  ctx.fill();
  ctx.strokeStyle = filled ? '#8c4c1f' : 'rgba(68, 43, 24, 0.25)';
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.stroke();
  if (filled) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, -r * 0.25, r * 0.25, r * 0.12, -0.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawConfetti(ctx, particles) {
  for (const p of particles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
}
