class FurnituresBehavior extends Sup.Behavior {
  
  toolsBought = { "Oven": false, "Chimney": false };
  
  trapsByPosition: {}
  
  private inventoryFurniturePositions: Sup.Math.Vector3[] = [];
  private inventorySelectedActor: Sup.Actor;
  private inventoryHoveredActor: Sup.Actor;
  private selectedFurnitureIndex: number;
  
  private previewActor: Sup.Actor;
  placedFurnitures: { actor: Sup.Actor; x: number; y: number; data: Furniture; }[] = [];
  private hoveredFurnitureIndex: number;
  
  awake() {
    Game.furnituresBehavior = this;
    
    this.inventorySelectedActor = this.actor.getChild("Selected");
    this.inventoryHoveredActor = this.actor.getChild("Hovered");
    this.previewActor = this.actor.getChild("Preview");
    
    for (let i = 0; i < Furnitures.length; i++) {
      const furnitureData = Furnitures[i];
      
      const furnitureActor = this.setupInventoryFurniture(furnitureData.name);
      const priceActor = new Sup.Actor("Quantity", furnitureActor).setLocalScale(0.5);
      new Sup.TextRenderer(priceActor, furnitureData.price, Font, { alignment: "right", size: 32 });
      priceActor.setLocalPosition(0.4, -0.35, 0.1);
    }
    this.setupInventoryFurniture("Sell");
    
    this.loadSelectedFurniture(0);
  }
  
  update() {
    if (Game.state !== "preparing") {
      this.actor.setVisible(false);
      return;
    }
    
    this.actor.setVisible(true);
    
    if (Sup.Input.wasMouseButtonJustPressed(6)) {
      let newSelectedFurniture = this.selectedFurnitureIndex + 1;
      if (newSelectedFurniture >= this.inventoryFurniturePositions.length) newSelectedFurniture = 0;
      this.loadSelectedFurniture(newSelectedFurniture);
    } else if (Sup.Input.wasMouseButtonJustPressed(5)) {
      let newSelectedFurniture = this.selectedFurnitureIndex - 1;
      if (newSelectedFurniture < 0) newSelectedFurniture = this.inventoryFurniturePositions.length - 1;
      this.loadSelectedFurniture(newSelectedFurniture);
    }
    
    const tileX = Math.floor(Game.gameBehavior.mousePosition.x);
    const tileY = Math.floor(Game.gameBehavior.mousePosition.y);
    
    this.inventoryHoveredActor.setVisible(false);
    for (let index = 0; index < this.inventoryFurniturePositions.length; index++) {
      const furniturePosition = this.inventoryFurniturePositions[index];
      if (Game.gameBehavior.mousePosition.distanceTo(furniturePosition) < 0.5) {
        this.inventoryHoveredActor.setPosition(furniturePosition.x, furniturePosition.y);
        this.inventoryHoveredActor.setVisible(true);
        
        if (Sup.Input.wasMouseButtonJustPressed(0)) this.loadSelectedFurniture(index === this.selectedFurnitureIndex ? -1 : index);
        break;
      }
    }
    
    if (tileX < 2 || tileX >= Game.map.getWidth() - 2 || tileY < 2 || tileY >= Game.map.getHeight() - 2) {
      this.previewActor.setVisible(false);
      return;
    }
    
    this.previewActor.setVisible(true);
    
    if (this.selectedFurnitureIndex === this.inventoryFurniturePositions.length - 1) {
      this.tryToRemoveFurniture(tileX, tileY);
      this.previewActor.setPosition(Game.gameBehavior.mousePosition.x, Game.gameBehavior.mousePosition.y, 9);
    } else {
      this.tryToPlaceFurniture(tileX, tileY);
      this.previewActor.setPosition(tileX, tileY);
    }
  }
  
  private setupInventoryFurniture(name: string) {
    const furnitureActor = new Sup.Actor(name, this.actor);
      
    const x = this.inventoryFurniturePositions.length % FurnituresBehavior.InventoryWidth;
    const y = Math.floor(this.inventoryFurniturePositions.length / FurnituresBehavior.InventoryWidth);
    furnitureActor.setLocalPosition((x - FurnituresBehavior.InventoryWidth + 1) * InventoryOffset, -y * InventoryOffset);
    
    new Sup.SpriteRenderer(furnitureActor, `InGame/HUD/Furnitures/${name}`);
    
    const backgroundActor = new Sup.Actor("Background", furnitureActor);
    backgroundActor.setLocalZ(-0.5);
    new Sup.SpriteRenderer(backgroundActor, "InGame/HUD/Slot");
    
    this.inventoryFurniturePositions.push(furnitureActor.getPosition());
    this.inventoryFurniturePositions[this.inventoryFurniturePositions.length - 1].z = 0;
    
    return furnitureActor;
  }
  
  private loadSelectedFurniture(newSelectedFurnitureIndex: number) {
    // TODO: Better visual indicator when placing a tool
    
    if (newSelectedFurnitureIndex === this.inventoryFurniturePositions.length - 1) {
      this.previewActor.spriteRenderer.setSprite("InGame/HUD/Furnitures/Sell");
      this.previewActor.spriteRenderer.setColor(1, 1, 1);
    } else {
      const furnitureData = Furnitures[newSelectedFurnitureIndex];
      const folder = furnitureData.type === "trap" ? "Traps" : "Furnitures";
      this.previewActor.spriteRenderer.setSprite(`InGame/${folder}/${furnitureData.name}`);
      
      if (furnitureData.price > Game.money || (furnitureData.type === "tool" && this.toolsBought[furnitureData.name])) this.previewActor.spriteRenderer.setColor(0.2, 0.2, 0.2);
      else this.previewActor.spriteRenderer.setColor(1, 1, 1);
    }
    
    const x = newSelectedFurnitureIndex % FurnituresBehavior.InventoryWidth;
    const y = Math.floor(newSelectedFurnitureIndex / FurnituresBehavior.InventoryWidth);
    this.inventorySelectedActor.setLocalPosition((x - FurnituresBehavior.InventoryWidth + 1) * InventoryOffset, -y * InventoryOffset);
    
    this.selectedFurnitureIndex = newSelectedFurnitureIndex;
  }
  
  private tryToPlaceFurniture(tileX: number, tileY: number) {
    const selectedFurnitureData = Furnitures[this.selectedFurnitureIndex];
    const selectedFurnitureZ = (selectedFurnitureData.type == "ground" || selectedFurnitureData.type == "trap" ? 4 : 8) - tileY / 100;
    this.previewActor.setZ(selectedFurnitureZ);
    
    if (selectedFurnitureData.price > Game.money) return;
    
    if (selectedFurnitureData.type === "tool") {
      if (!this.toolsBought[selectedFurnitureData.name] && Sup.Input.wasMouseButtonJustPressed(0)) {
        Game.money -= selectedFurnitureData.price;
        Sup.getActor("Tavern").getChild(selectedFurnitureData.name).setVisible(true);
        this.toolsBought[selectedFurnitureData.name] = true;
        this.previewActor.spriteRenderer.setColor(0.2, 0.2, 0.2);
      }
      return;
    }
    
    for (let y = 0; y < selectedFurnitureData.height; y++) {
      for (let x = 0; x < selectedFurnitureData.width; x++) {
        const checkX = tileX + x;
        const checkY = tileY + y;
        
        if (checkX < 0 || checkX >= Game.map.getWidth() || checkY < 2 || checkY >= Game.map.getHeight()) {
          this.previewActor.spriteRenderer.setColor(0.5, 0.2, 0.2);
          return;
        }
        
        // Prevent placing tables near other tables
        if (selectedFurnitureData.type == "table") {
          for (let yOffset = -1; yOffset <= 1; yOffset++) {
            for (let xOffset = -1; xOffset <= 1; xOffset++) {
              const tile = Game.map.getTileAt(0, checkX + xOffset, checkY + yOffset);
              if (tile == Tiles.Tables) {
                this.previewActor.spriteRenderer.setColor(0.5, 0.2, 0.2);
                return;
              }
            }
          }
        }
        
        const tile = Game.map.getTileAt(0, checkX, checkY);
        if (tile != -1 && (selectedFurnitureData.type != "ground" || tile == Tiles.Wall)) {
          this.previewActor.spriteRenderer.setColor(0.5, 0.2, 0.2);
          return;
        }
      }
    }

    this.previewActor.spriteRenderer.setColor(1, 1, 1);

    if (Sup.Input.wasMouseButtonJustPressed(0)) {
      Game.money -= selectedFurnitureData.price;
      if (Game.money < selectedFurnitureData.price) this.previewActor.spriteRenderer.setColor(0.2, 0.2, 0.2);
      
      const furnitureActor = new Sup.Actor("Furniture");
      furnitureActor.setLocalPosition(tileX, tileY);
      furnitureActor.setZ(selectedFurnitureZ);

      new Sup.SpriteRenderer(furnitureActor, this.previewActor.spriteRenderer.getSprite());

      if (selectedFurnitureData.type !== "ground") {
        const tile = selectedFurnitureData.type === "table" ? Tiles.Tables : selectedFurnitureData.type === "trap" ? Tiles.Trap : Tiles.Decorations;
        for (let y = 0; y < selectedFurnitureData.height; y++) {
          for (let x = 0; x < selectedFurnitureData.width; x++) {
            Game.map.setTileAt(0, tileX + x, tileY + y, tile);
          }
        }
      }
      
      this.placedFurnitures.push({ actor: furnitureActor, x: tileX, y: tileY, data: selectedFurnitureData });
      Sup.Audio.playSound("InGame/Sounds/Build", 1, { loop: false });
    }
  }
  
  private tryToRemoveFurniture(tileX: number, tileY: number) {
    const previouslyHoveredFurniture = this.hoveredFurnitureIndex;
    this.hoveredFurnitureIndex = null;
    
    for (let i = 0; i < this.placedFurnitures.length; i++) {
      const furniture = this.placedFurnitures[i];
      if (tileX >= furniture.x && tileX < furniture.x + furniture.data.width && tileY >= furniture.y && tileY < furniture.y + furniture.data.height) {
        this.hoveredFurnitureIndex = i;
      }
    }
    
    if (previouslyHoveredFurniture != this.hoveredFurnitureIndex) {
      if (previouslyHoveredFurniture != null) this.placedFurnitures[previouslyHoveredFurniture].actor.spriteRenderer.setColor(1, 1, 1);
      if (this.hoveredFurnitureIndex != null) this.placedFurnitures[this.hoveredFurnitureIndex].actor.spriteRenderer.setColor(1.5, 1.5, 1.5);
    }
    
    if (this.hoveredFurnitureIndex == null) return;
    
    if (Sup.Input.wasMouseButtonJustPressed(0)) {
      const furniture = this.placedFurnitures[this.hoveredFurnitureIndex];
      
      Game.money += furniture.data.price;
      
      furniture.actor.destroy();
      if (furniture.data.type != "ground") {
        for (let y = 0; y < furniture.data.height; y++) {
          for (let x = 0; x < furniture.data.width; x++) {
            Game.map.setTileAt(0, furniture.x + x, furniture.y + y, -1);
          }
        }
      }
      
      this.placedFurnitures.splice(this.hoveredFurnitureIndex, 1);
      this.hoveredFurnitureIndex = null;
    }
  }
}
Sup.registerBehavior(FurnituresBehavior);

namespace FurnituresBehavior {
  export const InventoryWidth = Math.ceil((Furnitures.length + 1) / 2);
}
