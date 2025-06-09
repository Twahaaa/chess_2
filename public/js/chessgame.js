//@ts-ignore
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const render = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;
      if (square) {
        const pieceElement = document.createElement("div");
        const piece = getPieceImage(square);
        if (piece) pieceElement.appendChild(piece);
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        // pieceElement.innerText = getPieceImage(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            const dragPreview = pieceElement.cloneNode(true);

            dragPreview.style.transform = "rotate(0deg)";
            dragPreview.style.width = "60px"; // or same as original
            dragPreview.style.height = "60px";
            dragPreview.style.position = "absolute";
            dragPreview.style.top = "-9999px"; // hide from actual screen
            document.body.appendChild(dragPreview);

            e.dataTransfer.setDragImage(dragPreview, 20, 20);

            // Clean up later
            setTimeout(() => document.body.removeChild(dragPreview), 0);
          }
        });
        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }
      squareElement.addEventListener("dragover", (e) => e.preventDefault());
      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });
      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (sourceSquare, targetSquare) => {
  const move = {
    from: `${String.fromCharCode(97 + sourceSquare.col)}${
      8 - sourceSquare.row
    }`,
    to: `${String.fromCharCode(97 + targetSquare.col)}${8 - targetSquare.row}`,
    promotion: "q",
  };
  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const unicodeMap = {
    p: { w: "♙", b: "♟" },
    r: { w: "♖", b: "♜" },
    n: { w: "♘", b: "♞" },
    b: { w: "♗", b: "♝" },
    q: { w: "♕", b: "♛" },
    k: { w: "♔", b: "♚" },
  };

  if (!piece || !piece.type || !piece.color) return "";
  return unicodeMap[piece.type][piece.color];
};

const getPieceImage = (piece) => {
  if (!piece || !piece.type || !piece.color) return "";

  // Lowercase for white, Uppercase for black
  const filename =
    piece.color === "b" ? piece.type.toLowerCase() : piece.type.toUpperCase();

  const img = document.createElement("img");
  img.src = `/pieces/${filename}.png`;
  img.alt = filename;
  img.classList.add(
    "w-full",
    "h-full",
    "object-contain",
    "pointer-events-none"
  );

  return img;
};

const movesList = document.getElementById("moveslist");

let movesHistory = [];

// Function to render moves on the sidebar
function renderMoves() {
  movesList.innerHTML = "";
  movesHistory.forEach((move, index) => {
    const moveElement = document.createElement("div");
    // Show move number and move in algebraic notation
    const moveNum = Math.floor(index / 2) + 1;
    if (index % 2 === 0) {
      // White's move
      moveElement.textContent = `w: ${move}`;
    } else {
      // Black's move
      moveElement.textContent = `b: ${move}`;
    }
    movesList.appendChild(moveElement);
  });

  // Scroll to the bottom to show the latest move
  movesList.scrollTop = movesList.scrollHeight;
  
}


socket.on("playerRole", (role) => {
  playerRole = role;
  movesHistory=[];
  render();
  renderMoves();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  movesHistory=[];
  render();
  renderMoves();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  render();
});

socket.on("move", (move) => {
  chess.move(move);
  movesHistory.push(move.from+"-"+move.to);
  render();
  renderMoves();
});

render();