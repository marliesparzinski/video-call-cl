<template>
  <div class="content">
    <div class="header">
      <h2 class="title">Welcome {{ username }} </h2>
      <p class="talking-to" v-if="conversing">You are now talking to {{connectedSocketId}}</p>
    </div>
    <div class="video-app">
      <div class="sidebar">
        <h3 class="sidebar-title">Active Users</h3>
        <p class="talk-info" id="talking-with-info"> 
          (Click on a user to talk)
        </p>
        <div class="active-users" id="active-user-container">
        </div>
      </div>
      <div class="video-chat">
        <div class="video-chat-container">
          <div :class="{ remoteActive: streamingRemote }" class="video-container">
            <video autoplay class="remote-video" id="remote-video"></video>
            <video autoplay muted class="local-video" id="local-video"></video>
            <div class="giphy"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
// client side
import { io } from "socket.io-client";
import SocketService from '../services/socket.service.js';


export default {
  name: 'HelloWorld',
  props: {
    msg: String
  }, 
  data() {
    return {
      connectedSocketId: '',
      username: '',
      socketId: '',
      streamingRemote: false,
      users: {},
    }
  },
  computed: {
    conversing() {
      return this.connectedSocketId.length > 0;
    },
    isStreamingRemote() {
      return this.streamingRemote;
    },
  },
  mounted() {


  },
  methods: {
    async callUser(socketId) {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(new RTCSessionDescription(offer));

      this.socket.emit("call-user", {
        offer,
        to: socketId,
      });
    },

    createUserItemContainer(socketId, username) {
      const userContainerEl = document.createElement("div");

      const usernameEl = document.createElement("p");

      userContainerEl.setAttribute("class", "active-user");
      userContainerEl.setAttribute("id", socketId);
      usernameEl.setAttribute("class", "username");
      usernameEl.innerHTML = `${username}`;

      userContainerEl.appendChild(usernameEl);

      userContainerEl.addEventListener("click", () => {
        this.unselectUsersFromList();
        userContainerEl.setAttribute("class", "active-user active-user--selected");
        this.connectedSocketId = username;
        this.callUser(socketId);
      });
      return userContainerEl;
    },
    updateUserList({ allUsers }) {
      const activeUserContainer = document.getElementById("active-user-container");

      Object.keys(allUsers).map((username) => {
        const alreadyExistingUser = document.getElementById(allUsers[username]);
        if (!alreadyExistingUser && allUsers[username] != this.socketId) {
          const userContainerEl = this.createUserItemContainer(allUsers[username], username);
          activeUserContainer.appendChild(userContainerEl);
          if (!this.users[allUsers[username]]) this.users[allUsers[username]] = username;
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
      this.socket = io("localhost:8082", {
      eventSource: { withCredentials: false },
    }).connect();


    this.isAlreadyCalling = false;
    // the webRTC
    const { RTCPeerConnection, RTCSessionDescription } = window;
    this.peerConnection = new RTCPeerConnection();
    this.RTCPeerConnection = RTCPeerConnection;
    this.RTCSessionDescription = RTCSessionDescription;



    this.peerConnection.ontrack = function ({ streams: [stream] }) {
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
          .forEach((track) => this.peerConnection.addTrack(track, stream));
      },
      (error) => {
        console.warn(error.message);
      }
    );

    SocketService.setupSocketConnection();  

    this.socket.on("update-user-list", ({ allUsers }) => {
      this.updateUserList({ allUsers });
    });

    this.socket.on("remove-user", ({ socketId }) => {
      const elToRemove = document.getElementById(socketId);

      if (elToRemove) {
        elToRemove.remove();
      }
    });

    this.socket.on("connect", () => {
      this.socketId = this.socket.id; 
      const username = window.prompt('Please fill in your name');
      this.username = username;
      this.socket.emit("set-username", {
        username: username,
        usersocket: this.socket.id,
      }); 
    });

    this.socket.on("call-made", async (data) => {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(new RTCSessionDescription(answer));
      this.streamingRemote = true;
      this.connectedSocketId = this.users[data.socket];
      this.socket.emit("make-answer", {
        answer,
        to: data.socket,
      });
    });

    this.socket.on("answer-made", async (data) => {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );

      if (!this.isAlreadyCalling) {
        this.callUser(data.socket);
        this.isAlreadyCalling = true;
      }

      this.streamingRemote = true;
    });
  },
  beforeUnmount() {
    SocketService.disconnect();
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
  .content {
    display: flex;
    flex-wrap: wrap;
  }

  .welcome-message {
    display: flex;
    width: 100%;
    justify-content: center;
  }

  .video-app {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
  }

  .sidebar {
    width: 20%;
  }

  .video-chat {
    width: 80%;
    flex-shrink: 0;
    display: flex;
    justify-content: stretch;
    flex-wrap: wrap;
    border: 12px solid #faf6ed;
    border-radius: 12px;
    background-color: #faf6ed;
  }

  .video-chat-container {
    width: 100%;
    border-radius: 12px;
  }

  .video-container {
    width: 100%;
  }

  .giphy {
    width: 20%;
  }

  .remoteActive {
    width: 100%;
    display: flex;
    justify-content: stretch;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .active-user {
    padding: 12px;
  }
  .active-user.active-user--selected {
    border: 1px solid #faf6ed;
    background-color: #faf6ed;
    border-radius: 12px 0 0 12px;
  }

  .remoteActive .remote-video {
    width: 70%;
  }

  .remoteActive .local-video {
    width: 30%;
    bottom: 0;
    right: 0;
  }

  .remote-video {
    border-radius: 12px 0 12px 12px;
  }

  .local-video {
    border-radius: 0 12px 12px 0;
  }

  .header {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
  }

  .talking-to, .title {
    width: 100%;
    text-align: center;
  }

  .talking-to, .title {
    margin-top: 0;
  }

  .sidebar-title, .talk-info {
    margin: 0;
    text-align: center;
    width: 100%;
  }



</style>
