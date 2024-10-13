"use strict";

let chatOpen = false;

document.addEventListener("DOMContentLoaded", () => {
  const chatInputField = document.querySelector("#chat-input");
  const chatInput = document.querySelector("#chat-input input");

  const addMessage = (peerId, message) => {
    const name = stats[peerId]?.name || "Unknown";
    const chat = document.querySelector("#chat");

    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    const nameElement = document.createElement("span");
    nameElement.classList.add("name");
    nameElement.textContent = name + ": ";

    const msgElement = document.createElement("span");
    msgElement.classList.add("msg");
    msgElement.textContent = message;

    messageElement.appendChild(nameElement);
    messageElement.appendChild(msgElement);
    chat.appendChild(messageElement);

    if (7 < chat.children.length) {
      chat.removeChild(chat.children[0]);
    }
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "c" && !chatOpen) {
      chatOpen = true;

      event.preventDefault();
      chatInputField.classList.add("active");
      chatInput.focus();
      return;
    }

    if (event.key === "Enter" && chatOpen) {
      chatOpen = false;

      const message = chatInput.value?.trim();

      if (message) {
        addMessage(peer.id, message);
        broadcast(JSON.stringify({ message }));
      }

      chatInputField.classList.remove("active");
      chatInput.value = "";
      chatInput.blur();
      return;
    }
  });

  registerCallback((peerId, data) => {
    const { message } = data;

    if (message) {
      addMessage(peerId, message);
    }
  });
});
