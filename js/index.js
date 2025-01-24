import loading from "/js/loading.js";

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE, // Redimensionne automatiquement le jeu
    autoCenter: Phaser.Scale.CENTER_BOTH, // Centre le jeu sur l'écran
    width: window.innerWidth, // Largeur de l'écran
    height: window.innerHeight, // Hauteur de l'écran
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: true,
    },
  },
  scene: [loading],
};

new Phaser.Game(config);
