import combat from "./combat.js";
import interfaceCombat from "./interface_combat.js";

export default class loading {
  preload() {
    this.load.image('whiteTile', './assets/tiles/floor_1.png');
    this.load.image('blackTile', './assets/tiles/floor_1_variant.png');
    this.load.image('bonkTile', './assets/tiles/bonk.png');
    this.load.image('bonkTileCaisse', './assets/tiles/bonk_2.png');

    this.load.image("pierreIcon", "./assets/ui/skills/aveugle_skill1.png");
    this.load.image("canneIcon", "./assets/ui/skills/aveugle_skill2.png");
    this.load.image("healIcon", "./assets/ui/skills/aveugle_ulti.png");
    this.load.image("recordIcon", "./assets/ui/skills/enregistreur_skill1.png");
    this.load.image("soundboardIcon", "./assets/ui/skills/enregistreur_skill2.png");
    this.load.image("rewindIcon", "./assets/ui/skills/enregistreur_ulti.png");
    this.load.image("musicIcon", "./assets/ui/skills/musicien_skill1.png");
    this.load.image("rythmIcon", "./assets/ui/skills/musicien_skill2.png");
    this.load.image("melodyIcon", "./assets/ui/skills/musicien_ulti.png");
    this.load.image("endTurnIcon", "./assets/ui/end_turn.png");
    this.load.image("aveugle", "./assets/ui/portraits/aveugle.png");
    this.load.image("enregistreur", "./assets/ui/portraits/enregistreur.png");
    this.load.image("musicien", "./assets/ui/portraits/musicien.png");

    this.load.image("hpBarMusicien4_4", "./assets/ui/hpbar/hpbar4_4.png");
    this.load.image("hpBarMusicien4_3", "./assets/ui/hpbar/hpbar4_3.png");
    this.load.image("hpBarMusicien4_2", "./assets/ui/hpbar/hpbar4_2.png");
    this.load.image("hpBarMusicien4_1", "./assets/ui/hpbar/hpbar4_1.png");

    this.load.image("hpBarEnregistreur5_5", "./assets/ui/hpbar/hpbar5_5.png");
    this.load.image("hpBarEnregistreur5_4", "./assets/ui/hpbar/hpbar5_4.png");
    this.load.image("hpBarEnregistreur5_3", "./assets/ui/hpbar/hpbar5_3.png");
    this.load.image("hpBarEnregistreur5_2", "./assets/ui/hpbar/hpbar5_2.png");
    this.load.image("hpBarEnregistreur5_1", "./assets/ui/hpbar/hpbar5_1.png");

    this.load.image("hpBarAveugle6_6", "./assets/ui/hpbar/hpbar6_6.png");
    this.load.image("hpBarAveugle6_5", "./assets/ui/hpbar/hpbar6_5.png");
    this.load.image("hpBarAveugle6_4", "./assets/ui/hpbar/hpbar6_4.png");
    this.load.image("hpBarAveugle6_3", "./assets/ui/hpbar/hpbar6_3.png");
    this.load.image("hpBarAveugle6_2", "./assets/ui/hpbar/hpbar6_2.png");
    this.load.image("hpBarAveugle6_1", "./assets/ui/hpbar/hpbar6_1.png");

    this.load.image("enregistreurSprite", "./assets/spritesheets/player/enregistreur/enregistreur_haut.png");
    this.load.image("musicienSprite", "./assets/spritesheets/player/musicien/musicien_haut.png");
    this.load.image("aveugleSprite", "./assets/spritesheets/player/aveugle/aveugle_haut.png");

    this.load.image("bossSprite", "./assets/spritesheets/enemy/boss.png");
    this.load.image("gramophoneSprite", "./assets/spritesheets/enemy/gramophone.png");
    this.load.image("megaphoneSprite", "./assets/spritesheets/enemy/megaphone.png");

    this.load.image("bossSprite", "./assets/spritesheets/enemy/boss.png");
    this.load.image("gramophoneSprite", "./assets/spritesheets/enemy/gramophone.png");
    this.load.image("megaphoneSprite", "./assets/spritesheets/enemy/megaphone.png");
  }

  create() {
    this.scene.add("combat", combat, false);
    this.scene.add("interfaceCombat", interfaceCombat, false);
    this.scene.start("combat");
  }
}
