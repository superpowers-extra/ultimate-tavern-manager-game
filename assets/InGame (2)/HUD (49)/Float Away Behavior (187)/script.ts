class FloatAwayBehavior extends Sup.Behavior {
  awake() {
    this.actor.setZ(12);
    const startY = this.actor.getLocalY();
    
    new Sup.Tween(this.actor, { y: 0 })
      .to({ y: 1.5 }, 800)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate((object) => {
        this.actor.setLocalY(startY + object.y);
      })
      .onComplete(() => {
        new Sup.Tween(this.actor, { blink: 0 })
        .to({ blink: 6 }, 400)
        .onUpdate((object) => {
          this.actor.setVisible(object.blink % 2 < 1);
          this.actor.setLocalScale(1 + object.blink / 12);
        })
        .onComplete(() => { this.actor.destroy(); })
        .start();
      })
      .start();
  }
}
Sup.registerBehavior(FloatAwayBehavior);
