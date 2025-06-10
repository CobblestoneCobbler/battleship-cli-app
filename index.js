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
const minBoardSize = 4;
const maxBoardSize = 10;
let debugging = false;
let output = "";

function testShot([letter, number], shots) {
  let alreadyShot = false;
  //TODO switch to find
  for (let set of shots) {
    if (set[0] === letter && set[1] === number) {
      alreadyShot = true;
      output += `You already shot at ${letter}${number}.\n`;
      break;
    }
  }
  if (!alreadyShot && boards[1].getPosition([letter, number]) === "-") {
    shots.push([letter, number]);
    aiming = false;
  } else {
    output += `You cant shoot at ${letter}${number}.`;
  }
}

function playerAiming(shotCount) {
  let aiming = true;
  let shots = [];
  while (aiming) {
    //TODO check for full board
    if (shots.length > 0) {
      output += `Your current shots are ${shots}. You have ${shotCount} shots remaining.`;
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
      if (shotCount <= 0) {
        aiming = false;
        output += `No sneaking in extra shots for you. \n` + output;
        break;
      }
      testShot([shot.slice(0, 1), shot.slice(1, 2)], shots);
      shot = shot.slice(2);
    }
  }
}

function updateScreen(debugging = false) {
  console.clear();
  boards[1].printBoard(debugging);
  console.log("\n\n-----------------------------------------------\n\n");
  boards[0].printBoard(debugging);
}

function main() {
  let running = true;
  let output = "";
  while (running) {
    let playerShots = boards[0].getShips().reduce((acc, n) => {
      if (n.isSunk() === false) {
        acc += n.getShots();
      }
      return acc;
    }, 0);
    let shots = [];

    updateScreen();
    console.log(`You have ${playerShots} shots this turn.`);
    playerAiming(playerShots);

    console.log("FIRE THE CANNONS!!");
    for (let shot of shots) {
      let result = boards[1].fire(shot);
      if (result !== "miss") {
        output += `${shot[0]}${shot[1]} has ${result}\n`;
      }
    }
    if (
      boards[1].getShips().reduce((acc, n) => {
        if (n.isSunk() === false) {
          acc++;
        }
        return acc;
      }, 0) === 0
    ) {
      updateScreen();
      console.log(output);
      console.log("You've sunk them all!");

      console.log(`========
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
    shots = [];

    //TODO Axis letter infinite loop (j0 Sailing west, hit j1, j2, loop after j3 === X, cannot find j0)
    let cycles = 0;
    for (let i = 0; i < aiShots; i++) {
      let aiming = true;
      while (aiming) {
        let letter, number;
        let ships = boards[0].getRevealedShips();
        if (ships !== false && i < ships.length) {
          let positions = ships[i].getHitPositions();
          if (positions.length > 1) {
            let undecided = true;
            let dir;
            let distance = 1;
            //figure out up and down or left and right
            if (positions[0][0] === positions[1][0]) {
              letter = positions[0][0];
              if (positions[0][1] < positions[1][1]) {
                //sailing west, numbers will increment. May have hit mid ship though
                dir = "pos";
              } else {
                //sailing east, numbers will decrease. May have hit mid ship though
                dir = "neg";
              }

              while (undecided) {
                console.log(
                  `distance: ${distance}, position: ${positions[0][0]},${positions[0][1]} axis: Letter is constant, dir: ${dir}.`
                );

                if (dir === "pos") {
                  if (positions[0][1] + distance < boards[0].getSize()) {
                    let pos = boards[0].getPosition([
                      letter,
                      positions[0][1] + distance,
                    ]);
                    if (pos === "-") {
                      number = positions[0][1] + distance;
                      undecided = false;
                    } else if (pos === "X") {
                      dir = "neg";
                      distance = 1;
                      continue;
                    }
                  } else {
                    distance = 1;
                    dir = "neg";
                    continue;
                  }
                } else {
                  if (positions[0][1] - distance > 0) {
                    let pos = boards[0].getPosition([
                      letter,
                      positions[0][1] - distance,
                    ]);
                    if (pos === "-") {
                      number = positions[0][1] - distance;
                      undecided = false;
                    } else if (pos === "X") {
                      dir = "pos";
                      distance = 1;
                      continue;
                    }
                  } else {
                    distance = 1;
                    dir = "pos";
                    continue;
                  }
                }
                distance++;
              }
            } else {
              //number is axis
              number = positions[0][1];
              if (positions[0][0] < positions[1][0]) {
                //sailing North, numbers will increment. May have hit mid ship though
                dir = "pos";
              } else {
                //sailing south, numbers will decrease. May have hit mid ship though
                dir = "neg";
              }
              const charCode = positions[0][0].charCodeAt(0);
              while (undecided) {
                console.log(
                  `distance: ${distance}, position: ${positions[0][0]},${positions[0][1]} axis: number is constant, dir: ${dir}.`
                );
                if (dir === "pos") {
                  if (charCode + distance < 97 + boards[0].getSize()) {
                    let pos = boards[0].getPosition([
                      String.fromCharCode(charCode + distance),
                      number,
                    ]);
                    if (pos === "-") {
                      letter = String.fromCharCode(charCode + distance);
                      undecided = false;
                    } else if (pos === "X") {
                      dir = "neg";
                      distance = 1;
                      continue;
                    }
                  } else {
                    distance = 1;
                    dir = "neg";
                    continue;
                  }
                } else {
                  if (charCode - distance > 96) {
                    let pos = boards[0].getPosition([
                      String.fromCharCode(charCode - distance),
                      number,
                    ]);
                    if (pos === "-") {
                      letter = String.fromCharCode(charCode - distance);
                      undecided = false;
                    } else if (pos === "X") {
                      dir = "pos";
                      distance = 1;
                      continue;
                    }
                  } else {
                    distance = 1;
                    dir = "pos";
                    continue;
                  }
                }
                distance++;
              }
            }
          } else {
            let undecided = true;
            while (undecided) {
              switch (Math.floor(Math.random() * 4)) {
                case 0: {
                  if (
                    positions[0][0] === "a" ||
                    !(
                      boards[0].getPosition([
                        String.fromCharCode(positions[0][0].charCodeAt(0) - 1),
                        positions[0][1],
                      ]) === "-"
                    )
                  ) {
                    cycles++;
                    continue;
                  } else {
                    undecided = false;
                    letter = String.fromCharCode(
                      positions[0][0].charCodeAt(0) - 1
                    );
                    number = positions[0][1];
                    aiming = false;
                    break;
                  }
                }
                case 1: {
                  if (
                    positions[0][0] ===
                      String.fromCharCode(boards[0].getSize() + 97) ||
                    !(
                      boards[0].getPosition([
                        String.fromCharCode(positions[0][0].charCodeAt(0) + 1),
                        positions[0][1],
                      ]) === "-"
                    )
                  ) {
                    cycles++;
                    continue;
                  } else {
                    undecided = false;
                    letter = String.fromCharCode(
                      positions[0][0].charCodeAt(0) + 1
                    );
                    number = positions[0][1];
                    aiming = false;
                    break;
                  }
                }
                case 2: {
                  if (
                    positions[0][1] === 0 ||
                    !(
                      boards[0].getPosition([
                        positions[0][0],
                        positions[0][1] - 1,
                      ]) === "-"
                    )
                  ) {
                    cycles++;
                    continue;
                  } else {
                    undecided = false;
                    letter = positions[0][0];
                    number = positions[0][1] - 1;
                    aiming = false;
                    break;
                  }
                }
                case 3: {
                  if (
                    positions[0][1] === boards[0].getSize() - 1 ||
                    !(
                      boards[0].getPosition([
                        positions[0][0],
                        positions[0][1] + 1,
                      ]) === "-"
                    )
                  ) {
                    cycles++;
                    continue;
                  } else {
                    undecided = false;
                    letter = positions[0][0];
                    number = positions[0][1] + 1;
                    aiming = false;
                    break;
                  }
                }
                default: {
                  output += "AI UNDECIDED OUT OF SCOPE \n";
                }
              }
            }
          }
        } else {
          letter = String.fromCharCode(
            Math.floor(Math.random() * boards[0].getSize()) + 97
          );
          number = Math.floor(Math.random() * boards[0].getSize());
        }
        if (boards[0].getPosition([letter, number]) === "-") {
          let alreadyShot = false;
          for (let set of shots) {
            if (set[0] === letter && set[1] === number) {
              alreadyShot = true;
              break;
            }
          }
          if (alreadyShot) {
            cycles++;
            continue;
          }
          shots.push([letter, number]);
          aiming = false;
        } else {
          cycles++;
        }
      }
    }
    //TODO Add output when Ai hits a ship or sinks a ship
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
  let graded = false;
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
      let direction = rs.question(
        `And which direction should she be sailing? [nsew]  `
      );

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
}

let running = true;
console.log("Welcome to Battleship");
while (running) {
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
      console.log("Standard Battleship");
      fleetSize = 5;
    } else {
      console.log(`${size} is a bit too big for me.`);
      size = 0;
    }
  }

  console.log(`A size of ${size}, lets give each player ${fleetSize} ships.`);

  if (setup(size, fleetSize) !== "skip") {
    main();
  }

  if (rs.keyInYN("Would you like to play again?")) {
    console.log("Awesome!");
  } else {
    running = false;
  }
}
console.log("Thank you for playing.");
