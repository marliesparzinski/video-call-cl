<template>
  <!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <!-- <script src="/socket.io/socket.io.js"></script> -->

  </head>
  <body>
    <noscript>
    </noscript>
    <div id="app">
      <div class="container">
        <header class="header">
            <h1 class="logo-text">
              Cloom video call assignment
            </h1>
        </header>
        <div class="content">
          <div class="active-users" id="active-user-container">
            <h3 class="title">Active Users:</h3>
          </div>
          <div class="video-chat-container">
            <div v-if="conversing">Talking to {{connectedSocketId}}</div>
            <h2 class="talk-info" id="talking-with-info"> 
              Click on a user to talk
            </h2>
            <div class="video-container">
              <video style="border: 1px solid red;" autoplay class="remote-video" id="remote-video"></video>
              <video style="border: 1px solid blue" autoplay muted class="local-video" id="local-video"></video>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- built files will be auto injected -->

  </body>
</html>

</template>


<script>
// client side
import { io } from "socket.io-client";
import SocketService from '../services/socket.service.js';

const socket = io("localhost:8082", {
  eventSource: { withCredentials: false },
  extraHeaders: {
    "my-custom-header": "abcd",
  },
}).connect();


let isAlreadyCalling = false;
// the webRTC
const { RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection = new RTCPeerConnection();

// function unselectUsersFromList() {
//   const alreadySelectedUser = document.querySelectorAll(
//     ".active-user.active-user--selected"
//   );

//   alreadySelectedUser.forEach((el) => {
//     el.setAttribute("class", "active-user");
//   });
// }

// function updateUserList(socketIds) {
//   const activeUserContainer = document.getElementById("active-user-container");

//   socketIds.forEach((socketId) => {
//     const alreadyExistingUser = document.getElementById(socketId);
//     if (!alreadyExistingUser) {
//       const userContainerEl = createUserItemContainer(socketId);
//       activeUserContainer.appendChild(userContainerEl);
//     }
//   });
// }

// function createUserItemContainer(socketId) {
//   const userContainerEl = document.createElement("div");

//   const usernameEl = document.createElement("p");

//   userContainerEl.setAttribute("class", "active-user");
//   userContainerEl.setAttribute("id", socketId);
//   usernameEl.setAttribute("class", "username");
//   usernameEl.innerHTML = `Socket: ${socketId}`;

//   userContainerEl.appendChild(usernameEl);

//   userContainerEl.addEventListener("click", () => {
//     unselectUsersFromList();
//     userContainerEl.setAttribute("class", "active-user active-user--selected");
//     const talkingWithInfo = document.getElementById("talking-with-info");
//     talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
//     callUser(socketId);
//   });
//   return userContainerEl;
// }

// async function callUser(socketId) {
//   const offer = await peerConnection.createOffer();
//   await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

//   socket.emit("call-user", {
//     offer,
//     to: socketId,
//   });
// }



peerConnection.ontrack = function ({ streams: [stream] }) {
  const remoteVideo = document.getElementById("remote-video");
  if (remoteVideo) {
    remoteVideo.srcObject = stream;
  }
};

navigator.getUserMedia(
  { video: true, audio: true },
  (stream) => {
    const localVideo = document.getElementById("local-video");
    if (localVideo) {
      localVideo.srcObject = stream;
    }

    stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, stream));
  },
  (error) => {
    console.warn(error.message);
  }
);

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  }, 
  mounted() {
    console.log('yeeeeeu')
  },
  methods: {
    async callUser(socketId) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

      socket.emit("call-user", {
        offer,
        to: socketId,
      });
    },

    createUserItemContainer(socketId) {
      const userContainerEl = document.createElement("div");

      const usernameEl = document.createElement("p");

      userContainerEl.setAttribute("class", "active-user");
      userContainerEl.setAttribute("id", socketId);
      usernameEl.setAttribute("class", "username");
      usernameEl.innerHTML = `Socket: ${socketId}`;

      userContainerEl.appendChild(usernameEl);

      userContainerEl.addEventListener("click", () => {
        this.unselectUsersFromList();
        userContainerEl.setAttribute("class", "active-user active-user--selected");
        const talkingWithInfo = document.getElementById("talking-with-info");
        talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
        this.callUser(socketId);
      });
      return userContainerEl;
    },
    updateUserList(socketIds) {
      const activeUserContainer = document.getElementById("active-user-container");

      socketIds.forEach((socketId) => {
        const alreadyExistingUser = document.getElementById(socketId);
        if (!alreadyExistingUser) {
          const userContainerEl = this.createUserItemContainer(socketId);
          activeUserContainer.appendChild(userContainerEl);
        }
      });
    },
    unselectUsersFromList() {
      const alreadySelectedUser = document.querySelectorAll(
        ".active-user.active-user--selected"
      );

      alreadySelectedUser.forEach((el) => {
        el.setAttribute("class", "active-user");
      });
    }
  },
  created() {
    SocketService.setupSocketConnection();  

    socket.on("update-user-list", ({ users }) => {
      this.updateUserList(users);
    });

    socket.on("remove-user", ({ socketId }) => {
      const elToRemove = document.getElementById(socketId);
      console.log('remove: ', socketId);

      if (elToRemove) {
        elToRemove.remove();
      }
    });

    socket.on("call-made", async (data) => {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

      socket.emit("make-answer", {
        answer,
        to: data.socket,
      });
    });

    socket.on("answer-made", async (data) => {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );

      if (!isAlreadyCalling) {
        this.callUser(data.socket);
        isAlreadyCalling = true;
      }
    });
  },
  beforeUnmount() {
    SocketService.disconnect();
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
