"use strict";

let pos = { x: 100, y: 100, z: 0 };
let look = { p: 0, y: 0, r: 0 };
let velocity = { x: 0, y: 0, z: 0 };

const PERSPECTIVE = 1000;
const SPEED = 5;
const BULLET_RATE = 50;

let ducking = false;
let jumping = false;
let accuracy = 1;

let ammo = 100;
let lastshotSeed = 0;

let health = 100;
let armor = 100;

const getWorld = () => ({
  x: Math.round(pos.x / FACE_SIZE),
  y: Math.round(pos.y / FACE_SIZE),
  z: Math.round(pos.z / FACE_SIZE),
});

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector(":root")
    .style.setProperty("--perspective", `${PERSPECTIVE}px`);

  const viewport = document.querySelector("#viewport");
  const scene = document.querySelector("#scene");

  const display = () => {
    viewport.style.transform = `translate3d(0, 0, ${PERSPECTIVE}px) rotateX(${
      90 - look.p
    }deg) rotateY(${look.r}deg) rotateZ(${180 - look.y}deg)`;

    scene.style.transform = `translate3d(${-pos.x - 0.5 * FACE_SIZE}px, ${
      -pos.y - 0.5 * FACE_SIZE
    }px, ${-pos.z - (ducking ? 0 : 0.5 * FACE_SIZE)}px)`;

    document.body.style.background = `linear-gradient(0, lightgreen, lightblue ${
      (100 * (90 + look.p)) / 180
    }%)`;

    accuracy =
      (1 /
        Math.max(
          Math.min(
            Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2),
            20
          ),
          1
        )) *
      (shooting && ammo ? 0.5 + 0.5 * lastshotSeed : 1);

    document.querySelector(".crosshair").style.transform = `scale(${Math.min(
      1 / accuracy,
      2
    )})`;

    document.querySelector("#ammo").textContent = ammo;
    document.querySelector("#health").textContent = health;
    document.querySelector("#armor").textContent = armor;
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
    look.y %= 360;

    if (look.p > 90) {
      look.p = 90;
    }

    if (look.p < -90) {
      look.p = -90;
    }

    display();

    if (event.movementX) {
      broadcast(serializeState());
    }
  });

  const keys = {};
  document.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
  });

  document.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
  });

  let shooting = false;
  document.addEventListener("mousedown", () => {
    if (!document.pointerLockElement) {
      return;
    }

    shooting = true;
  });

  document.addEventListener("mouseup", () => {
    shooting = false;
  });

  const serializeState = () =>
    JSON.stringify({
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      z: Math.round(pos.z),
      yaw: Math.round(look.y),
    });

  let lastframe = Date.now();
  const loop = () => {
    const stateBefore = serializeState();

    const angle = (look.y * Math.PI) / 180;
    const world = getWorld();

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

    v.x *= SPEED * (ducking ? 0.5 : 1);
    v.y *= SPEED * (ducking ? 0.5 : 1);
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

    // hit side
    if (0 < velocity.x && FACES[faceKey(world.x + 1, world.y, world.z, "x")]) {
      velocity.x = 0;
    }

    if (velocity.x < 0 && FACES[faceKey(world.x, world.y, world.z, "x")]) {
      velocity.x = 0;
    }

    if (0 < velocity.y && FACES[faceKey(world.x, world.y + 1, world.z, "y")]) {
      velocity.y = 0;
    }

    if (velocity.y < 0 && FACES[faceKey(world.x, world.y, world.z, "y")]) {
      velocity.y = 0;
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

      if (velocity.z < 0) {
        pos.z = world.z * FACE_SIZE;
      }

      velocity.z = 0;
      jumping = false;
    }

    pos.x = Math.max(0, Math.min((MAP_SIZE - 1) * FACE_SIZE, pos.x));
    pos.y = Math.max(0, Math.min((MAP_SIZE - 1) * FACE_SIZE, pos.y));
    pos.z = Math.max(-5, Math.min((MAP_SIZE - 1) * FACE_SIZE, pos.z));

    if (BULLET_RATE <= Date.now() - lastframe) {
      lastframe = Date.now();

      if (shooting && ammo) {
        lastshotSeed = Math.random();

        const el = document
          .elementsFromPoint(
            window.innerWidth / 2 + (Math.random() * 10 - 5),
            window.innerHeight / 2 + (Math.random() * 10 - 5)
          )
          .filter((el) => el.classList.contains("face"))
          .map((el) => {
            const face = faceKeyFrom(el.id.slice(1));
            const dx = world.x - face.x;
            const dy = world.y - face.y;
            const dz = world.z - face.z;

            const dist2 = dx * dx + dy * dy + dz * dz;

            return { el, dist2 };
          })
          .sort((a, b) => a.dist2 - b.dist2)[0]?.el;

        if (el) {
          FACES[el.id.slice(1)] = undefined;
          el.parentElement.remove();
        }

        ammo--;
      }

      if (!shooting && ammo < 100 && Math.random() < 0.2) {
        ammo++;
      }
    }

    display();

    const stateNow = serializeState();

    if (stateBefore !== stateNow) {
      broadcast(stateNow);
    }

    window.requestAnimationFrame(loop);
  };

  window.requestAnimationFrame(loop);
});
