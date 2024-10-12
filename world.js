"use strict";

const FACE_SIZE = 100;
const MAP_SIZE = 25;
document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(":root");

  root.style.setProperty("--face-size", `${FACE_SIZE}px`);
  root.style.setProperty("--map-size", `${MAP_SIZE}`);
});

let FACES = {};
const faceKey = (x, y, z, face) => `${x}_${y}_${z}_${face}`;
const faceKeyFrom = (key) => {
  const [x, y, z, face] = key.split("_");
  return { x, y, z, face };
};

const setFace = (x, y, z, face, color) => {
  FACES[faceKey(x, y, z, face)] = color;
};

const drawFace = (key, fallbackColor) => {
  const { x, y, z, face } = faceKeyFrom(key);
  const color = FACES[key] || fallbackColor;

  const element = document.querySelector(`#k${key}`);
  if (element) {
    element.style.background = color;
    return;
  }

  const scene = document.querySelector("#scene");

  const faceElement = document.createElement("div");
  faceElement.id = key;
  faceElement.classList.add("face");
  faceElement.classList.add(face);
  faceElement.style.background = color;
  faceElement.id = `k${key}`;

  const wrapper = document.createElement("div");
  wrapper.classList.add("face-wrapper");
  wrapper.appendChild(faceElement);
  wrapper.style.transform = `translate3d(${x * FACE_SIZE}px, ${
    y * FACE_SIZE
  }px, ${z * FACE_SIZE}px)`;

  scene.appendChild(wrapper);
};

const addCube = (x, y, z, color) => {
  setFace(x, y, z, "x", color);
  setFace(x, y, z, "y", color);
  setFace(x, y, z, "z", color);

  setFace(x + 1, y, z, "x", color);
  setFace(x, y + 1, z, "y", color);
  setFace(x, y, z + 1, "z", color);
};

const addPlane = (z) => {
  for (let x = 0; x < MAP_SIZE; x++) {
    for (let y = 0; y < MAP_SIZE; y++) {
      setFace(x, y, z, "z", "#fff");
    }
  }
};

const addPlayer = (x, y, z, yaw) => {
  setFace(x, y, z, "z", "red");
  setFace(x, y, z, "x", "red");
  setFace(x, y, z, "y", "red");
};

document.addEventListener("DOMContentLoaded", () => {
  addPlane(0);

  addCube(0, 0, 0, "orange");
  addCube(MAP_SIZE - 1, 0, 0, "lightblue");
  addCube(0, MAP_SIZE - 1, 0, "lightgreen");
  addCube(MAP_SIZE - 1, MAP_SIZE - 1, 0, "lightcoral");

  addCube(12, 12, 0, "lightcoral");
  addCube(12, 13, 1, "lightcoral");

  addCube(12, 14, 2, "lightcoral");
  setFace(13, 14, 3, "z", "lightcoral");
  setFace(14, 14, 3, "z", "lightcoral");
  setFace(12, 15, 3, "z", "lightcoral");
  setFace(13, 15, 3, "z", "lightcoral");
  setFace(14, 15, 3, "z", "lightcoral");
  setFace(12, 16, 3, "z", "lightcoral");
  setFace(13, 16, 3, "z", "lightcoral");
  setFace(14, 16, 3, "z", "lightcoral");

  Object.keys(FACES).forEach((key) => {
    drawFace(key);
  });

  registerCallback((peer, data) => {
    const { FACES: incomingFaces, removeFace, addFace } = data;

    if (incomingFaces) {
      FACES = incomingFaces;

      document.querySelectorAll("#scene .face-wrapper").forEach((el) => {
        const key = el.firstChild.id.slice(1);

        if (!FACES[key]) {
          el.remove();
          return;
        }

        el.firstChild.style.background = FACES[key];
      });
    }

    if (removeFace) {
      FACES[removeFace] = undefined;
      document.querySelector(`#k${removeFace}`).parentElement.remove();
    }

    if (addFace) {
      FACES[addFace] = "red";
      drawFace(addFace);
    }
  });
});
