"use strict";

const pannerConfig = {
  panningModel: "HRTF",
  refDistance: FACE_SIZE,
  maxDistance: FACE_SIZE * 15,
  rolloffFactor: 1,
  distanceModel: "inverse",
};

// FIXME: creating new Howl instances every time a sound is played is wasting memory
//        global Howler state holds references to them, so they can't be garbage collected
//        instead, we should create a single audio file with sprites for all sounds, then
//        instantiate them per player, and move them around as the corresponding player moves
const sounds = {
  shot: () =>
    new Howl({
      src: ["/assets/shot.mp3"],
      preload: true,
    }),

  shell: () =>
    new Howl({
      src: ["/assets/shell.mp3"],
      preload: true,
    }),

  empty: () =>
    new Howl({
      src: ["/assets/empty.mp3"],
      preload: true,
      sprite: {
        empty: [0, 200],
      },
    }),

  step: () =>
    new Howl({
      src: ["/assets/step.mp3"],
      preload: true,
      sprite: {
        a: [0, 200],
        b: [600, 200],
      },
    }),

  hurt: () =>
    new Howl({
      src: ["/assets/damage.mp3"],
      preload: true,
    }),

  ammo: () =>
    new Howl({
      src: ["/assets/ammo.mp3"],
      preload: true,
    }),

  bricks: () =>
    new Howl({
      src: ["/assets/bricks.mp3"],
      preload: true,
    }),

  jetpack: () =>
    new Howl({
      src: ["/assets/jetpack.mp3"],
      preload: true,
    }),

  health: () =>
    new Howl({
      src: ["/assets/health.mp3"],
      preload: true,
    }),

  bricks_use: () =>
    new Howl({
      src: ["/assets/bricks_use.mp3"],
      preload: true,
    }),

  jetpack_use: () =>
    new Howl({
      src: ["/assets/jetpack_use.mp3"],
      preload: true,
    }),

  wall_hit: () =>
    new Howl({
      src: ["/assets/wall_hit.mp3"],
      preload: true,
    }),
};

const play = (sound, id) => {
  sounds[sound]().play(id);
  broadcast(JSON.stringify({ sound, id, coords: pos }));
};

const play_world = (sound, id, coords) => {
  const s = sounds[sound]();
  s.pos(coords.x, coords.y, coords.z);
  s.orientation(1, 1, 1);
  s.pannerAttr(pannerConfig);
  s.play(id);

  broadcast(JSON.stringify({ sound, id, coords }));
};

registerCallback((peer, data) => {
  const { sound, id, coords } = data;

  if (!sound) {
    return;
  }

  const s = sounds[sound]();
  s.pos(coords.x, coords.y, coords.z);
  s.orientation(1, 1, 1);
  s.pannerAttr(pannerConfig);
  s.play(id);
});
