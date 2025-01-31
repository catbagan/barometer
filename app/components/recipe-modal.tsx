import {
  Button,
  Flex,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import {
  Ingredient,
  Menu,
  Recipe,
  RecipeIngredient,
  UnitEnum,
} from "~/types/index.type";

export interface RecipeModalProps {
  opened: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  menus: Menu[];
  recipeId: string;
  onSave: (recipe: Recipe, menus: Array<Menu>) => Promise<void>;
}

interface IngredientRowProps {
  showAddIcon: boolean;
  addIngredient: () => void;
  deleteIngredient: (ingredientId: string) => void;
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
  // Get available ingredient options
  const ingredientOptions = ingredients.map((ing) => ({
    value: ing.id,
    label: ing.name,
  }));

  const [isCustomQuantity, setIsCustomQuantity] = useState(false);

  const handleIngredientChange = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId);

    if (ingredient) {
      updateCurrentIngredient({
        ingredientId,
        amount: {
          unit: UnitEnum.oz,
          quantity: 0.75,
        },
      });
    }
  };

  const unitOptions = Object.values(UnitEnum).map((unit) => ({
    value: unit,
    label: unit,
  }));

  return (
    <Flex mb="sm" align="center" gap="sm">
      <Select
        style={{ width: "200px" }}
        placeholder="Ingredient"
        data={ingredientOptions}
        value={currentIngredient.ingredientId}
        onChange={(val) => val && handleIngredientChange(val)}
        searchable
      />
      <SegmentedControl
        style={{ minWidth: "300px" }}
        data={[
          { label: "0.75oz", value: "0.75" },
          { label: "1.5oz", value: "1.5" },
          { label: "3oz", value: "3" },
          { label: "custom", value: "custom" },
        ]}
        value={
          currentIngredient.amount.quantity === 0.75
            ? "0.75"
            : currentIngredient.amount.quantity === 1.5
            ? "1.5"
            : currentIngredient.amount.quantity === 3
            ? "3"
            : "custom"
        }
        onChange={(value) => {
          if (value === "custom") {
            setIsCustomQuantity(true);
            updateCurrentIngredient({
              ...currentIngredient,
              amount: {
                unit: UnitEnum.oz,
                quantity: 0.0,
              },
            });
          } else {
            // Set fixed amount for preset values
            setIsCustomQuantity(false);
            updateCurrentIngredient({
              ...currentIngredient,
              amount: {
                unit: UnitEnum.oz,
                quantity: parseFloat(value),
              },
            });
          }
        }}
      />
      {/* Show unit and quantity inputs only when custom is selected */}
      {isCustomQuantity && (
        <>
          <Select
            style={{ width: "100px" }}
            placeholder="Unit"
            data={unitOptions}
            value={currentIngredient.amount.unit}
            onChange={(val) => {
              if (val) {
                updateCurrentIngredient({
                  ...currentIngredient,
                  amount: {
                    ...currentIngredient.amount,
                    unit: val as UnitEnum,
                  },
                });
              }
            }}
          />
          <NumberInput
            style={{ width: "100px" }}
            placeholder="Quantity"
            value={currentIngredient.amount.quantity}
            onChange={(val) => {
              updateCurrentIngredient({
                ...currentIngredient,
                amount: {
                  ...currentIngredient.amount,
                  quantity: typeof val === "number" ? val : 0,
                },
              });
            }}
          />
        </>
      )}
      <Button
        variant="light"
        onClick={() => {
          showAddIcon
            ? addIngredient()
            : deleteIngredient(currentIngredient.ingredientId);
        }}
      >
        {showAddIcon ? <IconPlus stroke={1.5} /> : <IconTrash stroke={1.5} />}
      </Button>
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
  const menuOptions = menus.map((menu) => ({
    value: menu.id,
    label: menu.name,
  }));

  const recipeInMenu = currentMenu.recipes.find((r) => r.recipeId === recipeId);

  return (
    <Flex mb="sm" align="center" gap="sm">
      <Select
        style={{ width: "200px" }}
        placeholder="Menu"
        data={menuOptions}
        value={currentMenu.id}
        onChange={(value) => {
          if (value) {
            const existingMenu = menus.find((m) => m.id === value);
            if (existingMenu) {
              const updatedMenu = {
                ...existingMenu,
                recipes: existingMenu.recipes.some(
                  (r) => r.recipeId === recipeId
                )
                  ? existingMenu.recipes
                  : [...existingMenu.recipes, { recipeId, price: 0 }],
                updatedAt: new Date().toISOString(),
              };
              updateMenu(updatedMenu);
            }
          }
        }}
      />
      <NumberInput
        style={{ width: "100px" }}
        placeholder="Price"
        value={recipeInMenu?.price ?? 0}
        onChange={(val) => {
          updateMenu({
            ...currentMenu,
            recipes: currentMenu.recipes.map((recipe) =>
              recipe.recipeId === recipeId
                ? { ...recipe, price: typeof val === "number" ? val : 0 }
                : recipe
            ),
          });
        }}
      />
      <Button
        variant="light"
        onClick={() => {
          showAddIcon ? addMenu() : deleteMenu(currentMenu.id);
        }}
      >
        {showAddIcon ? <IconPlus stroke={1.5} /> : <IconTrash stroke={1.5} />}
      </Button>
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
      ingredientId: "",
      amount: {
        unit: UnitEnum.oz,
        quantity: 0.75,
      },
    },
  ]);

  const [menusToUpdate, setMenusToUpdate] = useState<Menu[]>([
    {
      id: "",
      name: "",
      recipes: [{ recipeId, price: 0 }],
      createdBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const addIngredient = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      {
        ingredientId: "",
        amount: {
          unit: UnitEnum.oz,
          quantity: 0.75,
        },
      },
    ]);
  };

  const deleteIngredient = (ingredientId: string) => {
    setRecipeIngredients(
      recipeIngredients.filter((ing) => ing.ingredientId !== ingredientId)
    );
  };

  const updateIngredient = (
    index: number,
    updatedIngredient: RecipeIngredient
  ) => {
    setRecipeIngredients(
      recipeIngredients.map((ing, idx) =>
        idx === index ? updatedIngredient : ing
      )
    );
  };

  const addMenu = () => {
    const newMenu: Menu = {
      id: "",
      name: "",
      recipes: [{ recipeId, price: 0 }],
      createdBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMenusToUpdate([...menusToUpdate, newMenu]);
  };

  const deleteMenu = (menuId: string) => {
    setMenusToUpdate(menusToUpdate.filter((menu) => menu.id !== menuId));
  };

  const updateMenu = (updatedMenu: Menu) => {
    setMenusToUpdate(
      menusToUpdate.map((menu) =>
        menu.id === updatedMenu.id ? updatedMenu : menu
      )
    );
  };

  const handleSave = async () => {
    const newRecipe: Recipe = {
      id: recipeId,
      name: recipeName,
      ingredients: recipeIngredients,
      createdBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await onSave(newRecipe, menusToUpdate);
    onClose();
  };

  return (
    <Modal
      size="xl"
      opened={opened}
      onClose={onClose}
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
      <Text fw={500} size="sm" mb="xs">
        Ingredients
      </Text>
      {recipeIngredients.map((ingredient, idx) => (
        <IngredientRow
          key={idx}
          showAddIcon={idx === recipeIngredients.length - 1}
          addIngredient={addIngredient}
          deleteIngredient={deleteIngredient}
          currentIngredient={ingredient}
          updateCurrentIngredient={(updated) => updateIngredient(idx, updated)}
          ingredients={ingredients}
        />
      ))}
      <Text fw={500} size="sm" mt="md" mb="xs">
        Menus
      </Text>
      {menusToUpdate.map((menu, idx) => (
        <MenuRow
          key={idx}
          showAddIcon={idx === menusToUpdate.length - 1}
          addMenu={addMenu}
          deleteMenu={deleteMenu}
          currentMenu={menu}
          updateMenu={updateMenu}
          menus={menus}
          recipeId={recipeId}
        />
      ))}
      <Button mt="xl" onClick={handleSave}>
        Save
      </Button>
    </Modal>
  );
};
