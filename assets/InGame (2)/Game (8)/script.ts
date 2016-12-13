enum Tiles { Wall, Tables, Decorations, Trap }
const StartLeftX = 9;
const StartRightX = 10;
const MusicVolume = 0.4;

const Font = Sup.get("Font", Sup.Font);
const SmallFont = Sup.get("Small Font", Sup.Font);
const InventoryOffset = 600 / 7 / 64; // THANKS THOMAS

interface Day {
  description: string;
  wave: string[];
}

const Days: Day[] = [
  {
    description: "Grand Opening",
    wave: [ "Basic", "Basic Woman", "Elf Woman" ]
  },
  
  {
    description: "Rush hour",
    wave: [ "Basic", "Basic Woman", "Basic Woman", "Elf Woman", "Kid Girl" ]
  },

  {
    description: "Special Guests",
    wave: [ "Basic", "Elf Woman", "Chicken Man", "Orc", "Orc", "Orc", "Kid Girl", "Lumberjack" ]
  },

  {
    description: "The End",
    wave: [ "Chicken Man", "Mermaid", "Orc", "Kid Girl", "Kid Girl", "Orc", "Lumberjack", "Basic", "Elf Woman" ]
  },
];

namespace Game {
  export let state: "dayIntro"|"preparing"|"serving"|"dayOutro" = "dayIntro";
  export let currentDay = 0;
  
  export const map = Sup.get("InGame/Map", Sup.TileMap);
  export const pathfinder = new EasyStar.js();
  
  export let money = 400;

  export let gameBehavior: GameBehavior;
  export let furnituresBehavior: FurnituresBehavior;
  export let barBehavior: BarBehavior;
  export let spawnerBehavior: SpawnerBehavior;
  export let foodBehavior: FoodBehavior;
  export let trapsBehavior: TrapsBehavior;
  
  let music: Sup.Audio.SoundPlayer;
  
  export function setMusic(path: string, loop = true) {
    if (music != null) music.stop();
    music = path != null ? Sup.Audio.playSound(`InGame/Musics/${path}`, MusicVolume, { loop }) : null;
  }
  
  export function startDayIntro() {
    state = "dayIntro";
    
    setMusic("New Day", false);
    
    spawnerBehavior.startDayIntro();
    
    const dayIntroActor = Sup.getActor("Day Intro");
    dayIntroActor.setVisible(true);
    
    const logoActor = dayIntroActor.getChild("Logo");
    logoActor.setVisible(true);
    logoActor.setLocalY(6.5);
    logoActor.spriteRenderer.setOpacity(1);
    
    new Sup.Tween(logoActor, { y: 6.5 })
      .to({ y: 1.5 }, 2000)
      .onUpdate((object) => logoActor.setLocalY(object.y) )
      .easing(TWEEN.Easing.Bounce.Out)
      .start();
    
    const dayActor = dayIntroActor.getChild("Day");
    dayActor.setVisible(false);
    dayActor.textRenderer.setText(`Day ${currentDay + 1} / ${Days.length} — ${Days[currentDay].description}`);
    
    new Sup.Tween(dayActor, { v: 1 })
      .to({ v: 0 }, 2000)
      .delay(500)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate((object) => {
        dayActor.setVisible(true);
        dayActor.textRenderer.setOpacity(1 - object.v);
        dayActor.setLocalX(object.v * -4);
      })
      .onComplete(() => {
        new Sup.Tween(dayActor, { v: 0 })
          .to({ v: 1 }, 1500)
          .easing(TWEEN.Easing.Quintic.In)
          .onUpdate((object) => {
            logoActor.spriteRenderer.setOpacity(1 - object.v);
            dayActor.textRenderer.setOpacity(1 - object.v);
            dayActor.setLocalX(object.v * 8);
          })
          .onComplete(() => {
            startPreparing();
            dayIntroActor.setVisible(false);
            dayActor.setVisible(false);
          })
          .start();
      })
      .start();
  }

  export function startDayOutro() {
    state = "dayOutro";

    barBehavior.startDayOutro();
    gameBehavior.startDayOutro();

    const victory = spawnerBehavior.satisfactionScore > 0;

    const dayOutroActor = Sup.getActor("Day Outro");
    dayOutroActor.setVisible(true);
    
    const resultActor = dayOutroActor.getChild("Result");
    resultActor.textRenderer.setText(victory ? "Congrats!" : "Failure!");
    
    const explanationActor = dayOutroActor.getChild("Explanation");
    explanationActor.textRenderer.setText(victory ? "Most customers left satisfied." : "Most customers left angry.");
    explanationActor.textRenderer.setOpacity(0);

    setMusic(victory ? "Good Day" : "Bad Day", false);
    
    new Sup.Tween(explanationActor, { v: 0 })
      .to({ v: 1 }, 1000)
      .delay(250)
      .easing(TWEEN.Easing.Cubic.In)
      .onUpdate((object) => {
        explanationActor.textRenderer.setOpacity(object.v);
        explanationActor.setLocalY(-0.5 - 1 + object.v * 1);
      })
      .start();
    
    new Sup.Tween(resultActor, { v: 0 })
      .to({ v: 1 }, 250)
      .easing(TWEEN.Easing.Cubic.In)
      .onUpdate((object) => {
        resultActor.setLocalScale(0.5 + object.v * 0.5);
        resultActor.textRenderer.setOpacity(object.v);
      })
      .onComplete(() => {
        if (victory) {
          currentDay++;
          if (currentDay >= Days.length) {
            Sup.loadScene("Game Over");
            return;
          }
        } else {
          gameBehavior.resetDayMoneyAndIngredients();
        }
        
        new Sup.Tween(dayOutroActor, { v: 0 })
          .to({ v: 1 }, 1000)
          .delay(1500)
          .easing(TWEEN.Easing.Cubic.Out)
          .onUpdate((object) => {
            resultActor.textRenderer.setOpacity(1 - object.v);
            explanationActor.textRenderer.setOpacity(1 - object.v);
          })
          .onComplete(() => {
            dayOutroActor.setVisible(false);
            startDayIntro();
          })
          .start();
      })
      .start();
  }

  export function startPreparing() {
    state = "preparing";
    
    setMusic("Preparing");
    
    gameBehavior.startPreparing();
    spawnerBehavior.startPreparing();
    barBehavior.startPreparing();
    foodBehavior.startPreparing();
    trapsBehavior.startPreparing();
  }
  
  export function startServing() {
    state = "serving";
    
    setMusic("Serving");
    
    updatePathfinder();
    
    gameBehavior.startServing();
    spawnerBehavior.startServing();
    barBehavior.startServing();
    foodBehavior.startServing();
    trapsBehavior.startServing();
  }
  
  export function updatePathfinder() {
    const tiles: number[][] = [];
    for (let y = 0; y < map.getHeight(); y++) {
      const row: number[] = [];
      for (let x = 0; x < map.getWidth(); x++) row.push(map.getTileAt(0, x, y));
      
      tiles.push(row);
    }
    
    pathfinder.setGrid(tiles);
    pathfinder.setAcceptableTiles([ -1, Tiles.Trap ]);
  }
}

(Game.pathfinder as any).enableSync();
