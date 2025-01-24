import combat from "./combat.js";
import interfaceCombat from "./interface_combat.js";

export default class loading {
  preload() {
    this.load.image('whiteTile', './assets/tiles/floor_1.png');
    this.load.image('blackTile', './assets/tiles/floor_1_variant.png');
    this.load.image('bonkTile', './assets/tiles/bonk.png');
    this.load.image('bonkTileCaisse', './assets/tiles/bonk_2.png');
  }

  create() {
    this.scene.add("combat", combat, false);
    this.scene.add("interfaceCombat", interfaceCombat, false);
    this.scene.start("combat");
  }
}
