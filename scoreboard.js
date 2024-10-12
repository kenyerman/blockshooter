"use strict";

let stats = {};

const refreshTable = () => {
  const tbody = scoreboard.querySelector("#scoreboard tbody");
  tbody.innerHTML = "";

  Object.values(stats)
    .sort((a, b) => b.score - a.score)
    .forEach((data) => {
      const tr = document.createElement("tr");

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
    if (e.key !== "Tab") {
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
