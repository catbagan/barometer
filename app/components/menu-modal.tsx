import {
  Button,
  Flex,
  Modal,
  NumberInput,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { Menu, MenuRecipe, Recipe } from "~/types/index.type";

export interface MenuModalProps {
  opened: boolean;
  onClose: () => void;
  recipes: Recipe[];
  menuId: string;
  onSave: (menu: Menu) => Promise<void>;
  userId: string;
}

export const MenuModal = ({
  opened,
  onClose,
  recipes,
  menuId,
  onSave,
  userId,
}: MenuModalProps) => {
  const [menuName, setMenuName] = useState("");
  const [menuRecipes, setMenuRecipes] = useState<MenuRecipe[]>([
    {
      recipeId: "",
      price: 0,
    },
  ]);

  const handleClose = () => {
    setMenuName("");
    setMenuRecipes([{ recipeId: "", price: 0 }]);
    onClose();
  };

  const handleSave = async () => {
    const newMenu: Menu = {
      id: menuId,
      name: menuName,
      recipes: menuRecipes.filter((recipe) => recipe.recipeId !== ""),
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await onSave(newMenu);
    handleClose();
  };

  const addRecipe = () => {
    setMenuRecipes([...menuRecipes, { recipeId: "", price: 0 }]);
  };

  const removeRecipe = (index: number) => {
    setMenuRecipes(menuRecipes.filter((_, idx) => idx !== index));
  };

  const updateRecipe = (index: number, recipeId: string) => {
    setMenuRecipes(
      menuRecipes.map((recipe, idx) =>
        idx === index ? { ...recipe, recipeId } : recipe
      )
    );
  };

  const updatePrice = (index: number, price: number) => {
    setMenuRecipes(
      menuRecipes.map((recipe, idx) =>
        idx === index ? { ...recipe, price } : recipe
      )
    );
  };

  return (
    <Modal
      size="lg"
      opened={opened}
      onClose={handleClose}
      title="Add new menu"
      styles={{ title: { fontSize: "24px" } }}
      centered
    >
      <TextInput
        label="Menu name"
        placeholder="Menu name"
        required
        mb="md"
        value={menuName}
        onChange={(event) => setMenuName(event.currentTarget.value)}
      />

      <Text fw={500} size="sm" mb="xs">
        Recipes
      </Text>

      {menuRecipes.map((menuRecipe, idx) => (
        <Flex key={idx} gap="sm" align="center" mb="sm">
          <Select
            style={{ flex: 2 }}
            placeholder="Select recipe"
            data={recipes
              .filter(
                (recipe) =>
                  !menuRecipes.some(
                    (mr) =>
                      mr.recipeId === recipe.id &&
                      menuRecipes.indexOf(mr) !== idx
                  )
              )
              .map((recipe) => ({
                value: recipe.id,
                label: recipe.name,
              }))}
            value={menuRecipe.recipeId}
            onChange={(value) => value && updateRecipe(idx, value)}
          />
          <NumberInput
            style={{ flex: 1 }}
            placeholder="Price"
            min={0}
            value={menuRecipe.price}
            onChange={(val) =>
              updatePrice(idx, typeof val === "number" ? val : 0)
            }
          />
          <Button
            variant="light"
            color={idx === menuRecipes.length - 1 ? "blue" : "red"}
            onClick={() => {
              idx === menuRecipes.length - 1 ? addRecipe() : removeRecipe(idx);
            }}
          >
            {idx === menuRecipes.length - 1 ? (
              <IconPlus stroke={1.5} />
            ) : (
              <IconTrash stroke={1.5} />
            )}
          </Button>
        </Flex>
      ))}

      <Button mt="xl" onClick={handleSave}>
        Save
      </Button>
    </Modal>
  );
};
