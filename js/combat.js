export default class Combat extends Phaser.Scene {
  constructor() {
    super({ key: "combat" });
    this.activeCharacterIndex = 0; // Indice du personnage actif
    this.selectedTile = null; // Case sélectionnée pour le déplacement
    this.isEnemyTurn = false; // Gestion des tours alternés entre joueurs et ennemis
    this.enemyTurnIndex = 0; // Indice pour gérer le tour des ennemis individuellement
    this.playerHasMoved = false; // Suivi du déplacement du joueur par tour
    this.patient = false;
    this.stateStack = [];
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



initializeCharacters() {
  const tileSize = 512;
  const offsetX = (this.cameras.main.width - this.grid[0].length * tileSize) / 2;
  const offsetY = (this.cameras.main.height - this.grid.length * tileSize) / 2;

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
      { name: "Ennemi 1", color: 0xff8800, x: 2, y: 0, hp: 3, debuff: false },
      { name: "Ennemi 2", color: 0x8800ff, x: 5, y: 0, hp: 3, debuff: false },
      { name: "Ennemi 2", color: 0x8877ff, x: 5, y: 0, hp: 3, debuff: false },
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
  
    // Texte du nom du personnage
    this.characterNameText = this.add.text(-3000, -700, "", {
      fontSize: "150px",
      fill: "#fff",
    });
    this.uiContainer.add(this.characterNameText);
  
    // Image du personnage actif (initialisée à null)
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
    const activeCharacter = this.characters[this.activeCharacterIndex];
  
    // Mettre à jour le texte du nom du personnage
    this.characterNameText.setText(`Nom: ${activeCharacter.name}`);
  
    // Mettre à jour l'icône du personnage actif
    this.activeCharacterIcon.setTexture(
      activeCharacter.name.toLowerCase()
    );
  
    // Supprimer les anciens boutons d'action
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

  restrictVisionToCharacter(character) {
    // Cache toutes les cases
    this.grid.flat().forEach((tile) => {
      console.log(tile)
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
      .setOrigin(0.5);
  
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
          } else if (actionIndex === 2) {
            this.performCrossAttack(activeCharacter);
          } else if (actionIndex === 3) {
            if (activeCharacter.ultReady) {
              this.performHeal(activeCharacter);
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
    activeCharacter.act = true;
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
        console.log(
          `Ennemi touché à (${targetX}, ${targetY}), HP restant : ${enemy.hp}`
        );
        tile.setTint(
          (targetX + targetY + 3) % 2 === 0 ? 0xffffff : 0xff8851
        ); // Révèle la case
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
  }

  performRhythmAttack(character) {
    // Logique pour l'attaque rythmée
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
        const baseColor =
          (tile.gridX + tile.gridY) % 2 === 0 ? 0xffffff : 0x5fffff;
        tile.setTint(baseColor); // Restaure les couleurs du plateau
      });
      this.obstacles.forEach((obstacle) => {
        obstacle.setTint(0xff00ff); // Restaure la couleur des obstacles
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

      const qteText = this.add.text(200, 200, `Appuyez sur '${targetLetter}'`, {
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 10, y: 10 },
      });

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
  }

  recordAction(character) {
    console.log(`${character.name} patiente ce tour.`);

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
    console.log(`${character.name} utilise sa prochaine action.`);

    // Diminue légèrement l'opacité des autres personnages et ennemis pour indiquer un focus
    this.dimGridAndHighlightCharacter(character);

    // Affiche les trois choix d'action
    const options = [
      {
        name: "Déplacement libre",
        action: this.freeMove.bind(this, character),
      },
      {
        name: "3 Dégâts autour",
        action: this.areaDamage.bind(this, character),
      },
      {
        name: "Échanger de place",
        action: this.switchPosition.bind(this, character),
      },
    ];

    options.forEach((option, index) => {
      const offsetX = 200;
      const offsetY = 150 + index * 50;

      const button = this.add
        .text(offsetX, offsetY, option.name, {
          fontSize: "16px",
          fill: "#fff",
          backgroundColor: "#444",
          padding: { x: 10, y: 5 },
        })
        .setInteractive()
        .on("pointerdown", () => {
          console.log(`Option choisie : ${option.name}`);
          option.action();
          this.clearActionButtons(); // Nettoie les boutons après choix
          this.updateUI(); // Met à jour l'interface
        });

      button.isActionButton = true;
      this.uiContainer.add(button);
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

    // Permet de cliquer sur une case dans les axes horizontaux et verticaux
    const validTiles = this.grid.flat().filter(
      (tile) => tile.gridX === character.x || tile.gridY === character.y // Même ligne ou même colonne
    );

    validTiles.forEach((tile) => {
      tile.setTint(0x87cefa); // Surligne les cases valides
      tile.setInteractive().on("pointerdown", () => {
        character.x = tile.gridX;
        character.y = tile.gridY;

        const offsetX =
          (this.cameras.main.width - this.grid[0].length * 512) / 2;
        const offsetY = (this.cameras.main.height - this.grid.length * 512) / 2;

        character.visual.x = tile.gridX * 512 + offsetX + 256;
        character.visual.y = tile.gridY * 512 + offsetY + 256;

        this.clearTileHighlights(); // Supprime les surlignages
        this.grid.flat().forEach((tile) => tile.removeInteractive()); // Désactive les clics
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

          // Désactive les clics et nettoie
          this.characters.forEach((char) => char.visual.removeInteractive());
          console.log("Échange terminé !");
        });
      });
  }

  performRewind(character) {
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
    this.grid.forEach((column) =>
      column.forEach((tile) => tile.clearTint())
    );

    activeCharacter.act = false;
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
    // Trouve le personnage cible le plus proche
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
          enemy.x = newX;
          enemy.y = newY;

          const offsetX =
            (this.cameras.main.width - this.grid[0].length * 512) / 2;
          const offsetY =
            (this.cameras.main.height - this.grid.length * 512) / 2;

          enemy.visual.x = enemy.x * 512 + offsetX + 256;
          enemy.visual.y = enemy.y * 512 + offsetY + 256;
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

      const offsetX = (this.cameras.main.width - this.grid[0].length * 512) / 2;
      const offsetY = (this.cameras.main.height - this.grid.length * 512) / 2;

      enemy.visual.x = enemy.x * 512 + offsetX + 256;
      enemy.visual.y = enemy.y * 512 + offsetY + 256;
    }

    this.time.delayedCall(500, callback);
  }

  nextPlayerTurn() {
    this.activeCharacterIndex =
      (this.activeCharacterIndex + 1) % this.characters.length;
    if (this.activeCharacterIndex === 0) {
      // Sauvegarde l'état après que tous les personnages ont joué
      this.saveGameState();
    }
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
    }
  }
  

  getCurrentEntity() {
    return this.characters[this.activeCharacterIndex];
  }
}
