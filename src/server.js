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
      const app = createApp({
        data() {
          return {
            user: "John Doe",
          };
        },
        template: `
   
            <div id="app">
              <div class="container">
                <header class="header">
                  <div class="logo-container">
                    <h1 class="logo-text">
                      Video call Server Side
                    </h1>
                  </div>
                </header>
                <div class="content-container">
                  <div class="active-users-panel" id="active-user-container">
                    <h3 class="panel-title">Active Users:</h3>
                  </div>
                  <div class="video-chat-container">
                    <h2 class="talk-info" id="talking-with-info"> 
                      Select active user on the left menu.
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
`,
      });

      const appContent = await renderToString(app);
      const html = `
      <html>
      <head>
      <base href="/" />
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title><%= htmlWebpackPlugin.options.title %></title>
  
    </head>
        <body>
          <h1>My First Heading hoi</h1>
          <div id="app"></div>
        </body>
      </html>
      `
        .toString()
        .replace('<div id="app">', `<div id="app">${appContent}`);
      res.setHeader("Content-Type", "text/html");
      res.send(html);

      //res.end(html);
    });

    // this.#app.get("/", (req, res) => {
    //   res.sendFile(__dirname + "/index.html");
    // });
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
