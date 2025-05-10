export class Board {
  constructor(name, size = 10) {
    this.name = name;
    this.size = size;
    this.board = {
      a: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
      b: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
      c: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
      d: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
      e: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
      f: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
      g: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
      h: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
      i: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
      j: ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
    };
    this.ships = [];
  }
  getSize() {
    return this.size;
  }
  getPosition(position) {
    return this.board[position[0]][position[1]];
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
      if (direction === "N") {
        letter = tipPos[0].charCodeAt(0) + i;
        if (letter > 96 && letter < 96 + this.getSize()) {
          letter = String.fromCharCode(letter);
        } else {
          return false;
        }
      } else if (direction === "S") {
        letter = tipPos[0].charCodeAt(0) - i;
        if (letter > 96 && letter < 96 + this.getSize()) {
          letter = String.fromCharCode(letter);
        } else {
          return false;
        }
      } else if (direction === "E") {
        number -= i;
        if (i < 0 || i > this.getSize()) {
          return false;
        }
      } else if (direction === "W") {
        number += i;
        if (i < 0 || i > this.getSize()) {
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
  printBoard(debug) {
    if (debug) {
      for (const ship of this.ships) {
        for (const [letter, number, hit] of ship.getPositions()) {
          this.updateSpace(letter, number, ship.getHitIcon());
        }
      }
    }
    console.log(`----- { ${this.name} } -----`);
    console.table(this.board);
  }
  fire(position) {
    let ship = this.ships.find((n) => {
      let i = 0;
      for (const pos of n.getPositions()) {
        if (pos[0] === position[0] && pos[1] === position[1]) {
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

let board = new Board("My Board");
board.printBoard(false);
let crusier = new Ship("Crusier", 2, 1, "C");
let submarine = new Ship("Submarine", 3, 1, "S");
board.addShip(crusier, ["a", 1], "N");
board.addShip(submarine, ["f", 3], "E");
console.log(board.fire(["a", 1]));
console.log(board.fire(["b", 1]));
board.printBoard(false);
console.log(board.getPosition(["a", 1]));
