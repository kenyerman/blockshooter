"use strict";

let playerName = "player";

let pos = { x: 100, y: 100, z: 0 };
let look = { p: 0, y: 0, r: 0 };
let velocity = { x: 0, y: 0, z: 0 };

const SPAWN_POINTS = [
  { x: 100, y: 100, z: 0 },
  { x: 1200, y: 1000, z: 0 },
  { x: 2300, y: 300, z: 0 },
];

const PERSPECTIVE = 1000;
const SPEED = 5;
const BULLET_RATE = 100;
const STEP_RATE = 400;
const MAX_AMMO = 40;

let ducking = false;
let jumping = false;
let accuracy = 1;
let aimDownSights = false;

let ammo = MAX_AMMO;
let lastshotSeed = 0;
let stepcount = 0;

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

const degreesToRadians = (deg) => {
  return deg * (Math.PI / 180);
};

const getHowlerVectors = () => {
  // Convert pitch, yaw, and roll from degrees to radians
  let pitch = degreesToRadians(90 - look.p);
  let yaw = degreesToRadians(180 - look.y);
  let roll = degreesToRadians(look.r);

  // Calculate the forward vector
  let forward = {
    x: Math.cos(pitch) * Math.sin(yaw),
    y: Math.sin(pitch),
    z: Math.cos(pitch) * Math.cos(yaw),
  };

  // Calculate the up vector
  let up = {
    x:
      -Math.cos(roll) * Math.sin(yaw) -
      Math.sin(roll) * Math.sin(pitch) * Math.cos(yaw),
    y: Math.sin(roll) * Math.cos(pitch),
    z:
      Math.cos(roll) * Math.cos(yaw) -
      Math.sin(roll) * Math.sin(pitch) * Math.sin(yaw),
  };

  return { forward, up };
};

document.addEventListener("DOMContentLoaded", () => {
  const dialog = document.querySelector("dialog");
  dialog.showModal();
  document.querySelector("dialog input").value =
    localStorage.getItem("@css3d/playerName") || "";

  document.querySelector("dialog form").addEventListener("submit", () => {
    playerName = document.querySelector("dialog input").value;
    setSelfName(playerName);
    broadcast(JSON.stringify({ name: playerName }));
    localStorage.setItem("@css3d/playerName", playerName);

    dialog.close();
    dialog.remove();
    scene.requestPointerLock();
  });

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
      velocity.x * Math.cos(degreesToRadians(look.y)) +
      velocity.y * Math.sin(degreesToRadians(look.y))
    }px, ${Math.max(
      -10,
      velocity.x * Math.sin(degreesToRadians(look.y)) +
        velocity.y * Math.cos(degreesToRadians(look.y)) +
        velocity.z -
        look.p / (aimDownSights ? 24 : 2)
    )}px, ${ducking ? 40 : 0}px)`;

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
    if (dialog.open || document.pointerLockElement || chatOpen) {
      return;
    }

    scene.requestPointerLock();
  });

  document.addEventListener("mousemove", (event) => {
    if (!document.pointerLockElement || chatOpen) {
      return;
    }

    look.p += event.movementY / (aimDownSights ? 14 : 2);
    look.y += event.movementX / (aimDownSights ? 14 : 2);
    look.y %= 360;

    if (look.p > 90) {
      look.p = 90;
    }

    if (look.p < -90) {
      look.p = -90;
    }

    display();
    const { forward, up } = getHowlerVectors();
    Howler.pos(pos.x, pos.y, pos.z + FACE_SIZE / 2);
    // FIXME: sound orientation does not work
    Howler.orientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);

    if (event.movementX) {
      broadcast(serializeState());
    }
  });

  let keys = {};
  document.addEventListener("keydown", (event) => {
    if (!document.pointerLockElement || chatOpen) {
      return;
    }

    event.preventDefault();
    keys[event.key.toLowerCase()] = true;
  });

  document.addEventListener("keyup", (event) => {
    if (!document.pointerLockElement) {
      return;
    }

    if (chatOpen) {
      keys = {};
      return;
    }

    event.preventDefault();
    keys[event.key.toLowerCase()] = false;
  });

  let shooting = false;
  document.addEventListener("mousedown", (event) => {
    if (!document.pointerLockElement || chatOpen) {
      return;
    }

    if (event.button === 0) {
      const highlight = document.querySelector(".highlight");
      if (keys["e"] && !shooting && highlight) {
        const face = highlight.id.slice(1);
        FACES[face] = "red";
        highlight.classList.remove("highlight");
        highlight.style.backgroundColor = "red";

        broadcast(
          JSON.stringify({
            addFace: face,
          })
        );
        return;
      }

      shooting = true;

      if (ammo) {
        document.querySelector("#viewmodel-animation").classList.add("active");
      }

      return;
    }

    if (event.button === 2) {
      aimDownSights = true;
      document
        .querySelector("#viewmodel-animation .viewmodel")
        .classList.add("aim-down-sights");

      document.querySelector(".aim-backdrop").classList.add("active");

      document
        .querySelector(":root")
        .style.setProperty("--perspective", `${PERSPECTIVE}px`);
    }
  });

  document.addEventListener("mouseup", (event) => {
    if (!document.pointerLockElement) {
      return;
    }

    if (event.button === 0) {
      shooting = false;
      document.querySelector("#viewmodel-animation").classList.remove("active");

      if (ammo !== 0) {
        play("shell");
      }
    }

    if (event.button === 2) {
      aimDownSights = false;
      document
        .querySelector("#viewmodel-animation .viewmodel")
        .classList.remove("aim-down-sights");

      document.querySelector(".aim-backdrop").classList.remove("active");

      document
        .querySelector(":root")
        .style.setProperty("--perspective", `${PERSPECTIVE}px`);
    }
  });

  let lastframe = Date.now();
  let lastframeStep = Date.now();
  const loop = () => {
    const stateBefore = serializeState();

    const angle = (look.y * Math.PI) / 180;
    const world = getWorld();

    const v = {
      x: (keys["a"] ?? false) - (keys["d"] ?? false),
      y: (keys["s"] ?? false) - (keys["w"] ?? false),
      z: keys[" "] ?? false,
    };

    ducking = keys["shift"];

    if (v.x && v.y) {
      v.x *= 0.7071067811865475;
      v.y *= 0.7071067811865475;
    }

    v.x *= SPEED * (ducking || aimDownSights ? 0.5 : 1);
    v.y *= SPEED * (ducking || aimDownSights ? 0.5 : 1);
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
        play("step", stepcount++ % 2 === 0 ? "a" : "b");
      }

      velocity.z = 0;
      jumping = false;
    }

    pos.x = Math.max(0, Math.min((MAP_SIZE - 1) * FACE_SIZE, pos.x));
    pos.y = Math.max(0, Math.min((MAP_SIZE - 1) * FACE_SIZE, pos.y));
    pos.z = Math.max(-5, Math.min((MAP_SIZE - 1) * FACE_SIZE, pos.z));

    Howler.pos(pos.x, pos.y, pos.z);

    look.r *= 0.9;

    if (BULLET_RATE <= Date.now() - lastframe) {
      lastframe = Date.now();

      if (shooting && ammo) {
        lastshotSeed = Math.random();

        look.y += (Math.random() - 0.5) * (aimDownSights || ducking ? 1 : 3);
        look.p += (Math.random() - 0.5) * (aimDownSights || ducking ? 1 : 3);
        look.r += (Math.random() - 0.5) * (aimDownSights || ducking ? 1 : 3);

        const target = document
          .elementsFromPoint(
            window.innerWidth / 2 + (Math.random() * 6 - 3),
            window.innerHeight / 2 + (Math.random() * 6 - 3)
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
          const damage = (+target.el.getAttribute("damage") || 0) + 1;
          target.el.setAttribute("damage", damage);
          target.el.style.setProperty("--grid-size", 100 / (damage * 2) + "%");

          if (10 < damage) {
            FACES[target.el.id.slice(1)] = undefined;
            target.el.parentElement.remove();
            broadcast(
              JSON.stringify({
                removeFace: target.el.id.slice(1),
              })
            );
          } else {
            broadcast(
              JSON.stringify({
                damageFaceId: target.el.id.slice(1),
                damageFace: damage,
              })
            );
          }
        }

        if (target?.playerId) {
          send(
            target.playerId,
            JSON.stringify({
              damage: target.damage,
              v: target.v,
            })
          );
          gainScore(target.damage);
        }

        ammo--;

        play("shot");

        if (ammo === 0) {
          play("shell");
          document
            .querySelector("#viewmodel-animation")
            .classList.remove("active");
        }
      } else if (shooting) {
        play("empty", "empty");
      }

      if (!shooting && ammo < MAX_AMMO && Math.random() < 0.2) {
        ammo++;
      }
    }

    if (STEP_RATE <= Date.now() - lastframeStep) {
      lastframeStep = Date.now();

      if ((Math.round(velocity.x) || Math.round(velocity.y)) && !velocity.z) {
        play("step", stepcount++ % 2 === 0 ? "a" : "b");
      }
    }

    document.querySelector(".highlight")?.parentElement?.remove();
    if (keys["e"]) {
      const target = document
        .elementsFromPoint(
          window.innerWidth / 2 + (Math.random() * 6 - 3),
          window.innerHeight / 2 + (Math.random() * 6 - 3)
        )
        .filter((el) => el.classList.contains("face"))
        .map((el) => {
          const face = faceKeyFrom(el.id.slice(1));

          if (face) {
            const dx = world.x - face.x;
            const dy = world.y - face.y;
            const dz = world.z - face.z;

            const dist2 = dx * dx + dy * dy + dz * dz;

            if (9 < dist2) {
              return undefined;
            }

            return { el, dist2 };
          }

          return undefined;
        })
        .sort((a, b) => a?.dist2 - b?.dist2)[0];

      if (target?.el) {
        const face = faceKeyFrom(target.el.id.slice(1));

        const axis =
          face.face !== "z" ? "z" : Math.round(look.y / 30) % 2 ? "x" : "y";

        let face2 = faceKey(face.x, face.y, face.z, axis);

        if (!FACES[face2]) {
          drawFace(face2);
          document.querySelector(`#k${face2}`)?.classList?.add("highlight");
        } else {
          const possibleFaces = [];

          const axisList = ["x", "y", "z"];
          axisList.splice(axisList.indexOf(axis), 1);
          axisList.unshift(axis);

          for (const axis of axisList) {
            const axisList2 = ["x", "y", "z"];
            axisList2.splice(axisList2.indexOf(axis), 1);
            axisList2.unshift(axis);

            for (const a2 of axisList2) {
              for (let i = -1; i <= 1; i += 2) {
                const deltaFace = {
                  ...face,
                  axis,
                  [a2]: Number.parseInt(face[a2]) + i,
                };

                if (deltaFace[a2] < 0 || MAP_SIZE <= deltaFace[a2]) {
                  continue;
                }

                face2 = faceKey(
                  deltaFace.x,
                  deltaFace.y,
                  deltaFace.z,
                  deltaFace.axis
                );

                possibleFaces.push(face2);
              }
            }
          }

          for (const face2 of possibleFaces) {
            if (!FACES[face2]) {
              drawFace(face2);
              document.querySelector(`#k${face2}`)?.classList?.add("highlight");
              break;
            }
          }
        }
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

      play("hurt");

      if (health <= 0) {
        health = 100;
        armor = 100;

        pos =
          SPAWN_POINTS[Math.round(Math.random() * (SPAWN_POINTS.length - 1))];
        broadcast(serializeState());

        getKilledByPeer(peer);
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
