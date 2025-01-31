import { LoaderFunction, redirect } from "@remix-run/node";
import { useDisclosure } from "@mantine/hooks";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useState, useMemo, useCallback, ReactNode, memo } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
} from "@tabler/icons-react";
import {
  Box,
  Button,
  Center,
  Flex,
  Group,
  List,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { connectDB } from "~/db/db.server";
import { fromRecipeDocument, RecipeModel } from "~/db/recipe.server";
import { Ingredient, Menu, Recipe, UnitEnum } from "~/types/index.type";
import { RecipeModal } from "~/components/recipe-modal";
import { getIngredientsForUser } from "~/db/ingredient.server";
import { fromMenuDocument, MenuModel } from "~/db/menu.server";
import mongoose from "mongoose";
import { getSession } from "~/services/auth.service";

interface RecipeResponse {
  recipes: Recipe[];
  ingredients: Ingredient[];
  menus: Menu[];
  userId: string;
}

interface ThProps {
  children: ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
}

const Th = memo(({ children, reversed, sorted, onSort }: ThProps) => {
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
Th.displayName = "Th";

const filterData = (data: Recipe[], search: string) => {
  const query = search.toLowerCase().trim();
  if (!query) return data;

  return data.filter((item) => item.name.toLowerCase().includes(query));
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
      default:
        return 0;
    }
  });
};

const formatAmount = (quantity: number, unit: UnitEnum) => {
  switch (quantity) {
    case 0.75:
      return "0.75oz";
    case 1.5:
      return "1.5oz";
    case 3:
      return "3oz";
    default:
      return `${quantity}${unit}`;
  }
};

const RecipeRow = memo(
  ({
    recipe,
    ingredients,
    onRowClick,
  }: {
    recipe: Recipe;
    ingredients: Ingredient[];
    onRowClick: (recipe: Recipe) => void;
  }) => (
    <Tooltip
      multiline
      style={{ width: 500 }}
      label={JSON.stringify(recipe)}
      key={recipe.id}
    >
      <Table.Tr
        style={{ cursor: "pointer" }}
        onClick={() => onRowClick(recipe)}
      >
        <Table.Td>{recipe.name}</Table.Td>
        <Table.Td>
          {recipe.ingredients
            .map((i) => {
              const ingredient = ingredients.find(
                (ing) => ing.id === i.ingredientId
              );
              return ingredient
                ? `${ingredient.name} (${formatAmount(
                    i.amount.quantity,
                    i.amount.unit
                  )})`
                : "";
            })
            .filter(Boolean)
            .join(", ")}
        </Table.Td>
      </Table.Tr>
    </Tooltip>
  )
);
RecipeRow.displayName = "RecipeRow";

export const loader: LoaderFunction = async ({
  request,
}): Promise<RecipeResponse> => {
  const session = await getSession(request);
  if (session == null) {
    throw redirect("/auth/login");
  }

  try {
    await connectDB();
    const recipes = await RecipeModel.find({
      $or: [{ createdBy: new mongoose.Types.ObjectId(session.userId) }],
    });

    await connectDB();
    const ingredients = await getIngredientsForUser(session.userId);
    const menus = await MenuModel.find({
      $or: [{ createdBy: new mongoose.Types.ObjectId(session.userId) }],
    });
    return {
      recipes: recipes.map((doc) => {
        const recipe = doc.toObject();
        return fromRecipeDocument(recipe);
      }),
      ingredients,
      menus: menus.map((doc) => {
        const menu = doc.toObject();
        return fromMenuDocument(menu);
      }),
      userId: session.userId,
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
      revalidate();
    } catch (error) {
      console.error("Error saving recipe:", error);
    }
  };

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailsOpened, { open: openDetails, close: closeDetails }] =
    useDisclosure(false);

  const handleRowClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    openDetails();
  };

  return (
    <>
      <RecipeModal
        key={newRecipeId}
        opened={opened}
        onClose={close}
        ingredients={ingredients}
        menus={menus}
        recipeId={newRecipeId}
        onSave={onSaveRecipe}
      />
      {selectedRecipe && (
        <RecipeDetails
          opened={detailsOpened}
          onClose={closeDetails}
          recipe={selectedRecipe}
          ingredients={ingredients}
        />
      )}
      <Title m="md">Recipes</Title>
      <Box m="md">
        <Flex gap="sm">
          <TextInput
            flex="auto"
            placeholder="Search by recipe name"
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
        <Text size="sm" color="gray" mb="md">
          Click on a row to view recipe details.
        </Text>
      </Box>
      <Table.ScrollContainer h={"80vh"} minWidth={100}>
        <Table horizontalSpacing="md" verticalSpacing="xs" miw={700}>
          <Table.Thead>
            <Table.Tr>
              <Th
                sorted={sortBy === "name"}
                reversed={reverseSortDirection}
                onSort={() => setSorting("name")}
              >
                Recipe Name
              </Th>
              <Th
                sorted={sortBy === "ingredients"}
                reversed={reverseSortDirection}
                onSort={() => setSorting("ingredients")}
              >
                Ingredients
              </Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedData.length > 0 ? (
              sortedData.map((recipe) => (
                <RecipeRow
                  key={recipe.id}
                  recipe={recipe}
                  ingredients={ingredients}
                  onRowClick={handleRowClick}
                />
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
      </Table.ScrollContainer>
    </>
  );
}

interface RecipeDetailsProps {
  opened: boolean;
  onClose: () => void;
  recipe: Recipe;
  ingredients: Ingredient[];
}

export const RecipeDetails = ({
  opened,
  onClose,
  recipe,
  ingredients,
}: RecipeDetailsProps) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Recipe Details"
      size="md"
      centered
    >
      <Stack>
        <Title order={2}>{recipe.name}</Title>

        <Group>
          <Text fw={500}>Ingredients:</Text>
          <List spacing="xs">
            {recipe.ingredients.map((ing, index) => {
              const ingredient = ingredients.find(
                (i) => i.id === ing.ingredientId
              );
              if (!ingredient) return null;

              return (
                <List.Item key={index}>
                  <Group>
                    <Text>{ingredient.name}</Text>
                    <Text c="dimmed">
                      {formatAmount(ing.amount.quantity, ing.amount.unit)}
                    </Text>
                  </Group>
                </List.Item>
              );
            })}
          </List>
        </Group>

        <Text size="sm" c="dimmed" mt="md">
          Created: {new Date(recipe.createdAt).toLocaleDateString()}
        </Text>
      </Stack>
    </Modal>
  );
};
