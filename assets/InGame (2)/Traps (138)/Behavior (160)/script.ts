interface Trap {
  actor: Sup.Actor;
  x: number;
  y: number;
  name: string;
  cooldown: number;
}

class TrapsBehavior extends Sup.Behavior {
  
  private traps: Trap[] = [];
  private hoveredTrap: Trap;
  
  awake() {
    Game.trapsBehavior = this;
  }
  
  startPreparing() {
    for (const trap of this.traps) {
      trap.actor.spriteRenderer.setSprite(`InGame/Traps/${trap.name}`);
      Game.map.setTileAt(0, trap.x, trap.y, Tiles.Trap);
    }
  }
  
  startServing() {
    this.traps.length = 0;
    for (const furniture of Game.furnituresBehavior.placedFurnitures) {
      if (furniture.data.type !== "trap") continue;
      
      this.traps.push({ actor: furniture.actor, x: furniture.x, y: furniture.y, name: furniture.data.name, cooldown: 0 });
    }
  }

  update() {
    if (Game.state !== "serving") return;
    
    if (this.hoveredTrap != null) {
      this.hoveredTrap.actor.spriteRenderer.setColor(1, 1, 1);
      this.hoveredTrap = null;
    }
    
    const tileX = Math.floor(Game.gameBehavior.mousePosition.x);
    const tileY = Math.floor(Game.gameBehavior.mousePosition.y);
    
    let mustResetCustomersPath = false;
    
    for (const trap of this.traps) {
      if (tileX === trap.x && tileY === trap.y) this.hoveredTrap = trap;
      
      if (trap.cooldown > 0) {
        trap.cooldown--;
        if (trap.cooldown === 0) {
          trap.actor.spriteRenderer.setSprite(`InGame/Traps/${trap.name}`);
          Game.map.setTileAt(0, trap.x, trap.y, Tiles.Trap);
          mustResetCustomersPath = true;
        }
      }
    }
    
    if (this.hoveredTrap != null && this.hoveredTrap.cooldown === 0) {
      this.hoveredTrap.actor.spriteRenderer.setColor(1.5, 1.5, 1.5);
      
      if (Sup.Input.wasMouseButtonJustPressed(0)) {
        this.hoveredTrap.cooldown = 180;
        this.hoveredTrap.actor.spriteRenderer.setSprite(`InGame/Traps/${this.hoveredTrap.name} Activated`);
        Game.map.setTileAt(0, this.hoveredTrap.x, this.hoveredTrap.y, Tiles.Wall);
        mustResetCustomersPath = true;
        
        for (const customer of Game.spawnerBehavior.customers) {
          if (customer.position.distanceTo(this.hoveredTrap) < 0.5) {
            const ingredient = Sup.Math.Random.sample(customer.data.dropIngredients);
            Game.barBehavior.dropIngredient(ingredient);
            
            const floatingIngredientBehavior = new Sup.Actor("Floating Ingredient");
            floatingIngredientBehavior.setPosition(customer.position);
            floatingIngredientBehavior.move(0.5, 0.5);
            new Sup.SpriteRenderer(floatingIngredientBehavior, `InGame/Food/Ingredients/${ingredient}`);
            floatingIngredientBehavior.addBehavior(FloatAwayBehavior);
            
            if (Game.spawnerBehavior.eatSpotIsAvailableByPosition[`${this.hoveredTrap.x}_${this.hoveredTrap.y}`] != null)
              Game.spawnerBehavior.eatSpotIsAvailableByPosition[`${this.hoveredTrap.x}_${this.hoveredTrap.y}`] = true;
            
            Sup.Audio.playSound("InGame/Sounds/Drop", 0.5, { loop: false });
            
            Game.spawnerBehavior.removeCustomer(customer);
            customer.bubbleActor.destroy();
            customer.destroy();
            new Sup.Tween(customer.actor, { scale: 1 })
              .to({ scale: 0.001 }, 500)
              .onUpdate((object) => customer.actor.setLocalScale(object.scale, object.scale, 1) )
              .onComplete(() => {
                Sup.Audio.playSound("InGame/Sounds/Pick Up", 1, { loop: false });
                customer.actor.destroy();
              })
              .start();
          }
        }
      }
    }
    
    if (mustResetCustomersPath) {
      Game.updatePathfinder();
      for (const customer of Game.spawnerBehavior.customers) customer.resetPath();
    }
  }
}
Sup.registerBehavior(TrapsBehavior);
