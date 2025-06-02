export class Board {
  constructor(name, size = 10) {
    this.name = name;
    this.size = size;
    this.board = {};
    let arry = [];
    for (let i = 0; i < size; i++) {
      arry.push("-");
    }
    for (let i = 0; i < size; i++) {
      let key = i + 97;
      this.board[String.fromCharCode(i + 97)] = Array.from(arry);
    }

    this.ships = [];
  }
  getSize() {
    return this.size;
  }
  getPosition(position) {
    return this.board[position[0]][position[1]];
  }
  getShips() {
    return this.ships;
  }
  checkForShip(letter, number) {
    //only to be used durring generation
    if (this.ships.length > 0) {
      let ship = this.ships.find((n) => {
        for (const pos of n.getPositions()) {
          if (pos[0] === letter && pos[1] === number) {
            return true;
          }
        }
        return false;
      });
      if (ship != undefined) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  addShip(ship, tipPos, direction) {
    let positions = [];
    for (let i = 0; i < ship.getLength(); i++) {
      let letter = tipPos[0];
      let number = tipPos[1];
      if (direction === "n") {
        letter = tipPos[0].charCodeAt(0) + i;
        if (letter > 96 && letter < 96 + this.getSize()) {
          letter = String.fromCharCode(letter);
        } else {
          return false;
        }
      } else if (direction === "s") {
        letter = tipPos[0].charCodeAt(0) - i;
        if (letter > 96 && letter < 96 + this.getSize()) {
          letter = String.fromCharCode(letter);
        } else {
          return false;
        }
      } else if (direction === "e") {
        number -= i;
        if (number < 0 || number > this.getSize()) {
          return false;
        }
      } else if (direction === "w") {
        number += i;
        if (number < 0 || number > this.getSize()) {
          return false;
        }
      }

      if (this.checkForShip(letter, number)) {
        return false;
      } else {
        positions.push([letter, number, false]);
      }
    }
    ship.setPositions(positions);
    this.ships.push(ship);
    return true;
  }
  updateSpace(letter, number, char) {
    this.board[letter][number] = char;
  }
  printBoard(debug = false) {
    console.log(`----- { ${this.name} } -----`);
    if (debug) {
      let board = structuredClone(this.board);
      for (const ship of this.ships) {
        for (const position of ship.getPositions()) {
          board[position[0]][position[1]] = ship.getHitIcon();
        }
      }
      console.log("Debug");
      console.table(board);
    } else {
      console.table(this.board);
    }
  }
  fire(position) {
    let ship = this.ships.find((n) => {
      let i = 0;
      for (const pos of n.getPositions()) {
        if (pos[0] == position[0] && pos[1] == position[1]) {
          n.hit(i);
          return true;
        }
        i++;
      }
      return false;
    });
    if (ship === undefined) {
      this.updateSpace(position[0], position[1], "X");
      return "missed!";
    } else {
      this.updateSpace(position[0], position[1], ship.getHitIcon());
      if (ship.isSunk()) {
        return `hit and sunk the ${ship.getName()}!`;
      } else {
        return `hit the ${ship.getName()}!`;
      }
    }
  }
}
export class Ship {
  constructor(name, length, shots, hitIcon = "!") {
    this.name = name;
    this.length = length;
    this.shots = shots;
    this.hitIcon = hitIcon;

    this.sunk = false;
    this.positions = [];
  }

  getLength() {
    return this.length;
  }
  getName() {
    return this.name;
  }
  getShots() {
    return this.shots;
  }
  getHitIcon() {
    return this.hitIcon;
  }
  getPositions() {
    return this.positions;
  }

  setPositions(arry) {
    this.positions = arry;
  }

  hit(position) {
    this.positions[position][2] = true;
    let sinking = true;
    for (const pos of this.positions) {
      if (pos[2] === false) {
        sinking = false;
      }
    }
    if (sinking) {
      this.sunk = true;
    }
  }
  isSunk() {
    return this.sunk;
  }
}
