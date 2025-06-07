import express from "express";
import { Server } from "socket.io";
import http from "http";
import { Chess } from "chess.js";
import path from "path";
import { fileURLToPath } from "url";

// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server);
const games = {};

const chess = new Chess();
// let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("home", { title: "Home Page" });
});

app.get("/game", (req, res) => {
  res.render("multiplayer", { tite: "Chess Game" });
});

app.get("/game/:roomId", (req, res) => {
  const gameId = req.params.roomId;
  res.render("index", { title: "Chess Game", gameId });

});

io.on("connection", (socket) => {
  console.log("Connected");

  socket.on("joinGame", (gameId) => {
    if (!games[gameId]) {
      games[gameId] = { players: {}, chess: new Chess() };
    }
    const game = games[gameId];
    const { players } = game;

    socket.join(gameId);
    socket.data.gameId = gameId;

    if (!players.white) {
      players.white = socket.id;
      socket.emit("playerRole", "w");
    } else if (!players.black) {
      players.black = socket.id;
      socket.emit("playerRole", "b");
    } else {
      socket.emit("spectatorRole");
    }

    socket.emit("boardState", game.chess.fen());
  });

  socket.on("move", (move) => {
    const roomId = socket.data.gameId;
    if (!roomId || !games[roomId]) return;

    const game = games[roomId];
    const { chess, players } = game;

    try {
      // Validate the moverow, rowIndex
      if (chess.turn() === "w" && socket.id !== players.white) return;
      if (chess.turn() === "b" && socket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.to(roomId).emit("move", move);
        io.to(roomId).emit("boardState", chess.fen());
      } else {
        console.log("Invalid Move:", move);
        socket.emit("invalidMove", move);
      }
    } catch (error) {
      console.log(error);
      socket.emit("invalidMove", move);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected", socket.id);
    const roomId = socket.data.gameId;
    if (!roomId || !games[roomId]) return;

    const game = games[roomId];
    const { players } = game;

    if (players.white === socket.id) {
      delete players.white;
    } else if (players.black === socket.id) {
      delete players.black;
    }
    if (!players.white && !players.black) {
      delete games[roomId];
    }
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
