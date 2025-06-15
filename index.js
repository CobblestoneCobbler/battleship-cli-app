import * as rs from "readline-sync";
import { Board, Ship } from "./board.js";

let shipTypes = [
  ["Crusier", 2, 1, `🟠`],
  ["Submarine", 3, 1, `🔵`],
  ["Destroyer", 3, 2, `🟣`],
  ["Battleship", 4, 3, `\u{1F7E5}`],
  ["Aircraft Carrier", 5, 1, `🟧`],
];
let boards = [];
let ships = [];
const minBoardSize = 4;
const maxBoardSize = 10;
let running = false;
let debugging = false;
let output = "";

function fireShots(shots, board, player = true) {
  for (const shot of shots) {
    let result = board.fire(shot);
    if (result !== "miss") {
      if (player) {
        output += "Your shot at ";
      } else {
        output += "The Computer's shot at ";
      }
      output += `${shot[0]}${shot[1]} has ${result}\n`;
    }
  }
}

function testShot([letter, number], shots, board, player = true) {
  if (
    shots.find((s) => {
      return s[0] === letter && s[1] === number;
    })
  ) {
    if (player) {
      output += `You are already aiming at ${letter}${number}.\n`;
    }
    return false;
  }
  if (board.getPosition([letter, number]) === "-") {
    shots.push([letter, number]);
    return true;
  } else {
    if (player) {
      output += `You can't shoot at ${letter}${number}.`;
    }
  }
}

function playerAiming(shotCount) {
  let aiming = true;
  let shots = [];
  output += `You have ${shotCount} shots this turn.`;
  while (aiming) {
    if (shots.length > 0) {
      output += `Your current shots are ${shots}. You have ${
        shotCount - shots.length
      } shots remaining.`;
    }
    updateScreen(debugging);
    console.log(output);
    output = "";
    debugging = false;

    let shot = rs.question("Where would you like to fire? ");
    if (shot.length > 0) {
      shot = shot.trim().toLowerCase().replaceAll(" ", "").replaceAll(",", "");
    } else {
      console.log("You cant leave this empty.");
      continue;
    }
    if (shot === "end") {
      running = false;
      break;
    }
    if (shot === "debug") {
      debugging = true;
      continue;
    }
    while (shot.length > 0) {
      if (shotCount <= shots.length) {
        aiming = false;
        output += `No sneaking in extra shots for you. \n` + output;
        break;
      }
      testShot([shot.slice(0, 1), shot.slice(1, 2)], shots, boards[1]);
      shot = shot.slice(2);
      if (shotCount - shots.length === 0) {
        aiming = false;
        break;
      }
    }
  }
  fireShots(shots, boards[1]);
}

function aimAroundShip(ship, shots) {
  let undecided = true;
  let letter, number;
  let positions = ship.getHitPositions();
  if (positions.length > 1) {
    let dir, axis;
    let distance = 1;
    if (positions[0][0] === positions[1][0]) {
      letter = positions[0][0];
      axis = 1;
    } else {
      number = positions[0][1];
      axis = 0;
    }
    if (positions[0][axis] < positions[1][axis]) {
      dir = "pos";
    } else {
      dir = "neg";
      distance = -1;
    }
    while (undecided) {
      if (axis === 1) {
        //number moves
        number = positions[0][axis] + distance;
        if (number >= boards[0].getSize()) {
          distance = 0;
          dir = "neg";
        }
        if (number < 0) {
          distance = 0;
          dir = "pos";
        }
      } else {
        letter = String.fromCharCode(
          positions[0][axis].charCodeAt(0) + distance
        );
        if (letter.charCodeAt(0) > boards[0].getSize() + 96) {
          distance = 0;
          dir = "neg";
        }
        if (letter < "a") {
          distance = 0;
          dir = "pos";
        }
      }

      if (testShot([letter, number], shots, boards[0], false)) {
        undecided = false;
      } else if (boards[0].getPosition([letter, number]) === "X") {
        distance = 0;
        if (dir === "pos") {
          dir = "neg";
        } else {
          dir = "pos";
        }
      } else {
        if (dir === "pos") {
          distance++;
        } else {
          distance--;
        }
      }
    }
  } else {
    let letter, number;
    while (undecided) {
      switch (Math.floor(Math.random() * 4)) {
        case 0: {
          letter = String.fromCharCode(positions[0][0].charCodeAt(0) - 1);
          number = positions[0][1];
          break;
        }
        case 1: {
          letter = String.fromCharCode(positions[0][0].charCodeAt(0) + 1);
          number = positions[0][1];
          break;
        }
        case 2: {
          letter = positions[0][0];
          number = positions[0][1] - 1;
          break;
        }
        case 3: {
          letter = positions[0][0];
          number = positions[0][1] + 1;
          break;
        }
        default: {
          output += "AI aimAroundShip MathRand out of scope";
        }
      }
      if (testShot([letter, number], shots, boards[0], false)) {
        undecided = false;
      }
    }
  }
}

function aimRandom(shots) {
  let undecided = true;
  let letter, number;
  while (undecided) {
    letter = String.fromCharCode(
      Math.floor(Math.random() * boards[0].getSize()) + 97
    );
    number = Math.floor(Math.random() * boards[0].getSize());
    if (testShot([letter, number], shots, boards[0], false)) {
      undecided = false;
    }
  }
}

function aiAiming(shotCount) {
  let shots = [];
  let ships = boards[0].getRevealedShips();
  let aiming = true;
  if (ships) {
    for (let ship of ships) {
      if (shotCount <= shots.length) {
        aiming = false;
        break;
      }
      aimAroundShip(ship, shots);
    }
  }
  while (aiming) {
    if (shotCount <= shots.length) {
      aiming = false;
      break;
    }
    aimRandom(shots);
  }
  fireShots(shots, boards[0], false);
}

function updateScreen(debugging = false) {
  console.clear();
  boards[1].printBoard(debugging);
  console.log("\n\n-----------------------------------------------\n\n");
  boards[0].printBoard(debugging);
}

function main() {
  running = true;
  let output = "";
  while (running) {
    let playerShots = boards[0].getShips().reduce((acc, n) => {
      if (n.isSunk() === false) {
        acc += n.getShots();
      }
      return acc;
    }, 0);
    let availableShots = boards[1].getAvailableShots();
    if (availableShots < playerShots) {
      playerShots = availableShots;
    }
    updateScreen();
    console.log(`You have ${playerShots} shots this turn.`);
    playerAiming(playerShots);

    if (
      !boards[1].getShips().find((n) => {
        return !n.isSunk();
      })
    ) {
      updateScreen();
      console.log(output);
      console.log(`You've sunk them all!\n========
__   _______ _   _   _    _ _____ _   _
\\ \\ / /  _  | | | | | |  | |_   _| \\ | |
 \\ V /| | | | | | | | |  | | | | |  \\| |
  \\ / | | | | | | | | |/\\| | | | | . ' |
  | | \\ \\_/ / |_| | \\  /\\  /_| |_| |\\  |
  \\_/  \\___/ \\___/   \\/  \\/ \\___/\\_| \\_/
========`);
      running = false;
      break;
    }

    //ai
    let aiShots = boards[1].getShips().reduce((acc, n) => {
      if (n.isSunk() === false) {
        acc += n.getShots();
      }
      return acc;
    }, 0);
    availableShots = boards[0].getAvailableShots();
    if (availableShots < aiShots) {
      aiShots = availableShots;
    }
    aiAiming(aiShots);
    if (
      !boards[0].getShips().find((n) => {
        return !n.isSunk();
      })
    ) {
      updateScreen();
      console.log("Your fleet has been destroyed...");
      running = false;
    }
  }
}

function setup(size, fleetSize) {
  let playerBoard = new Board("Your Board", size);
  let aiBoard = new Board("Computer Board", size);
  ships = [];
  let graded = false;
  let directions = ["n", "s", "e", "w"];
  if (size > 4 && size < 7) {
    graded = rs.keyInYN("Are you here to grade this? ");
  }
  for (let i = fleetSize - 1; i >= 0; i--) {
    let ship;
    if (graded) {
      if (size === 5 && i === 2) {
        ship = new Ship(shipTypes[i][0], 2, 1, shipTypes[i][3]);
      } else if (size === 6 && i === 3) {
        ship = new Ship("Corvette", 2, 1, "CV");
      } else {
        ship = new Ship(
          shipTypes[i][0],
          shipTypes[i][1],
          shipTypes[i][2],
          shipTypes[i][3]
        );
      }
    } else {
      ship = new Ship(
        shipTypes[i][0],
        shipTypes[i][1],
        shipTypes[i][2],
        shipTypes[i][3]
      );
    }
    console.clear();
    playerBoard.printBoard(true);
    ships.push(ship);
    let unset = true;
    while (unset) {
      let position = rs.question(
        `Where would you like to place the front of your ${ship.getName()}? It is ${ship.getLength()} tiles long.  `
      );
      if (position === "end") {
        console.log("Rethinking are we..");
        return "skip";
      }
      let direction = rs.keyInSelect(
        directions,
        `And which direction should she be sailing?  `
      );
      if (direction === -1) {
        console.log("Change your mind? ");
        continue;
      }
      if (
        playerBoard.addShip(ship, position, directions[direction]) === false
      ) {
        console.log(
          `Sailing ${directions[direction]}, with the front at ${position}, is not able to happen.`
        );
      } else {
        unset = false;
      }
    }
  }
  for (let i = fleetSize - 1; i >= 0; i--) {
    let ship;
    if (graded) {
      if (size === 5 && i === 2) {
        ship = new Ship(shipTypes[i][0], 2, 1, shipTypes[i][3]);
      } else if (size === 6 && i === 3) {
        ship = new Ship("Corvette", 2, 1, "🟢");
      } else {
        ship = new Ship(
          shipTypes[i][0],
          shipTypes[i][1],
          shipTypes[i][2],
          shipTypes[i][3]
        );
      }
    } else {
      ship = new Ship(
        shipTypes[i][0],
        shipTypes[i][1],
        shipTypes[i][2],
        shipTypes[i][3]
      );
    }
    ships.push(ship);
    let unset = true;
    while (unset) {
      let direction;
      switch (Math.floor(Math.random() * 4)) {
        case 0:
          direction = "n";
          break;
        case 1:
          direction = "s";
          break;
        case 2:
          direction = "e";
          break;
        case 3:
          direction = "w";
        default:
          direction = "n";
          break;
      }
      let letter = String.fromCharCode(Math.floor(Math.random() * size) + 97);
      let number = Math.floor(Math.random() * size);
      if (aiBoard.addShip(ship, [letter, number], direction)) {
        unset = false;
      }
    }
  }
  boards = [playerBoard, aiBoard];
}
let playing = true;
console.log("Welcome to Battleship");
while (playing) {
  console.log("Let's setup a game.");
  let size = 0;
  let fleetSize = 0;
  while (size === 0) {
    size = rs.questionInt("How big of a board do you want? (4-10)");
    if (size < 3) {
      console.log(`A board of ${size} is a bit lame. Dream a little bigger.`);
      size = 0;
    } else if (size < 7) {
      fleetSize = size - 2;
    } else if (size < 10) {
      fleetSize = 4;
    } else if (size === 10) {
      fleetSize = 5;
    } else {
      console.log(`${size} is a bit too big for me.`);
      size = 0;
    }
  }

  if (setup(size, fleetSize) !== "skip") {
    main();
  }

  if (rs.keyInYN("Would you like to play again?")) {
    console.log("Awesome!");
  } else {
    playing = false;
  }
}
console.log("Thank you for playing.");
