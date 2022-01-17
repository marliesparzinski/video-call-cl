/* eslint-disable no-dupe-class-members */
import express from "express";
import { Server as SocketIO } from "socket.io";
import { createServer } from "http";
//import path from "path";
import { createApp } from "vue";
import { renderToString } from "@vue/server-renderer";
import cors from "cors";

const DEFAULT_PORT = 8081;
export class Server {
  #httpServer;
  #app;
  #io;

  constructor() {
    //const __filename = fileURLToPath(import.meta.url);
    //this.__dirname = dirname(__filename);
    this.activeSockets = [];
    console.log("hoi");

    this.#initialize();
  }

  #handleSocketConnection() {
    console.log("connecting socket?");
    this.#io.on("connection", (socket) => {
      console.log("Socket connected.");

      const existingSocket = this.activeSockets.find(
        (existingSocket) => existingSocket === socket.id
      );

      if (!existingSocket) {
        this.activeSockets.push(socket.id);

        socket.emit("update-user-list", {
          users: this.activeSockets.filter(
            (existingSocket) => existingSocket !== socket.id
          ),
        });

        socket.broadcast.emit("update-user-list", {
          users: [socket.id],
        });
      }

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
    const PORT = process.env.PORT || 8081;
    this.#httpServer.listen(DEFAULT_PORT, () => callback(DEFAULT_PORT));
  }

  #configureApp() {
    //this.#app.use(express.static(path.join(this.__dirname, "../public")));
    // this.#app.get("/", (req, res) => {
    //   res.sendFile(__dirname + "/index.html");
    // });
    this.#app.get("*", async (req, res) => {
      res.setHeader("Content-Type", "text/html");
      res.send("");

      //res.end(html);
    });
  }

  #initialize() {
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
    this.#configureApp();
    this.#handleSocketConnection();
  }
}

const server = new Server();

server.listen((port) => {
  console.log(`Server is listening on http://localhost:${port}`);
});
