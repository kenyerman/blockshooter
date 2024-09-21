"use strict";

let pos = { x: 100, y: 100, z: 0 };
let look = { p: 0, y: 0, r: 0 };
let velocity = { x: 0, y: 0, z: 0 };

const PERSPECTIVE = 1000;
const SPEED = 5;

let ducking = false;
let jumping = false;

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector(":root")
    .style.setProperty("--perspective", `${PERSPECTIVE}px`);

  const viewport = document.querySelector("#viewport");
  const scene = document.querySelector("#scene");

  const refresh = () => {
    viewport.style.transform = `translate3d(0, 0, ${PERSPECTIVE}px) rotateX(${
      90 - look.p
    }deg) rotateY(${look.r}deg) rotateZ(${180 - look.y}deg)`;

    scene.style.transform = `translate3d(${-pos.x - 0.5 * FACE_SIZE}px, ${
      -pos.y - 0.5 * FACE_SIZE
    }px, ${-pos.z - (ducking ? 0 : 0.5 * FACE_SIZE)}px)`;
  };

  document.addEventListener("click", () => {
    if (document.pointerLockElement) {
      return;
    }

    scene.requestPointerLock();
  });

  document.addEventListener("mousemove", (event) => {
    if (!document.pointerLockElement) {
      return;
    }

    look.p += event.movementY;
    look.y += event.movementX;

    if (look.p > 90) {
      look.p = 90;
    }

    if (look.p < -90) {
      look.p = -90;
    }

    refresh();
  });

  const keys = {};
  document.addEventListener("keydown", (event) => {
    keys[event.key] = true;
  });

  document.addEventListener("keyup", (event) => {
    keys[event.key] = false;
  });

  const checkKeys = () => {
    const angle = (look.y * Math.PI) / 180;
    const world = {
      x: Math.round(pos.x / FACE_SIZE),
      y: Math.round(pos.y / FACE_SIZE),
      z: Math.round(pos.z / FACE_SIZE),
    };

    const v = {
      x: (keys["a"] ?? false) - (keys["d"] ?? false),
      y: (keys["s"] ?? false) - (keys["w"] ?? false),
      z: keys[" "] ?? false,
    };

    ducking = keys["c"];

    if (v.x && v.y) {
      v.x *= 0.7071067811865475;
      v.y *= 0.7071067811865475;
    }

    v.x *= SPEED;
    v.y *= SPEED;
    v.z *= SPEED * 2;

    velocity.x += v.x * Math.cos(angle) + v.y * Math.sin(angle);
    velocity.y += v.x * Math.sin(angle) - v.y * Math.cos(angle);
    if (v.z && !jumping) {
      jumping = true;
      velocity.z += v.z;
    }

    // has ceiling
    if (0 < velocity.z && FACES[faceKey(world.x, world.y, world.z + 1, "z")]) {
      velocity.z = 0;
    }

    pos.x += velocity.x;
    pos.y += velocity.y;
    pos.z += velocity.z;

    velocity.x *= 0.7;
    velocity.y *= 0.7;

    // falling
    if (!FACES[faceKey(world.x, world.y, world.z, "z")]) {
      velocity.z -= 1;
    } else {
      // hit the ground
      velocity.z = 0;
      jumping = false;
    }

    pos.x = Math.max(0, Math.min((MAP_SIZE - 1) * FACE_SIZE, pos.x));
    pos.y = Math.max(0, Math.min((MAP_SIZE - 1) * FACE_SIZE, pos.y));
    pos.z = Math.max(-5, Math.min((MAP_SIZE - 1) * FACE_SIZE, pos.z));

    refresh();
  };

  refresh();

  const loop = () => {
    checkKeys();
    window.requestAnimationFrame(loop);
  };
  window.requestAnimationFrame(loop);
});
