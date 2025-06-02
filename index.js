import * as rs from "readline-sync";
import { Board, Ship } from "./board.js";

let shipTypes = [
  ["Crusier", 2, 1, "C"],
  ["Submarine", 3, 1, "S"],
  ["Destroyer", 3, 2, "D"],
  ["Battleship", 4, 3, "B"],
  ["Aircraft Carrier", 5, 1, "AC"],
];
let boards = [];
let ships = [];

//TODO add args to allow a new call to update screen everytime new dialougue set is passed
function updateScreen() {
  boards[1].printBoard(false);
  console.log("\n\n-----------------------------------------------\n\n");
  boards[0].printBoard(false);
}

function main() {
  let running = true;
  while (running) {
    updateScreen();
    let playerShots = boards[0].getShips().reduce((acc, n) => {
      if (n.isSunk() === false) {
        acc += n.getShots();
      }
      return acc;
    }, 0);
    let shots = [];
    console.log(`You have ${playerShots} shots this turn.`);
    for (let i = 0; i < playerShots; i++) {
      //TODO will need validating
      //TODO cross check against current shots list.
      let aiming = true;
      while (aiming) {
        if (shots.length > 0) {
          console.log(
            `Your current shots are ${shots}. You have ${
              playerShots - shots.length
            } shots remaining.`
          );
        }
        let letter, number;
        let shot = rs.question("Where would you like to fire? ");
        if (shot.length > 0) {
          shot = shot
            .trim()
            .toLowerCase()
            .replaceAll(" ", "")
            .replaceAll(",", "");
        } else {
          console.log("You cant leave this empty.");
          continue;
        }

        if (shot === "end") {
          running = false;
          break;
        }
        if (shot === "debug") {
          boards[0].printBoard(true);
          console.log("\n\n");
          boards[1].printBoard(true);
        }
        shot = shot.replace(" ", "");
        if (shot.length === 2) {
          [letter, number] = [shot.slice(0, 1), shot.slice(1)];

          if (boards[1].getPosition([letter, number]) === "-") {
            shots.push([letter, number]);
            aiming = false;
          } else {
            console.log("You cant shoot here.");
          }
        } else if (shot.length % 2 === 0) {
          [letter, number] = [shot.slice(0, 1), shot.slice(1, 2)];
          if (boards[1].getPosition([letter, number]) === "-") {
            shots.push([letter, number]);
          } else {
            console.log("You cant shoot here.");
          }
          if (i >= playerShots - 1) {
            aiming = false;
            console.log(`No sneaking in extra shots for you.`);
          }
          shot = shot.slice(2);
          if (aiming) {
            while (shot.length > 0) {
              [letter, number] = [shot.slice(0, 1), shot.slice(1, 2)];
              if (boards[1].getPosition([letter, number]) === "-") {
                shots.push([letter, number]);
                shot = shot.slice(2);
                i++;
                aiming = false;
                if (i >= playerShots - 1) {
                  break;
                }
              } else {
                console.log(`Space ${letter}, ${number} is not a valid place`);
                break;
              }
            }
          }
        }

        if (aiming) {
          console.log("keep shooting.");
        }
      }
      if (running === false) {
        break;
      }
    }
    if (running === false) {
      break;
    }
    console.log("FIRE THE CANNONS!!");
    for (let shot of shots) {
      console.log(boards[1].fire(shot));
    }
    if (
      boards[1].getShips().reduce((acc, n) => {
        if (n.isSunk() === false) {
          acc++;
        }
        return acc;
      }, 0) === 0
    ) {
      console.log("Youve sunk them all!");
      running = false;
    }

    //ai
    //TODO ensure they dont shoot at an already shot at space.
    //TODO if i hit a ship, attack near it?
    let aiShots = boards[1].getShips().reduce((acc, n) => {
      if (n.isSunk() === false) {
        acc += n.getShots();
      }
      return acc;
    }, 0);
    shots = [];
    let cycles = 0;
    for (let i = 0; i < aiShots; i++) {
      let aiming = true;
      while (aiming) {
        let letter = String.fromCharCode(
          Math.floor(Math.random() * boards[0].getSize()) + 97
        );
        let number = Math.floor(Math.random() * boards[0].getSize());
        shots.push([letter, number]);
        if (boards[0].getPosition([letter, number]) === "-") {
          shots.push([letter, number]);
          aiming = false;
        } else {
          cycles++;
        }
      }
    }
    console.log(`Incoming Fire! Cpu extra cycles: ${cycles}`);
    for (let shot of shots) {
      boards[0].fire(shot);
    }
    if (
      boards[0].getShips().reduce((acc, n) => {
        if (n.isSunk() === false) {
          acc++;
        }
        return acc;
      }, 0) === 0
    ) {
      console.log("Your fleet has been destroyed...");
      running = false;
    }
  }
}

function setup(size, fleetSize) {
  let playerBoard = new Board("Your Board", size);
  let aiBoard = new Board("Computer Board", size);
  ships = []; //needed for second play
  let extraCycles = 0;
  console.clear();
  playerBoard.printBoard();
  //TODO if size goes beyond 26 inputs will need double lettering, so ill just limit 26 later

  for (let i = fleetSize - 1; i >= 0; i--) {
    let ship = new Ship(
      shipTypes[i][0],
      shipTypes[i][1],
      shipTypes[i][2],
      shipTypes[i][3]
    );
    ships.push(ship);
    let unset = true;
    while (unset) {
      let position = rs.question(
        `Where would you like to place the front of your ${ship.getName()}? It is ${ship.getLength()} tiles long.  `
      );
      let direction = rs.question(
        `And which direction should she be sailing? [nsew]  `
      );
      // TODO direction and position user handling
      if (playerBoard.addShip(ship, position, direction) === false) {
        console.log(
          `Sailing ${direction}, with the front at ${position}, is not able to happen.`
        );
      } else {
        unset = false;
      }
    }
  }
  console.log("Your fleet is set. Now where will the computer go?");

  for (let i = fleetSize - 1; i >= 0; i--) {
    let ship = new Ship(
      shipTypes[i][0],
      shipTypes[i][1],
      shipTypes[i][2],
      shipTypes[i][3]
    );
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
      if (aiBoard.addShip(ship, [letter, number], direction) === false) {
        extraCycles++;
      } else {
        unset = false;
      }
    }
  }
  boards = [playerBoard, aiBoard];

  console.log(
    `Computers board has been set, with ${extraCycles} extra cycles.`
  );
  //prompt ship placements;
}

let running = true;
console.log("Welcome to Battleship");
while (running) {
  console.log("Let's setup a game.");
  let size = 0;
  let fleetSize = 0;
  while (size === 0) {
    size = rs.questionInt("How big of a board do you want? ");
    if (size < 3) {
      console.log(`A board of ${size} is a bit lame. Dream a little bigger.`);
      size = 0;
    } else if (size < 7) {
      fleetSize = size - 2;
    } else if (size < 10) {
      fleetSize = 4;
    } else if (size === 10) {
      console.log("Standard Battleship");
      fleetSize = 5;
    } else {
      console.log(`${size} is a bit too big for me.`);
      size = 0;
      //fleetSize = Math.trunc((size * size) / 3);
    }
  }

  console.log(`A size of ${size}, lets give each player ${fleetSize} ships.`);

  setup(size, fleetSize);
  main();

  if (rs.keyInYN("Would you like to play again?")) {
    console.log("Awesome!");
  } else {
    running = false;
  }
}
console.log("Thank you for playing.");
