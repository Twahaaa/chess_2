//@ts-ignore
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// const renderBoard = () => {
//   const board = chess.board();
//   boardElement.innerHTML = "";

//   boardElement.classList.add(
//     "grid",
//     "grid-cols-8",
//     "w-full",
//     "max-w-[400px]",
//     "aspect-square"
//   );

//   // Flip rows for white player to have correct orientation
//   const displayBoard = playerRole === "w" ? board : [...board].reverse();

//   displayBoard.forEach((row, displayRowIndex) => {
//     row.forEach((square, colIndex) => {
//       // Calculate original rowIndex (0 at top, 7 at bottom)
//       const rowIndex =
//         playerRole === "w" ? displayRowIndex : 7 - displayRowIndex;

//       const squareElement = document.createElement("div");
//       squareElement.classList.add(
//         "w-full",
//         "aspect-square",
//         "flex",
//         "items-center",
//         "justify-center",
//         (rowIndex + colIndex) % 2 === 0 ? "bg-orange-100" : "bg-green-600"
//       );
//       squareElement.dataset.row = rowIndex;
//       squareElement.dataset.col = colIndex;

//       if (square) {
//         const pieceElement = document.createElement("div");
//         pieceElement.classList.add(
//           "text-xl",
//           "select-none",
//           "cursor-grab",
//           square.color === "w" ? "text-white" : "text-black"
//         );
//         //   pieceElement.innerText = getPieceUnicode(square);
//         const pieceImg = getPieceImage(square);
//         if (pieceImg) pieceElement.appendChild(pieceImg);
//         pieceElement.draggable = playerRole === square.color;

//         pieceElement.addEventListener("dragstart", (e) => {
//           if (pieceElement.draggable) {
//             draggedPiece = pieceElement;
//             sourceSquare = { row: rowIndex, col: colIndex };
//             e.dataTransfer.setData("text/plain", ""); // Required for Firefox
//           }
//         });

//         pieceElement.addEventListener("dragend", () => {
//           draggedPiece = null;
//           sourceSquare = null;
//         });

//         squareElement.appendChild(pieceElement);
//       }

//       squareElement.addEventListener("dragover", (e) => e.preventDefault());
//       squareElement.addEventListener("drop", (e) => {
//         e.preventDefault();
//         if (draggedPiece) {
//           const targetSquare = {
//             row: parseInt(squareElement.dataset.row),
//             col: parseInt(squareElement.dataset.col),
//           };
//           handleMove(sourceSquare, targetSquare);
//         }
//       });

//       boardElement.appendChild(squareElement);
//     });
//   });
// };

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
            dragPreview.style.width = "40px"; // or same as original
            dragPreview.style.height = "40px";
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

socket.on("playerRole", (role) => {
  playerRole = role;
  render();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  render();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  render();
});

socket.on("move", (move) => {
  chess.move(move);
  render();
});

render();
