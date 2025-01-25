export default class Combat extends Phaser.Scene {
  constructor() {
    super({ key: "combat" });
    this.activeCharacterIndex = 0; // Indice du personnage actif
    this.selectedTile = null; // Case sélectionnée pour le déplacement
    this.isEnemyTurn = false; // Gestion des tours alternés entre joueurs et ennemis
    this.enemyTurnIndex = 0; // Indice pour gérer le tour des ennemis individuellement
    this.playerHasMoved = false; // Suivi du déplacement du joueur par tour
    this.patient = false;
    this.tuto = true;
    this.stateStack = [];
  }

  // Phaser preload method
  preload() {
    // Précharge ici les assets si nécessaire
  }

  // Phaser create method
  create() {
    this.fond = this.add.image(0, 0, "portrait").setOrigin(1.75, 1).setScale(5);

    this.tutorialContainer = this.add.container(this.scale.width - 300, 50);

    // Créer les images du tutoriel (mais les rendre invisibles au départ)
    this.tutoImages = {
      move: this.add
        .image(0, 0, "tuto_move")
        .setOrigin(-1.2, 0)
        .setScale(1.3)
        .setVisible(false),
      action: this.add
        .image(0, 0, "tuto_action")
        .setOrigin(-1.2, 0)
        .setScale(1.3)
        .setVisible(false),
      aveugle: this.add
        .image(0, 0, "tuto_aveugle")
        .setOrigin(-1.2, 0)
        .setScale(1.3)
        .setVisible(false),
      musicien: this.add
        .image(0, 0, "tuto_musicien")
        .setOrigin(-1.2, 0)
        .setScale(1.3)
        .setVisible(false),
      enregistreur: this.add
        .image(0, 0, "tuto_enregistreur")
        .setOrigin(-1.2, 0)
        .setScale(1.3)
        .setVisible(false),
      ulti: this.add
        .image(0, 0, "tuto_ulti")
        .setOrigin(-1.2, 0)
        .setScale(1.3)
        .setVisible(false),
    };

    // Ajouter les images au conteneur
    Object.values(this.tutoImages).forEach((image) =>
      this.tutorialContainer.add(image)
    );

    // Afficher la première image
    this.showTutorial("move");
    this.initializeGrid();
    this.createObstacles();
    this.initializeCharacters();
    this.initializeEnemies();
    this.createUI();
    this.updateUI();
  }

  showTutorial(key) {
    // Masquer toutes les images
    Object.values(this.tutoImages).forEach((image) => image.setVisible(false));

    // Afficher l'image correspondante
    if (this.tutoImages[key]) {
      this.tutoImages[key].setVisible(true);
    }
  }

  checkTutorialProgress() {
    if (!this.tuto) return;
    const activeCharacter = this.characters[this.activeCharacterIndex];

    switch (activeCharacter.name) {
      case "Aveugle":
        this.showTutorial("aveugle");
        break;
      case "Musicien":
        this.showTutorial("musicien");
        break;
      case "Enregistreur":
        this.showTutorial("enregistreur");
        break;
    }

    // Si on est au quatrième tour, afficher l'image pour l'ulti
    if (this.turnIndex === 4) {
      this.showTutorial("ulti");
    }
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
        const tileKey = (x + y) % 2 === 0 ? "whiteTile" : "blackTile";

        // Crée le sprite avec sa taille native (512x512)
        const tile = this.add
          .sprite(posX + tileSize / 2, posY + tileSize / 2, tileKey)
          .setOrigin(0.5);

        tile.gridX = x;
        tile.gridY = y;
        tile.setInteractive();
        tile.on("pointerdown", () => this.handleTileClick(tile));
        this.grid[x][y] = tile;
      }
    }
  }

  saveGameState() {
    const state = {
      characters: this.characters.map((char) => ({
        name: char.name,
        x: char.x,
        y: char.y,
        hp: char.hp,
        buffs: char.buff || null,
        hasActed: char.hasActed || false, // Nouveau
      })),
      enemies: this.enemies.map((enemy) => ({
        name: enemy.name,
        x: enemy.x,
        y: enemy.y,
        hp: enemy.hp,
        debuff: enemy.debuff || false,
        hasActed: enemy.hasActed || false, // Nouveau
      })),
      activeCharacterIndex: this.activeCharacterIndex,
      enemyTurnIndex: this.enemyTurnIndex,
      gridState: this.grid.flat().map((tile) => ({
        x: tile.gridX,
        y: tile.gridY,
        color: tile.fillColor,
      })),
    };

    this.stateStack.push(state);
    console.log("État sauvegardé :", state);
  }

  // Dans la méthode createObstacles() :
  createObstacles() {
    const tileSize = 512;
    const offsetX =
      (this.cameras.main.width - this.grid[0].length * tileSize) / 2;
    const offsetY =
      (this.cameras.main.height - this.grid.length * tileSize) / 2;
    const camera = this.cameras.main;

    // Ajustez le zoom (valeur inférieure à 1 pour dézoomer)
    camera.setZoom(0.2);
    this.background = this.add
      .image(0, 0, "back")
      .setOrigin(0.4, 0.4)
      .setDisplaySize(
        this.cameras.main.width / camera.zoom,
        this.cameras.main.height / camera.zoom
      );
    camera.centerOn(this.background.width / 2, this.background.height / 2);
    this.children.sendToBack(this.background);
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
        const obstacleImage =
          Phaser.Math.Between(0, 1) === 0 ? "bonkTile" : "bonkTileCaisse";

        // Créez un sprite d'obstacle avec l'image sélectionnée
        const obstacle = this.add
          .sprite(posX, posY, obstacleImage)
          .setOrigin(0.5);

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

  initializeCharacters() {
    const tileSize = 512;
    const offsetX =
      (this.cameras.main.width - this.grid[0].length * tileSize) / 2;
    const offsetY =
      (this.cameras.main.height - this.grid.length * tileSize) / 2;

    this.characters = [
      {
        name: "Aveugle",
        spriteKey: "aveugleSprite",
        x: 0,
        y: 7,
        angle: 90, // Direction initiale (vers le bas)
        actions: [
          { name: "Pierre Résonnante", icon: "pierreIcon" },
          { name: "Canne Chercheuse", icon: "canneIcon" },
        ],
        ult: { name: "Gourde énergisante", icon: "healIcon" },
        ultReady: false,
        hp: 6,
        u: 0,
      },
      {
        name: "Musicien",
        spriteKey: "musicienSprite",
        x: 3,
        y: 7,
        angle: 90, // Direction initiale (vers le bas)
        actions: [
          { name: "La musique dans la peau", icon: "musicIcon" },
          { name: "Rythme endiablé", icon: "rythmIcon" },
        ],
        ult: { name: "Douce mélodie", icon: "melodyIcon" },
        ultReady: false,
        hp: 4,
        u: 0,
      },
      {
        name: "Enregistreur",
        spriteKey: "enregistreurSprite",
        x: 7,
        y: 7,
        angle: 90, // Direction initiale (vers le bas)
        actions: [
          { name: "Record", icon: "recordIcon" },
          { name: "Soundboard", icon: "soundboardIcon" },
        ],
        ult: { name: "Rewind", icon: "rewindIcon" },
        ultReady: false,
        hp: 5,
        u: 0,
      },
    ];

    this.characters.forEach((char) => {
      const posX = char.x * tileSize + offsetX + tileSize / 2;
      const posY = char.y * tileSize + offsetY + tileSize / 2;
      char.visual = this.add
        .sprite(posX, posY, char.spriteKey)
        .setOrigin(0.5)
        .setScale(0.5)
        .setAngle(char.angle);
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
      {
        name: "Ennemi 1",
        x: 2,
        y: 0,
        hp: 3,
        debuff: false,
        spriteKey: "gramophoneSprite",
      },
      {
        name: "Ennemi 2",

        x: 5,
        y: 0,
        hp: 4,
        debuff: false,
        spriteKey: "megaphoneSprite",
      },
      {
        name: "Ennemi 3",
        color: 0x8877ff,
        x: 3,
        y: 0,
        hp: 5,
        debuff: false,
        spriteKey: "megaphoneSprite",
      },
    ];

    this.enemies.forEach((enemy) => {
      const posX = enemy.x * tileSize + offsetX + tileSize / 2;
      const posY = enemy.y * tileSize + offsetY + tileSize / 2;
      enemy.visual = this.add
        .sprite(posX, posY, enemy.spriteKey)
        .setScale(0.3)
        .setOrigin(0.5, 0.5);
    });
  }

  highlightMovableTiles(character) {
    this.grid.forEach((column, x) =>
      column.forEach((tile, y) => {
        tile.clearTint(); // Réinitialise toutes les teintes
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
        this.grid[newX][newY].setTint(0x1652ff); // Vert
      }
    });
  }

  createUI() {
    this.uiContainer = this.add.container(0, 0);

    this.activeCharacterIcon = this.add.image(-2500, -1300, null).setScale(2);
    this.uiContainer.add(this.activeCharacterIcon);

    // Bouton "Fin de tour"
    this.endTurnButtonIcon = this.add
      .image(4000, 2000, "endTurnIcon")
      .setScale(2)
      .setInteractive()
      .on("pointerdown", () => this.endPlayerTurn());
    this.uiContainer.add(this.endTurnButtonIcon);
  }

  updateUI() {
    if (this.characters.length === 0 || this.enemies.length === 0) {
      this.checkEndConditions();
      return; // Arrête la mise à jour de l'interface
    }

    const activeCharacter = this.characters[this.activeCharacterIndex];

    // Vérifie si l'activeCharacter existe encore
    if (!activeCharacter) {
      console.log("Aucun personnage actif !");
      return;
    }
    this.checkEndConditions(); // Mettre à jour le texte du nom du personnage

    this.portrait = this.activeCharacterIcon.setTexture(
      activeCharacter.name.toLowerCase()
    );

    this.uiContainer.list
      .filter((child) => child.isActionButton)
      .forEach((button) => button.destroy());

    // Créer de nouveaux boutons d'action
    activeCharacter.actions.forEach((action, index) => {
      this.createActionButton(action, index + 1);
    });

    if (activeCharacter.u === 3) {
      activeCharacter.ultReady = true; // Débloque l'ultime après un tour complet
    }

    this.createActionButton(activeCharacter.ult, 3, activeCharacter.ultReady);

    if (activeCharacter.name === "Aveugle") {
      this.restrictVisionToCharacter(activeCharacter);
    } else if (!this.playerHasMoved) {
      this.highlightMovableTiles(activeCharacter);
    } else {
      // Réinitialiser les surbrillances
      this.grid.forEach((column) => column.forEach((tile) => tile.clearTint()));
    }

    // Créer le bouton de l'ultime si nécessaire
    if (activeCharacter.u === 3) {
      activeCharacter.ultReady = true;
    }

    this.createActionButton(activeCharacter.ult, 3, activeCharacter.ultReady);
  }

  checkEndConditions() {
    // Supprime les personnages ou ennemis morts
    this.characters = this.characters.filter((character) => {
      if (character.hp <= 0) {
        console.log(`${character.name} est mort et disparaît du plateau.`);
        character.visual.destroy(); // Supprime l'affichage du personnage
        return false; // Retire le personnage de la liste
      }
      return true;
    });

    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.hp <= 0) {
        console.log(`${enemy.name} est mort et disparaît du plateau.`);
        enemy.visual.destroy(); // Supprime l'affichage de l'ennemi
        return false; // Retire l'ennemi de la liste
      }
      return true;
    });

    // Conditions de victoire ou de défaite
    if (this.characters.length === 0) {
      console.log("Défaite ! Tous les personnages sont morts.");
      this.showEndScreen(false); // Affiche un écran de défaite
    } else if (this.enemies.length === 0) {
      console.log("Victoire ! Tous les ennemis ont été vaincus.");
      this.showEndScreen(true); // Affiche un écran de victoire
    }
  }

  showEndScreen(victory) {
    const text = victory ? "Victoire !" : "Défaite !";
    const color = victory ? "#00ff00" : "#ff0000";

    // Affiche un texte au centre de l'écran
    const endText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      text,
      {
        fontSize: "128px",
        color: color,
      }
    );
    endText.setOrigin(0.5);

    // Désactive toutes les interactions
    this.input.enabled = false;

    // Redémarre la scène après quelques secondes
    this.time.delayedCall(3000, () => {
      this.scene.restart();
    });
  }

  restrictVisionToCharacter(character) {
    // Cache toutes les cases
    this.grid.flat().forEach((tile) => {
      tile.setTint(0x000000); // Noir pour cacher
    });

    // Cache tous les obstacles, ennemis et personnages
    this.obstacles.forEach((obstacle) => obstacle.setVisible(false));
    this.enemies.forEach((enemy) => enemy.visual.setVisible(false));
    this.characters.forEach((char) => {
      if (char !== character) char.visual.setVisible(false);
    });

    // Affiche uniquement la case du personnage et les cases visibles autour de lui
    const directions = [
      { x: 0, y: 0 }, // Position actuelle
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: -1 }, // Diagonales
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: 1 },
    ];

    directions.forEach((dir) => {
      const targetX = character.x + dir.x;
      const targetY = character.y + dir.y;

      if (
        targetX >= 0 &&
        targetX < this.grid.length &&
        targetY >= 0 &&
        targetY < this.grid[0].length
      ) {
        const tile = this.grid[targetX][targetY];
        const baseColor = (targetX + targetY) % 2 === 0 ? 0xffffff : 0x5fffff;

        // Rendre visible les obstacles, ennemis ou personnages dans le champ de vision
        if (
          this.obstacles.some(
            (ob) => ob.gridX === targetX && ob.gridY === targetY
          )
        ) {
          const obstacle = this.obstacles.find(
            (ob) => ob.gridX === targetX && ob.gridY === targetY
          );
          obstacle.setVisible(true);
          tile.setTint(baseColor); // Restaure la couleur de la case
        } else if (
          this.enemies.some((en) => en.x === targetX && en.y === targetY)
        ) {
          const enemy = this.enemies.find(
            (en) => en.x === targetX && en.y === targetY
          );
          enemy.visual.setVisible(true);
          tile.setTint(baseColor); // Restaure la couleur de la case
        } else if (
          this.characters.some(
            (ch) => ch.x === targetX && ch.y === targetY && ch !== character
          )
        ) {
          const otherChar = this.characters.find(
            (ch) => ch.x === targetX && ch.y === targetY && ch !== character
          );
          otherChar.visual.setVisible(true);
          tile.setTint(baseColor); // Restaure la couleur de la case
        } else {
          tile.setTint(baseColor); // Restaure uniquement les cases adjacentes visibles
        }
      }
    });

    // Rendre visible le personnage actuel
    character.visual.setVisible(true);

    // Met en surbrillance les cases où le personnage peut se déplacer
    //this.highlightMovableTiles(character);
  }

  createActionButton(action, actionIndex, ready = true) {
    const offsetX = -3000; // Garder l'alignement à gauche
    const offsetY = 0 + actionIndex * 800; // Espacement entre les boutons
    const backgroundColor = actionIndex === 3 && !ready ? "#ff0000" : "#444";

    // Ajout de l'image d'action
    const actionImage = this.add
      .image(offsetX + 500, offsetY - 300, action.icon) // Positionner l'image
      .setScale(2)
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => {
        if (actionIndex === 3 && !ready) {
          console.log("Ultime non disponible !");
        } else {
          this.handleAction(actionIndex);
        }
      });

    // Ajout du bouton texte
    const button = this.add
      .text(offsetX, offsetY, action.name, {
        fontSize: "100px", // Réduire la taille du texte du bouton
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
    actionImage.isActionButton = true;

    this.uiContainer.add(actionImage);
    this.uiContainer.add(button);
  }

  handleAction(actionIndex) {
    const activeCharacter = this.characters[this.activeCharacterIndex];
    console.log(activeCharacter.act);
    if (!activeCharacter.act) {
      switch (activeCharacter.name) {
        case "Aveugle":
          if (actionIndex === 1) {
            this.performLineAttack(activeCharacter);
            activeCharacter.act = true;
          } else if (actionIndex === 2) {
            this.performCrossAttack(activeCharacter);
            activeCharacter.act = true;
          } else if (actionIndex === 3) {
            if (activeCharacter.ultReady) {
              this.performHeal(activeCharacter);
              activeCharacter.act = true;
              activeCharacter.ultReady = false; // Réinitialise l'ultime après utilisation
            } else {
              console.log("Ultime non disponible !");
            }
          }
          break;

        case "Musicien":
          if (actionIndex === 1) {
            this.performRhythmAttack(activeCharacter);
          } else if (actionIndex === 2) {
            this.performBuffOrDebuff(activeCharacter);
          } else if (actionIndex === 3) {
            if (activeCharacter.ultReady) {
              this.performCharm(activeCharacter);
              activeCharacter.ultReady = false; // Réinitialise l'ultime après utilisation
            } else {
              console.log("Ultime non disponible !");
            }
          }
          break;

        case "Enregistreur":
          if (actionIndex === 1) {
            this.recordAction(activeCharacter);
          } else if (actionIndex === 2) {
            this.playRecordedAction(activeCharacter);
          } else if (actionIndex === 3) {
            if (activeCharacter.ultReady) {
              this.performRewind(activeCharacter);
              activeCharacter.ultReady = false; // Réinitialise l'ultime après utilisation
            } else {
              console.log("Ultime non disponible !");
            }
          }
          break;
      }
    }
    // Marque que le joueur a effectué une action
  }
  performLineAttack(character) {
    console.log(`${character.name} effectue une attaque en ligne.`);

    const direction = { x: 0, y: -1 }; // Par défaut, attaque vers le haut
    const tilesRevealed = [];
    let targetX = character.x + direction.x;
    let targetY = character.y + direction.y;

    // Révèle la case actuelle du personnage
    const startTile = this.grid[character.x][character.y];
    const startColor =
      (character.x + character.y) % 2 === 0 ? 0xffffff : 0xff8851;
    startTile.setTint(startColor);
    tilesRevealed.push(startTile);

    while (
      targetX >= 0 &&
      targetX < this.grid.length &&
      targetY >= 0 &&
      targetY < this.grid[0].length
    ) {
      const tile = this.grid[targetX][targetY];

      if (
        this.obstacles.some(
          (ob) => ob.gridX === targetX && ob.gridY === targetY
        )
      ) {
        // S'arrête sur un obstacle
        console.log("Obstacle rencontré !");
        tile.setTint((targetX + targetY) % 2 === 0 ? 0xffffff : 0xff8851); // Révèle la case
        tilesRevealed.push(tile);
        break;
      }

      if (this.enemies.some((en) => en.x === targetX && en.y === targetY)) {
        // Inflige des dégâts à l'ennemi rencontré
        const enemy = this.enemies.find(
          (en) => en.x === targetX && en.y === targetY
        );
        enemy.hp -= 1;
        this.sound.play("pierre_resonante");
        console.log(
          `Ennemi touché à (${targetX}, ${targetY}), HP restant : ${enemy.hp}`
        );
        tile.setTint((targetX + targetY + 3) % 2 === 0 ? 0xffffff : 0xff8851); // Révèle la case
        tilesRevealed.push(tile);
        break;
      }

      // Révèle le chemin
      tile.setTint((targetX + targetY) % 2 === 0 ? 0xffffff : 0xff8851);
      tilesRevealed.push(tile);

      targetX += direction.x;
      targetY += direction.y;
    }

    console.log("Chemin révélé :", tilesRevealed);
  }

  performCrossAttack(character) {
    console.log(`${character.name} effectue une attaque en croix.`);

    const directions = [
      { x: 0, y: -1 }, // Haut
      { x: 0, y: 1 }, // Bas
      { x: -1, y: 0 }, // Gauche
      { x: 1, y: 0 }, // Droite
    ];

    directions.forEach((dir) => {
      const targetX = character.x + dir.x;
      const targetY = character.y + dir.y;

      if (
        targetX >= 0 &&
        targetX < this.grid.length &&
        targetY >= 0 &&
        targetY < this.grid[0].length
      ) {
        const tile = this.grid[targetX][targetY];

        // Vérifie si un ennemi se trouve sur la case
        const enemy = this.enemies.find(
          (en) => en.x === targetX && en.y === targetY
        );
        if (enemy) {
          enemy.hp -= 2; // Inflige 2 dégâts
          console.log(
            `Ennemi touché à (${targetX}, ${targetY}), HP restant : ${enemy.hp}`
          );
          this.sound.play("canne");
        }

        // Révèle la case en couleur
        const baseColor = (targetX + targetY) % 2 === 0 ? 0xffffff : 0xff8851;
        tile.setTint(baseColor);
      }
    });
  }

  performHeal(character) {
    const activeCharacter = this.getCurrentEntity();
    activeCharacter.u = 0;
    this.characters.forEach((char) => {
      char.hp += 2; // Réinitialise l'opacité des personnages
    });
    this.sound.play("gourde");
  }

  performRhythmAttack(character) {
    // Logique pour l'attaque rythmée
    this.sound.play("rythme");
  }

  performBuffOrDebuff(character) {
    console.log(`${character.name} utilise son buff/debuff.`);

    const letters = ["A", "E", "S", "Z", "Q", "D"];
    let qteIndex = 0;
    let qteSuccessCount = 0;
    let previousLetter = null;

    const dimGridAndObstacles = () => {
      this.grid.flat().forEach((tile) => {
        tile.setTint(0x333333); // Assombrit toutes les cases
      });
      this.obstacles.forEach((obstacle) => {
        obstacle.setTint(0x333333); // Assombrit les obstacles
      });
    };

    const resetGridAndTargets = () => {
      this.grid.flat().forEach((tile) => {
        tile.clearTint(); // Restaure les couleurs du plateau
      });
      this.obstacles.forEach((obstacle) => {
        obstacle.clearTint(); // Restaure la couleur des obstacles
      });
      this.characters.forEach((char) => {
        char.visual.setAlpha(1); // Réinitialise l'opacité des personnages
      });
      this.enemies.forEach((enemy) => {
        enemy.visual.setAlpha(1); // Réinitialise l'opacité des ennemis
      });
    };

    const chooseTarget = () => {
      console.log("Choisissez un allié ou un ennemi.");

      dimGridAndObstacles(); // Assombrit le plateau et les obstacles
      // Met en lumière les cibles possibles

      // Affiche les alliés et ennemis à l'écran pour sélection
      this.characters.forEach((char) => {
        if (char !== character) {
          char.visual.setInteractive().on("pointerdown", () => {
            char.visual.disableInteractive();
            resetGridAndTargets(); // Réinitialise le plateau après la sélection
            console.log(`${char.name} sélectionné pour le buff.`);
            handleQTE(char, true); // Lance le QTE avec un allié
          });
        }
      });

      this.enemies.forEach((enemy) => {
        enemy.visual.setInteractive().on("pointerdown", () => {
          enemy.visual.disableInteractive();
          resetGridAndTargets(); // Réinitialise le plateau après la sélection
          console.log(`${enemy.name} sélectionné pour le debuff.`);
          handleQTE(enemy, false); // Lance le QTE avec un ennemi
        });
      });
    };

    const handleQTE = (target, isAlly) => {
      if (qteIndex >= 3) {
        console.log("QTE terminé !");
        if (qteSuccessCount === 3) {
          console.log("QTE réussi entièrement ! Effet appliqué sur la cible.");

          if (isAlly) {
            target.buff = { atkBoost: 1 };
            console.log(
              `${target.name} reçoit un buff de +1 ATK pour son prochain coup.`
            );
          } else {
            target.debuff = { cannotMove: true };
            console.log(
              `${target.name} ne peut pas bouger pendant son prochain tour.`
            );
            target.debuff = true;
          }
        } else {
          console.log("QTE partiellement échoué. Aucun effet appliqué.");
        }
        return;
      }

      let targetLetter;
      do {
        targetLetter = letters[Math.floor(Math.random() * letters.length)];
      } while (targetLetter === previousLetter); // Évite de répéter la même lettre

      previousLetter = targetLetter;
      console.log(
        `QTE ${qteIndex + 1}: Appuyez sur '${targetLetter}' rapidement !`
      );

      const qteText = this.add.text(
        3000,
        -1500,
        `Appuyez sur '${targetLetter}'`,
        {
          fontSize: "200px",
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 10, y: 10 },
        }
      );

      let qteSuccess = false;
      const qteTimer = this.time.delayedCall(1500, () => {
        // 1.5 secondes pour répondre
        if (!qteSuccess) {
          console.log(`QTE ${qteIndex + 1} échoué.`);
        }
        qteText.destroy();
        qteIndex++;
        handleQTE(target, isAlly);
      });

      const keyListener = this.input.keyboard.on("keydown", (event) => {
        if (event.key.toUpperCase() === targetLetter && !qteSuccess) {
          qteSuccess = true;
          qteSuccessCount++;
          qteTimer.remove();
          console.log(`QTE ${qteIndex + 1} réussi !`);
          qteText.destroy();
          this.input.keyboard.off("keydown", keyListener);
          qteIndex++;
          handleQTE(target, isAlly);
        }
      });
    };

    chooseTarget();
  }
  performCharm(character) {
    const activeCharacter = this.getCurrentEntity();
    activeCharacter.u = 0;
    this.sound.play("charme");
  }

  recordAction(character) {
    console.log(`${character.name} patiente ce tour.`);

    this.sound.play("record");

    // Désactive les actions et les déplacements pour ce tour
    this.playerHasMoved = true;

    this.patient = true;
    // Si nécessaire, vous pouvez ajouter des effets visuels pour indiquer que le personnage attend

    // Passe directement au tour suivant
    this.endPlayerTurn();
  }

  playRecordedAction(character) {
    if (!this.patient) return;
    this.patient = false;
    this.sound.play("soundboard");
    console.log(`${character.name} utilise sa prochaine action.`);

    // Diminue légèrement l'opacité des autres personnages et ennemis pour indiquer un focus
    this.dimGridAndHighlightCharacter(character);

    // Affiche les trois choix d'action
    const options = [
      {
        name: "Déplacement libre",
        action: this.freeMove.bind(this, character),
        imageKey: "card_move", // Clé de l'image pour l'option
      },
      {
        name: "3 Dégâts autour",
        action: this.areaDamage.bind(this, character),
        imageKey: "card_att", // Clé de l'image pour l'option
      },
      {
        name: "Échanger de place",
        action: this.switchPosition.bind(this, character),
        imageKey: "card_echange", // Clé de l'image pour l'option
      },
    ];

    // Calcul des positions pour centrer les images
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const imageSpacing = 1600; // Espacement entre les images

    options.forEach((option, index) => {
      const posX = centerX + (index - 1) * imageSpacing; // Positionne les images horizontalement au centre
      const posY = centerY;

      // Ajoute l'image interactive pour l'option
      const optionImage = this.add
        .image(posX, posY, option.imageKey) // Utilise la clé de l'image
        .setScale(2) // Ajuste l'échelle de l'image
        .setInteractive()
        .on("pointerdown", () => {
          console.log(`Option choisie : ${option.name}`);
          option.action(); // Exécute l'action associée
          this.clearActionButtons(); // Nettoie les images après choix
          this.updateUI(); // Met à jour l'interface
        });

      optionImage.isActionButton = true;
      this.uiContainer.add(optionImage);
    });
  }

  dimGridAndHighlightCharacter(character) {
    this.grid.flat().forEach((tile) => tile.setTint(0x333333)); // Assombrit la grille
    character.visual.setAlpha(1); // Met en évidence le personnage actif
  }

  clearActionButtons() {
    this.uiContainer.list
      .filter((child) => child.isActionButton)
      .forEach((button) => button.destroy());
  }
  freeMove(character) {
    console.log("Déplacement libre activé.");

    // Récupère toutes les cases valides pour le mouvement (même ligne ou colonne)
    const validTiles = this.grid
      .flat()
      .filter(
        (tile) => tile.gridX === character.x || tile.gridY === character.y
      );

    // Ajoute des interactivités aux cases valides
    validTiles.forEach((tile) => {
      tile.setTint(0x87cefa); // Surligne les cases valides
      tile.setInteractive().on("pointerdown", () => {
        // Déplace le personnage vers la nouvelle case
        character.x = tile.gridX;
        character.y = tile.gridY;

        const offsetX =
          (this.cameras.main.width - this.grid[0].length * 512) / 2;
        const offsetY = (this.cameras.main.height - this.grid.length * 512) / 2;

        character.visual.x = tile.gridX * 512 + offsetX + 256;
        character.visual.y = tile.gridY * 512 + offsetY + 256;

        // Nettoie uniquement les cases valides après le déplacement
        validTiles.forEach((tile) => {
          tile.clearTint();
          tile.removeInteractive();
        });

        this.playerHasMoved = true;
        console.log("Déplacement terminé !");
      });
    });
  }

  areaDamage(character) {
    console.log("Attaque de zone activée.");

    const directions = [
      { x: 0, y: -1 }, // Haut
      { x: 0, y: 1 }, // Bas
      { x: -1, y: 0 }, // Gauche
      { x: 1, y: 0 }, // Droite
      { x: -1, y: -1 }, // Diagonale haut-gauche
      { x: 1, y: -1 }, // Diagonale haut-droite
      { x: -1, y: 1 }, // Diagonale bas-gauche
      { x: 1, y: 1 }, // Diagonale bas-droite
    ];

    directions.forEach((dir) => {
      const targetX = character.x + dir.x;
      const targetY = character.y + dir.y;

      const enemy = this.enemies.find(
        (en) => en.x === targetX && en.y === targetY
      );

      if (enemy) {
        enemy.hp -= 3; // Inflige 3 dégâts
        this.sound.play("rocker_atk1");
        console.log(`${enemy.name} touché ! HP restant : ${enemy.hp}`);
      }
    });
  }

  switchPosition(character) {
    console.log("Échange de position activé.");

    this.characters
      .filter((char) => char !== character) // Filtre les autres alliés
      .forEach((ally) => {
        ally.visual.setInteractive().on("pointerdown", () => {
          console.log(`Échange entre ${character.name} et ${ally.name}`);

          // Échange des positions
          const tempX = character.x;
          const tempY = character.y;
          character.x = ally.x;
          character.y = ally.y;
          ally.x = tempX;
          ally.y = tempY;

          const offsetX =
            (this.cameras.main.width - this.grid[0].length * 512) / 2;
          const offsetY =
            (this.cameras.main.height - this.grid.length * 512) / 2;

          // Met à jour les positions visuelles
          character.visual.x = character.x * 512 + offsetX + 256;
          character.visual.y = character.y * 512 + offsetY + 256;
          ally.visual.x = ally.x * 512 + offsetX + 256;
          ally.visual.y = ally.y * 512 + offsetY + 256;
          this.sound.play("gourde");

          // Désactive les clics et nettoie
          this.characters.forEach((char) => char.visual.removeInteractive());
          console.log("Échange terminé !");
        });
      });
  }

  performRewind(character) {
    this.sound.play("rewind");
    const activeCharacter = this.getCurrentEntity();
    activeCharacter.u = 0;
    this.restoreGameState();
  }
  restoreGameState() {
    if (this.stateStack.length === 0) {
      console.log("Aucun état à restaurer !");
      return;
    }

    const lastState = this.stateStack.pop();

    // Restaurer les personnages
    lastState.characters.forEach((savedChar, index) => {
      const char = this.characters[index];
      char.x = savedChar.x;
      char.y = savedChar.y;
      char.hp = savedChar.hp;
      char.buff = savedChar.buffs;
      char.hasActed = savedChar.hasActed; // Restaure l'état d'action

      const offsetX = (this.cameras.main.width - this.grid[0].length * 512) / 2;
      const offsetY = (this.cameras.main.height - this.grid.length * 512) / 2;

      char.visual.x = char.x * 512 + offsetX + 256;
      char.visual.y = char.y * 512 + offsetY + 256;
    });

    // Restaurer les ennemis
    lastState.enemies.forEach((savedEnemy, index) => {
      const enemy = this.enemies[index];
      enemy.x = savedEnemy.x;
      enemy.y = savedEnemy.y;
      enemy.hp = savedEnemy.hp;
      enemy.debuff = savedEnemy.debuff;
      enemy.hasActed = savedEnemy.hasActed; // Restaure l'état d'action

      const offsetX = (this.cameras.main.width - this.grid[0].length * 512) / 2;
      const offsetY = (this.cameras.main.height - this.grid.length * 512) / 2;

      enemy.visual.x = enemy.x * 512 + offsetX + 256;
      enemy.visual.y = enemy.y * 512 + offsetY + 256;
    });

    // Restaurer l'état de la grille
    lastState.gridState.forEach((savedTile) => {
      const tile = this.grid[savedTile.x][savedTile.y];
      tile.setTint(savedTile.color);
    });

    this.activeCharacterIndex = lastState.activeCharacterIndex;
    this.enemyTurnIndex = lastState.enemyTurnIndex;

    console.log("État restauré :", lastState);
    this.updateUI();
  }

  endPlayerTurn() {
    this.playerHasMoved = false;
    this.turnIndex++;

    const activeCharacter = this.getCurrentEntity();
    if (activeCharacter.u < 3) activeCharacter.u++;

    // Réinitialiser les surbrillances
    this.grid.forEach((column) => column.forEach((tile) => tile.clearTint()));

    if (this.tutoImages.move.visible) {
      this.showTutorial("action"); // Passer au tutoriel suivant
    } else if (this.tutoImages.action.visible) {
      this.showTutorial(null); // Masquer les tutoriels
    }

    this.startEnemyTurn();
  }

  startEnemyTurn() {
    this.saveGameState();
    this.isEnemyTurn = true;
    const enemy = this.enemies[this.enemyTurnIndex];
    this.obstacles.forEach((obstacle) => {
      obstacle.setVisible(true); // Affiche les obstacles
    });

    this.enemies.forEach((enemy) => {
      enemy.visual.setVisible(true); // Affiche les ennemis
    });

    this.characters.forEach((char) => {
      char.visual.setVisible(true); // Affiche les personnages
    });

    if (enemy.debuff) {
      console.log(`${enemy.name} est débuffé et ne peut pas bouger ce tour.`);
      enemy.debuff = false; // Réinitialise le debuff après le tour
      this.isEnemyTurn = false;
      this.enemyTurnIndex = (this.enemyTurnIndex + 1) % this.enemies.length;
      this.nextPlayerTurn();
      return;
    }

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

    if (!target) {
      console.log("Aucune cible disponible pour cet ennemi.");
      this.time.delayedCall(500, callback);
      return;
    }

    // Dimensions de la grille
    const rows = this.grid.length;
    const cols = this.grid[0].length;

    // Initialisation de la matrice de distances
    const distanceMatrix = Array.from({ length: rows }, () =>
      Array(cols).fill(Infinity)
    );

    // Marque les obstacles dans la matrice
    this.grid.flat().forEach((tile) => {
      if (tile.isObstacle) {
        distanceMatrix[tile.gridX][tile.gridY] = -1; // -1 pour représenter un obstacle
      }
    });

    // BFS pour calculer les distances depuis la cible
    const queue = [{ x: target.x, y: target.y, distance: 0 }];
    distanceMatrix[target.x][target.y] = 0;

    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift();

      directions.forEach((dir) => {
        const newX = current.x + dir.x;
        const newY = current.y + dir.y;

        if (
          newX >= 0 &&
          newX < rows &&
          newY >= 0 &&
          newY < cols &&
          distanceMatrix[newX][newY] === Infinity &&
          !this.characters.some((char) => char.x === newX && char.y === newY) &&
          !this.enemies.some(
            (otherEnemy) =>
              otherEnemy !== enemy &&
              otherEnemy.x === newX &&
              otherEnemy.y === newY
          )
        ) {
          distanceMatrix[newX][newY] = current.distance + 1;
          queue.push({ x: newX, y: newY, distance: current.distance + 1 });
        }
      });
    }

    // Détermine la direction optimale
    let bestMove = null;
    let shortestDistance = Infinity;

    directions.forEach((dir) => {
      const newX = enemy.x + dir.x;
      const newY = enemy.y + dir.y;

      if (
        newX >= 0 &&
        newX < rows &&
        newY >= 0 &&
        newY < cols &&
        distanceMatrix[newX][newY] !== -1 && // Pas un obstacle
        distanceMatrix[newX][newY] < shortestDistance
      ) {
        shortestDistance = distanceMatrix[newX][newY];
        bestMove = { x: newX, y: newY };
      }
    });

    // Déplace l'ennemi vers la meilleure case
    if (bestMove) {
      enemy.x = bestMove.x;
      enemy.y = bestMove.y;

      const tileSize = 512; // Taille des tuiles : 512x512
      const offsetX =
        (this.cameras.main.width - this.grid[0].length * tileSize) / 2;
      const offsetY =
        (this.cameras.main.height - this.grid.length * tileSize) / 2;

      enemy.visual.x = enemy.x * tileSize + offsetX + tileSize / 2;
      enemy.visual.y = enemy.y * tileSize + offsetY + tileSize / 2;
    } else {
      console.log("Aucun mouvement optimal trouvé pour cet ennemi.");
    }
    this.performEnemyAttack(enemy);
    if (enemy.name === "Ennemi 2") {
      // Vérifie s'il y a des cibles pour l'attaque spéciale
      this.enemyAttack2(enemy);
      this.time.delayedCall(500, callback); // Délai avant la fin du tour
      return;
    }

    if (enemy.name === "Ennemi 3") {
      // Effectue une attaque combinée
      this.enemyAttackCombined(enemy);
      this.time.delayedCall(500, callback); // Ajoute un délai avant la fin du tour
      return;
    }

    this.time.delayedCall(500, callback);
  }

  performEnemyAttack(enemy) {
    const directions = [
      { x: 0, y: -1 }, // Haut
      { x: 0, y: 1 }, // Bas
      { x: -1, y: 0 }, // Gauche
      { x: 1, y: 0 }, // Droite
    ];

    directions.forEach((dir) => {
      const targetX = enemy.x + dir.x;
      const targetY = enemy.y + dir.y;

      const targetCharacter = this.characters.find(
        (char) => char.x === targetX && char.y === targetY
      );

      if (targetCharacter) {
        targetCharacter.hp -= 1; // Inflige 1 dégât
        console.log(
          `${enemy.name} attaque ${targetCharacter.name}. HP restant : ${targetCharacter.hp}`
        );

        if (targetCharacter.hp <= 0) {
          console.log(`${targetCharacter.name} est éliminé !`);
          targetCharacter.visual.destroy(); // Supprime le visuel
          this.characters = this.characters.filter(
            (char) => char !== targetCharacter
          ); // Retire le personnage de la liste
        }
      }
    });
  }
  enemyAttack2(enemy) {
    console.log(`${enemy.name} prépare une attaque.`);

    // Les directions possibles (haut, bas, gauche, droite)
    const directions = [
      { x: 0, y: -1 }, // Haut
      { x: 0, y: 1 }, // Bas
      { x: -1, y: 0 }, // Gauche
      { x: 1, y: 0 }, // Droite
    ];

    // Vérifie chaque direction pour trouver une cible
    for (const dir of directions) {
      let damageDealt = false;

      for (let i = 1; i <= 3; i++) {
        // Jusqu'à 3 cases de loin
        const targetX = enemy.x + dir.x * i;
        const targetY = enemy.y + dir.y * i;

        // Vérifie si la case est valide
        if (
          targetX >= 0 &&
          targetX < this.grid.length &&
          targetY >= 0 &&
          targetY < this.grid[0].length
        ) {
          // Vérifie si un personnage est sur cette case
          const targetCharacter = this.characters.find(
            (char) => char.x === targetX && char.y === targetY
          );

          if (targetCharacter) {
            targetCharacter.hp -= 2; // Inflige 2 dégâts
            console.log(
              `${enemy.name} inflige 2 dégâts à ${targetCharacter.name}. PV restants : ${targetCharacter.hp}`
            );

            damageDealt = true;
            break; // Arrête de vérifier plus loin dans cette direction
          }

          // Si la case est un obstacle, arrête la recherche dans cette direction
          if (this.grid[targetX][targetY].isObstacle) {
            break;
          }
        }
      }

      if (damageDealt) {
        return; // Si des dégâts ont été infligés, termine l'attaque
      }
    }

    console.log(`${enemy.name} n'a trouvé aucune cible à attaquer.`);
  }

  enemyAttackCombined(enemy) {
    console.log(`${enemy.name} prépare une attaque combinée.`);

    // Étape 1 : Inflige 1 dégât sur les 4 cases autour de lui
    const adjacentDirections = [
      { x: 0, y: -1 }, // Haut
      { x: 0, y: 1 }, // Bas
      { x: -1, y: 0 }, // Gauche
      { x: 1, y: 0 }, // Droite
    ];

    adjacentDirections.forEach((dir) => {
      const targetX = enemy.x + dir.x;
      const targetY = enemy.y + dir.y;

      if (
        targetX >= 0 &&
        targetX < this.grid.length &&
        targetY >= 0 &&
        targetY < this.grid[0].length
      ) {
        const targetCharacter = this.characters.find(
          (char) => char.x === targetX && char.y === targetY
        );

        if (targetCharacter) {
          targetCharacter.hp -= 1; // Inflige 1 dégât
          console.log(
            `${enemy.name} inflige 1 dégât à ${targetCharacter.name}. PV restants : ${targetCharacter.hp}`
          );
        }
      }
    });

    // Étape 2 : Inflige 2 dégâts jusqu'à 3 cases dans une direction
    const directions = [
      { x: 0, y: -1 }, // Haut
      { x: 0, y: 1 }, // Bas
      { x: -1, y: 0 }, // Gauche
      { x: 1, y: 0 }, // Droite
    ];

    for (const dir of directions) {
      let damageDealt = false;

      for (let i = 1; i <= 3; i++) {
        const targetX = enemy.x + dir.x * i;
        const targetY = enemy.y + dir.y * i;

        if (
          targetX >= 0 &&
          targetX < this.grid.length &&
          targetY >= 0 &&
          targetY < this.grid[0].length
        ) {
          const targetCharacter = this.characters.find(
            (char) => char.x === targetX && char.y === targetY
          );

          if (targetCharacter) {
            targetCharacter.hp -= 2; // Inflige 2 dégâts
            console.log(
              `${enemy.name} inflige 2 dégâts à ${targetCharacter.name}. PV restants : ${targetCharacter.hp}`
            );

            damageDealt = true;
            break; // Arrête après avoir infligé des dégâts
          }

          if (this.grid[targetX][targetY].isObstacle) {
            break; // Arrête si un obstacle est rencontré
          }
        }
      }

      if (damageDealt) {
        return; // Terminer l'attaque après avoir infligé des dégâts dans une direction
      }
    }
  }

  nextPlayerTurn() {
    this.activeCharacterIndex =
      (this.activeCharacterIndex + 1) % this.characters.length;
    if (this.activeCharacterIndex === 0) {
      this.tuto = false;
      Object.values(this.tutoImages).forEach((image) =>
        image.setVisible(false)
      );
      this.saveGameState();
    }

    this.checkTutorialProgress();
    this.updateUI();
  }

  handleTileClick(tile) {
    if (this.isEnemyTurn || this.playerHasMoved) return;

    const activeCharacter = this.characters[this.activeCharacterIndex];

    // Vérifie si le personnage actif est l'enregistreur
    if (activeCharacter.name === "Enregistreur") {
      console.log("L'enregistreur ne peut pas se déplacer.");
      return; // Bloque le déplacement
    }

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
      const dx = tile.gridX - activeCharacter.x;
      const dy = tile.gridY - activeCharacter.y;

      // Ajuste la position
      activeCharacter.x = tile.gridX;
      activeCharacter.y = tile.gridY;

      // Définit l'angle en fonction de la direction
      if (dx === 1) activeCharacter.visual.setAngle(90); // Droite
      else if (dx === -1) activeCharacter.visual.setAngle(270); // Gauche
      else if (dy === 1) activeCharacter.visual.setAngle(180); // Bas
      else if (dy === -1) activeCharacter.visual.setAngle(0); // Haut

      const offsetX = (this.cameras.main.width - this.grid[0].length * 512) / 2;
      const offsetY = (this.cameras.main.height - this.grid.length * 512) / 2;

      activeCharacter.visual.x = tile.gridX * 512 + offsetX + 256;
      activeCharacter.visual.y = tile.gridY * 512 + offsetY + 256;

      this.playerHasMoved = true;

      this.updateUI();
      if (this.tutoImages.move.visible) {
        this.showTutorial("action"); // Passer au tutoriel suivant
      }
    }
  }

  getCurrentEntity() {
    return this.characters[this.activeCharacterIndex];
  }
}
