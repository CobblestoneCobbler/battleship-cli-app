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
      this.board[String.fromCharCode(i + 97)] = Array.from(arry);
    }

    this.ships = [];
  }
  getSize() {
    return this.size;
  }
  getPosition(position) {
    //TODO Learn what notation this is
    return this.board[position[0]]?.[position[1]];
  }
  getShips() {
    return this.ships;
  }
  getAvailableShots() {
    let count = 0;
    for (let i = 0; i < this.size; i++) {
      count += this.board[String.fromCharCode(i + 97)].reduce((acc, i) => {
        if (i === "-") {
          return acc + 1;
        }
        return acc;
      }, 0);
    }
    return count;
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
      });
      if (ship) {
        return true;
      }
    }
  }
  addShip(ship, tipPos, direction) {
    let positions = [];
    for (let i = 0; i < ship.getLength(); i++) {
      let letter = tipPos[0].charCodeAt(0);
      let number = Number(tipPos[1]);
      switch (direction) {
        case "n": {
          letter += i;
          break;
        }
        case "s": {
          letter -= i;
          break;
        }
        case "e": {
          number -= i;
          break;
        }
        case "w": {
          number += i;
          break;
        }
        default: {
          console.log("dir ERROR");
          return false;
        }
      }
      //TODO check the letter and number validation
      if (
        letter > 96 &&
        letter < 97 + this.getSize() &&
        number >= 0 &&
        number < this.getSize()
      ) {
        letter = String.fromCharCode(letter);
      }
      if (
        this.getPosition([letter, number]) === "-" &&
        !this.checkForShip(letter, number)
      ) {
        positions.push([letter, number, false]);
      } else {
        return false;
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
      return "miss";
    } else {
      this.updateSpace(position[0], position[1], ship.getHitIcon());
      if (ship.isSunk()) {
        return `hit and sunk the ${ship.getName()}!`;
      } else {
        return `hit the ${ship.getName()}!`;
      }
    }
  }
  getRevealedShips() {
    let revealedShips = this.ships.filter((s) => {
      if (s.isRevealed() && !s.isSunk()) {
        return true;
      }
    });
    if (revealedShips.length > 0) {
      return revealedShips;
    }
  }
}
export class Ship {
  constructor(name, length, shots, hitIcon = "!") {
    this.name = name;
    this.length = length;
    this.shots = shots;
    this.hitIcon = hitIcon;

    this.revealed = false;
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
  getHitPositions() {
    let arry = [];
    for (const pos of this.positions) {
      if (pos[2] === true) {
        arry.push([pos[0], pos[1]]);
      }
    }
    return arry;
  }
  isRevealed() {
    return this.revealed;
  }

  setPositions(arry) {
    this.positions = arry;
  }

  hit(position) {
    this.positions[position][2] = true;
    this.revealed = true;
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
