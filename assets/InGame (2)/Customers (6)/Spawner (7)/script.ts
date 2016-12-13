class SpawnerBehavior extends Sup.Behavior {
  
  customers: CustomerBehavior[] = [];
  private spawnDelay: number;
  private possibleCustomers: string[];
  
  private satisfactionActor = Sup.getActor("Satisfaction");
  satisfactionScore = 0;
  
  eatSpotIsAvailableByPosition: { [position: string]: boolean };
  eatSpotPatienceMultiplier: { [position: string]: number };
  
  awake() {
    Game.spawnerBehavior = this;
  }
  
  startPreparing() {
    for (const customer of this.customers) customer.actor.destroy();
    this.customers.length = 0;
    
    this.possibleCustomers = Days[Game.currentDay].wave.slice(0);
    
    this.satisfactionActor.setVisible(true);
    this.satisfactionScore = 0;
    this.updateSatisfactionText();
  }
  
  updateSatisfactionText() {
    this.satisfactionActor.textRenderer.setText(`${this.satisfactionScore} / ${Days[Game.currentDay].wave.length}`);
  }
  
  startDayIntro() {
    this.satisfactionActor.setVisible(false);
  }
  
  startServing() {
    this.spawnDelay = 2 * 60;
    
    this.eatSpotIsAvailableByPosition = {};
    this.eatSpotPatienceMultiplier = {};
    
    for (const furniture of Game.furnituresBehavior.placedFurnitures) {
      if (furniture.data.type !== "table") continue;
      
      for (let x = 0; x < furniture.data.width; x++) {
        const tile = Game.map.getTileAt(0, furniture.x + x, furniture.y + 1);
        if (tile == -1 || tile == Tiles.Trap) {
          this.eatSpotIsAvailableByPosition[`${furniture.x + x}_${furniture.y + 1}`] = true;
          this.eatSpotPatienceMultiplier[`${furniture.x + x}_${furniture.y + 1}`] = furniture.data.patienceMultiplier;
        }
      }
    }
  }

  update() {
    if (Game.state !== "serving") return;
    if (this.customers.length >= SpawnerBehavior.MaxCustomers) return;
    if (this.possibleCustomers.length === 0) {
      if (this.customers.length === 0) Game.startDayOutro();
      return;
    }

    this.spawnDelay--;
    if (this.spawnDelay == 0) this.spawnCustomer();
  }

  spawnCustomer() {
    const index = Sup.Math.Random.integer(0, this.possibleCustomers.length - 1);
    const customerData = CustomersByName[this.possibleCustomers.splice(index, 1)[0]];
    
    const customerActor = Sup.appendScene("InGame/Customers/Prefab")[0];
    const customerBehavior = customerActor.addBehavior(CustomerBehavior, { data: customerData, x: Sup.Math.Random.integer(StartLeftX, StartRightX), y: 0 });
    this.customers.push(customerBehavior);
    
    this.spawnDelay = Sup.Math.Random.integer(SpawnerBehavior.MinSpawnDelay, SpawnerBehavior.MaxSpawnDelay);
  }
  
  removeCustomer(customerBehavior: CustomerBehavior) {
    const index = this.customers.indexOf(customerBehavior);
    if (index != -1) this.customers.splice(index, 1);
  }
  
  addSatisfactionPoint(point: number) {
    this.satisfactionScore += point;
    this.updateSatisfactionText();
  }
}
Sup.registerBehavior(SpawnerBehavior);

namespace SpawnerBehavior {
  export const MaxCustomers = 6;
  export const MinSpawnDelay = 4 * 60;
  export const MaxSpawnDelay = 10 * 60;
}
