/* eslint-disable no-dupe-class-members */
import express from "express";
import { Server as SocketIO } from "socket.io";
import { createServer } from "http";
import cors from "cors";

const DEFAULT_PORT = 8081;
export class Server {
  #httpServer;
  #app;
  #io;
  users = {};

  constructor() {
    this.activeSockets = [];

    this.#initialize();
  }

  #initialize() {
    console.log("initializing socket server side...");
    this.#app = express();
    this.#app.use(cors());
    this.#app.options("*", cors());
    this.#httpServer = createServer(this.#app);
    this.#io = new SocketIO(this.#httpServer, {
      allowEIO3: true,
      cors: {
        origin: "http://localhost:8081",
      },
    });
    this.user;
    this.#configureApp();
    this.#handleSocketConnection();
    this.users = {};
  }

  #handleSocketConnection() {
    this.#io.on("connection", (socket) => {
      socket.on("set-username", (data) => {
        if (!this.users[data.username]) {
          this.users[data.username] = [data.usersocket];
        }

        const existingSocket = this.activeSockets.find(
          (existingSocket) => existingSocket === data.usersocket
        );

        if (!existingSocket) {
          this.activeSockets.push(data.usersocket);

          socket.emit("update-user-list", {
            allUsers: this.users,
            users: this.activeSockets.filter(
              (existingSocket) => existingSocket !== data.usersocket
            ),
            userName: data.username,
          });

          socket.broadcast.emit("update-user-list", {
            allUsers: this.users,
            users: [data.usersocket],
            userName: data.username,
          });
        }
      });

      socket.on("disconnect", () => {
        this.activeSockets = this.activeSockets.filter(
          (existingSocket) => existingSocket !== socket.id
        );
        socket.broadcast.emit("remove-user", {
          socketId: socket.id,
        });
      });

      socket.on("call-user", (data) => {
        socket.to(data.to).emit("call-made", {
          offer: data.offer,
          socket: socket.id,
        });
      });

      socket.on("make-answer", (data) => {
        socket.to(data.to).emit("answer-made", {
          socket: socket.id,
          answer: data.answer,
        });
      });
    });
  }

  listen(callback) {
    this.#httpServer.listen(DEFAULT_PORT, () => callback(DEFAULT_PORT));
  }

  #configureApp() {
    this.#app.get("*", async (req, res) => {
      res.setHeader("Content-Type", "text/html");
      res.send("");
    });
  }
}

const server = new Server();

server.listen((port) => {
  console.log(`Server is listening on http://localhost:${port}`);
});
