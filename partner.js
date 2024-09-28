"use strict";

const players = {};

document.addEventListener("DOMContentLoaded", () => {
  const createPeer = (x, y, z, yaw) => {
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

    const rightLeg = document.createElement("div");
    rightLeg.classList.add("right-leg");
    rightLeg.appendChild(createBox("right-leg-upper"));
    rightLeg.appendChild(createBox("right-leg-lower"));
    player.appendChild(rightLeg);

    const leftLeg = document.createElement("div");
    leftLeg.classList.add("left-leg");
    leftLeg.appendChild(createBox("left-leg-upper"));
    leftLeg.appendChild(createBox("left-leg-lower"));
    player.appendChild(leftLeg);

    player.style.transform = `translate3d(${x + 50}px, ${
      y + 50
    }px, ${z}px) rotateZ(${yaw - 90}deg)`;
    scene.appendChild(player);

    return player;
  };

  registerCallback((peer, data) => {
    const { x, y, z, yaw } = data;

    const player = players[peer];

    if (!player) {
      players[peer] = createPeer(x, y, z, yaw);
    }

    players[peer].style.transform = `translate3d(${x + 50}px, ${
      y + 50
    }px, ${z}px) rotateZ(${yaw - 90}deg)`;

    console.log("Received", peer, data);
  });
});
