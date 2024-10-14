"use strict";

let stats = {};

const showDeathMessage = (killerId, victimId) => {
  const killerName = stats[killerId]?.name || "Unknown";
  const victimName = stats[victimId]?.name || "Unknown";

  const killer = document.createElement("span");
  killer.textContent = killerName;
  if (killerId === peer.id) {
    killer.classList.add("self");
  }

  const message = document.createElement("span");
  message.textContent = " killed ";

  const victim = document.createElement("span");
  victim.textContent = victimName;
  if (victimId === peer.id) {
    victim.classList.add("self");
  }

  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.appendChild(killer);
  messageElement.appendChild(message);
  messageElement.appendChild(victim);

  const deathmessages = document.querySelector("#deathmessages");
  deathmessages.appendChild(messageElement);

  if (4 < deathmessages.children.length) {
    deathmessages.removeChild(deathmessages.children[0]);
  }
};

const refreshTable = () => {
  const tbody = scoreboard.querySelector("#scoreboard tbody");
  tbody.innerHTML = "";

  document.querySelector("#scoreboard h1 div").textContent = `players: ${
    Object.keys(stats).length
  } / ${MAX_CLIENTS}`;

  Object.entries(stats)
    .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
    .forEach(([id, data]) => {
      const tr = document.createElement("tr");

      if (id === peer.id) {
        tr.classList.add("self");
      }

      const name = document.createElement("td");
      const score = document.createElement("td");
      const kills = document.createElement("td");
      const deaths = document.createElement("td");

      name.textContent = data.name || data.peer;
      score.textContent = data.score || 0;
      kills.textContent = data.kills || 0;
      deaths.textContent = data.deaths || 0;

      tr.appendChild(name);
      tr.appendChild(score);
      tr.appendChild(kills);
      tr.appendChild(deaths);

      tbody.appendChild(tr);
    });
};

const setSelfName = (name) => {
  stats[peer.id] = {
    ...stats[peer.id],
    name,
  };

  refreshTable();
};

const getKilledByPeer = (killedById) => {
  const deaths = (stats[peer.id]?.deaths || 0) + 1;

  stats[peer.id] = {
    ...stats[peer.id],
    deaths,
  };

  stats[killedById] = {
    ...stats[killedById],
    kills: (stats[killedById]?.kills || 0) + 1,
  };

  broadcast(JSON.stringify({ killedById, deaths }));

  showDeathMessage(killedById, peer.id);
};

const gainScore = (amount) => {
  const score = (stats[peer.id]?.score || 0) + amount;

  stats[peer.id] = {
    ...stats[peer.id],
    score,
  };

  broadcast(JSON.stringify({ score }));
};

document.addEventListener("DOMContentLoaded", () => {
  const scoreboard = document.querySelector("#scoreboard");

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || chatOpen) {
      return;
    }

    e.preventDefault();
    scoreboard.classList.add("active");
  });

  document.addEventListener("keyup", (e) => {
    if (e.key !== "Tab") {
      return;
    }

    e.preventDefault();
    scoreboard.classList.remove("active");
  });

  registerCallback((peer, data) => {
    const { name, score, deaths, killedById, stats: incomingStats } = data;

    if (name !== undefined) {
      stats[peer] = {
        ...stats[peer],
        name,
      };
    }

    if (score !== undefined) {
      stats[peer] = {
        ...stats[peer],
        score,
      };
    }

    if (deaths !== undefined) {
      stats[peer] = {
        ...stats[peer],
        deaths,
      };
    }

    if (killedById !== undefined) {
      stats[killedById] = {
        ...stats[killedById],
        kills: (stats[killedById]?.kills || 0) + 1,
      };

      showDeathMessage(killedById, peer);
    }

    if (incomingStats) {
      stats = {
        ...stats,
        ...incomingStats,
      };
    }

    refreshTable();
  });

  registerCleanup(() => {
    delete stats[peer.id];
    refreshTable();
  });
});
