import { LoaderFunction, redirect } from "@remix-run/node";
import { useDisclosure } from "@mantine/hooks";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useState, useMemo, useCallback } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
} from "@tabler/icons-react";
import {
  Button,
  Modal,
  Center,
  Flex,
  Group,
  ScrollArea,
  Table,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { connectDB } from "~/db/db.server";
import { fromRecipeModel, RecipeModel } from "~/db/recipe.server";
import React from "react";
import { Ingredient, Menu, Recipe } from "~/types/index.type";
import { RecipeModal } from "~/components/recipe-modal";
import { fromIngredientModel, IngredientModel } from "~/db/ingredient.server";
import { fromMenuModel, MenuModel } from "~/db/menu.server";
import mongoose, { mongo } from "mongoose";
import { isLoggedIn } from "~/services/auth.service";
import { DANIEL_USER_ID } from "~/shared/const";

interface RecipeResponse {
  recipes: Recipe[];
  ingredients: Ingredient[];
  menus: Menu[];
  userId: string;
}

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
}

const Th = React.memo(({ children, reversed, sorted, onSort }: ThProps) => {
  const Icon = sorted
    ? reversed
      ? IconChevronUp
      : IconChevronDown
    : IconSelector;
  return (
    <Table.Th>
      <UnstyledButton onClick={onSort} className="flex justify-between w-full">
        <Group justify="space-between">
          <Text fw={500} fz="sm">
            {children}
          </Text>
          <Center>
            <Icon size={16} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
});

const filterData = (data: Recipe[], search: string) => {
  const query = search.toLowerCase().trim();
  if (!query) return data;

  return data.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.ingredients.some((ing) => ing.category.toLowerCase().includes(query))
  );
};

const sortData = (
  data: Recipe[],
  {
    sortBy,
    reversed,
    search,
  }: { sortBy: string | null; reversed: boolean; search: string }
) => {
  const filtered = filterData(data, search);

  if (!sortBy) return filtered;

  return filtered.sort((a, b) => {
    if (reversed) [a, b] = [b, a];

    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "categories":
        return a.ingredients
          .map((i) => i.category)
          .join(",")
          .localeCompare(b.ingredients.map((i) => i.category).join(","));
      default:
        return 0;
    }
  });
};

const RecipeRow = React.memo(({ recipe }: { recipe: Recipe }) => (
  <Tooltip
    multiline
    style={{ width: 500 }}
    label={JSON.stringify(recipe)}
    key={recipe.id}
  >
    <Table.Tr>
      <Table.Td>{recipe.name}</Table.Td>
      <Table.Td>
        {recipe.ingredients
          .map((i) => `${i.category} (${i.amount})`)
          .join(", ")}
      </Table.Td>
    </Table.Tr>
  </Tooltip>
));

export const loader: LoaderFunction = async ({
  request,
}): Promise<RecipeResponse> => {
  const loginResult = await isLoggedIn(request);
  if (!loginResult.isLoggedIn || loginResult.userId == null) {
    throw redirect("/auth/login");
  }

  try {
    await connectDB();
    const recipes = await RecipeModel.find({
      $or: [{ createdBy: new mongoose.Types.ObjectId(loginResult.userId) }],
    });
    const ingredients = await IngredientModel.find({
      $or: [
        { createdBy: new mongoose.Types.ObjectId(loginResult.userId) },
        { createdBy: new mongoose.Types.ObjectId(DANIEL_USER_ID) },
      ],
    });
    const menus = await MenuModel.find({
      $or: [{ createdBy: new mongoose.Types.ObjectId(loginResult.userId) }],
    });
    return {
      recipes: recipes.map((doc) => {
        const recipe = doc.toObject();
        return fromRecipeModel(recipe);
      }),
      ingredients: ingredients.map((doc) => {
        const ingredient = doc.toObject();
        return fromIngredientModel(ingredient);
      }),
      menus: menus.map((doc) => {
        const menu = doc.toObject();
        return fromMenuModel(menu);
      }),
      userId: loginResult.userId,
    };
  } catch (error) {
    console.error("Error:", error);
    return { recipes: [], ingredients: [], menus: [], userId: "" };
  }
};

export default function Recipes() {
  const { revalidate } = useRevalidator();
  const { recipes, ingredients, menus, userId } =
    useLoaderData<RecipeResponse>();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const sortedData = useMemo(
    () =>
      sortData(recipes, {
        sortBy,
        reversed: reverseSortDirection,
        search,
      }),
    [recipes, sortBy, reverseSortDirection, search]
  );

  const setSorting = useCallback((field: string) => {
    setSortBy((sortBy) => {
      const reversed = field === sortBy;
      setReverseSortDirection(reversed);
      return field;
    });
  }, []);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(event.currentTarget.value);
    },
    []
  );

  const [newRecipeId, setNewRecipeId] = useState<string>("");
  const [opened, { open, close }] = useDisclosure(false);

  const onSaveRecipe = async (recipe: Recipe, menus: Menu[]) => {
    recipe.createdBy = userId;
    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, recipe, menus }),
      });

      if (!response.ok) {
        throw new Error("Failed to save recipe");
      }

      const data = await response.json();
      revalidate()
    } catch (error) {
      console.error("Error saving recipe:", error);
    }
  };

  return (
    <>
      <RecipeModal
        key={newRecipeId}
        opened={opened}
        onClose={close}
        ingredients={ingredients}
        recipes={recipes}
        menus={menus}
        recipeId={newRecipeId}
        onSave={onSaveRecipe}
      />
      <ScrollArea m="md">
        <Flex gap="sm">
          <TextInput
            flex="auto"
            placeholder="Search by recipe name or ingredient category"
            mb="md"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={search}
            onChange={handleSearchChange}
          />
          <Button
            onClick={() => {
              setNewRecipeId(new mongoose.Types.ObjectId().toHexString());
              open();
            }}
            size="sm"
          >
            Add new recipe
          </Button>
        </Flex>
        <Table horizontalSpacing="md" verticalSpacing="xs" miw={700}>
          <Table.Thead>
            <Table.Tr>
              {[
                { key: "name", label: "Recipe Name" },
                { key: "categories", label: "Ingredients" },
              ].map(({ key, label }) => (
                <Th
                  key={key}
                  sorted={sortBy === key}
                  reversed={reverseSortDirection}
                  onSort={() => setSorting(key)}
                >
                  {label}
                </Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedData.length > 0 ? (
              sortedData.map((recipe) => (
                <RecipeRow key={recipe.id} recipe={recipe} />
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={2}>
                  <Text fw={500} ta="center">
                    Nothing found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
}
