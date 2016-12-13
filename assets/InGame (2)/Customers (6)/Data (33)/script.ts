interface Customer {
  name: string;
  patienceDelay: number;
  foodWish: {
    kind: FoodKind;
    size: FoodSize;
    meal: FoodMeal;
    ingredient?: string;
  },
  dropIngredients: string[];
}

const Customers: Customer[] = [
  {
    name: "Basic",
    patienceDelay: 20 * 60,
    foodWish: { kind: "Drink", size: "Big", meal: "Sweet", ingredient: "Tomato" },
    dropIngredients: ["Human Eye", "Human Piece", "Blood Horn"]
  },
  {
    name: "Basic Woman",
    patienceDelay: 20 * 60,
    foodWish: { kind: "Drink", size: "Small", meal: "Sweet" },
    dropIngredients: ["Human Eye", "Human Piece"]
  },
  {
    name: "Elf Woman",
    patienceDelay: 20 * 60,
    foodWish: { kind: "Meal", size: "Small", meal: "Salty" },
    dropIngredients: [ "Human Eye", "Blood Horn" ]
  },
  {
    name: "Chicken Man",
    patienceDelay: 16 * 60,
    foodWish: { kind: "Meal", size: "Small", meal: "Salty" },
    dropIngredients: [ "Chicken Leg" ]
  },
  {
    name: "Kid Girl",
    patienceDelay: 16 * 60,
    foodWish: { kind: "Meal", size: "Small", meal: "Sweet", ingredient: "Sugar" },
    dropIngredients: [ "Human Eye", "Blood Horn" ]
  },
  {
    name: "Lumberjack",
    patienceDelay: 25 * 60,
    foodWish: { kind: "Drink", size: "Big", meal: "Salty" },
    dropIngredients: [ "Human Eye", "Human Piece" ]
  },
  {
    name: "Mermaid",
    patienceDelay: 25 * 60,
    foodWish: { kind: "Meal", size: "Small", meal: "Sweet" },
    dropIngredients: [ "Human Eye", "Fish Piece" ]
  },
  {
    name: "Orc",
    patienceDelay: 14 * 60,
    foodWish: { kind: "Meal", size: "Big", meal: "Human", ingredient: "Blood Horn" },
    dropIngredients: ["Human Eye", "Human Piece"]
  }
];

const CustomersByName: { [name: string]: Customer } = {};
for (const customer of Customers) CustomersByName[customer.name] = customer;

