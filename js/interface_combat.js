export default class InterfaceCombat extends Phaser.Scene {
  constructor() {
    super({ key: "interfaceCombat" });
    this.highlightedTiles = [];
  }

  init(data) {
    this.characters = data.characters;
    this.enemies = data.enemies;
    this.activeCharacterIndex = data.activeCharacterIndex;
    this.onActionSelected = data.onActionSelected;
    this.onNextTurn = data.onNextTurn;
  }

  create() {
    this.interfaceContainer = this.add.container(10, this.scale.height - 150);
    this.createEnemies();
    this.updateInterface(this.activeCharacterIndex);
    this.enableMovementSelection();
  }

  updateInterface(activeCharacterIndex) {
    this.activeCharacterIndex = activeCharacterIndex;
    this.interfaceContainer.removeAll(true);

    const character = this.characters[this.activeCharacterIndex];

    // Affichage de l'interface du joueur actif
    this.interfaceContainer.add(
      this.add.text(10, 10, character.name, {
        fontSize: "20px",
        color: "#ffffff",
      })
    );
    character.actions.forEach((action, index) => {
      const actionText = this.add.text(10, 40 + index * 30, action, {
        fontSize: "16px",
        color: "#ffffff",
      });
      actionText.setInteractive().on("pointerdown", () => {
        this.onActionSelected(action);
      });
      this.interfaceContainer.add(actionText);
    });
  }

  enableMovementSelection() {
    const character = this.characters[this.activeCharacterIndex];

    // Supprime les anciennes surbrillances avant d'en ajouter de nouvelles
    this.clearHighlightedTiles();

    const tileSize = 64;
    const offsetX = (this.cameras.main.width - 8 * tileSize) / 2;
    const offsetY = (this.cameras.main.height - 8 * tileSize) / 2;

    const highlightTiles = [
      { x: character.x, y: character.y - 1 },
      { x: character.x, y: character.y + 1 },
      { x: character.x - 1, y: character.y },
      { x: character.x + 1, y: character.y },
    ];

    highlightTiles.forEach(({ x, y }) => {
      if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        const posX = x * tileSize + offsetX + tileSize / 2;
        const posY = y * tileSize + offsetY + tileSize / 2;

        const highlight = this.add
          .rectangle(posX, posY, tileSize, tileSize, 0xffff00, 0.5)
          .setOrigin(0.5, 0.5)
          .setInteractive();

        highlight.on("pointerdown", () => {
          this.moveCharacter(character, x, y);
          this.clearHighlightedTiles();
        });

        this.highlightedTiles.push(highlight);
      }
    });
  }

  moveCharacter(character, x, y) {
    const tileSize = 64;
    const offsetX = (this.cameras.main.width - 8 * tileSize) / 2;
    const offsetY = (this.cameras.main.height - 8 * tileSize) / 2;

    const posX = x * tileSize + offsetX + tileSize / 2;
    const posY = y * tileSize + offsetY + tileSize / 2;

    character.x = x;
    character.y = y;
    character.visual.setPosition(posX, posY);
  }

  clearHighlightedTiles() {
    this.highlightedTiles.forEach((tile) => tile.destroy());
    this.highlightedTiles = [];
  }

  createEnemies() {
    this.enemies.forEach((enemy) => {
      const tileSize = 64;
      const offsetX = (this.cameras.main.width - 8 * tileSize) / 2;
      const offsetY = (this.cameras.main.height - 8 * tileSize) / 2;

      const posX = enemy.x * tileSize + offsetX + tileSize / 2;
      const posY = enemy.y * tileSize + offsetY + tileSize / 2;

      enemy.visual = this.add
        .rectangle(posX, posY, tileSize / 2, tileSize / 2, enemy.color)
        .setOrigin(0.5, 0.5);
    });
  }

  enemyAction(enemy) {
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    const randomDirection =
      directions[Math.floor(Math.random() * directions.length)];
    const newX = enemy.x + randomDirection.x;
    const newY = enemy.y + randomDirection.y;

    if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
      this.moveCharacter(enemy, newX, newY);
    }
    this.onNextTurn();
  }
}
