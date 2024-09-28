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

const callbacks = [];
const registerCallback = (f) => callbacks.push(f);

document.addEventListener("beforeunload", () => {
  if (peer) {
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

    conn.on("data", (data) => {
      callbacks.forEach((f) => f(conn.peer, JSON.parse(data)));
    });
    conn.on("close", () => {
      console.log("closing connection to", conn.peer);
      delete connections[conn.peer];
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
      conn.on("data", (data) => {
        callbacks.forEach((f) => f(conn.peer, JSON.parse(data)));
      });
      conn.on("close", () => {
        console.log("closing connection to", conn.peer);
        delete connections[conn.peer];
      });
    } catch (e) {
      console.error(e);
    }
  }
});
