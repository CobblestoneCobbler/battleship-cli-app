let rs = require("readline-sync");
import { Board, Ship } from "./board.js";
//TODO Fix the import to actually work...

let shipTypes = [
  ["Crusier", 2, 1, "C"],
  ["Submarine", 3, 1, "S"],
  ["Destroyer", 3, 2, "D"],
  ["Battleship", 4, 3, "B"],
  ["Aircraft Carrier", 5, 1, "AC"],
];
let boards = new WeakMap();
let ships = new WeakMap();
function main() {}
function setup(size, fleetSize) {
  let playerBoard = new Board("Your Board", size);
  if (fleetSize === 5) {
    for (let i = 4; i >= 0; i--) {
      let ship = new Ship(
        shipTypes[i][0],
        shipTypes[i][1],
        shipTypes[i][2],
        shipTypes[i][3]
      );
      ships.add(ship);
      let unset = true;
      while (unset) {
        let position = rs.question(
          `Where would you like to place the front of your ${ship.getName()}? It is ${ship.getLength()} tiles long.  `
        );
        let direction = rs.question(
          `And which direction should she be sailing? [N E S W]  `
        );
        // TODO direction and position user handling
        if (addShip(ship, position, direction) === false) {
          console.log(
            `Sailing ${direction}, with the front at ${position}, is not able to happen.`
          );
        } else {
          unset = false;
        }
      }
    }
  }
  //prompt ship placements;

  let aiBoard = new Board("Computer Board", size);

  boards.add(playerBoard);
  boards.add(aiBoard);
}

let running = true;
console.log("Welcome to Battleship");
while (running) {
  console.log("Let's setup a game.");
  let size = 0;
  let fleetSize = 0;
  while (size === 0) {
    size = rs.questionInt("How big of a board do you want? ");
    if (size === "end") {
      running = false;
      break;
    }
    if (size < 3) {
      console.log(`A board of ${size} is a bit lame. Dream a little bigger.`);
      size = 0;
    }
  }
  if (running === false) {
    break;
  }
  if (size < 7) {
    fleetSize = size - 2;
  } else if (size === 10) {
    console.log("Standard Battleship");
    fleetSize = 5;
  } else {
    //TODO make this more realistic vvvv
    fleetSize = Math.trunc((size * size) / 3);
  }
  console.log(`A size of ${size}, lets give each player ${fleetSize} ships.`);

  setup(size, fleetSize);
  main();

  if (rs.keyIn("Would you like to play again?")) {
    console.log("Awesome!");
  } else {
    running = false;
  }
}
console.log("Thank you for playing.");
