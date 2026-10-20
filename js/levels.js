// Level geometry and the feathered cast.
// All coordinates are in the game's 1600 x 900 virtual stage.
// The ground surface sits at y = 790.

export const WORLD_W = 1600;
export const WORLD_H = 900;
export const GROUND_Y = 790;
export const SLING = { x: 252, y: 596, anchorY: 596, forkTop: 566, baseY: 790 };

export const BIRD_TYPES = {
  red: {
    name: 'Red',
    ability: 'Battle Cry',
    abilityShort: 'A furious mid-air boost',
    radius: 25,
    color: '#dc4a3d',
    dark: '#9f2f28',
    light: '#ff8d73',
    density: 0.0042,
    description: 'The steady leader. Tap for a burst of speed and a shockwave.'
  },
  chuck: {
    name: 'Chuck',
    ability: 'Turbo Dash',
    abilityShort: 'Rocket forward like a dart',
    radius: 23,
    color: '#ffd43b',
    dark: '#d9a21c',
    light: '#fff4a8',
    density: 0.0038,
    description: 'Fast and pointy. Tap to dash forward with a sonic zip.'
  },
  bomb: {
    name: 'Bomb',
    ability: 'Big Bang',
    abilityShort: 'Explode with a mighty boom',
    radius: 29,
    color: '#3d3f4b',
    dark: '#20212a',
    light: '#7d8394',
    density: 0.0052,
    description: 'A heavyweight with a short fuse. Tap to detonate on command.'
  },
  blues: {
    name: 'The Blues',
    ability: 'Triple Trouble',
    abilityShort: 'Split into three blue bullets',
    radius: 19,
    color: '#55b9e9',
    dark: '#2b7da5',
    light: '#c3f0ff',
    density: 0.0032,
    description: 'Three tiny trouble-makers. Tap to split the shot into three.'
  }
};

const G = GROUND_Y;
const WOOD = 'wood';
const ICE = 'ice';
const STONE = 'stone';

/** Vertical post. `bottom` is the surface it stands on. */
function post(x, bottom, h, mat = WOOD, w = 24) {
  return { x, y: bottom - h / 2, w, h, mat };
}

/** Horizontal plank. `bottom` is the surface it rests on. */
function slab(x, bottom, w, mat = WOOD, h = 22) {
  return { x, y: bottom - h / 2, w, h, mat };
}

/** A free-standing crate. */
function crate(x, bottom, w, h, mat = WOOD) {
  return { x, y: bottom - h / 2, w, h, mat };
}

/** A pig whose feet rest at `bottom`. */
function pig(x, bottom, r = 28, kind = 'pig') {
  return { x, y: bottom - r, r, kind };
}

function tnt(x, bottom = G) {
  return { x, y: bottom - 24, w: 48, h: 48, mat: 'tnt' };
}

function angled(x, y, w, h, mat, angle) {
  return { x, y, w, h, mat, angle };
}

const levels = [
  {
    id: 'first-flight',
    name: 'First Flight',
    subtitle: 'A gentle introduction to pig-removal.',
    theme: 'day',
    birds: ['red', 'red', 'chuck'],
    blocks: [
      post(1050, G, 135),
      post(1170, G, 135),
      slab(1110, 655, 168),
      post(1262, G, 95, ICE, 22),
      post(1338, G, 95, ICE, 22),
      slab(1300, 695, 120, WOOD, 20),
      crate(1440, G, 96, 38)
    ],
    pigs: [pig(1110, 633, 28), pig(1300, 675, 27), pig(1440, 752, 26)]
  },
  {
    id: 'piggy-picnic',
    name: 'Piggy Picnic',
    subtitle: 'Someone left the ham out in the sun.',
    theme: 'day',
    birds: ['red', 'blues', 'red', 'chuck'],
    blocks: [
      post(1040, G, 110),
      post(1160, G, 110),
      slab(1100, 680, 170, WOOD, 24),
      post(1300, G, 105, ICE, 22),
      post(1400, G, 105, ICE, 22),
      slab(1350, 685, 150),
      crate(1470, G, 70, 38)
    ],
    pigs: [pig(1100, 656, 28), pig(1100, G, 27), pig(1350, 663, 27), pig(1470, 752, 24)]
  },
  {
    id: 'glass-ceiling',
    name: 'Glass Ceiling',
    subtitle: 'A brittle high-rise with a view.',
    theme: 'day',
    birds: ['chuck', 'red', 'bomb', 'red'],
    blocks: [
      post(1040, G, 90, ICE, 22),
      post(1160, G, 90, ICE, 22),
      slab(1100, 700, 160, ICE, 18),
      post(1050, 682, 80, ICE, 20),
      post(1150, 682, 80, ICE, 20),
      slab(1100, 602, 150, ICE, 18),
      post(1260, G, 95, ICE, 22),
      post(1380, G, 95, ICE, 22),
      slab(1320, 695, 160, ICE, 18)
    ],
    pigs: [pig(1100, G, 24), pig(1100, 682, 25), pig(1100, 584, 27), pig(1320, 677, 27)]
  },
  {
    id: 'tower-of-ham',
    name: 'Tower of Ham',
    subtitle: 'Three storeys of pork, one short fuse.',
    theme: 'golden',
    birds: ['red', 'bomb', 'chuck', 'red'],
    blocks: [
      post(1030, G, 135, STONE, 30),
      post(1180, G, 135, STONE, 30),
      slab(1105, 655, 190),
      post(1060, 633, 105),
      post(1150, 633, 105),
      slab(1105, 528, 160),
      post(1255, G, 85),
      post(1340, G, 85),
      slab(1298, 705, 110),
      tnt(1298),
      crate(1440, G, 70, 38)
    ],
    pigs: [pig(1105, G, 26), pig(1105, 506, 28), pig(1298, 683, 27), pig(1440, 752, 28)]
  },
  {
    id: 'bridge-and-bacon',
    name: 'Bridge & Bacon',
    subtitle: 'A piggy traffic jam under the boards.',
    theme: 'golden',
    birds: ['blues', 'red', 'bomb', 'chuck'],
    blocks: [
      post(980, G, 160, STONE, 30),
      post(1210, G, 160, STONE, 30),
      post(1420, G, 160, STONE, 30),
      slab(1095, 630, 230),
      slab(1315, 630, 230),
      crate(1120, 608, 44, 44),
      crate(1310, 608, 44, 44),
      crate(1210, 608, 52, 38),
      tnt(1155)
    ],
    pigs: [pig(1095, G, 28), pig(1210, G, 26), pig(1330, G, 28), pig(1210, 570, 27)]
  },
  {
    id: 'fort-snout',
    name: 'Fort Snout',
    subtitle: 'Stone walls, wooden nerves.',
    theme: 'golden',
    birds: ['bomb', 'chuck', 'red', 'bomb'],
    blocks: [
      post(990, G, 200, STONE, 34),
      post(1430, G, 200, STONE, 34),
      slab(1210, 590, 470, STONE, 44),
      post(1080, G, 100),
      post(1260, G, 100),
      slab(1170, 690, 220),
      tnt(1170)
    ],
    pigs: [pig(1080, G, 27), pig(1170, 668, 27), pig(1330, G, 28), pig(1210, 546, 30)]
  },
  {
    id: 'the-gauntlet',
    name: 'The Gauntlet',
    subtitle: 'Three little forts, no room for error.',
    theme: 'dusk',
    birds: ['blues', 'chuck', 'bomb', 'red', 'chuck'],
    blocks: [
      post(920, G, 115),
      post(1020, G, 115),
      slab(970, 675, 140),
      post(1160, G, 150, ICE, 22),
      post(1260, G, 150, ICE, 22),
      slab(1210, 640, 145, ICE, 20),
      post(1360, G, 95, STONE, 28),
      post(1460, G, 95, STONE, 28),
      slab(1410, 695, 140, STONE, 24),
      tnt(1410),
      crate(1080, G, 45, 45, ICE)
    ],
    pigs: [pig(970, 653, 27), pig(970, G, 23), pig(1210, 622, 27), pig(1410, 671, 27), pig(1080, 745, 24)]
  },
  {
    id: 'pig-pyramid',
    name: 'Pig Pyramid',
    subtitle: 'Ancient stones. Modern problems.',
    theme: 'dusk',
    birds: ['bomb', 'red', 'bomb', 'chuck'],
    blocks: [
      crate(1080, G, 100, 50, STONE),
      crate(1200, G, 100, 50, STONE),
      crate(1320, G, 100, 50, STONE),
      crate(1140, 740, 100, 50, STONE),
      crate(1260, 740, 100, 50, STONE),
      crate(1200, 690, 100, 50, STONE),
      tnt(990),
      crate(1200, 640, 54, 24, STONE)
    ],
    pigs: [pig(910, G, 27), pig(1390, G, 27), pig(1110, 690, 22), pig(1200, 616, 27)]
  },
  {
    id: 'high-stakes',
    name: 'High Stakes',
    subtitle: 'A bridge too far, a drop too high.',
    theme: 'dusk',
    birds: ['chuck', 'blues', 'bomb', 'red'],
    blocks: [
      post(980, G, 130),
      post(1060, G, 130),
      slab(1020, 660, 130),
      post(1340, G, 130),
      post(1420, G, 130),
      slab(1380, 660, 130),
      post(990, 638, 100, ICE, 20),
      post(1050, 638, 100, ICE, 20),
      slab(1020, 538, 120, ICE, 18),
      post(1350, 638, 100, ICE, 20),
      post(1410, 638, 100, ICE, 20),
      slab(1380, 538, 120, ICE, 18),
      slab(1200, 520, 300, ICE, 16),
      crate(1200, 504, 50, 38)
    ],
    pigs: [pig(1020, G, 24), pig(1380, G, 24), pig(1200, 466, 26), pig(1290, 504, 24)]
  },
  {
    id: 'boom-town',
    name: 'Boom Town',
    subtitle: 'Please do not lick the dynamite.',
    theme: 'night',
    birds: ['red', 'bomb', 'chuck', 'blues', 'red'],
    blocks: [
      post(930, G, 95),
      post(1010, G, 95),
      slab(970, 695, 130),
      tnt(1040),
      post(1140, G, 105, STONE, 28),
      post(1240, G, 105, STONE, 28),
      slab(1190, 685, 150, WOOD, 24),
      post(1150, 661, 85, WOOD),
      post(1230, 661, 85, WOOD),
      slab(1190, 576, 130, ICE, 20),
      tnt(1280),
      post(1350, G, 90, ICE, 22),
      post(1430, G, 90, ICE, 22),
      slab(1390, 700, 130, WOOD, 20),
      crate(1500, G, 55, 55, WOOD)
    ],
    pigs: [pig(970, 673, 26), pig(1190, 556, 26), pig(1390, 680, 26), pig(1095, G, 22), pig(1190, G, 25)]
  },
  {
    id: 'iron-curtain',
    name: 'Iron Curtain',
    subtitle: 'The pigs have been busy with concrete.',
    theme: 'night',
    birds: ['bomb', 'bomb', 'chuck', 'red', 'blues'],
    blocks: [
      post(960, G, 180, STONE, 32),
      post(1100, G, 180, STONE, 32),
      post(1240, G, 180, STONE, 32),
      post(1380, G, 180, STONE, 32),
      slab(1030, 610, 165, STONE, 38),
      slab(1310, 610, 165, STONE, 38),
      post(1140, G, 120, ICE, 24),
      post(1300, G, 120, ICE, 24),
      slab(1220, 670, 200, WOOD, 22),
      { x: 1220, y: 624, w: 48, h: 48, mat: 'tnt' },
      post(1160, 648, 90),
      post(1280, 648, 90),
      slab(1220, 558, 170),
      crate(1470, G, 65, 40, STONE)
    ],
    pigs: [pig(1030, G, 24), pig(1170, G, 24), pig(1310, G, 24), pig(1220, 536, 28), pig(1470, 750, 26)]
  },
  {
    id: 'kings-castle',
    name: "King Pig's Castle",
    subtitle: 'The last slice of the kingdom. Make it crumble.',
    theme: 'night',
    birds: ['chuck', 'bomb', 'blues', 'red', 'bomb', 'chuck'],
    blocks: [
      post(960, G, 220, STONE, 34),
      post(1070, G, 220, STONE, 34),
      slab(1015, 570, 170, STONE, 26),
      post(1160, G, 160),
      post(1300, G, 160),
      slab(1230, 630, 170),
      tnt(1230),
      post(1390, G, 220, STONE, 34),
      post(1500, G, 220, STONE, 34),
      slab(1445, 570, 170, STONE, 26),
      crate(1020, G, 60, 60, ICE),
      crate(1445, G, 60, 60, ICE)
    ],
    pigs: [
      pig(1015, 544, 28),
      pig(1445, 544, 28),
      pig(1116, G, 25),
      pig(1356, G, 25),
      pig(1230, 608, 48, 'king')
    ]
  }
];

// Score thresholds are derived from the level's potential. Clearing a level
// always earns at least one star; the upper stars reward efficient shots.
for (const level of levels) {
  const pigPoints = level.pigs.reduce((sum, p) => sum + (p.kind === 'king' ? 9000 : 5000), 0);
  const blockPoints = level.blocks.reduce((sum, b) => {
    if (b.mat === STONE) return sum + 800;
    if (b.mat === 'tnt') return sum + 1000;
    if (b.mat === ICE) return sum + 400;
    return sum + 500;
  }, 0);
  const unusedCap = Math.min(level.birds.length, 4) * 10000;
  const max = pigPoints + blockPoints + unusedCap;
  level.starScores = [
    Math.round(max * 0.24),
    Math.round(max * 0.46),
    Math.round(max * 0.68)
  ];
  level.maxScore = max;
  level.blockCount = level.blocks.length;
  level.pigCount = level.pigs.length;
}

export const LEVELS = levels;

export function levelBirdList(level) {
  return level.birds.map((type) => BIRD_TYPES[type]);
}

export const CHARACTER_INFO = [
  {
    type: 'red',
    title: 'Red',
    text: 'An all-rounder with an angry streak. Battle Cry gives him a mid-air burst of speed.'
  },
  {
    type: 'chuck',
    title: 'Chuck',
    text: 'A featherweight dart. Turbo Dash rockets him through wood and glass.'
  },
  {
    type: 'bomb',
    title: 'Bomb',
    text: 'Heavy, round, and explosive. Big Bang clears the room — including the room.'
  },
  {
    type: 'blues',
    title: 'The Blues',
    text: 'A tiny trio. Triple Trouble fans the shot out to pop piggy clusters.'
  }
];
