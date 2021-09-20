/**
 * @class User
 */
export class User {
  constructor(name) {
    this.socket = null;
    this.currentRoom = null;
    this.name = name;
  }
}
