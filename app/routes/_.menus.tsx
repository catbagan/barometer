import { LoaderFunction, redirect } from "@remix-run/node";
import { useDisclosure } from "@mantine/hooks";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useState, useMemo, useCallback, memo } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
} from "@tabler/icons-react";
import {
  Button,
  ScrollArea,
  Table,
  Text,
  TextInput,
  UnstyledButton,
  Center,
  Group,
  Flex,
} from "@mantine/core";
import { connectDB } from "~/db/db.server";
import { fromMenuModel, MenuModel } from "~/db/menu.server";
import { Menu, Recipe } from "~/types/index.type";
import mongoose from "mongoose";
import { MenuModal } from "~/components/menu-modal";
import { fromRecipeModel, RecipeModel } from "~/db/recipe.server";
import { getSession } from "~/services/auth.service";

interface MenuResponse {
  menus: Menu[];
  recipes: Recipe[];
  userId: string;
}

interface ThProps {
  children: React.ReactNode;
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

const filterData = (data: Menu[], search: string) => {
  const query = search.toLowerCase().trim();
  if (!query) return data;
  return data.filter((item) => item.name.toLowerCase().includes(query));
};

const sortData = (
  data: Menu[],
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
      case "recipeCount":
        return a.recipes.length - b.recipes.length;
      default:
        return 0;
    }
  });
};

const MenuRow = memo(({ menu }: { menu: Menu }) => (
  <Table.Tr>
    <Table.Td>{menu.name}</Table.Td>
    <Table.Td>{menu.recipes.length}</Table.Td>
  </Table.Tr>
));
MenuRow.displayName = "MenuRow";

export const loader: LoaderFunction = async ({
  request,
}): Promise<MenuResponse> => {
  const session = await getSession(request);
  if (session == null) {
    throw redirect("/auth/login");
  }

  try {
    await connectDB();
    const menus = await MenuModel.find({
      $or: [{ createdBy: new mongoose.Types.ObjectId(session.userId) }],
    });
    const recipes = await RecipeModel.find({
      $or: [{ createdBy: new mongoose.Types.ObjectId(session.userId) }],
    });
    return {
      recipes: recipes.map((doc) => {
        const recipe = doc.toObject();
        return fromRecipeModel(recipe);
      }),
      menus: menus.map((doc) => {
        const menu = doc.toObject();
        return fromMenuModel(menu);
      }),
      userId: session.userId,
    };
  } catch (error) {
    console.error("Error:", error);
    return { menus: [], recipes: [], userId: "" };
  }
};

export default function Menus() {
  const { revalidate } = useRevalidator();
  const { menus, recipes, userId } = useLoaderData<MenuResponse>();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const sortedData = useMemo(
    () =>
      sortData(menus, {
        sortBy,
        reversed: reverseSortDirection,
        search,
      }),
    [menus, sortBy, reverseSortDirection, search]
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

  const [newMenuId, setNewMenuId] = useState<string>("");

  const [opened, { open, close }] = useDisclosure(false);

  const onSaveMenu = async (menu: Menu) => {
    try {
      const response = await fetch("/api/menus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(menu),
      });

      if (!response.ok) {
        throw new Error("Failed to save menu");
      }
      revalidate();
    } catch (error) {
      console.error("Error saving menu:", error);
    }
  };

  return (
    <>
      <MenuModal
        key={newMenuId}
        opened={opened}
        onClose={close}
        recipes={recipes}
        menuId={newMenuId}
        onSave={onSaveMenu}
        userId={userId}
      />
      <ScrollArea m="md">
        <Flex gap="sm">
          <TextInput
            flex="auto"
            placeholder="Search by menu name"
            mb="md"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={search}
            onChange={handleSearchChange}
          />
          <Button
            onClick={() => {
              setNewMenuId(new mongoose.Types.ObjectId().toHexString());
              open();
            }}
            size="sm"
          >
            Add new menu
          </Button>
        </Flex>
        <Table horizontalSpacing="md" verticalSpacing="xs" miw={700}>
          <Table.Thead>
            <Table.Tr>
              {[
                { key: "name", label: "Menu Name" },
                { key: "recipeCount", label: "Number of Recipes" },
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
              sortedData.map((menu) => <MenuRow key={menu.id} menu={menu} />)
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
