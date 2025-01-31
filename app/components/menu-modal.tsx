import {
  Button,
  Flex,
  Modal,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import {
  Menu,
  MenuRecipe,
  Recipe,
} from "~/types/index.type";

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
  const [menuRecipes, setMenuRecipes] = useState<
    (MenuRecipe & { name: string })[]
  >([
    {
      name: "",
      recipe: "",
      price: 0,
    },
  ]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    const newMenu: Menu = {
      id: menuId,
      name: menuName,
      recipes: menuRecipes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    };
    await onSave(newMenu);
    onClose();
  };

  return (
    <Modal
      size="lg"
      overlayProps={{ blur: 2 }}
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
        mb="sm"
        value={menuName}
        onChange={(event) => setMenuName(event.currentTarget.value)}
      />
      <Text size="sm">Recipes</Text>
      {menuRecipes.map((menuRecipe, idx) => {
        return (
          <Flex key={idx} gap="sm" align="center" mb="sm">
            <Select
              data={recipes.map((recipe) => ({
                value: recipe.id,
                label: recipe.name,
              }))}
              placeholder="Select recipe"
              value={menuRecipe.recipe}
              onChange={(value) => {
                if (value) {
                  setMenuRecipes(
                    menuRecipes.map((recipe, index) =>
                      index === idx ? { ...recipe, id: value } : recipe
                    )
                  );
                }
              }}
            />

            <TextInput
              placeholder="Price"
              type="number"
              value={menuRecipe.price !== 0 ? menuRecipe.price : ""}
              onChange={(event) => {
                setMenuRecipes(
                  menuRecipes.map((recipe, index) =>
                    index === idx
                      ? {
                          ...recipe,
                          price: parseFloat(event.currentTarget.value),
                        }
                      : recipe
                  )
                );
              }}
            />
            <Button
              style={{ cursor: "pointer" }}
              onClick={() => {
                idx === menuRecipes.length - 1
                  ? setMenuRecipes([
                      ...menuRecipes,
                      { name: "", recipe: "", price: 0 },
                    ])
                  : setMenuRecipes(
                      menuRecipes.filter((_, index) => index !== idx)
                    );
              }}
            >
              {idx === menuRecipes.length - 1 ? (
                <IconPlus stroke={1.5} />
              ) : (
                <IconTrash stroke={1.5} />
              )}
            </Button>
          </Flex>
        );
      })}
      <Button mt="md" onClick={handleSave}>
        Save
      </Button>
    </Modal>
  );
};
