"use strict";

const PREFIX = "css3dv2-";
const MAX_CLIENTS = 10;

let peer;
const connections = {};

const broadcast = (data) => {
  for (const conn of Object.values(connections)) {
    conn.send(data);
  }
};

const send = (id, data) => {
  const conn = connections[id];

  if (conn) {
    conn.send(data);
  }
};

const callbacks = [];
const registerCallback = (f) => callbacks.push(f);
const cleanups = [];
const registerCleanup = (f) => cleanups.push(f);

document.addEventListener("beforeunload", () => {
  if (peer) {
    console.log("destroying peer");
    peer.destroy();
  }
});

const createPeer = (postfix) =>
  new Promise((resolve, reject) => {
    const peer = new Peer(`${PREFIX}${postfix}`);

    peer.on("open", () => resolve(peer));
    peer.on("error", reject);
  });

const createConnection = (peer, id) =>
  new Promise((resolve, reject) => {
    const conn = peer.connect(id);

    const timeout = setTimeout(() => reject(new Error("timeout")), 1000);
    conn.on("open", () => {
      clearTimeout(timeout);
      resolve(conn);
    });
    conn.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

document.addEventListener("DOMContentLoaded", async () => {
  let i = 0;

  for (; i < MAX_CLIENTS; i++) {
    try {
      peer = await createPeer(i);
      break;
    } catch (error) {
      if (error.type !== "unavailable-id") {
        console.error(e);
        return;
      }

      continue;
    }
  }

  if (!peer) {
    console.error("Could not create peer");
    return;
  }

  console.log("got id", peer.id);

  peer.on("connection", (conn) => {
    console.log("incoming connection from", conn.peer);
    connections[conn.peer] = conn;

    conn.on("open", () => {
      console.log("connection open to", conn.peer);

      // sending the current state to the new connection
      conn.send(JSON.stringify({ FACES }));
      conn.send(serializeState());
      conn.send(JSON.stringify({ stats }));
    });

    conn.on("data", (data) => {
      try {
        data = JSON.parse(data);
        callbacks.forEach((f) => f(conn.peer, data));
      } catch (e) {
        console.warn("invalid data", data);
        return;
      }
    });
    conn.on("close", () => {
      console.log("closing connection to", conn.peer);
      delete connections[conn.peer];
      cleanups.forEach((f) => f(conn.peer));
    });
  });

  for (let j = 0; j < MAX_CLIENTS; j++) {
    if (j === i || connections[`${PREFIX}${j}`]) {
      continue;
    }

    try {
      console.log("connecting to", `${PREFIX}${j}`);
      const conn = await createConnection(peer, `${PREFIX}${j}`);
      connections[conn.peer] = conn;
      console.log("connecting to", `${PREFIX}${j}`, "done");
      conn.send(serializeState());
      conn.send(JSON.stringify({ name: playerName }));

      conn.on("data", (data) => {
        callbacks.forEach((f) => f(conn.peer, JSON.parse(data)));
      });
      conn.on("close", () => {
        console.log("closing connection to", conn.peer);
        delete connections[conn.peer];
        cleanups.forEach((f) => f(conn.peer));
      });
    } catch (e) {}
  }
});
