import {
  Button,
  ComboboxItem,
  Flex,
  Modal,
  MultiSelect,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import mongoose from "mongoose";
import { useState } from "react";
import { Ingredient, Menu, Recipe, RecipeIngredient } from "~/types/index.type";

export interface RecipeModalProps {
  opened: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  recipes: Recipe[];
  menus: Menu[];
  recipeId: string;
  onSave: (recipe: Recipe, menus: Array<Menu>) => Promise<void>;
}

interface IngredientRowProps {
  showAddIcon: boolean;
  addIngredient: () => void;
  deleteIngredient: (id: string) => void;
  currentIngredient: RecipeIngredient;
  updateCurrentIngredient: (updated: RecipeIngredient) => void;
  ingredients: Ingredient[];
}

const IngredientRow = ({
  showAddIcon,
  addIngredient,
  deleteIngredient,
  currentIngredient,
  updateCurrentIngredient,
  ingredients,
}: IngredientRowProps) => {
  const ingredientTypes = Array.from(
    new Set(ingredients.map((ing) => ing.category))
  );

  const [search, setSearch] = useState("");
  const allBrands = ingredients.map((ing) => ({ name: ing.brand, id: ing.id }));
  const brands = ingredients
    .filter((ing) => {
      let check = true;
      if (currentIngredient.category) {
        check = check && ing.category === currentIngredient.category;
      }
      if (search) {
        check = check && ing.brand.toLowerCase().includes(search.toLowerCase());
      }
      if (currentIngredient.brands) {
        check =
          check && !currentIngredient.brands.map((b) => b.id).includes(ing.id);
      }
      return check;
    })
    .map((ing) => ({ name: ing.brand, id: ing.id }));

  return (
    <Flex mb="sm" align="center" gap="sm">
      <Select
        placeholder="Type"
        data={ingredientTypes}
        value={currentIngredient.category}
        onChange={(val: string | null, opt: ComboboxItem) => {
          updateCurrentIngredient({
            ...currentIngredient,
            category: val ?? "",
          });
        }}
      />
      <MultiSelect
        placeholder="Brand"
        data={brands.map((brand) => brand.name)}
        clearable
        searchable
        value={currentIngredient.brands.map((b) => b.name)}
        onClear={() => {
          updateCurrentIngredient({ ...currentIngredient, brands: [] });
        }}
        onChange={(val) => {
          const uniqueBrandNames = Array.from(new Set(val));
          updateCurrentIngredient({
            ...currentIngredient,
            brands: uniqueBrandNames.map((v) => ({
              id: allBrands.find((b) => b.name === v)?.id ?? "",
              name: v,
            })),
          });
        }}
        onSearchChange={setSearch}
      />
      <Select
        placeholder="Amount"
        data={["0.5oz", "1oz", "1.5oz", "2oz", "custom"]}
        value={currentIngredient.amount}
        onChange={(val) => {
          updateCurrentIngredient({ ...currentIngredient, amount: val ?? "" });
        }}
      />
      <a
        style={{ cursor: "pointer" }}
        onClick={() => {
          showAddIcon
            ? addIngredient()
            : deleteIngredient(currentIngredient.id);
        }}
      >
        {showAddIcon ? <IconPlus stroke={1.5} /> : <IconTrash stroke={1.5} />}
      </a>
    </Flex>
  );
};

interface MenuRowProps {
  showAddIcon: boolean;
  addMenu: () => void;
  deleteMenu: (id: string) => void;
  currentMenu: Menu;
  updateMenu: (updated: Menu) => void;
  menus: Menu[];
  recipeId: string;
}

const MenuRow = ({
  showAddIcon,
  addMenu,
  deleteMenu,
  currentMenu,
  updateMenu,
  menus,
  recipeId,
}: MenuRowProps) => {
  const allMenuOptions = Array.from(
    new Set([...menus].map((menu) => menu.name))
  )
    .filter((name) => name)
    .map((name) => ({
      label: name,
      value: name,
    }));

  return (
    <Flex mb="sm" align="center" gap="sm">
      <Select
        placeholder="Menu"
        data={allMenuOptions}
        value={currentMenu.name}
        onChange={(value) => {
          const existingMenu = menus.find((m) => m.name === value);
          if (existingMenu) {
            updateMenu({
              ...currentMenu,
              id: menus.find((m) => m.name === value)?.id ?? "",
              name: value || "",
              recipes: existingMenu.recipes.some((r) => r.recipe === recipeId)
                ? existingMenu.recipes
                : [...existingMenu.recipes, { recipe: recipeId, price: 0 }],
            });
          } else {
            updateMenu({
              ...currentMenu,
              name: value || "",
              recipes: [{ recipe: recipeId, price: 0 }],
            });
          }
        }}
      />
      <TextInput
        placeholder="Price"
        type="number"
        value={
          currentMenu.recipes
            .find((r) => r.recipe === recipeId)
            ?.price?.toString() ?? ""
        }
        onChange={(event) => {
          const inputValue = event.currentTarget.value;
          updateMenu({
            ...currentMenu,
            recipes: currentMenu.recipes.map((recipe) =>
              recipe.recipe === recipeId
                ? {
                    ...recipe,
                    price: inputValue === "" ? 0 : parseFloat(inputValue),
                  }
                : recipe
            ),
          });
        }}
      />
      <a
        style={{ cursor: "pointer" }}
        onClick={() => {
          showAddIcon ? addMenu() : deleteMenu(currentMenu.id);
        }}
      >
        {showAddIcon ? <IconPlus stroke={1.5} /> : <IconTrash stroke={1.5} />}
      </a>
    </Flex>
  );
};

export const RecipeModal = ({
  opened,
  onClose,
  ingredients,
  menus,
  recipeId,
  onSave,
}: RecipeModalProps) => {
  const [recipeName, setRecipeName] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState<
    RecipeIngredient[]
  >([
    {
      id: new mongoose.Types.ObjectId().toHexString(),
      category: "",
      brands: [],
      amount: "",
    },
  ]);
  const [menusToUpdate, setMenusToUpdate] = useState<Menu[]>([
    {
      ...menus[0],
      recipes: [{ recipe: recipeId, price: 0 }],
    },
  ]);

  const addIngredient = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      {
        id: new mongoose.Types.ObjectId().toHexString(),
        category: "",
        brands: [],
        amount: "",
      },
    ]);
  };

  const deleteIngredient = (id: string) => {
    setRecipeIngredients(recipeIngredients.filter((ing) => ing.id !== id));
  };

  const updateIngredient = (
    id: string,
    updatedIngredient: RecipeIngredient
  ) => {
    setRecipeIngredients(
      recipeIngredients.map((ing) => (ing.id === id ? updatedIngredient : ing))
    );
  };

  const addMenu = () => {
    const newMenu: Menu = {
      id: "",
      name: "",
      recipes: [{ recipe: recipeId, price: 0 }],
    };
    setMenusToUpdate([...menusToUpdate, newMenu]);
  };

  const deleteMenu = (idx: number) => {
    setMenusToUpdate(menusToUpdate.filter((_, index) => index !== idx));
  };

  const updateMenu = (idx: number, updatedMenu: Menu) => {
    setMenusToUpdate(
      menusToUpdate.map((menu, index) => (index === idx ? updatedMenu : menu))
    );
  };

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    const newRecipe: Recipe = {
      id: recipeId,
      name: recipeName,
      ingredients: recipeIngredients,
      createdBy: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await onSave(newRecipe, menusToUpdate);
    onClose();
  };

  return (
    <Modal
      size="lg"
      overlayProps={{ blur: 2 }}
      opened={opened}
      onClose={handleClose}
      title="Add new recipe"
      styles={{ title: { fontSize: "24px" } }}
      centered
    >
      <TextInput
        label="Recipe name"
        placeholder="Recipe name"
        required
        mb="sm"
        value={recipeName}
        onChange={(event) => setRecipeName(event.currentTarget.value)}
      />
      <Text fw={500} size="sm">
        Ingredients
      </Text>
      {recipeIngredients.map((ingredient, idx) => (
        <IngredientRow
          key={ingredient.id}
          showAddIcon={idx === recipeIngredients.length - 1}
          addIngredient={addIngredient}
          deleteIngredient={() => deleteIngredient(ingredient.id)}
          ingredients={ingredients}
          currentIngredient={ingredient}
          updateCurrentIngredient={(updated) =>
            updateIngredient(ingredient.id, updated)
          }
        />
      ))}
      <Text fw={500} size="sm">
        Menus
      </Text>
      {menusToUpdate.map((menu, idx) => {
        return (
          <MenuRow
            key={menu.id}
            showAddIcon={idx === menusToUpdate.length - 1}
            deleteMenu={() => deleteMenu(idx)}
            currentMenu={menu}
            addMenu={addMenu}
            menus={menus}
            updateMenu={(updated) => updateMenu(idx, updated)}
            recipeId={recipeId}
          />
        );
      })}
      <Button mt="md" onClick={handleSave}>
        Save
      </Button>
    </Modal>
  );
};
