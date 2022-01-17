import { io } from "socket.io-client";

class SocketService {
  socket;
  constructor() {}

  setupSocketConnection() {
    this.socket = io("localhost:8082", {
      eventSource: { withCredentials: false },
      extraHeaders: {
        "my-custom-header": "abcd",
      },
    }).connect();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketService();
