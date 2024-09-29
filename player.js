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

const serializeState = () =>
  JSON.stringify({
    x: Math.round(pos.x),
    y: Math.round(pos.y),
    z: Math.round(pos.z),
    yaw: Math.round(look.y),
  });

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector(":root")
    .style.setProperty("--perspective", `${PERSPECTIVE}px`);

  const viewport = document.querySelector("#viewport");
  const scene = document.querySelector("#scene");
  const viewmodelPosition = document.querySelector("#viewmodel-position");

  const display = () => {
    viewport.style.transform = `translate3d(0, 0, ${PERSPECTIVE}px) rotateX(${
      90 - look.p
    }deg) rotateY(${look.r}deg) rotateZ(${180 - look.y}deg)`;

    scene.style.transform = `translate3d(${-pos.x - 0.5 * FACE_SIZE}px, ${
      -pos.y - 0.5 * FACE_SIZE
    }px, ${-pos.z - (ducking ? 0.3 : 0.5) * FACE_SIZE}px)`;

    document.body.style.background = `linear-gradient(0, lightgreen, lightblue ${
      (100 * (90 + look.p)) / 180
    }%)`;

    viewmodelPosition.style.transform = `translate3d(${
      velocity.x + velocity.y + velocity.z
    }px, ${velocity.x + velocity.y + velocity.z - look.p / 2}px, ${
      ducking ? 40 : 0
    }px)`;

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
    document.querySelector("#viewmodel-animation").classList.add("active");
  });

  document.addEventListener("mouseup", () => {
    shooting = false;
    document.querySelector("#viewmodel-animation").classList.remove("active");
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

        const target = document
          .elementsFromPoint(
            window.innerWidth / 2 + (Math.random() * 10 - 5),
            window.innerHeight / 2 + (Math.random() * 10 - 5)
          )
          .filter(
            (el) =>
              el.classList.contains("face") ||
              el.parentElement?.parentElement?.classList?.contains("player") ||
              el.parentElement?.parentElement?.parentElement?.classList?.contains(
                "player"
              )
          )
          .map((el) => {
            const playerId =
              el.parentElement?.parentElement?.id ||
              el.parentElement?.parentElement?.parentElement?.id;
            const ppos = playerPos[playerId];

            if (ppos) {
              const dx = ppos.x - pos.x;
              const dy = ppos.y - pos.y;
              const dz = ppos.z - pos.z;

              const dist2 = dx * dx + dy * dy + dz * dz;
              const dist = Math.sqrt(dist2);
              const v = { x: dx / dist, y: dy / dist, z: dz / dist };

              let damage = 10;

              const part = el.parentElement.classList.item(0);

              switch (part) {
                case "head":
                  damage = 60;
                  break;
                case "torso":
                  damage = 60;
                  break;
                case "right-arm-upper":
                  damage = 40;
                  break;
                case "right-arm-lower":
                  damage = 20;
                  break;
                case "left-arm-upper":
                  damage = 40;
                  break;
                case "left-arm-lower":
                  damage = 20;
                  break;
                case "right-leg-upper":
                  damage = 30;
                  break;
                case "right-leg-lower":
                  damage = 20;
                  break;
                case "left-leg-upper":
                  damage = 30;
                  break;
                case "left-leg-lower":
                  damage = 20;
                  break;
              }

              return { playerId, dist2, damage, v };
            }

            const face = faceKeyFrom(el.id.slice(1));

            if (face) {
              const dx = world.x - face.x;
              const dy = world.y - face.y;
              const dz = world.z - face.z;

              const dist2 = dx * dx + dy * dy + dz * dz;

              return { el, dist2 };
            }

            return undefined;
          })
          .sort((a, b) => a?.dist2 - b?.dist2)[0];

        if (target?.el) {
          FACES[target.el.id.slice(1)] = undefined;
          target.el.parentElement.remove();
          broadcast(
            JSON.stringify({
              removeFace: target.el.id.slice(1),
            })
          );
        }

        if (target?.playerId) {
          send(
            target.playerId,
            JSON.stringify({
              damage: target.damage,
              v: target.v,
            })
          );
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

  registerCallback((peer, data) => {
    const { damage, v } = data;

    if (damage) {
      health -= damage * (armor ? 0.5 : 1);
      armor -= damage * 0.5;

      if (health <= 0) {
        health = 100;
        armor = 100;
        pos = { x: 100, y: 100, z: 0 };
      }

      if (armor < 0) {
        health += armor;
        armor = 0;
      }

      velocity.x += v.x * 10;
      velocity.y += v.y * 10;
      velocity.z += v.z * 10;
    }
  });
});
