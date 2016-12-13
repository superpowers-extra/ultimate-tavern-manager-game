class GameBehavior extends Sup.Behavior {
  mouseRay = new Sup.Math.Ray();
  mousePosition = new Sup.Math.Vector2();
  
  private currentDayMoney: number;
  private currentDayIngredientQuantityByName: { [name: string]: number };
  
  private camera = Sup.getActor("Camera").camera;
  private doorLabelTicks = 0;
  private closedDoor: Sup.Actor;
  private closedDoorLabel: Sup.Actor;
  private openedDoor: Sup.Actor;
  private openedDoorLabel: Sup.Actor;
  
  hoveredCustomer: CustomerBehavior;
  private moneyRndr: Sup.TextRenderer;
    
  awake() {
    Game.gameBehavior = this;
    this.closedDoor = Sup.getActor("Door Closed");
    this.closedDoorLabel = Sup.getActor("HUD").getChild("Click To Open");
    this.openedDoor = Sup.getActor("Door Opened");
    this.openedDoorLabel = Sup.getActor("HUD").getChild("Click To Close");
    this.moneyRndr = Sup.getActor("HUD").getChild("Money").textRenderer;
  }
  
  start() {
    Game.startDayIntro();
  }
  
  startDayOutro() {
    this.openedDoorLabel.setVisible(false);
    this.openedDoor.setVisible(false);
    this.closedDoorLabel.setVisible(false);
    this.closedDoor.setVisible(true);
  }
  
  startPreparing() {
    this.closedDoorLabel.setVisible(true);
  }
  
  startServing() {
    this.currentDayMoney = Game.money;
    this.currentDayIngredientQuantityByName = {};
    for (const ingredientName in IngredientsByName) this.currentDayIngredientQuantityByName[ingredientName] = IngredientsByName[ingredientName].quantity;
  }

  resetDayMoneyAndIngredients() {
    Game.money = this.currentDayMoney;
    
    for (const ingredientName in IngredientsByName) {
      IngredientsByName[ingredientName].quantity = this.currentDayIngredientQuantityByName[ingredientName];
    }
  }

  update() {
    if (this.moneyRndr.getText() != Game.money.toString()) this.moneyRndr.setText(Game.money);
    
    const mouseInputPosition = Sup.Input.getMousePosition();
    this.mouseRay.setFromCamera(this.actor.camera, mouseInputPosition);
    mouseInputPosition.unproject(this.camera)
    this.mousePosition.x = mouseInputPosition.x;
    this.mousePosition.y = mouseInputPosition.y;

    if (Game.state === "dayIntro") {
      // Nothing, auto-skips after a little bit
    } else if (Game.state === "dayOutro") {
      // TODO
    } else if (Game.state === "serving" || Game.state === "preparing") {
      // Customers
      let newHoveredCustomer: CustomerBehavior;
      if (!Game.barBehavior.isBarOpened) {
        for (const customer of Game.spawnerBehavior.customers) {
          if (customer.isHovered()) {
            newHoveredCustomer = customer;
            break;
          }
        }
      }

      if (newHoveredCustomer != this.hoveredCustomer) {
        if (this.hoveredCustomer != null) this.hoveredCustomer.showBubble = false;
        if (newHoveredCustomer != null) newHoveredCustomer.showBubble = true;

        this.hoveredCustomer = newHoveredCustomer;
      }

      // Doors
      this.doorLabelTicks++;
      (Game.state !== "serving" ? this.closedDoorLabel : this.openedDoorLabel).setLocalY(-13 + Math.sin(this.doorLabelTicks / 10) * 0.06);

      const door = Game.state === "preparing" ? this.closedDoor : this.openedDoor;

      if (this.mouseRay.intersectActor(this.closedDoor).length > 0) {
        door.spriteRenderer.setColor(1.5, 1.5, 1.5);

        if (Sup.Input.wasMouseButtonJustPressed(0)) {
          if (Game.state === "preparing") {
            this.closedDoor.setVisible(false);
            this.closedDoorLabel.setVisible(false);
            this.openedDoor.setVisible(true);
            this.openedDoorLabel.setVisible(true);
            
            Sup.Audio.playSound("InGame/Sounds/Open Door", 1, { loop: false });

            Game.startServing();
          } else {
            this.openedDoor.setVisible(false);
            this.openedDoorLabel.setVisible(false);
            this.closedDoor.setVisible(true);
            this.closedDoorLabel.setVisible(true);
            
            Sup.Audio.playSound("InGame/Sounds/Close Door", 1, { loop: false });

            this.resetDayMoneyAndIngredients();
            Game.startPreparing();
          }
        }
      } else {
        door.spriteRenderer.setColor(1, 1, 1);
      }
    }
  }
}
Sup.registerBehavior(GameBehavior);
