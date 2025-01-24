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

initializeGrid() {
  const camera = this.cameras.main;
  const gridWidth = 8; // Nombre de colonnes
  const gridHeight = 8; // Nombre de lignes
  const tileSize = 512; // Taille de la tuile (largeur et hauteur)

  const offsetX = (camera.width - gridWidth * tileSize) / 2;
  const offsetY = (camera.height - gridHeight * tileSize) / 2;

  this.grid = [];
  for (let x = 0; x < gridWidth; x++) {
    this.grid[x] = [];
    for (let y = 0; y < gridHeight; y++) {
      const posX = x * tileSize + offsetX;
      const posY = y * tileSize + offsetY;
      const tileKey = (x + y) % 2 === 0 ? 'whiteTile' : 'blackTile';

      // Crée le sprite avec sa taille native (512x512)
      const tile = this.add.sprite(posX + tileSize / 2, posY + tileSize / 2, tileKey).setOrigin(0.5);

      tile.gridX = x;
      tile.gridY = y;
      tile.setInteractive();
      tile.on("pointerdown", () => this.handleTileClick(tile));
      this.grid[x][y] = tile;
    }
  }
}

// Dans la méthode createObstacles() :
createObstacles() {
  const tileSize = 512;
  const offsetX = (this.cameras.main.width - this.grid[0].length * tileSize) / 2;
  const offsetY = (this.cameras.main.height - this.grid.length * tileSize) / 2;
  const camera = this.cameras.main;

  // Ajustez le zoom (valeur inférieure à 1 pour dézoomer)
  camera.setZoom(0.2);

  const minObstacles = 5;
  const maxObstacles = 8;
  const totalObstacles = Phaser.Math.Between(minObstacles, maxObstacles);

  this.obstacles = [];

  // Fonction pour vérifier si une position est valide
  const isValidPosition = (x, y) => {
    // Pas sur les deux premières et deux dernières lignes
    if (y < 2 || y > this.grid.length - 3) return false;

    // Vérifie les positions adjacentes
    const adjacentOffsets = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    const adjacentObstacles = adjacentOffsets.reduce((count, offset) => {
      const nx = x + offset.dx;
      const ny = y + offset.dy;
      return (
        count +
        (this.grid[nx] && this.grid[nx][ny] && this.grid[nx][ny].isObstacle
          ? 1
          : 0)
      );
    }, 0);

    // Pas plus de 2 obstacles côte à côte
    if (adjacentObstacles >= 3) return false;

    return true;
  };

  let attempts = 0;
  while (this.obstacles.length < totalObstacles && attempts < 1000) {
    const x = Phaser.Math.Between(0, this.grid.length - 1);
    const y = Phaser.Math.Between(2, this.grid[0].length - 3); // Évite les deux premières et dernières lignes

    // Vérifie si la position est valide
    if (!this.grid[x][y].isObstacle && isValidPosition(x, y)) {
      const posX = x * tileSize + offsetX + tileSize / 2;
      const posY = y * tileSize + offsetY + tileSize / 2;

      // Choisissez aléatoirement une image pour l'obstacle
      const obstacleImage = Phaser.Math.Between(0, 1) === 0 ? 'bonkTile' : 'bonkTileCaisse';

      // Créez un sprite d'obstacle avec l'image sélectionnée
      const obstacle = this.add.sprite(posX, posY, obstacleImage).setOrigin(0.5);

      // Facultatif : ajuster l'échelle pour correspondre à la taille de la tuile
      obstacle.setDisplaySize(tileSize, tileSize);

      obstacle.gridX = x;
      obstacle.gridY = y;
      obstacle.isObstacle = true;

      this.obstacles.push(obstacle);

      this.grid[x][y].isObstacle = true;
    }

    attempts++;
  }

  if (this.obstacles.length < minObstacles) {
    console.warn(
      `Nombre insuffisant d'obstacles générés (${this.obstacles.length}). Réessayez.`
    );
  }
}



  // Characters Initialization
  initializeCharacters() {
    const tileSize = 512;
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
    const tileSize = 512;
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


  highlightMovableTiles(character) {
    this.grid.forEach((column, x) =>
      column.forEach((tile, y) => {
        tile.clearTint(); // Réinitialise toutes les teintes
        console.log(`Case (${x}, ${y}) réinitialisée.`);
      })
    );
  
    if (!character) return;
  
    const { x, y } = character;
    const possibleMoves = [
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
    ];
  
    possibleMoves.forEach(({ dx, dy }) => {
      const newX = x + dx;
      const newY = y + dy;
  
      if (
        newX >= 0 &&
        newX < this.grid.length &&
        newY >= 0 &&
        newY < this.grid[0].length &&
        !this.grid[newX][newY].isObstacle
      ) {
        console.log(`Highlight case (${newX}, ${newY})`);
        this.grid[newX][newY].setTint(0x00ff00); // Vert
      }
    });
  }

  createUI() {
    this.uiContainer = this.add.container(0, 0);
  
    // Positionner le texte du nom du personnage à gauche
    this.characterNameText = this.add.text(-3000, -1500, "", {
      fontSize: "200px",  // Réduire la taille du texte pour plus de lisibilité
      fill: "#fff",
    });
    this.uiContainer.add(this.characterNameText);
  
    // Positionner le bouton "Fin de tour" à gauche
    this.endTurnButton = this.add
      .text(3400, 2000, "Fin de tour", {
        fontSize: "200px",  // Réduire la taille du texte du bouton
        fill: "#fff",
        backgroundColor: "#444",
      })
      .setInteractive()
      .on("pointerdown", () => this.endPlayerTurn());
  
    this.uiContainer.add(this.endTurnButton);
  }
  
  updateUI() {
    const activeCharacter = this.characters[this.activeCharacterIndex];
  
    // Mettre à jour le nom du personnage
    this.characterNameText.setText(`Nom: ${activeCharacter.name}`);
  
    // Supprimer les anciens boutons d'action
    this.uiContainer.list
      .filter((child) => child.isActionButton)
      .forEach((button) => button.destroy());
  
    // Créer de nouveaux boutons d'action
    activeCharacter.actions.forEach((action, index) => {
      this.createActionButton(action, index + 1);
    });

    if (!this.playerHasMoved){
      this.highlightMovableTiles(activeCharacter);
    } else {
    // Réinitialiser les surbrillances
    this.grid.forEach((column) =>
      column.forEach((tile) => tile.clearTint())
    );
    }
  
    // Créer le bouton de l'ultime si nécessaire
    if (activeCharacter.u === 3) {
      activeCharacter.ultReady = true;
    }
  
    this.createActionButton(activeCharacter.ult, 3, activeCharacter.ultReady);
  }
  
  createActionButton(actionName, actionIndex, ready = true) {
    const offsetX = -3000;  // Garder l'alignement à gauche
    const offsetY = 500 + actionIndex * 500;  // Espacement entre les boutons
    const backgroundColor = actionIndex === 3 && !ready ? "#ff0000" : "#444";
  
    const button = this.add
      .text(offsetX, offsetY, actionName, {
        fontSize: "200px",  // Réduire la taille du texte du bouton
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

    // Réinitialiser les surbrillances
    this.grid.forEach((column) =>
      column.forEach((tile) => tile.clearTint())
    );

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
            (this.cameras.main.width - this.grid[0].length * 512) / 2;
          const offsetY =
            (this.cameras.main.height - this.grid.length * 512) / 2;

          enemy.visual.x = enemy.x * 512 + offsetX + 256;
          enemy.visual.y = enemy.y * 512 + offsetY + 256;
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

      const offsetX = (this.cameras.main.width - this.grid[0].length * 512) / 2;
      const offsetY = (this.cameras.main.height - this.grid.length * 512) / 2;

      activeCharacter.visual.x = tile.gridX * 512 + offsetX + 256;
      activeCharacter.visual.y = tile.gridY * 512 + offsetY + 256;

      this.playerHasMoved = true;

      this.updateUI();
    }
  }

  getCurrentEntity() {
    return this.characters[this.activeCharacterIndex];
  }
}
