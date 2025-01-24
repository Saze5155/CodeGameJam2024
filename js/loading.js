import combat from "./combat.js";
import interfaceCombat from "./interface_combat.js";

export default class loading {
  preload() {}

  create() {
    this.scene.add("combat", combat, false);
    this.scene.add("interfaceCombat", interfaceCombat, false);
    this.scene.start("combat");
  }
}
