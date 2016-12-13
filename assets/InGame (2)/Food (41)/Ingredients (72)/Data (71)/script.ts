interface Ingredient {
  name: string;
  price: number; // can be null if item cannot be bought
  
  maxAvailable: number;
  refillTicksDuration: number;
  
  quantity?: number;
  available?: number;
  refillTicks?: number;
}

const Ingredients: Ingredient[] = [
  {
    name:  "Apple", price: 5,
    maxAvailable: 5, refillTicksDuration: 2 * 60
  },
  {
    name:  "Carrot", price: 5,
    maxAvailable: 5, refillTicksDuration: 2 * 60
  },
  {
    name: "Cheese", price: 10,
    maxAvailable: 5, refillTicksDuration: 5 * 60
  },
  {
    name: "Corn", price: 5,
    maxAvailable: 5, refillTicksDuration: 2 * 60
  },
  {
    name: "Egg", price: 5,
    maxAvailable: 5, refillTicksDuration: 5 * 60
  },
  {
    name: "Grape", price: 10,
    maxAvailable: 5, refillTicksDuration: 5 * 60
  },
  {
    name: "Ham", price: 20,
    maxAvailable: 5, refillTicksDuration: 5 * 60
  },
  {
    name: "Hop", price: 5,
    maxAvailable: 5, refillTicksDuration: 2 * 60
  },
  {
    name: "Potato", price: 5,
    maxAvailable: 5, refillTicksDuration: 2 * 60
  },
  {
    name: "Salad", price: 5,
    maxAvailable: 5, refillTicksDuration: 2 * 60
  },
  {
    name: "Sugar", price: 10,
    maxAvailable: 10, refillTicksDuration: 5 * 60
  },
  {
    name: "Tomato", price: 5,
    maxAvailable: 5, refillTicksDuration: 2 * 60
  },
  {
    name: "Water", price: 2,
    maxAvailable: 10, refillTicksDuration: 1 * 30
  },
  {
    name: "Wheat", price: 5,
    maxAvailable: 10, refillTicksDuration: 1 * 60
  },
  
  // Dropped on customers
  {
    name:  "Blood Horn", price: null,
    maxAvailable: 5, refillTicksDuration: 5 * 60
  },
  {
    name: "Chicken Leg", price: null,
    maxAvailable: 5, refillTicksDuration: 5 * 60
  },
  {
    name: "Fish Piece", price: null,
    maxAvailable: 5, refillTicksDuration: 5 * 60
  },
  {
    name: "Human Eye", price: null,
    maxAvailable: 5, refillTicksDuration: 5 * 60
  },
  {
    name: "Human Piece", price: null,
    maxAvailable: 5, refillTicksDuration: 5 * 60
  },
];

const IngredientsByName: { [name: string]: Ingredient } = {};
for (const ingredient of Ingredients) {
  ingredient.quantity = 0;
  IngredientsByName[ingredient.name] = ingredient;
}

// Check all recipes
for (const recipe of Recipes) {
  for (const ingredient of recipe.ingredients) {
    if (IngredientsByName[ingredient.name] == null) {
      Sup.log(`Invalid ${ingredient.name} ingredient in ${recipe.name} recipe.`)
    }
  }
}
