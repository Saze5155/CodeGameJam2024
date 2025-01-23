import loading from "./loading.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: true,
    },
  },
  scene: [loading], // Assurez-vous que le nom de la scène est correct
};

new Phaser.Game(config);
