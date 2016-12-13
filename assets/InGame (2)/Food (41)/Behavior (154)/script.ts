class FoodBehavior extends Sup.Behavior {
  
  private slots: Sup.Actor[] = [];
  private slotOffset = 0;
  private leftArrow: Sup.Actor;
  private rightArrow: Sup.Actor;
  
  private previewRecipeActor: Sup.Actor;
  private selectedRecipeActor: Sup.Actor;
  private hoveredRecipeActor: Sup.Actor;
  private selectedRecipeIndex: number;
  private inventory: Recipe[] = [];
  
  awake() {
    Game.foodBehavior = this;
    
    for (let i = 0; i < FoodBehavior.InventorySize; i++) {
      const slotActor = new Sup.Actor("Slot", this.actor);
      slotActor.setLocalX((i - FoodBehavior.InventorySize + 1) * InventoryOffset);
      new Sup.SpriteRenderer(slotActor);
      
      this.slots.push(slotActor);
      
      const backgroundActor = new Sup.Actor("Background", slotActor);
      backgroundActor.setLocalZ(-0.2);
      new Sup.SpriteRenderer(backgroundActor, "InGame/HUD/Slot");
    }
    
    this.leftArrow = new Sup.Actor("Left", this.actor);
    this.leftArrow.setLocalX(-FoodBehavior.InventorySize - 1);
    new Sup.SpriteRenderer(this.leftArrow, "InGame/HUD/Arrow");
    
    this.rightArrow = new Sup.Actor("Right", this.actor);
    this.rightArrow.setLocalX(InventoryOffset / 2);
    new Sup.SpriteRenderer(this.rightArrow, "InGame/HUD/Arrow");
    this.rightArrow.spriteRenderer.setHorizontalFlip(true);
    
    this.previewRecipeActor = this.actor.getChild("Preview");
    this.selectedRecipeActor = this.actor.getChild("Selected");
    this.hoveredRecipeActor = this.actor.getChild("Hovered");
  }

  update() {
    // Select food
    if (this.inventory.length !== 0) {
      if (Sup.Input.wasMouseButtonJustPressed(6)) {
        let newSelectedRecipe = this.selectedRecipeIndex + 1;
        if (newSelectedRecipe >= this.inventory.length) newSelectedRecipe = 0;
        this.setSelectedRecipe(newSelectedRecipe);
      } else if (Sup.Input.wasMouseButtonJustPressed(5)) {
        let newSelectedRecipe = this.selectedRecipeIndex - 1;
        if (newSelectedRecipe < 0) newSelectedRecipe = Math.max(0, this.inventory.length - 1);
        this.setSelectedRecipe(newSelectedRecipe);
      }
      
      if (Game.gameBehavior.mouseRay.intersectActor(this.leftArrow).length > 0) {
        this.leftArrow.spriteRenderer.setColor(2, 2, 2);
        
        if (Sup.Input.wasMouseButtonJustPressed(0)) {
          let newSelectedRecipe = this.selectedRecipeIndex + 1;
          if (newSelectedRecipe >= this.inventory.length) newSelectedRecipe = 0;
          this.setSelectedRecipe(newSelectedRecipe);
        }
      } else {
        this.leftArrow.spriteRenderer.setColor(1, 1, 1);
      }
      
      if (Game.gameBehavior.mouseRay.intersectActor(this.rightArrow).length > 0) {
        this.rightArrow.spriteRenderer.setColor(2, 2, 2);
        
        if (Sup.Input.wasMouseButtonJustPressed(0)) {
          let newSelectedRecipe = this.selectedRecipeIndex - 1;
          if (newSelectedRecipe < 0) newSelectedRecipe = Math.max(0, this.inventory.length - 1);
          this.setSelectedRecipe(newSelectedRecipe);
        }
      } else {
        this.rightArrow.spriteRenderer.setColor(1, 1, 1);
      }
      
      this.hoveredRecipeActor.setVisible(false);
      for (let i = 0; i < FoodBehavior.InventorySize; i++) {
        if (this.inventory[this.slotOffset + i] == null) continue;

        if (Game.gameBehavior.mouseRay.intersectActor(this.slots[i]).length > 0) {
          this.hoveredRecipeActor.setLocalX((i - FoodBehavior.InventorySize + 1) * InventoryOffset);
          this.hoveredRecipeActor.setVisible(true);

          if (Sup.Input.wasMouseButtonJustPressed(0)) this.setSelectedRecipe(this.slotOffset + i);
          break;
        }
      }
    }
    
    // Serve food
    const selectedRecipe = this.selectedRecipeIndex !== -1 ? this.inventory[this.selectedRecipeIndex] : null;
    if (selectedRecipe != null && Game.gameBehavior.hoveredCustomer != null && Game.gameBehavior.hoveredCustomer.state === "waitingForMeal") {
      this.previewRecipeActor.setParent(Game.gameBehavior.hoveredCustomer.actor);
      this.previewRecipeActor.setLocalPosition(0, -0.2, 0.5);
      this.previewRecipeActor.setParent(null);
      this.previewRecipeActor.spriteRenderer.setSprite(`InGame/Food/${selectedRecipe.kind}s/${selectedRecipe.name}`);
      this.previewRecipeActor.setVisible(true);
      
      if (Sup.Input.wasMouseButtonJustPressed(0)) {
        this.useSelectedRecipe();
        Game.gameBehavior.hoveredCustomer.serveRecipe(selectedRecipe);
      }
    } else {
      this.previewRecipeActor.setVisible(false);
    }
  }
  
  startPreparing() {
    this.actor.setVisible(false);
  }
  
  startServing() {
    this.slotOffset = 0;
    for (const slot of this.slots) slot.spriteRenderer.setSprite(null);
    
    this.inventory.length = 0;
    this.setSelectedRecipe(-1);
    
    this.actor.setVisible(true);
  }
  
  addRecipe(recipe: Recipe) {
    this.inventory.push(recipe);
    this.setSelectedRecipe(this.inventory.length - 1);
  }
  
  private useSelectedRecipe() {
    this.inventory.splice(this.selectedRecipeIndex, 1);
    if (this.selectedRecipeIndex >= this.inventory.length) this.selectedRecipeIndex--;
    this.updateDisplayedRecipe();
  }
  
  setSelectedRecipe(index: number) {
    if (index !== -1) {
      if (index >= this.slotOffset + FoodBehavior.InventorySize) this.slotOffset = index - FoodBehavior.InventorySize + 1;
      else if (index < this.slotOffset) this.slotOffset = index;
    }
    
    this.selectedRecipeIndex = index;
    this.updateDisplayedRecipe();
  } 
  
  private updateDisplayedRecipe() {
    this.slotOffset = Sup.Math.clamp(this.slotOffset, 0, this.inventory.length - FoodBehavior.InventorySize);
    
    for (let i = 0; i < FoodBehavior.InventorySize; i++) {
      const recipe = this.inventory[this.slotOffset + i];
      const sprite = recipe != null ? `InGame/Food/${recipe.kind}s/${recipe.name}` : null;
      this.slots[i].spriteRenderer.setSprite(sprite);
    }
    
    if (this.selectedRecipeIndex == -1) {
      this.selectedRecipeActor.setVisible(false);
    } else {
      this.selectedRecipeActor.setLocalX((this.selectedRecipeIndex - this.slotOffset - FoodBehavior.InventorySize + 1) * InventoryOffset);
      this.selectedRecipeActor.setVisible(true);
    }
  }
}
Sup.registerBehavior(FoodBehavior);

namespace FoodBehavior {
  export const InventorySize = 5;
}
