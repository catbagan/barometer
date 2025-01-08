import { LinksFunction } from "@remix-run/node";
import stylesUrl from "./sidebar.css?url";
import { useNavigate } from "@remix-run/react";
import { IngredientList } from "./ingredient-list";
import { RecipeList } from "./recipe-list";
import { CategoryFilters } from "./category-filters";
import { useState, useMemo } from "react";
import { Tabs } from "./tabs";
import { Ingredient } from "~/types/ingredient.type";
import cocktail from "/cocktail.png";

interface SidebarProps {
  ingredients: Array<Ingredient>;
  recipes: Array<any>;
  setSelectedIngredient: (id: string) => void;
  selectedIngredient: string;
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export function Sidebar({
  ingredients,
  recipes,
  setSelectedIngredient,
  selectedIngredient,
}: SidebarProps) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    "ingredients" | "recipes" | "menus"
  >("ingredients");

  const [selectedCategories, setSelectedCategories] = useState([
    ...new Set(ingredients.map((i) => i.category.toLowerCase())),
  ]);
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ingredient) =>
      selectedCategories.includes(ingredient.category.toLowerCase())
    );
  }, [ingredients, selectedCategories]);

  return (
    <div id="sidebar">
      <div id="sidebar-header">
        <h1>BarOMeter</h1>
        <img src={cocktail} alt="Cocktail icon" />
      </div>

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "ingredients" && (
        <>
          <CategoryFilters
            categories={[
              ...new Set(ingredients.map((i) => i.category.toLowerCase())),
            ]}
            selectedCategories={selectedCategories}
            onToggleCategory={(category) =>
              setSelectedCategories((prev) =>
                prev.includes(category)
                  ? prev.filter((cat) => cat !== category)
                  : [...prev, category]
              )
            }
          />
          <IngredientList
            ingredients={filteredIngredients}
            selectedIngredient={selectedIngredient}
            setSelectedIngredient={setSelectedIngredient}
          />
        </>
      )}

      {activeTab === "recipes" && (
        <>
          <div id="recipe-controls">
            <button id="add-recipe-button" onClick={() => navigate('/recipe/add')}>Add recipe</button>
          </div>
          <RecipeList recipes={recipes} />
        </>
      )}
      {/* {activeTab === "menus" && <MenuList />} */}
    </div>
  );
}
