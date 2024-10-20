"use strict";

const players = {};
const playerPos = {};

document.addEventListener("DOMContentLoaded", () => {
  const createPartner = (id, x, y, z, yaw, move) => {
    const createBox = (className) => {
      const box = document.createElement("div");
      box.classList.add(className);
      box.classList.add("box");

      for (let i = 0; i < 6; i++) {
        const face = document.createElement("div");
        box.appendChild(face);
      }

      return box;
    };

    const scene = document.querySelector("#scene");

    const player = document.createElement("div");
    player.id = id;
    player.classList.add("player");
    player.appendChild(createBox("head"));
    player.appendChild(createBox("torso"));

    const rightArm = document.createElement("div");
    rightArm.classList.add("right-arm");
    rightArm.appendChild(createBox("right-arm-upper"));
    rightArm.appendChild(createBox("right-arm-lower"));
    player.appendChild(rightArm);

    const leftArm = document.createElement("div");
    leftArm.classList.add("left-arm");
    leftArm.appendChild(createBox("left-arm-upper"));
    leftArm.appendChild(createBox("left-arm-lower"));
    player.appendChild(leftArm);

    const legs = document.createElement("div");
    legs.classList.add("legs");

    const rightLeg = document.createElement("div");
    rightLeg.classList.add("right-leg");
    rightLeg.appendChild(createBox("right-leg-upper"));
    rightLeg.appendChild(createBox("right-leg-lower"));
    legs.appendChild(rightLeg);

    const leftLeg = document.createElement("div");
    leftLeg.classList.add("left-leg");
    leftLeg.appendChild(createBox("left-leg-upper"));
    leftLeg.appendChild(createBox("left-leg-lower"));
    legs.appendChild(leftLeg);

    player.appendChild(legs);

    const gun = document.createElement("div");
    gun.classList.add("gun");
    gun.appendChild(createBox("gun-body"));
    gun.appendChild(createBox("gun-mag"));
    gun.appendChild(createBox("gun-handle"));
    gun.appendChild(createBox("gun-aim"));
    gun.appendChild(createBox("gun-aim2"));
    player.appendChild(gun);

    player.style.transform = `translate3d(${x + 50}px, ${
      y + 50
    }px, ${z}px) rotateZ(${yaw - 90}deg)`;

    const dx = Math.abs(move?.x || 0);
    const dy = Math.abs(move?.y || 0);
    const moveAngle = Math.atan2(dx, dy);

    legs.style.transform = `rotateZ(${moveAngle}rad)`;

    scene.appendChild(player);

    return player;
  };

  registerCallback((peer, data) => {
    const { x, y, z, yaw, move } = data;

    const player = players[peer];

    if (!player) {
      players[peer] = createPartner(peer, x, y, z, yaw);
    }

    players[peer].style.transform = `translate3d(${x + 50}px, ${
      y + 50
    }px, ${z}px) rotateZ(${yaw - 90}deg)`;

    const dx = -(move?.x || 0);
    const dy = Math.abs(move?.y || 0);
    const moveAngle = Math.atan2(dx, dy);

    players[peer].querySelector(
      ".legs"
    ).style.transform = `rotateZ(${moveAngle}rad)`;

    playerPos[peer] = { x, y, z, yaw };
  });

  registerCleanup((peer) => {
    players[peer]?.remove();

    delete players[peer];
    delete playerPos[peer];
  });
});
