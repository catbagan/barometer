import {
  Button,
  Card,
  Flex,
  Modal,
  MultiSelect,
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
  deleteIngredient: () => void;
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
  const ingredientOptions = ingredients.map((ing) => ({
    value: ing.id,
    label: ing.name,
  }));

  const [isCustomQuantity, setIsCustomQuantity] = useState(false);

  const handleIngredientOptionsChange = (selectedIds: string[]) => {
    updateCurrentIngredient({
      ...currentIngredient,
      optionIds: selectedIds,
    });
  };

  const unitOptions = Object.values(UnitEnum).map((unit) => ({
    value: unit,
    label: unit,
  }));

  return (
    <Flex mb="sm" align="center" gap="sm">
      <MultiSelect
        style={{ width: "300px" }}
        placeholder="Select ingredients"
        data={ingredientOptions}
        value={currentIngredient.optionIds}
        onChange={handleIngredientOptionsChange}
        searchable
      />
      <Flex direction={"column"}>
        <SegmentedControl
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
        {isCustomQuantity && (
          <Flex>
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
          </Flex>
        )}
      </Flex>
      <Button
        variant="light"
        onClick={() => {
          showAddIcon ? addIngredient() : deleteIngredient();
        }}
        color={showAddIcon ? "blue" : "red"}
      >
        {showAddIcon ? <IconPlus stroke={1.5} /> : <IconTrash stroke={1.5} />}
      </Button>
    </Flex>
  );
};

interface MenuRowProps {
  showAddIcon: boolean;
  addMenu: () => void;
  deleteMenu: () => void;
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
        prefix="$"
        value={recipeInMenu?.price || undefined}
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
          showAddIcon ? addMenu() : deleteMenu();
        }}
        color={showAddIcon ? "blue" : "red"}
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
      optionIds: [],
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
        optionIds: [],
        amount: {
          unit: UnitEnum.oz,
          quantity: 0.75,
        },
      },
    ]);
  };

  const deleteIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, idx) => idx !== index));
  };

  const updateIngredient = (index: number, updated: RecipeIngredient) => {
    setRecipeIngredients(
      recipeIngredients.map((ing, idx) => (idx === index ? updated : ing))
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
      title={
        <Text fw={700} size="xl">
          Add new recipe
        </Text>
      }
      centered
    >
      <Card shadow="md" m="md" radius="md">
        <Text fw={500} size="md">
          Recipe name
        </Text>
        <Text color="gray" size="xs" mb="xs">
          Make it a good one!
        </Text>
        <TextInput
          placeholder="Recipe name"
          required
          value={recipeName}
          onChange={(event) => setRecipeName(event.currentTarget.value)}
        />
      </Card>
      <Card shadow="md" m="md" radius="md">
        <Text fw={500} size="md">
          Ingredients
        </Text>
        <Text color="gray" size="xs" mb="xs">
          Specify options for the ingredient by selecting multiple ingredients
          per row
        </Text>
        {recipeIngredients.map((ingredient, idx) => (
          <IngredientRow
            key={idx}
            showAddIcon={idx === recipeIngredients.length - 1}
            addIngredient={addIngredient}
            deleteIngredient={() => deleteIngredient(idx)}
            currentIngredient={ingredient}
            updateCurrentIngredient={(updated) =>
              updateIngredient(idx, updated)
            }
            ingredients={ingredients}
          />
        ))}
      </Card>
      <Card shadow="md" m="md" radius="md">
        <Text fw={500} size="md">
          Menus
        </Text>
        <Text color="gray" size="xs" mb="xs">
          Add the recipe to menus and set the price
        </Text>
        {menusToUpdate.map((menu, idx) => (
          <MenuRow
            key={idx}
            showAddIcon={idx === menusToUpdate.length - 1}
            addMenu={() => {
              const newMenu: Menu = {
                id: "",
                name: "",
                recipes: [{ recipeId, price: 0 }],
                createdBy: "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setMenusToUpdate([...menusToUpdate, newMenu]);
            }}
            deleteMenu={() => {
              setMenusToUpdate(menusToUpdate.filter((_, i) => idx !== i));
            }}
            currentMenu={menu}
            updateMenu={(updatedMenu) => {
              setMenusToUpdate(
                menusToUpdate.map((m) =>
                  m.id === updatedMenu.id ? updatedMenu : m
                )
              );
            }}
            menus={menus}
            recipeId={recipeId}
          />
        ))}
      </Card>
      <Button mt="xl" onClick={handleSave}>
        Save
      </Button>
    </Modal>
  );
};
