type FoodKind = "Meal" | "Drink";
type FoodSize = "Small" | "Big";
type FoodMeal = "Sweet" | "Salty" | "Human";

interface Recipe {
  name: string;
  price: number; // NOTE: Hacked a 2x multiplier for it in CustomerBehavior
  kind: FoodKind;
  size: FoodSize;
  meal: FoodMeal;
  ingredients: { name: string; quantity: number; }[];
}

const MaxIngredientsPerRecipe = 4;

const Recipes: Recipe[] = [
  // Meals
  {
    name: "Apple Pie",
    price: 40,
    kind: "Meal",
    size: "Small",
    meal: "Sweet",
    ingredients: [
      { name: "Apple", quantity: 2 },
      { name: "Sugar", quantity: 1 },
      { name: "Wheat", quantity: 1 },
      { name: "Water", quantity: 1 },
    ]
  },
  {
    name: "Bread",
    price: 15,
    kind: "Meal",
    size: "Small",
    meal: "Salty",
    ingredients: [
      { name: "Wheat", quantity: 1 },
      { name: "Water", quantity: 1 },
    ]
  },
  {
    name: "Carrot Salad",
    price: 20,
    kind: "Meal",
    size: "Small",
    meal: "Salty",
    ingredients: [
      { name: "Carrot", quantity: 3 }
    ]
  },
  {
    name: "Carrot Soup",
    price: 25,
    kind: "Meal",
    size: "Small",
    meal: "Salty",
    ingredients: [
      { name: "Carrot", quantity: 2 },
      { name: "Potato", quantity: 1 },
      { name: "Water", quantity: 1 }
    ]
  },
  {
    name: "Candies",
    price: 30,
    kind: "Meal",
    size: "Small",
    meal: "Sweet",
    ingredients: [
      { name: "Sugar", quantity: 2 }
    ]
  },
  {
    name: "Eye Soup",
    price: 35,
    kind: "Meal",
    size: "Small",
    meal: "Human",
    ingredients: [
      { name: "Human Eye", quantity: 3 },
      { name: "Blood Horn", quantity: 1 },
    ]
  },
  {
    name: "Fish Grilled",
    price: 30,
    kind: "Meal",
    size: "Big",
    meal: "Human",
    ingredients: [
      { name: "Fish Piece", quantity: 6 }
    ]
  },
  {
    name: "Fried Egg",
    price: 25,
    kind: "Meal",
    size: "Small",
    meal: "Salty",
    ingredients: [
      { name: "Egg", quantity: 1 },
      { name: "Ham", quantity: 1 },
    ]
  },
  {
    name: "Human Meat Pie",
    price: 100,
    kind: "Meal",
    size: "Big",
    meal: "Human",
    ingredients: [
      { name: "Human Piece", quantity: 6 },
      { name: "Wheat", quantity: 2 },
      { name: "Water", quantity: 1 },
    ]
  },
  {
    name: "Mixed Salad",
    price: 20,
    kind: "Meal",
    size: "Small",
    meal: "Salty",
    ingredients: [
      { name: "Tomato", quantity: 1 },
      { name: "Corn", quantity: 1 },
      { name: "Salad", quantity: 1 },
    ]
  },
  {
    name: "Roasted Chicken",
    price: 50,
    kind: "Meal",
    size: "Big",
    meal: "Salty",
    ingredients: [
      { name: "Chicken Leg", quantity: 3 },
    ]
  },
  {
    name: "Sandwich",
    price: 30,
    kind: "Meal",
    size: "Small",
    meal: "Salty",
    ingredients: [
      { name: "Salad", quantity: 1 },
      { name: "Wheat", quantity: 1 },
      { name: "Water", quantity: 1 },
      { name: "Tomato", quantity: 1 },
      { name: "Cheese", quantity: 1 }
    ]
  },
  {
    name: "Tartiflette",
    price: 50,
    kind: "Meal",
    size: "Big",
    meal: "Salty",
    ingredients: [
      { name: "Potato", quantity: 2 },
      { name: "Cheese", quantity: 1 },
      { name: "Ham", quantity: 1 }
    ]
  },
  {
    name: "Tomato Salad",
    price: 20,
    kind: "Meal",
    size: "Small",
    meal: "Salty",
    ingredients: [
      { name: "Tomato", quantity: 3 }
    ]
  },
  
  
  // Drinks
  {
    name: "Beer",
    price: 30,
    kind: "Drink",
    size: "Big",
    meal: "Salty",
    ingredients: [
      { name: "Wheat", quantity: 1 },
      { name: "Water", quantity: 1 },
      { name: "Hop", quantity: 1 }
    ]
  },
  {
    name: "Tomato Juice",
    price: 20,
    kind: "Drink",
    size: "Big",
    meal: "Sweet",
    ingredients: [
      { name: "Water", quantity: 1 },
      { name: "Tomato", quantity: 2 }
    ]
  },
  {
    name: "Wine",
    price: 40,
    kind: "Drink",
    size: "Small",
    meal: "Sweet",
    ingredients: [
      { name: "Grape", quantity: 2 },
      { name: "Water", quantity: 2 },
      { name: "Sugar", quantity: 1 }
    ]
  }
];

const RecipesByName: { [name: string]: Recipe; } = {};
for (const recipe of Recipes) RecipesByName[recipe.name] = recipe;
