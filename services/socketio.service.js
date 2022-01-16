import { io } from "socket.io";

class SocketioService {
  socket;
  constructor() {}

  setupSocketConnection() {
    console.log("making socket....");
    this.socket = io(process.env.VUE_APP_SOCKET_ENDPOINT);
  }
}

export default new SocketioService();
