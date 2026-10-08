const express = require("express");
const fs = require("node:fs");

const app = express();
app.use(express.json());
const plansFile = "./plans.json";

let plans = {};

if (fs.existsSync(plansFile)) {
  plans = JSON.parse(fs.readFileSync(plansFile, "utf8"));
}

const meals = [
  {
    id: 1,
    name: "Porridge with banana",
    image: "/images/porridge.png",
    categories: ["breakfast"],
    ingredients: [
      { name: "Oats", quantity: 50, unit: "g" },
      { name: "Milk", quantity: 200, unit: "ml" },
      { name: "Banana", quantity: 1, unit: "item" },
    ],
  },
  {
    id: 2,
    name: "Tomato pasta",
    image: "/images/tomato-pasta.png",
    categories: ["lunch", "dinner"],
    ingredients: [
      { name: "Pasta", quantity: 100, unit: "g" },
      { name: "Chopped tomatoes", quantity: 200, unit: "g" },
    ],
  },
  {
    id: 3,
    name: "Eggs on toast",
    image: "/images/eggs-on-toast.png",
    categories: ["breakfast", "lunch"],
    ingredients: [
      { name: "Egg", quantity: 2, unit: "item" },
      { name: "Bread", quantity: 2, unit: "slice" },
    ],
  },
  {
    id: 4,
    name: "Yogurt with oats",
    image: "/images/yogurt-oats.png",
    categories: ["breakfast", "snack"],
    ingredients: [
      { name: "Yogurt", quantity: 150, unit: "g" },
      { name: "Oats", quantity: 30, unit: "g" },
    ],
  },
  {
    id: 5,
    name: "Cheese sandwich",
    image: "/images/cheese-sandwich.png",
    categories: ["lunch"],
    ingredients: [
      { name: "Bread", quantity: 2, unit: "slice" },
      { name: "Cheese", quantity: 40, unit: "g" },
      { name: "Tomato", quantity: 1, unit: "item" },
    ],
  },
  {
    id: 6,
    name: "Chicken rice bowl", 
    image: "/images/chicken-rice.png",
    categories: ["lunch", "dinner"],
    ingredients: [
      { name: "Chicken", quantity: 150, unit: "g" },
      { name: "Rice", quantity: 75, unit: "g" },
      { name: "Broccoli", quantity: 100, unit: "g" },
    ],
  },
  {
    id: 7,
    name: "Chickpea rice bowl",
    image: "/images/chickpea-rice.png",
    categories: ["lunch", "dinner"],
    ingredients: [
      { name: "Chickpeas", quantity: 150, unit: "g" },
      { name: "Rice", quantity: 75, unit: "g" },
      { name: "Chopped tomatoes", quantity: 200, unit: "g" },
    ],
  },
  {
    id: 8,
    name: "Banana and yogurt",
    categories: ["snack"],
    ingredients: [
      { name: "Banana", quantity: 1, unit: "item" },
      { name: "Yogurt", quantity: 100, unit: "g" },
    ],
  },
    {
    id: 9,
    name: "Apple",
    categories: ["snack"],
    ingredients: [
      { name: "Apple", quantity: 1, unit: "item" },
    ],
  },
  {
    id: 10,
    name: "Pack of crisps",
    categories: ["snack"],
    ingredients: [
      { name: "Crisps", quantity: 1, unit: "pack" },
    ],
  },
  {
    id: 11,
    name: "Banana",
    categories: ["snack"],
    ingredients: [
      { name: "Banana", quantity: 1, unit: "item" },
    ],
  },
];

app.get("/api/meals", (req, res) => {
  res.json(meals);
});

// Load the meal plan for a date.
app.get("/api/plan", (req, res) => {
  const { date } = req.query;

  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      message: "Choose a date in YYYY-MM-DD format.",
    });
  }

  const emptyPlan = {
    breakfast: "",
    lunch: "",
    dinner: "",
    snack: "",
  };

  res.json(plans[date] ?? emptyPlan);
});

// Save the meal plan for a date.
app.put("/api/plan", (req, res) => {
  const { date, mealPlan } = req.body ?? {};

  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      message: "Choose a date in YYYY-MM-DD format.",
    });
  }

  const slots = ["breakfast", "lunch", "dinner", "snack"];
  const validMealIds = meals.map((meal) => String(meal.id));

  const validPlan =
    mealPlan &&
    slots.every(
      (slot) =>
        mealPlan[slot] === "" ||
        validMealIds.includes(mealPlan[slot])
    );

  if (!validPlan) {
    return res.status(400).json({
      message: "One or more meal selections are invalid.",
    });
  }

  const cleanedPlan = {};

  for (const slot of slots) {
    cleanedPlan[slot] = mealPlan[slot];
  }

  const updatedPlans = {
    ...plans,
    [date]: cleanedPlan,
  };

  try {
    fs.writeFileSync(
      plansFile,
      JSON.stringify(updatedPlans, null, 2)
    );

    plans = updatedPlans;

    res.json({ message: "Meal plan saved." });
  } catch {
    res.status(500).json({
      message: "Could not save the meal plan.",
    });
  }
});

app.get("/api/shopping-list", (req, res) => {
  const { date } = req.query;

  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      message: "Choose a date in YYYY-MM-DD format.",
    });
  }

  const plan = plans[date];

  if (!plan) {
    return res.json([]);
  }

  const shoppingList = new Map();
  const slots = ["breakfast", "lunch", "dinner", "snack"];

  for (const slot of slots) {
    const mealId = plan[slot];

    if (!mealId) continue;

    const meal = meals.find(
      (meal) => String(meal.id) === String(mealId)
    );

    if (!meal) continue;

    for (const ingredient of meal.ingredients) {
      const name = ingredient.name.trim();
      const unit = ingredient.unit.trim();

      const key = JSON.stringify([
        name.toLowerCase(),
        unit.toLowerCase(),
      ]);

      if (shoppingList.has(key)) {
        shoppingList.get(key).quantity += ingredient.quantity;
      } else {
        shoppingList.set(key, {
          id: key,
          name,
          quantity: ingredient.quantity,
          unit,
        });
      }
    }
  }

  res.json(
    Array.from(shoppingList.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  );
});

app.listen(3001, () => {
  console.log("Server running at http://localhost:3001");
});