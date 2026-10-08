import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [mealPlan, setMealPlan] = useState({
     breakfast: "",
     lunch: "",
     dinner: "",
     snack: "",
  });
  const [loadedDate, setLoadedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [planError, setPlanError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [shoppingList, setShoppingList] = useState([]);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [shoppingError, setShoppingError] = useState("");
  const [checkedItems, setCheckedItems] = useState([]);
  const [shoppingVersion, setShoppingVersion] = useState(0);

  const planReady = selectedDate !== "" && loadedDate === selectedDate;

  useEffect(() => {
    async function loadMeals() {
      try {
        const response = await fetch("/api/meals");

        if (!response.ok) {
          throw new Error("Failed to load meals");
        }

        const data = await response.json();
        setMeals(data);
      } catch {
        setError("Could not load meals. Check the server is running.");
      } finally {
        setLoading(false);
      }
    }

    loadMeals();
  }, []);

  
  useEffect(() => {
  if (!selectedDate) return;

  let ignore = false;

  async function loadPlan() {
    try {
      const response = await fetch(
        `/api/plan?date=${encodeURIComponent(selectedDate)}`
      );

      if (!response.ok) {
        throw new Error("Could not load this plan.");
      }

      const data = await response.json();

      if (!ignore) {
        setMealPlan(data);
        setLoadedDate(selectedDate);
      }
    } catch {
      if (!ignore) {
        setPlanError("Could not load this plan. Check the server.");
      }
    }
  }

  loadPlan();

  return () => {
    ignore = true;
  };
}, [selectedDate]);
  
useEffect(() => {
  let ignore = false;

  setShoppingList([]);
  setCheckedItems([]);
  setShoppingError("");

  if (!selectedDate) {
    setShoppingLoading(false);
    return;
  }

  setShoppingLoading(true);

  async function loadShoppingList() {
    try {
      const response = await fetch(
        `/api/shopping-list?date=${encodeURIComponent(selectedDate)}`
      );

      if (!response.ok) {
        throw new Error("Could not load shopping list.");
      }

      const data = await response.json();

      if (!ignore) {
        setShoppingList(data);
      }
    } catch {
      if (!ignore) {
        setShoppingError("Could not load your shopping list.");
      }
    } finally {
      if (!ignore) {
        setShoppingLoading(false);
      }
    }
  }

  loadShoppingList();

  return () => {
    ignore = true;
  };
}, [selectedDate, shoppingVersion]);
  

  function updateMeal(slot, mealId) {
  setMealPlan((previousPlan) => ({
    ...previousPlan,
    [slot]: mealId,
  }));

  setSaveMessage("");
  }

  async function savePlan() {
  if (!planReady || saving) return;

  setSaving(true);
  setPlanError("");
  setSaveMessage("Meal plan saved.");
  setShoppingVersion((version) => version + 1);

  try {
    const response = await fetch("/api/plan", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: selectedDate,
        mealPlan,
      }),
    });

    if (!response.ok) {
      throw new Error("Could not save the plan.");
    }

    setSaveMessage("Meal plan saved.");
  } catch {
    setPlanError("Could not save your plan. Please try again.");
  } finally {
    setSaving(false);
  }
  }

  function toggleShoppingItem(itemId) {
  setCheckedItems((previousItems) =>
    previousItems.includes(itemId)
      ? previousItems.filter((id) => id !== itemId)
      : [...previousItems, itemId]
  );
  } 

  return (
    <main className="app">
      <h1>Meal Planner</h1>
      <p>Plan your daily meals and organise your shopping.</p>
      <div className="date-picker">
         <label htmlFor="plan-date">Choose a day:</label>
         <input
             id="plan-date"
             type="date"
             value={selectedDate}
             disabled={saving}
             onChange={(event) => {
               setSelectedDate(event.target.value);
               setLoadedDate("");
               setPlanError("");
               setSaveMessage("");
               setMealPlan({
                 breakfast: "",
                 lunch: "",
                 dinner: "",
                 snack: "",
               });
             }}
/>
      </div>

  <section aria-labelledby="daily-plan-heading">
    <h2 id="daily-plan-heading">Your daily plan</h2>

  {!selectedDate && <p>Choose a date to start planning.</p>}

    <div className="planner-grid">
    {["breakfast", "lunch", "dinner", "snack"].map((slot) => (
      <div className="meal-slot" key={slot}>
        <label htmlFor={`meal-${slot}`}>
          {slot === "snack"
            ? "Snack (optional)"
            : slot.charAt(0).toUpperCase() + slot.slice(1)}
        </label>

        <select
          id={`meal-${slot}`}
          value={mealPlan[slot]}
          onChange={(event) => updateMeal(slot, event.target.value)}
          disabled={!planReady || loading || Boolean(error) || saving}
        >
          <option value="">Choose a meal</option>

          {meals
            .filter(
              (meal) =>
                meal.categories.includes(slot) ||
                String(meal.id) === mealPlan[slot]
            )
            .map((meal) => (
              <option key={meal.id} value={String(meal.id)}>
                {meal.name}
              </option>
            ))}
        </select>
      </div>
    ))}
    </div>
    <p className="plan-hint">
       Save your changes before switching dates.
    </p>

    <button
       type="button"
       className="save-button"
       onClick={savePlan}
       disabled={!planReady || loading || Boolean(error) || saving}
    >
       {saving ? "Saving..." : "Save meal plan"}
    </button>

    <div role="status">
       {selectedDate && !planReady && !planError && (
    <p>Loading your plan...</p>
    )}

       {saveMessage && <p>{saveMessage}</p>}
     </div>

     {planError && <p role="alert">{planError}</p>}
    </section>

    <section
      className="shopping-section"
      aria-labelledby="shopping-heading"
    >
      <h2 id="shopping-heading">Shopping list</h2>
      <p>Ingredients for your saved plan. Save meal changes to update this list.</p>

        {!selectedDate && <p>Choose a date to see your shopping list.</p>}

        {shoppingLoading && <p role="status">Loading shopping list...</p>}

        {shoppingError && <p role="alert">{shoppingError}</p>}

        {selectedDate &&
        !shoppingLoading &&
        !shoppingError &&
        shoppingList.length === 0 && (
      <p>No ingredients yet. Choose some meals and save your plan.</p>
      )}

      {!shoppingLoading && !shoppingError && shoppingList.length > 0 && (
      <>
        <p>
          {checkedItems.length} of {shoppingList.length} items checked
        </p>

        <ul className="shopping-list">
          {shoppingList.map((item) => (
            <li key={item.id}>
              <label className="shopping-item">
                <input
                  type="checkbox"
                  checked={checkedItems.includes(item.id)}
                  onChange={() => toggleShoppingItem(item.id)}
                />

                <span
                  className={
                    checkedItems.includes(item.id) ? "item-checked" : ""
                  }
                >
                  {item.name} — {item.quantity} {item.unit}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </>
      )}
      </section>

      <h2>Available meals</h2>

      {loading && <p>Loading meals...</p>}
      {error && <p role="alert">{error}</p>}

      <div className="meal-grid">
        {meals
          .filter((meal) =>
            meal.categories.some((category) => category !== "snack")
        )
          .map((meal) => (
          <article className="meal-card" key={meal.id}>
             {meal.image && (
               <img
                  className="meal-image"
                  src={meal.image}
                  alt={meal.name}
                  loading="lazy"
               />
             )}

             <h3>{meal.name}</h3>

            <ul>
              {meal.ingredients.map((ingredient) => (
                <li key={ingredient.name}>
                  {ingredient.name}: {ingredient.quantity} {ingredient.unit}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </main>
  );
}
export default App;