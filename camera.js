"use strict";

let pos = { x: 100, y: 100, z: 0 };
let look = { p: 0, y: 0, r: 0 };

const PERSPECTIVE = 1000;
const SPEED = 10;

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
    }px, ${-pos.z - 0.5 * FACE_SIZE}px)`;
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
    // FACES[faceKey(pos.x, pos.y, pos.z, "z")] = "transparent";
    // drawFace(faceKey(pos.x, pos.y, pos.z, "z"));

    const angle = (look.y * Math.PI) / 180;

    const v = {
      x: (keys["a"] ?? false) - (keys["d"] ?? false),
      y: (keys["s"] ?? false) - (keys["w"] ?? false),
      z: (keys[" "] ?? false) - (keys["Backspace"] ?? false),
    };

    if (v.x && v.y) {
      v.x *= 0.7071067811865475;
      v.y *= 0.7071067811865475;
    }

    v.x *= SPEED;
    v.y *= SPEED;
    v.z *= SPEED;

    pos.x += v.x * Math.cos(angle) + v.y * Math.sin(angle);
    pos.y += v.x * Math.sin(angle) - v.y * Math.cos(angle);
    pos.z += v.z;

    // FACES[faceKey(pos.x, pos.y, pos.z, "z")] = "red";
    // drawFace(faceKey(pos.x, pos.y, pos.z, "z"));
    refresh();
  };

  refresh();

  const loop = () => {
    checkKeys();
    window.requestAnimationFrame(loop);
  };
  window.requestAnimationFrame(loop);
});
