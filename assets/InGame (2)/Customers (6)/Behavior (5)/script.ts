type CustomerState = "wandering" | "waiting" | "goingToEatSpot" | "waitingForMeal" | "eating" | "leaving";
type CustomerEmotion = "Angry" | "Satisfied" | "Neutral";

class CustomerBehavior extends Sup.Behavior {
  
  data: Customer;
  
  private bodyActor: Sup.Actor;
  private headActor: Sup.Actor;
  private eatingActor: Sup.Actor;
  
  bubbleActor: Sup.Actor;
  showBubble = false;
  private patienceActor: Sup.Actor;
  
  private foodActor: Sup.Actor;
  private servedRecipe: Recipe;
  
  position = new Sup.Math.Vector2();
  private prevX: number;
  private prevY: number;
  private x: number;
  private y: number;
  private path: { x: number; y: number }[] = [];
  private moveTicks = 0;
  private bobbingTicks = Sup.Math.Random.integer(0, 16);
  
  state: CustomerState;
  private stateTicks: number;
  private leaveTicks: number;
  private emotion: CustomerEmotion;
  
  private spotPatienceMultiplier = 1;

  awake() {
    this.prevX = this.x;
    this.prevY = this.y;
    this.actor.setLocalPosition(this.x + 0.5, this.y + 0.5);
    
    this.bodyActor = this.actor.getChild("Body");
    this.bodyActor.spriteRenderer.setSprite(`InGame/Customers/${this.data.name}/Body`);

    this.headActor = this.actor.getChild("Head");
    this.headActor.spriteRenderer.setSprite(`InGame/Customers/${this.data.name}/Head`);
    
    this.bubbleActor = this.actor.getChild("Bubble");
    this.patienceActor = this.bubbleActor.getChild("Patience");
    
    this.bubbleActor.getChild("Kind").spriteRenderer.setSprite(`InGame/Customers/Bubbles/${this.data.foodWish.kind}`);
    this.bubbleActor.getChild("Size").spriteRenderer.setSprite(`InGame/Customers/Bubbles/${this.data.foodWish.size}`);
    this.bubbleActor.getChild("Meal").spriteRenderer.setSprite(`InGame/Customers/Bubbles/${this.data.foodWish.meal}`);
    if (this.data.foodWish.ingredient != null) {
      const ingredientActor = this.bubbleActor.getChild("Ingredient");
      ingredientActor.spriteRenderer.setSprite(`InGame/Food/Ingredients/${this.data.foodWish.ingredient}`);
      ingredientActor.setVisible(true);
    }
    
    this.state = "wandering";
    this.findWanderTarget();
  }
  
  private getMoveTicksDuration() { return this.emotion === "Angry" ? CustomerBehavior.AngryMoveTicksDuration : CustomerBehavior.MoveTicksDuration; }
  private isMovementFinished() { return this.moveTicks >= this.getMoveTicksDuration() && this.path.length == 0; }
  isHovered() { return Game.gameBehavior.mouseRay.intersectActor(this.bodyActor).length > 0 || Game.gameBehavior.mouseRay.intersectActor(this.headActor).length > 0; }
  
  update() {
    this.stateTicks++;
    this.moveTicks++;
    this.bobbingTicks++;
    
    switch (this.state) {
      case "wandering": this.doWandering(); break;
      case "waiting": this.doWaiting(); break;
      case "goingToEatSpot": this.doGoingToEatSpot(); break;
      case "waitingForMeal": this.doWaitingForMeal(); break;
      case "eating": this.doEating(); break;
      case "leaving": this.doLeaving(); break;
    }
    
    // Movement
    if (this.moveTicks >= this.getMoveTicksDuration()) this.getNextPosition();
    
    this.position.x = Sup.Math.lerp(this.prevX, this.x, this.moveTicks / this.getMoveTicksDuration());
    this.position.y = Sup.Math.lerp(this.prevY, this.y, this.moveTicks / this.getMoveTicksDuration());
    
    this.actor.setLocalPosition(this.position.x + 0.5, this.position.y + 0.5);
    this.actor.setLocalZ(8 - this.position.y / 100);
    
    // Animation
    if (this.prevX !== this.x || this.prevY !== this.y) {
      this.bodyActor.setLocalEulerZ(Math.sin(this.bobbingTicks / 2) / 8);
      this.bodyActor.setLocalY(0 + Math.sin(this.bobbingTicks / 2) / 16);
      
      this.headActor.setLocalY(CustomerBehavior.HeadOffset + Math.sin(this.bobbingTicks / 2) / 16);
      this.headActor.setLocalEulerZ(0);
    } else {
      this.bodyActor.setLocalEulerZ(0);
      this.bodyActor.setLocalY(0);
      
      if (this.state == "eating") {
        this.headActor.setLocalY(CustomerBehavior.HeadOffset + Math.sin(this.bobbingTicks / 2) / 8);
        this.headActor.setLocalEulerZ(Math.sin(this.bobbingTicks / 3) * Math.PI / 8);
        
      } else {
        this.headActor.setLocalY(CustomerBehavior.HeadOffset + Math.sin(this.bobbingTicks / 8) / 32);
        this.headActor.setLocalEulerZ(0);
      }
    }
    
    const showWaitingBubble = this.state === "waitingForMeal" &&
      (this.stateTicks < CustomerBehavior.ShowBubbleDuration || (this.stateTicks > this.data.patienceDelay / 2 && this.stateTicks <= this.data.patienceDelay / 2 + CustomerBehavior.ShowBubbleDuration));
    const showEatingBubble = this.state === "eating" && this.stateTicks < CustomerBehavior.ShowBubbleDuration;
    const showLeavingBubble = this.state === "leaving" && this.isMovementFinished();
    
    this.bubbleActor.setVisible(this.showBubble || showWaitingBubble || showEatingBubble || showLeavingBubble);
  }
  
  private setEmotion(emotion: CustomerEmotion) {
    this.emotion = emotion;
    
    const emotionActor = this.bubbleActor.getChild("Emotion");
    emotionActor.spriteRenderer.setSprite(`InGame/Customers/Bubbles/${emotion}`);
    emotionActor.setVisible(true);
    
    if (this.emotion === "Angry") this.headActor.spriteRenderer.setColor(1.0, 0.4, 0.4);
    
    this.bubbleActor.getChild("Wishes").setVisible(false);
    this.bubbleActor.getChild("Patience").setVisible(false);
  }
  
  serveRecipe(recipe: Recipe) {
    this.setEating();
    this.servedRecipe = recipe;
    
    this.foodActor = new Sup.Actor("food", this.actor);
    this.foodActor.setLocalPosition(0, -0.2, 0.5);
    new Sup.SpriteRenderer(this.foodActor, `InGame/Food/${recipe.kind}s/${recipe.name}`);
    
    this.eatingActor = new Sup.Actor("Eating", this.foodActor);
    this.eatingActor.setLocalPosition(0, 0.1, 0.1);
    new Sup.SpriteRenderer(this.eatingActor, "InGame/Customers/Eating");
    this.eatingActor.spriteRenderer.setAnimation("Animation", true);
    
    Sup.Audio.playSound(`InGame/Sounds/${recipe.kind}`, 1, { loop: false });
    
    let satisfiedScore = 0;
    
    if (recipe.kind === this.data.foodWish.kind) satisfiedScore++;
    if (recipe.size === this.data.foodWish.size) satisfiedScore++;
    if (recipe.meal === this.data.foodWish.meal) satisfiedScore++;
    for (const ingredient of recipe.ingredients) {
      if (ingredient.name === this.data.foodWish.ingredient) {
        satisfiedScore++;
        break;
      }
    }
      
    this.setEmotion(satisfiedScore > 1 ? "Satisfied" : "Neutral");
  }
  
  // State machine
  private setWandering() {
    this.state = "wandering";
    this.findWanderTarget();
  }
  
  private doWandering() {
    if (this.isMovementFinished()) {
      if (Sup.Math.Random.integer(0, 3) == 0) this.setGoingToEatSpot();
      else this.setWaiting();
      
      return;
    }
  }
  
  private setWaiting() {
    this.state = "waiting";
    this.stateTicks = 0;
  }
  
  private doWaiting() {
    if (this.stateTicks >= CustomerBehavior.WaitTicksDuration) {
      this.setWandering();

      return;
    }
  }
  
  private setGoingToEatSpot() {
    if (this.findEatingSpotTarget()) {
      this.state = "goingToEatSpot";
    } else {
      this.setLeaving();
      this.setEmotion("Angry");
    }
  }
  
  private doGoingToEatSpot() {
    if (this.isMovementFinished()) {
      this.setWaitingForMeal();
      
      return;
    }
  }
  
  private setWaitingForMeal() {
    this.state = "waitingForMeal";
    this.stateTicks = 0;
    this.patienceActor.setVisible(true);
  }
  
  private doWaitingForMeal() {
    const patience = Math.max(0, 1 - this.stateTicks / (this.data.patienceDelay * this.spotPatienceMultiplier));
    
    if (patience === 0) {
      Game.spawnerBehavior.eatSpotIsAvailableByPosition[`${this.x}_${this.y}`] = true;
      this.setLeaving();
      this.setEmotion("Angry");

      return;
    }
    
    this.patienceActor.setLocalX(-0.5 + patience / 2)
    this.patienceActor.setLocalScaleX(patience);
  }
  
  private setEating() {
    this.state = "eating";
    this.stateTicks = 0;
  }
  
  private doEating() {
    if (this.stateTicks >= CustomerBehavior.EatDuration) {
      Game.spawnerBehavior.eatSpotIsAvailableByPosition[`${this.x}_${this.y}`] = true;
      this.setLeaving();
      this.foodActor.destroy();
      return;
    }
  }
  
  private setLeaving() {
    this.state = "leaving";
    this.leaveTicks = 0;
    this.findLeaveTarget();
  }
  
  private doLeaving() {
    if (this.isMovementFinished()) {
      this.leaveTicks++;
      
      if (this.leaveTicks == CustomerBehavior.LeaveWaitTicksDuration) {
        if (this.servedRecipe != null) {
          
          // FIXME: Just hacked a 2x multiplier in there!
          let money = this.servedRecipe.price * 2;
          if (this.emotion === "Satisfied") money = Math.round(money * 1.4);
          
          // TODO: Add effect
          Game.money += money;

          const floatingMoneyActor = new Sup.Actor("Floating Money");
          floatingMoneyActor.setPosition(this.actor.getPosition());
          new Sup.TextRenderer(floatingMoneyActor, `+${money}`, SmallFont, { size: 24, color: new Sup.Color(0.5, 1, 0.8) });
          floatingMoneyActor.addBehavior(FloatAwayBehavior);
          
          Sup.Audio.playSound("InGame/Sounds/Cash Register", 0.5, { loop: false });
        }

        if (this.emotion === "Satisfied") Game.spawnerBehavior.addSatisfactionPoint(1);
        else if (this.emotion === "Angry") Game.spawnerBehavior.addSatisfactionPoint(-1);

        Game.spawnerBehavior.removeCustomer(this);
        
        this.actor.destroy();
      }
    }
  }
  
  // Pathfinders
  private findWanderTarget() {
    let endX = 0; let endY = 0;
    while (Game.map.getTileAt(0, endX, endY) !== -1 || Game.spawnerBehavior.eatSpotIsAvailableByPosition[`${endX}_${endY}`] != null) {
      endX = Sup.Math.Random.integer(0, Game.map.getWidth() - 1);
      endY = Sup.Math.Random.integer(2, Game.map.getHeight() - 1);
    }

    Game.pathfinder.findPath(this.x, this.y, endX, endY, (computedPath) => this.path = computedPath);
    Game.pathfinder.calculate();
    
    // FIXME: Try several time before giving up? It currently can happen when it tries to access an impossible location even if there is some other choice possibles
    // Or maybe we should compute and disable non accessible points
    if (this.path == null) {
      this.setLeaving();
      this.setEmotion("Angry");
    }
  }
  
  private findEatingSpotTarget() {
    const availableEatingSpots: { x: number; y: number; patienceMultiplier: number; }[] = [];
    
    for (const eatingSpotPosition in Game.spawnerBehavior.eatSpotIsAvailableByPosition) {
      if (!Game.spawnerBehavior.eatSpotIsAvailableByPosition[eatingSpotPosition]) continue;
      
      const [x, y] = eatingSpotPosition.split("_");
      availableEatingSpots.push({
        x: parseInt(x, 10), y: parseInt(y, 10),
        patienceMultiplier: Game.spawnerBehavior.eatSpotPatienceMultiplier[eatingSpotPosition]
      });
    }
    
    if (availableEatingSpots.length == 0) return false;
    
    const spot = Sup.Math.Random.sample(availableEatingSpots);
    this.spotPatienceMultiplier = spot.patienceMultiplier;
    Game.pathfinder.findPath(this.x, this.y, spot.x, spot.y, (computedPath) => this.path = computedPath);
    Game.pathfinder.calculate();
    
    return this.path != null;
  }
  
  private findLeaveTarget() {
    Game.pathfinder.findPath(this.x, this.y, Sup.Math.Random.integer(StartLeftX, StartRightX), 0, (computedPath) => this.path = computedPath);
    Game.pathfinder.calculate();
    
    if (this.path == null) this.setWaiting();
  }
  
  private getNextPosition() {
    this.prevX = this.x;
    this.prevY = this.y;

    if (this.path == null || this.path.length === 0) return;
  
    const nextPosition = this.path.shift();
    
    // Check if someone is already on the spot you want to stop in
    if (this.path.length == 0) {
      if (this.state === "goingToEatSpot" && Game.spawnerBehavior.eatSpotIsAvailableByPosition[`${nextPosition.x}_${nextPosition.y}`]) {
        Game.spawnerBehavior.eatSpotIsAvailableByPosition[`${nextPosition.x}_${nextPosition.y}`] = false;
      } else if (this.state === "wandering" || this.state === "goingToEatSpot") {
        for (const customer of Game.spawnerBehavior.customers) {
          if (customer == this) continue;
          
          if (customer.x == nextPosition.x && customer.y == nextPosition.y) {
            this.resetPath();
            return;
          }
        }
      }
    }
    
    this.x = nextPosition.x;
    this.y = nextPosition.y;

    this.moveTicks = 0;
  }
  
  resetPath() {
    if (this.state == "wandering") this.findWanderTarget();
    else if (this.state == "goingToEatSpot") this.setGoingToEatSpot();
  }
}
Sup.registerBehavior(CustomerBehavior);

namespace CustomerBehavior {
  export const HeadOffset = 0.5;
  
  export const MoveTicksDuration = 60 / 4;
  export const AngryMoveTicksDuration = 60 / 6;
  
  export const WaitTicksDuration = 60;
  export const LeaveWaitTicksDuration = 40;
  export const ShowBubbleDuration = 60 * 2;
  export const PatienceBarSize = 1.5;
  export const EatDuration = 60 * 2;
}
