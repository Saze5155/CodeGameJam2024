import Cook from "/5/test3D/js/cook.js";
import Laby_map1 from "/5/test3D/js/laby/laby_map1.js";

export default class loading {
  preload() {}

  create() {
    this.anims.create({
      key: "anim_bonny",
      frames: [
        { key: "bonny1" },
        { key: "bonny2" },
        { key: "bonny3" },
        { key: "bonny4" },
        { key: "bonny5" },
        { key: "bonny6" },
        { key: "bonny7" },
        { key: "bonny8" },
        { key: "bonny9" },
      ],
      frameRate: 7,
      repeat: -1,
    });

    this.anims.create({
      key: "anim_bonny2",
      frames: [
        { key: "bonny12" },
        { key: "bonny22" },
        { key: "bonny32" },
        { key: "bonny42" },
        { key: "bonny52" },
        { key: "bonny62" },
        { key: "bonny72" },
        { key: "bonny82" },
        { key: "bonny92" },
      ],
      frameRate: 7,
      repeat: -1,
    });

    // Animation Tour par Tour
    this.anims.create({
      key: "vie_attaque_dieux",
      frames: [
        { key: "vie_attaque_dieux_1" },
        { key: "vie_attaque_dieux_2" },
        { key: "vie_attaque_dieux_3" },
        { key: "vie_attaque_dieux_4" },
        { key: "vie_attaque_dieux_5" },
        { key: "vie_attaque_dieux_6" },
        { key: "vie_attaque_dieux_7" },
        { key: "vie_attaque_dieux_8" },
        { key: "vie_attaque_dieux_9" },
        { key: "vie_attaque_dieux_10" },
        { key: "vie_attaque_dieux_11" },
      ],
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: "vie_attente_dieux",
      frames: [
        { key: "vie_attente_dieux_1" },
        { key: "vie_attente_dieux_2" },
        { key: "vie_attente_dieux_3" },
        { key: "vie_attente_dieux_4" },
        { key: "vie_attente_dieux_5" },
        { key: "vie_attente_dieux_6" },
        { key: "vie_attente_dieux_7" },
        { key: "vie_attente_dieux_8" },
        { key: "vie_attente_dieux_9" },
        { key: "vie_attente_dieux_10" },
        { key: "vie_attente_dieux_11" },
      ],
      frameRate: 7,
      repeat: -1,
    });

    this.anims.create({
      key: "temps_attaque_dieux",
      frames: [
        { key: "temps_attaque_dieux_1" },
        { key: "temps_attaque_dieux_2" },
        { key: "temps_attaque_dieux_3" },
        { key: "temps_attaque_dieux_4" },
        { key: "temps_attaque_dieux_5" },
        { key: "temps_attaque_dieux_6" },
        { key: "temps_attaque_dieux_7" },
        { key: "temps_attaque_dieux_8" },
        { key: "temps_attaque_dieux_9" },
        { key: "temps_attaque_dieux_10" },
        { key: "temps_attaque_dieux_11" },
      ],
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: "temps_attente_dieux",
      frames: [
        { key: "temps_attente_dieux_1" },
        { key: "temps_attente_dieux_2" },
        { key: "temps_attente_dieux_3" },
        { key: "temps_attente_dieux_4" },
        { key: "temps_attente_dieux_5" },
        { key: "temps_attente_dieux_6" },
        { key: "temps_attente_dieux_7" },
        { key: "temps_attente_dieux_8" },
        { key: "temps_attente_dieux_9" },
        { key: "temps_attente_dieux_10" },
        { key: "temps_attente_dieux_11" },
      ],
      frameRate: 7,
      repeat: -1,
    });

    this.anims.create({
      key: "lumiere_attaque_dieux",
      frames: [
        { key: "lumiere_attaque_dieux_1" },
        { key: "lumiere_attaque_dieux_2" },
        { key: "lumiere_attaque_dieux_3" },
        { key: "lumiere_attaque_dieux_4" },
        { key: "lumiere_attaque_dieux_5" },
        { key: "lumiere_attaque_dieux_6" },
        { key: "lumiere_attaque_dieux_7" },
        { key: "lumiere_attaque_dieux_8" },
        { key: "lumiere_attaque_dieux_9" },
        { key: "lumiere_attaque_dieux_10" },
        { key: "lumiere_attaque_dieux_11" },
      ],
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: "lumiere_attente_dieux_",
      frames: [
        { key: "lumiere_attente_dieux_1" },
        { key: "lumiere_attente_dieux_2" },
        { key: "lumiere_attente_dieux_3" },
        { key: "lumiere_attente_dieux_4" },
        { key: "lumiere_attente_dieux_5" },
        { key: "lumiere_attente_dieux_6" },
        { key: "lumiere_attente_dieux_7" },
        { key: "lumiere_attente_dieux_8" },
        { key: "lumiere_attente_dieux_9" },
        { key: "lumiere_attente_dieux_10" },
        { key: "lumiere_attente_dieux_11" },
      ],
      frameRate: 7,
      repeat: -1,
    });

    this.anims.create({
      key: "attaque_espace_dieux",
      frames: [
        { key: "espace_attaque_dieux_1" },
        { key: "espace_attaque_dieux_2" },
        { key: "espace_attaque_dieux_3" },
        { key: "espace_attaque_dieux_4" },
        { key: "espace_attaque_dieux_5" },
        { key: "espace_attaque_dieux_6" },
        { key: "espace_attaque_dieux_7" },
        { key: "espace_attaque_dieux_8" },
        { key: "espace_attaque_dieux_9" },
        { key: "espace_attaque_dieux_10" },
        { key: "espace_attaque_dieux_11" },
      ],
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: "attente_espace_dieux",
      frames: [
        { key: "espace_attente_dieux_1" },
        { key: "espace_attente_dieux_2" },
        { key: "espace_attente_dieux_3" },
        { key: "espace_attente_dieux_4" },
        { key: "espace_attente_dieux_5" },
        { key: "espace_attente_dieux_6" },
        { key: "espace_attente_dieux_7" },
        { key: "espace_attente_dieux_8" },
        { key: "espace_attente_dieux_9" },
        { key: "espace_attente_dieux_10" },
        { key: "espace_attente_dieux_11" },
      ],
      frameRate: 7,
      repeat: -1,
    });

    this.anims.create({
      key: "attaque_vie_enemy",
      frames: [
        { key: "vie_attaque_enemy_1" },
        { key: "vie_attaque_enemy_2" },
        { key: "vie_attaque_enemy_3" },
        { key: "vie_attaque_enemy_4" },
        { key: "vie_attaque_enemy_5" },
        { key: "vie_attaque_enemy_6" },
        { key: "vie_attaque_enemy_7" },
        { key: "vie_attaque_enemy_8" },
        { key: "vie_attaque_enemy_9" },
        { key: "vie_attaque_enemy_10" },
      ],
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: "attaque_temps_enemy",
      frames: [
        { key: "temps_attaque_enemy_1" },
        { key: "temps_attaque_enemy_2" },
        { key: "temps_attaque_enemy_3" },
        { key: "temps_attaque_enemy_4" },
        { key: "temps_attaque_enemy_5" },
        { key: "temps_attaque_enemy_6" },
        { key: "temps_attaque_enemy_7" },
        { key: "temps_attaque_enemy_8" },
        { key: "temps_attaque_enemy_9" },
        { key: "temps_attaque_enemy_10" },
      ],
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: "attaque_espace_enemy",
      frames: [
        { key: "espace_attaque_enemy_1" },
        { key: "espace_attaque_enemy_2" },
        { key: "espace_attaque_enemy_3" },
        { key: "espace_attaque_enemy_4" },
        { key: "espace_attaque_enemy_5" },
        { key: "espace_attaque_enemy_6" },
        { key: "espace_attaque_enemy_7" },
        { key: "espace_attaque_enemy_8" },
        { key: "espace_attaque_enemy_9" },
        { key: "espace_attaque_enemy_10" },
      ],
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: "attente_vie_enemy",
      frames: [
        { key: "vie_attente_enemy_1" },
        { key: "vie_attente_enemy_2" },
        { key: "vie_attente_enemy_3" },
        { key: "vie_attente_enemy_4" },
        { key: "vie_attente_enemy_5" },
        { key: "vie_attente_enemy_6" },
        { key: "vie_attente_enemy_7" },
        { key: "vie_attente_enemy_8" },
      ],
      frameRate: 15,
      repeat: -1,
    });

    this.anims.create({
      key: "attente_temps_enemy",
      frames: [
        { key: "temps_attente_enemy_1" },
        { key: "temps_attente_enemy_2" },
        { key: "temps_attente_enemy_3" },
        { key: "temps_attente_enemy_4" },
        { key: "temps_attente_enemy_5" },
        { key: "temps_attente_enemy_6" },
        { key: "temps_attente_enemy_7" },
        { key: "temps_attente_enemy_8" },
      ],
      frameRate: 15,
      repeat: -1,
    });

    this.anims.create({
      key: "attente_espace_enemy",
      frames: [
        { key: "espace_attente_enemy_1" },
        { key: "espace_attente_enemy_2" },
        { key: "espace_attente_enemy_3" },
        { key: "espace_attente_enemy_4" },
        { key: "espace_attente_enemy_5" },
        { key: "espace_attente_enemy_6" },
        { key: "espace_attente_enemy_7" },
        { key: "espace_attente_enemy_8" },
      ],
      frameRate: 15,
      repeat: -1,
    });

    this.anims.create({
      key: "attaquedroite",
      frames: [
        { key: "attaquedroite_1" },
        { key: "attaquedroite_2" },
        { key: "attaquedroite_3" },
        { key: "attaquedroite_4" },
        { key: "attaquedroite_5" },
        { key: "attaquedroite_6" },
        { key: "attaquedroite_7" },
        { key: "attaquedroite_8" },
      ],
      frameRate: 12,
      repeat: 0,
    });

    // Animation d'attente (idle)
    this.anims.create({
      key: "idle",
      frames: [
        { key: "idle_1" },
        { key: "idle_2" },
        { key: "idle_3" },
        { key: "idle_4" },
        { key: "idle_5" },
        { key: "idle_6" },
      ],
      frameRate: 6,
      repeat: -1,
    });
    // chargement des scenes
    this.scene.add("monde", monde, false);
    this.scene.add("tpt", tpt, false);
    this.scene.add("cook", Cook, false);
    this.scene.add("MarchandScene", MarchandScene, false);
    this.scene.add("Plateformer_map1", Plateformer_map1, false);
    this.scene.add("Plateformer_map2", Plateformer_map2, false);
    this.scene.add("Plateformer_map3", Plateformer_map3, false);

    this.scene.add("Laby_map1", Laby_map1, false);
    this.scene.add("Laby_map2", Laby_map2, false);
    this.scene.add("Laby_map3", Laby_map3, false);

    this.scene.add("SpaceLevel", SpaceLevel, false);
    this.scene.add("RocketLevel", RocketLevel, false);
    this.scene.add("BossLevel", BossLevel, false);
    this.scene.add("DialogueScene", DialogueScene, false);
    this.scene.add("DialogueScene2", DialogueScene2, false);
    this.scene.add("Dialogue", Dialogue, false);
    this.scene.add("MainMenu", MainMenu, false);

    this.scene.start("monde");
  }
}
