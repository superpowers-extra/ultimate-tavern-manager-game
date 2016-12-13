interface Furniture {
  name: string;
  type: "tool" | "table" | "decoration" | "ground" | "trap";
  price: number;
  width: number;
  height: number;
  patienceMultiplier: number;
}

const Furnitures: Furniture[] = [
  {
    name: "Simple Table",
    type: "table", price: 60,
    width: 1, height: 1,
    patienceMultiplier: 1
  },
  {
    name: "Simple Table Cloth",
    type: "table", price: 120,
    width: 1, height: 1,
    patienceMultiplier: 2

  },
  {
    name: "Double Table",
    type: "table", price: 130,
    width: 2, height: 1,
    patienceMultiplier: 1

  },
  {
    name: "Double Table Cloth",
    type: "table", price: 260,
    width: 2, height: 1,
    patienceMultiplier: 2

  },
  {
    name: "Plant",
    type: "decoration", price: 35,
    width: 1, height: 1,
    patienceMultiplier: 1

  },
  { 
    name: "Carpet",
    type: "ground", price: 25,
    width: 3, height: 2,
    patienceMultiplier: 1

  },
  {
    name: "Trapdoor",
    type: "trap", price: 300,
    width: 1, height: 1,
    patienceMultiplier: 1

  },
  /*{
    name: "Oven",
    type: "tool", price: 300,
    width: 1, height: 1,
    patienceMultiplier: 1

  },
  {
    name: "Chimney",
    type: "tool", price: 500,
    width: 1, height: 1,
    patienceMultiplier: 1

  }*/
]
