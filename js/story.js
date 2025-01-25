export default class StoryIntro extends Phaser.Scene {
  constructor() {
    super({ key: "story" });
  }

  preload() {
    // Chargez ici vos 7 images pour l'histoire
    for (let i = 1; i <= 7; i++) {
      this.load.image(`storyImage${i}`, `../assets/images/story_${i}.png`); // Remplacez par vos chemins d'images
    }
  }

  create() {
    this.currentImageIndex = 0;
    this.imageKeys = [
      "storyImage1",
      "storyImage2",
      "storyImage3",
      "storyImage4",
      "storyImage5",
      "storyImage6",
      "storyImage7",
    ];

    this.displayImage(this.imageKeys[this.currentImageIndex]);
  }

  displayImage(imageKey) {
    // Affiche l'image au centre de l'écran
    const image = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      imageKey
    );
    image.setScale(
      Math.min(
        this.cameras.main.width / image.width,
        this.cameras.main.height / image.height
      )
    );

    // Effet de fondu au noir après 5 secondes
    this.time.delayedCall(5000, () => {
      this.tweens.add({
        targets: image,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          image.destroy();
          this.nextImage();
        },
      });
    });
  }

  nextImage() {
    this.currentImageIndex++;

    if (this.currentImageIndex < this.imageKeys.length) {
      this.displayImage(this.imageKeys[this.currentImageIndex]);
    } else {
      this.startCombat();
    }
  }

  startCombat() {
    // Passez à la scène de combat
    this.scene.start("combat");
  }
}
