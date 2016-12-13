class BarBehavior extends Sup.Behavior {
  isBarOpened = false;
  
  private clickTheBarLabel: Sup.Actor;
  private clickTheBarLabelTicks = 0;
  
  private barUIActor = Sup.getActor("Bar UI");
  private shelfActor = this.barUIActor.getChild("Shelf");
  private selectionActor = this.barUIActor.getChild("Selection");
  
  private ingredientActors: Sup.Actor[] = [];
  private ingredientHoverActor = this.shelfActor.getChild("Hover");
  private ingredientPriceActor = this.ingredientHoverActor.getChild("Price");
  private ingredientPopupActor = this.ingredientHoverActor.getChild("Popup");
  private popupSprite = Sup.get("InGame/Bar/Popup", Sup.Sprite);
  private popupTrapSprite = Sup.get("InGame/Bar/Popup Trap", Sup.Sprite);
  private hoveredIngredient: Ingredient;
  
  private selectedIngredients: string[] = [];
  private selectedIngredientActors: Sup.Actor[] = [];
  private discardActor = this.barUIActor.getChild("Selection").getChild("Discard");

  private recipeActors: Sup.Actor[] = [];
  private recipesActor = this.barUIActor.getChild("Recipes");
  private recipeHoverActor = this.recipesActor.getChild("Hover");
  private hoveredRecipe: Recipe;
  
  awake() {
    Game.barBehavior = this;
    
    this.clickTheBarLabel = Sup.getActor("Click The Bar");
    
    for (let i = 0; i < Ingredients.length; i++) {
      const ingredient = Ingredients[i];
      
      const actor = new Sup.Actor(ingredient.name, this.shelfActor);
      this.ingredientActors.push(actor);
      
      new Sup.SpriteRenderer(actor, `InGame/Food/Ingredients/${ingredient.name}`);
      
      actor.setLocalPosition((i % 4) * 1.25, -Math.floor(i / 4) * 1.25);
      
      const quantityActor = new Sup.Actor("Quantity", actor);
      new Sup.TextRenderer(quantityActor, ingredient.quantity || 0, SmallFont, { alignment: "right", size: 16 });
      quantityActor.textRenderer.setOpacity(0.99);
      quantityActor.setLocalPosition(0.4, -0.35, 0.1);
    }
  }
  
  startDayOutro() {
    this.setBarOpened(false);
    this.clickTheBarLabel.setVisible(false);
  }
  
  startPreparing() {
    this.setBarOpened(false);
    this.clickTheBarLabel.setVisible(false);
  }
  
  startServing() {
    // Reset some ingredient properties
    for (let i = 0; i < Ingredients.length; i++) {
      const ingredient = Ingredients[i];
      
      ingredient.available = 1;
      ingredient.refillTicks = 0;
      
      const refillActor = this.shelfActor.getChild(ingredient.name).getChild("Refill");
      if (refillActor != null) refillActor.destroy();
    }
    
    this.clickTheBarLabel.setVisible(true);
    
    for (const ingredient of Ingredients) this.updateIngredientDisplay(ingredient);
    this.selectedIngredients.length == 0;
    this.refreshCompatibleRecipes();
  }

  update() {
    if (Game.state !== "serving") return;
    
    this.clickTheBarLabelTicks++;
    this.clickTheBarLabel.setLocalY(-5.25 + Math.sin(this.clickTheBarLabelTicks / 10) * 0.06);
    
    this.tickIngredientsRefill();

    if (!this.isBarOpened) {
      const isHovered = Game.gameBehavior.mouseRay.intersectActor(this.actor).length > 0;
      this.actor.setVisible(isHovered);

      if (isHovered && Sup.Input.wasMouseButtonJustPressed(0)) {
        this.setBarOpened(true);
        return;
      }
    } else {
      const mousePosition = Game.gameBehavior.mouseRay.getOrigin();
      if (Sup.Input.wasKeyJustPressed("ESCAPE") || (Sup.Input.wasMouseButtonJustPressed(0) && mousePosition.x > 5 && mousePosition.y > 3)) {
        this.setBarOpened(false);
        return;
      }
      
      this.ingredientHoverActor.setVisible(false);
      if (this.hoveredIngredient != null) {
        const previouslyHoveredIngredient = this.hoveredIngredient;
        this.hoveredIngredient = null;
        this.updateIngredientDisplay(previouslyHoveredIngredient);
      }
      
      for (const ingredientActor of this.ingredientActors) {
        if (Game.gameBehavior.mouseRay.intersectActor(ingredientActor).length > 0) {
          this.ingredientHoverActor.setLocalPosition(ingredientActor.getLocalPosition().toVector2());
          this.ingredientHoverActor.setVisible(true);
          this.hoveredIngredient = IngredientsByName[ingredientActor.getName()];
          this.updateIngredientDisplay(this.hoveredIngredient);
          
          const hasPrice = this.hoveredIngredient.price != null;
          
          this.ingredientPriceActor.setVisible(hasPrice);
          if (hasPrice) this.ingredientPriceActor.textRenderer.setText(this.hoveredIngredient.price);
          this.ingredientPopupActor.spriteRenderer.setSprite(hasPrice ? this.popupSprite : this.popupTrapSprite);
          break;
        }
      }
      
      if (this.hoveredIngredient != null) {
        if (Sup.Input.wasMouseButtonJustPressed(0)) this.buyHoveredIngredient();
        else if (Sup.Input.wasMouseButtonJustPressed(2)) this.placeHoveredIngredient();
      }
      
      const hoveringDiscard = this.selectedIngredients.length > 0 && Game.gameBehavior.mouseRay.intersectActor(this.discardActor).length > 0;
      this.discardActor.setVisible(hoveringDiscard);
      
      if (hoveringDiscard && Sup.Input.wasMouseButtonJustPressed(0)) {
        this.discardSelectedIngredients();
      }
      
      this.recipeHoverActor.setVisible(false);
      this.hoveredRecipe = null;
      
      for (const recipeActor of this.recipeActors) {
        recipeActor.textRenderer.setOpacity(0.8);
        if (Game.gameBehavior.mouseRay.intersectActor(recipeActor).length > 0) {
          recipeActor.textRenderer.setOpacity(1.0);
          this.recipeHoverActor.setLocalY(recipeActor.getLocalY());
          this.recipeHoverActor.setVisible(true);
          this.hoveredRecipe = RecipesByName[recipeActor.getName()];
          break;
        }
      }

      
      if (this.hoveredRecipe != null && Sup.Input.wasMouseButtonJustPressed(0)) {
        if (this.hasEnoughIngredients(this.hoveredRecipe)) {
          for (const ingredient of this.hoveredRecipe.ingredients) {
            IngredientsByName[ingredient.name].quantity -= ingredient.quantity;
            this.updateIngredientDisplay(IngredientsByName[ingredient.name]);
          }

          Game.foodBehavior.addRecipe(this.hoveredRecipe);

          this.discardSelectedIngredients();

          this.recipeHoverActor.setVisible(false);
          this.refreshCompatibleRecipes();
        }
      }
    }
  }
  
  private hasEnoughIngredients(recipe: Recipe) {
    let hasEnoughIngredients = true;

    for (const ingredient of recipe.ingredients) {
      if (IngredientsByName[ingredient.name].quantity < ingredient.quantity) {
        hasEnoughIngredients = false;
        break;
      }
    }
        
    return hasEnoughIngredients;
  }

  private tickIngredientsRefill() {
    for (const ingredient of Ingredients) {
      if (ingredient.available >= ingredient.maxAvailable) continue;
      
      ingredient.refillTicks++;
      
      if (ingredient.available === 0) {
        const refillActor = this.shelfActor.getChild(ingredient.name).getChild("Refill");
        
        if (ingredient.refillTicks === ingredient.refillTicksDuration) refillActor.destroy();
        else refillActor.setLocalScaleX(ingredient.refillTicks / ingredient.refillTicksDuration);
      }
      
      if (ingredient.refillTicks >= ingredient.refillTicksDuration) {
        ingredient.refillTicks = 0;
        ingredient.available++;
      }
    }
  }

  private setBarOpened(opened: boolean) {
    this.isBarOpened = opened;
    this.actor.setVisible(!opened);
    this.barUIActor.setVisible(opened);
    
    if (this.isBarOpened) this.clickTheBarLabel.setVisible(false);
  }
  
  private placeHoveredIngredient() {
    if (this.hoveredIngredient.quantity === 0) return;
    if (this.selectedIngredientActors.length >= MaxIngredientsPerRecipe) return;
    if (this.selectedIngredients.indexOf(this.hoveredIngredient.name) !== -1) return;
    
    // TODO: play some button press animation on the hover
    
    this.selectedIngredients.push(this.hoveredIngredient.name);

    const actor = new Sup.Actor(this.hoveredIngredient.name, this.selectionActor);
    new Sup.SpriteRenderer(actor, `InGame/Food/Ingredients/${this.hoveredIngredient.name}`);
    this.selectedIngredientActors.push(actor);
    
    let i = 0;
    for (const selectedActor of this.selectedIngredientActors) {
      const offset = (-(this.selectedIngredientActors.length - 1) / 2 + i) * 0.5;
      selectedActor.setLocalPosition(offset, -offset);
      i++;
    }
    
    this.refreshCompatibleRecipes();
  }
  
  private discardSelectedIngredients() {
    /*if (returnToShelf) {
      for (const ingredientName of this.selectedIngredients) {
        const ingredient = IngredientsByName[ingredientName];
        ingredient.quantity++;
        this.updateIngredientDisplay(ingredient);
      }
    }*/
    
    for (const actor of this.selectedIngredientActors) actor.destroy();
    
    this.selectedIngredients.length = 0;
    this.selectedIngredientActors.length = 0;

    this.refreshCompatibleRecipes();
  }
  
  private refreshCompatibleRecipes() {
    for (const actor of this.recipeActors) actor.destroy();
    this.recipeActors.length = 0;

    if (this.selectedIngredients.length == 0) return;

    const matchingRecipes: { matchingIngredients: number; recipe: Recipe; hasEnoughIngredients: boolean; }[] = [];

    for (const recipe of Recipes) {
      let matchingIngredients = 0;
      
      for (const ingredient of recipe.ingredients) {
        if (this.selectedIngredients.indexOf(ingredient.name) !== -1) matchingIngredients++;
      }
      
      if (matchingIngredients === this.selectedIngredients.length) {
        const hasEnoughIngredients = this.hasEnoughIngredients(recipe);
        matchingRecipes.push({ matchingIngredients, recipe, hasEnoughIngredients });
      }
    }
    
    matchingRecipes.sort((a, b) => b.matchingIngredients - a.matchingIngredients);
    
    let i = 0;
    for (const match of matchingRecipes) {
      const actor = new Sup.Actor(match.recipe.name, this.recipesActor).setLocalScale(0.5);
      this.recipeActors.push(actor);
      
      const ingredientsInfo = match.recipe.ingredients.map((x) => `${x.name} x ${x.quantity}`).join(", ");
      
      new Sup.TextRenderer(actor, `${match.recipe.name} (${ingredientsInfo})`, SmallFont, { alignment: "left", size: 32 });
      if (!match.hasEnoughIngredients) actor.textRenderer.setColor(1, 0.5, 0.5);
      actor.setLocalY(-i * 0.5);
      
      /*const ingredientsInfoActor = new Sup.Actor("Ingredients", actor);
      ingredientsInfoActor.setLocalY(-0.5);
      new Sup.TextRenderer(ingredientsInfoActor, "(Liste d'ingrédients)");*/
      
      i++;
    }
  }
  
  private buyHoveredIngredient() {
    if (this.hoveredIngredient.available === 0) return;
    if (this.hoveredIngredient.price == null || this.hoveredIngredient.price > Game.money) return;

    Game.money -= this.hoveredIngredient.price;
    this.hoveredIngredient.available--;
    this.hoveredIngredient.quantity++;
    this.updateIngredientDisplay(this.hoveredIngredient);

    if (this.hoveredIngredient.available === 0) {
      const actor = this.shelfActor.getChild(this.hoveredIngredient.name);
      const refillActor = new Sup.Actor("Refill", actor);
      refillActor.setLocalPosition(-0.5, 0.5);
      refillActor.setLocalScaleX(0.001);
      new Sup.SpriteRenderer(refillActor, "InGame/Bar/Refill Indicator");
    }
    
    this.refreshCompatibleRecipes();
  }
  
  dropIngredient(ingredientName: string) {
    const ingredient = IngredientsByName[ingredientName];
    ingredient.quantity++;
    this.updateIngredientDisplay(ingredient);
    
    this.refreshCompatibleRecipes();
  }
  
  private updateIngredientDisplay(ingredient: Ingredient) {
    const actor = this.shelfActor.getChild(ingredient.name);
    const color = ingredient.quantity === 0 ? ingredient == this.hoveredIngredient ? 0.8 : 0.3 : 1;
    actor.spriteRenderer.setColor(color, color, color);
    
    const quantityTextRenderer = actor.getChild("Quantity").textRenderer;
    quantityTextRenderer.setText(ingredient.quantity);
  }
}
Sup.registerBehavior(BarBehavior);
