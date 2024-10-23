"use strict";

const POWERUP_INTERVAL = 1_000;
const POWERUP_LIFE = 10_000;
const POWERUP_SIZE = 10;
let lastPowerupGenerationTime = undefined;

const POWERUP_EFFECT_TIME = 15_000;

const powerups = {};
let takePowerup;

const activePowerups = {};

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(":root");
  root.style.setProperty("--powerup-life", `${POWERUP_LIFE}ms`);
  root.style.setProperty("--powerup-size", `${POWERUP_SIZE}px`);
  root.style.setProperty("--powerup-effect-time", `${POWERUP_EFFECT_TIME}ms`);

  const timeouts = {};

  const emojis = {
    ammo: "🔫",
    health: "❤️",
    jetpack: "🚀",
    bricks: "🧱",
  };

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

  takePowerup = (powerupId, type) => {
    removePowerup(powerupId);
    broadcast(
      JSON.stringify({
        powerupTaken: powerupId,
      })
    );

    gainScore(10);

    clearTimeout(timeouts[type]);
    timeouts[type] = setTimeout(() => {
      activePowerups[type] = false;
    }, POWERUP_EFFECT_TIME);

    activePowerups[type] = true;

    if (type === "ammo") {
      ammo = MAX_AMMO;
    }

    if (type === "health") {
      health = 100;
    }

    if (type === "jetpack") {
      jetpack = MAX_JETPACK;
    }

    if (type === "bricks") {
      bricks = Math.min(MAX_BRICKS, bricks + 10);
    }

    const scanline = document.createElement("div");
    scanline.classList.add("powerup-scanline");
    scanline.classList.add(type);
    const text = document.createElement("div");
    text.classList.add("text");
    text.textContent = (() => {
      switch (type) {
        case "ammo":
          return `Restocked Ammo + Infinite Ammo for ${
            POWERUP_EFFECT_TIME / 1000
          }s`;
        case "health":
          return `Restored Health + Invulnerability for ${
            POWERUP_EFFECT_TIME / 1000
          }s`;
        case "jetpack":
          return "Jetpack refueled";
        case "bricks":
          return "Bricks picked up";
      }
    })();
    scanline.appendChild(text);
    document.body.appendChild(scanline);

    scanline.addEventListener("animationend", () => {
      scanline.remove();
    });

    document.querySelector(`#powerup-badges .badge.${type}`)?.remove?.();
    const badge = document.createElement("div");
    badge.classList.add("badge");
    badge.classList.add(type);
    if (type === "ammo" || type === "health") {
      badge.classList.add("timed");
    }
    badge.innerHTML = `<svg viewBox="0 0 800 800"><circle cx="400" cy="400" r="290" /></svg>${emojis[type]}`;

    badge.addEventListener("animationend", () => {
      badge.remove();
    });
    document.querySelector(`#powerup-badges`).appendChild(badge);

    play(type);
  };

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
      type: ["jetpack", "ammo", "health", "bricks"][
        Math.floor(Math.random() * 4)
      ],
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
