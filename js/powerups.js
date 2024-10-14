"use strict";

const POWERUP_INTERVAL = 5000;
const POWERUP_LIFE = 10000;
const POWERUP_SIZE = 10;
let lastPowerupGenerationTime = undefined;

const powerups = {};

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(":root");
  root.style.setProperty("--powerup-life", `${POWERUP_LIFE}ms`);
  root.style.setProperty("--powerup-size", `${POWERUP_SIZE}px`);

  const drawPowerup = (id, type) => {
    const { x, y, z } = faceKeyFrom(id);

    const createBox = () => {
      const box = document.createElement("div");
      box.classList.add("box");

      for (let i = 0; i < 6; i++) {
        const face = document.createElement("div");
        box.appendChild(face);
      }

      return box;
    };

    const scene = document.querySelector("#scene");

    const powerup = document.createElement("div");
    powerup.id = "k" + id;
    powerup.classList.add("powerup");
    powerup.classList.add(type);
    powerup.appendChild(createBox());

    powerup.style.transform = `translate3d(${
      (+x + 0.5) * FACE_SIZE - POWERUP_SIZE / 2
    }px, ${(+y + 0.5) * FACE_SIZE - POWERUP_SIZE / 2}px, ${
      +z * FACE_SIZE + 10
    }px)`;
    scene.appendChild(powerup);
  };

  const addPowerup = (powerup) => {
    powerups[powerup.id] = powerup.type;

    setTimeout(() => {
      removePowerup(powerup.id);
    }, POWERUP_LIFE);

    drawPowerup(powerup.id, powerup.type);
  };

  const removePowerup = (powerupId) => {
    if (!powerups[powerupId]) {
      return;
    }

    delete powerups[powerupId];
    document.querySelector("#k" + powerupId)?.remove();
  };

  const takePowerup = (powerupId, type) => {
    removePowerup(powerupId);
    broadcast(
      JSON.stringify({
        powerupTaken: powerupId,
      })
    );

    // TODO: Apply powerup to the player
  };

  addPowerup({
    type: "jetpack",
    id: faceKey(3, 3, 0),
  });

  setInterval(() => {
    const now = Date.now();

    if (now < (lastPowerupGenerationTime || 0) + POWERUP_INTERVAL) {
      return;
    }

    lastPowerupGenerationTime = now;

    const faceKeys = Object.keys(FACES);
    const possibleKeys = faceKeys.filter((key) => powerups[key] === undefined);
    const position = faceKeyFrom(
      possibleKeys[Math.floor(Math.random() * possibleKeys.length)]
    );

    const powerup = {
      type: (() => {
        switch (Math.floor(Math.random() * 3)) {
          case 0:
            return "jetpack";
          case 1:
            return "ammo";
          case 2:
            return "health";
          case 3:
            return "bricks";
        }
      })(),
      id: faceKey(position.x, position.y, position.z, undefined),
    };

    addPowerup(powerup);
    broadcast(
      JSON.stringify({
        powerup,
      })
    );
  }, 1000);

  registerCallback((peerId, data) => {
    const { powerup } = data;

    if (!powerup) {
      return;
    }

    const now = Date.now();

    if ((lastPowerupGenerationTime || 0) + lastPowerupGenerationTime < now) {
      return;
    }

    lastPowerupGenerationTime = now;

    addPowerup(powerup);
  });

  registerCallback((peerId, data) => {
    const { powerupTaken } = data;

    if (!powerupTaken) {
      return;
    }

    removePowerup(powerupTaken);
  });
});
