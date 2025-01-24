export default class Combat extends Phaser.Scene {
  constructor() {
    super({ key: "combat" });
    this.activeCharacterIndex = 0; // Indice du personnage actif
    this.selectedTile = null; // Case sélectionnée pour le déplacement
    this.isEnemyTurn = false; // Gestion des tours alternés entre joueurs et ennemis
    this.enemyTurnIndex = 0; // Indice pour gérer le tour des ennemis individuellement
    this.playerHasMoved = false; // Suivi du déplacement du joueur par tour
    this.playerHasActed = false;
  }

  // Phaser preload method
  preload() {
    // Précharge ici les assets si nécessaire
  }

  // Phaser create method
  create() {
    this.initializeGrid();
    this.createObstacles();
    this.initializeCharacters();
    this.initializeEnemies();
    this.createUI();
    this.updateUI();
  }

  // Grid Initialization
  initializeGrid() {
    const camera = this.cameras.main;
    const gridWidth = 8;
    const gridHeight = 8;
    const tileSize = 64;

    const offsetX = (camera.width - gridWidth * tileSize) / 2;
    const offsetY = (camera.height - gridHeight * tileSize) / 2;

    this.grid = [];
    for (let x = 0; x < gridWidth; x++) {
      this.grid[x] = [];
      for (let y = 0; y < gridHeight; y++) {
        const posX = x * tileSize + offsetX;
        const posY = y * tileSize + offsetY;
        const color = (x + y) % 2 === 0 ? 0xffffff : 0x000000;

        const tile = this.add
          .rectangle(posX, posY, tileSize, tileSize, color)
          .setOrigin(0, 0)
          .setInteractive();

        tile.gridX = x;
        tile.gridY = y;
        tile.on("pointerdown", () => this.handleTileClick(tile));
        this.grid[x][y] = tile;
      }
    }
  }

  // Obstacles Initialization
  createObstacles() {
    const obstaclePositions = [
      { x: 4, y: 4 },
      { x: 2, y: 3 },
      { x: 5, y: 6 },
    ];

    const offsetX = (this.cameras.main.width - this.grid[0].length * 64) / 2;
    const offsetY = (this.cameras.main.height - this.grid.length * 64) / 2;

    this.obstacles = [];
    obstaclePositions.forEach((pos) => {
      if (this.grid[pos.x] && this.grid[pos.x][pos.y]) {
        const posX = pos.x * 64 + offsetX;
        const posY = pos.y * 64 + offsetY;

        const obstacle = this.add
          .rectangle(posX, posY, 64, 64, 0xff00ff)
          .setOrigin(0, 0);

        obstacle.gridX = pos.x;
        obstacle.gridY = pos.y;
        obstacle.isObstacle = true;
        this.obstacles.push(obstacle);

        this.grid[pos.x][pos.y].isObstacle = true;
      }
    });
  }

  // Characters Initialization
  initializeCharacters() {
    const tileSize = 64;
    const offsetX =
      (this.cameras.main.width - this.grid[0].length * tileSize) / 2;
    const offsetY =
      (this.cameras.main.height - this.grid.length * tileSize) / 2;

    this.characters = [
      {
        name: "Aveugle",
        color: 0xff0000,
        x: 0,
        y: 7,
        actions: ["Attaquer", "Defendre"],
        ult: "heal",
        ultReady: false,
        hp: 6,
        u: 0,
      },
      {
        name: "Musicien",
        color: 0x00ff00,
        x: 3,
        y: 7,
        actions: ["Jouer une note", "Soutenir"],
        ult: "emp",
        ultReady: false,
        hp: 4,
        u: 0,
      },
      {
        name: "Enregistreur",
        color: 0x0000ff,
        x: 7,
        y: 7,
        actions: ["Capturer", "Analyser"],
        ult: "rewind",
        ultReady: false,
        hp: 5,
        u: 0,
      },
    ];

    this.characters.forEach((char) => {
      const posX = char.x * tileSize + offsetX + tileSize / 2;
      const posY = char.y * tileSize + offsetY + tileSize / 2;
      char.visual = this.add
        .rectangle(posX, posY, tileSize / 2, tileSize / 2, char.color)
        .setOrigin(0.5, 0.5);
    });
  }

  // Enemies Initialization
  initializeEnemies() {
    const tileSize = 64;
    const offsetX =
      (this.cameras.main.width - this.grid[0].length * tileSize) / 2;
    const offsetY =
      (this.cameras.main.height - this.grid.length * tileSize) / 2;

    this.enemies = [
      { name: "Ennemi 1", color: 0xff8800, x: 2, y: 0, hp: 3 },
      { name: "Ennemi 2", color: 0x8800ff, x: 5, y: 0, hp: 3 },
    ];

    this.enemies.forEach((enemy) => {
      const posX = enemy.x * tileSize + offsetX + tileSize / 2;
      const posY = enemy.y * tileSize + offsetY + tileSize / 2;
      enemy.visual = this.add
        .rectangle(posX, posY, tileSize / 2, tileSize / 2, enemy.color)
        .setOrigin(0.5, 0.5);
    });
  }

  // UI Initialization
  createUI() {
    this.uiContainer = this.add.container(10, 10);

    this.characterNameText = this.add.text(0, 0, "", {
      fontSize: "16px",
      fill: "#fff",
    });
    this.uiContainer.add(this.characterNameText);

    this.endTurnButton = this.add
      .text(10, 60, "Fin de tour", {
        fontSize: "14px",
        fill: "#fff",
        backgroundColor: "#444",
      })
      .setInteractive()
      .on("pointerdown", () => this.endPlayerTurn());

    this.uiContainer.add(this.endTurnButton);
  }

  updateUI() {
    const activeCharacter = this.characters[this.activeCharacterIndex];

    // Supprime uniquement les boutons d'action et d'ultime
    this.uiContainer.list
      .filter((child) => child.isActionButton)
      .forEach((button) => button.destroy());

    this.characterNameText.setText(`Nom: ${activeCharacter.name}`);

    activeCharacter.actions.forEach((action, index) => {
      this.createActionButton(action, index + 1);
    });

    if (activeCharacter.u === 3) {
      activeCharacter.ultReady = true; // Débloque l'ultime après un tour complet
    }

    this.createActionButton(activeCharacter.ult, 3, activeCharacter.ultReady);

    if (!this.playerHasMoved) {
      this.highlightMovableTiles(activeCharacter);
    } else {
      this.clearTileHighlights();
    }
  }

  createActionButton(actionName, actionIndex, ready = true) {
    const offsetX = 10;
    const offsetY = 120 + actionIndex * 30;
    const backgroundColor = actionIndex === 3 && !ready ? "#ff0000" : "#444";

    const button = this.add
      .text(offsetX, offsetY, actionName, {
        fontSize: "14px",
        fill: "#fff",
        backgroundColor,
        padding: { x: 10, y: 5 },
      })
      .setInteractive()
      .on("pointerdown", () => {
        if (actionIndex === 3 && !ready) {
          console.log("Ultime non disponible !");
        } else {
          this.handleAction(actionIndex);
        }
      });

    button.isActionButton = true;
    this.uiContainer.add(button);
  }

  handleAction(actionIndex) {
    const activeCharacter = this.characters[this.activeCharacterIndex];

    // Gestion des actions spécifiques aux personnages
    if (actionIndex === 1) {
      this.performLineAttack(activeCharacter);
    } else if (actionIndex === 2) {
      this.performCrossAttack(activeCharacter);
    } else if (actionIndex === 3) {
      if (activeCharacter.ultReady) {
        this.performUltimate(activeCharacter);
        activeCharacter.ultReady = false;
      } else {
        console.log("Ultime non disponible !");
      }
    }

    this.playerHasActed = true;
    this.updateUI();
  }

  performLineAttack(character) {
    console.log(`${character.name} effectue une attaque en ligne.`);
  }

  performCrossAttack(character) {
    console.log(`${character.name} effectue une attaque en croix.`);
  }

  performUltimate(character) {
    console.log(`${character.name} utilise son ultime.`);
    character.u = 0; // Réinitialise l'état ultime
  }

  endPlayerTurn() {
    this.playerHasMoved = false;
    this.playerHasActed = false;
    this.turnIndex++;

    const activeCharacter = this.getCurrentEntity();
    if (activeCharacter.u < 3) activeCharacter.u++;

    this.clearTileHighlights();
    this.startEnemyTurn();
  }

  startEnemyTurn() {
    this.isEnemyTurn = true;
    const enemy = this.enemies[this.enemyTurnIndex];

    this.enemyMove(enemy, () => {
      this.isEnemyTurn = false;
      this.enemyTurnIndex = (this.enemyTurnIndex + 1) % this.enemies.length;
      this.nextPlayerTurn();
    });
  }

  enemyMove(enemy, callback) {
    const target = this.characters.reduce(
      (closest, char) => {
        const distance =
          Math.abs(char.x - enemy.x) + Math.abs(char.y - enemy.y);
        return distance < closest.distance ? { char, distance } : closest;
      },
      { char: null, distance: Infinity }
    ).char;

    if (target) {
      const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];

      directions.sort((a, b) => {
        const distA =
          Math.abs(target.x - (enemy.x + a.x)) +
          Math.abs(target.y - (enemy.y + a.y));
        const distB =
          Math.abs(target.x - (enemy.x + b.x)) +
          Math.abs(target.y - (enemy.y + b.y));
        return distA - distB;
      });

      for (const dir of directions) {
        const newX = enemy.x + dir.x;
        const newY = enemy.y + dir.y;

        if (
          newX >= 0 &&
          newX < this.grid.length &&
          newY >= 0 &&
          newY < this.grid[0].length &&
          !this.grid[newX][newY].isObstacle &&
          !this.characters.some((char) => char.x === newX && char.y === newY) &&
          !this.enemies.some(
            (otherEnemy) =>
              otherEnemy !== enemy &&
              otherEnemy.x === newX &&
              otherEnemy.y === newY
          )
        ) {
          enemy.x = newX;
          enemy.y = newY;

          const offsetX =
            (this.cameras.main.width - this.grid[0].length * 64) / 2;
          const offsetY =
            (this.cameras.main.height - this.grid.length * 64) / 2;

          enemy.visual.x = enemy.x * 64 + offsetX + 32;
          enemy.visual.y = enemy.y * 64 + offsetY + 32;
          break;
        }
      }
    }

    this.time.delayedCall(500, callback);
  }

  nextPlayerTurn() {
    this.activeCharacterIndex =
      (this.activeCharacterIndex + 1) % this.characters.length;
    this.updateUI();
  }

  highlightMovableTiles(entity) {
    this.clearTileHighlights();
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    directions.forEach((dir) => {
      const targetX = entity.x + dir.x;
      const targetY = entity.y + dir.y;

      if (
        targetX >= 0 &&
        targetX < this.grid.length &&
        targetY >= 0 &&
        targetY < this.grid[0].length &&
        !this.grid[targetX][targetY].isObstacle &&
        !this.characters.some(
          (char) => char.x === targetX && char.y === targetY
        )
      ) {
        this.grid[targetX][targetY].setFillStyle(0x87cefa);
      }
    });
  }

  clearTileHighlights() {
    this.grid.flat().forEach((tile) => {
      const baseColor =
        (tile.gridX + tile.gridY) % 2 === 0 ? 0xffffff : 0x000000;
      tile.setFillStyle(baseColor);
    });
  }

  handleTileClick(tile) {
    if (this.isEnemyTurn || this.playerHasMoved) return;

    const activeCharacter = this.characters[this.activeCharacterIndex];

    const distance =
      Math.abs(tile.gridX - activeCharacter.x) +
      Math.abs(tile.gridY - activeCharacter.y);

    if (
      distance === 1 &&
      !tile.isObstacle &&
      !this.characters.some(
        (char) => char.x === tile.gridX && char.y === tile.gridY
      )
    ) {
      activeCharacter.x = tile.gridX;
      activeCharacter.y = tile.gridY;

      const offsetX = (this.cameras.main.width - this.grid[0].length * 64) / 2;
      const offsetY = (this.cameras.main.height - this.grid.length * 64) / 2;

      activeCharacter.visual.x = tile.gridX * 64 + offsetX + 32;
      activeCharacter.visual.y = tile.gridY * 64 + offsetY + 32;

      this.playerHasMoved = true;
      this.clearTileHighlights();
      this.updateUI();
    }
  }

  getCurrentEntity() {
    return this.characters[this.activeCharacterIndex];
  }
}
