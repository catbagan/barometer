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
  UnstyledButton,
} from "@mantine/core";
import { connectDB } from "~/db/db.server";
import { fromMenuDocument, MenuModel } from "~/db/menu.server";
import { Menu, Recipe } from "~/types/index.type";
import mongoose from "mongoose";
import { MenuModal } from "~/components/menu-modal";
import { fromRecipeDocument, RecipeModel } from "~/db/recipe.server";
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
    const aRevenue = a.recipes.reduce((sum, r) => sum + r.price, 0);
    const bRevenue = b.recipes.reduce((sum, r) => sum + r.price, 0);

    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "recipeCount":
        return a.recipes.length - b.recipes.length;
      case "revenue":
        return aRevenue - bRevenue;
      default:
        return 0;
    }
  });
};

interface MenuRowProps {
  menu: Menu;
  onRowClick: (menu: Menu) => void;
  recipes: Recipe[];
}

const MenuRow = memo(({ menu, onRowClick, recipes }: MenuRowProps) => {
  const totalRevenue = menu.recipes.reduce(
    (sum, recipe) => sum + recipe.price,
    0
  );
  const recipeNames = menu.recipes
    .map(
      (menuRecipe) => recipes.find((r) => r.id === menuRecipe.recipeId)?.name
    )
    .filter(Boolean)
    .join(", ");

  return (
    <Table.Tr onClick={() => onRowClick(menu)} style={{ cursor: "pointer" }}>
      <Table.Td>{menu.name}</Table.Td>
      <Table.Td>{recipeNames}</Table.Td>
      <Table.Td>{menu.recipes.length}</Table.Td>
      <Table.Td>${totalRevenue.toFixed(2)}</Table.Td>
    </Table.Tr>
  );
});
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
      createdBy: new mongoose.Types.ObjectId(session.userId),
    });
    const recipes = await RecipeModel.find({
      createdBy: new mongoose.Types.ObjectId(session.userId),
    });
    return {
      recipes: recipes.map((doc) => fromRecipeDocument(doc.toObject())),
      menus: menus.map((doc) => fromMenuDocument(doc.toObject())),
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
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [detailsOpened, { open: openDetails, close: closeDetails }] =
    useDisclosure(false);

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

  const handleRowClick = (menu: Menu) => {
    setSelectedMenu(menu);
    openDetails();
  };

  return (
    <>
      <MenuModal
        key={newMenuId}
        opened={modalOpened}
        onClose={closeModal}
        recipes={recipes}
        menuId={newMenuId}
        onSave={onSaveMenu}
        userId={userId}
      />
      {selectedMenu && (
        <MenuDetails
          opened={detailsOpened}
          onClose={closeDetails}
          menu={selectedMenu}
          recipes={recipes}
        />
      )}
      <Title m="md">Menus</Title>
      <Box m="md">
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
              openModal();
            }}
            size="sm"
          >
            Add new menu
          </Button>
        </Flex>
        <Text size="sm" color="gray" mb="md">
          Click on a row to view menu details.
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
                Menu Name
              </Th>
              <Th sorted={false} reversed={false} onSort={() => {}}>
                Recipes
              </Th>
              <Th
                sorted={sortBy === "recipeCount"}
                reversed={reverseSortDirection}
                onSort={() => setSorting("recipeCount")}
              >
                Count
              </Th>
              <Th
                sorted={sortBy === "revenue"}
                reversed={reverseSortDirection}
                onSort={() => setSorting("revenue")}
              >
                Total Revenue
              </Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedData.length > 0 ? (
              sortedData.map((menu) => (
                <MenuRow
                  key={menu.id}
                  menu={menu}
                  recipes={recipes}
                  onRowClick={handleRowClick}
                />
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={4}>
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

interface MenuDetailsProps {
  opened: boolean;
  onClose: () => void;
  menu: Menu;
  recipes: Recipe[];
}

export const MenuDetails = ({
  opened,
  onClose,
  menu,
  recipes,
}: MenuDetailsProps) => {
  const totalRevenue = menu.recipes.reduce(
    (sum, menuRecipe) => sum + menuRecipe.price,
    0
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Menu Details"
      size="md"
      centered
    >
      <Stack>
        <Title order={2}>{menu.name}</Title>

        <Group>
          <Text fw={500}>Recipes:</Text>
          <List spacing="xs">
            {menu.recipes.map((menuRecipe, index) => {
              const recipe = recipes.find((r) => r.id === menuRecipe.recipeId);
              if (!recipe) return null;

              return (
                <List.Item key={index}>
                  <Group justify="space-between" w="100%">
                    <Text>{recipe.name}</Text>
                    <Text c="dimmed">${menuRecipe.price.toFixed(2)}</Text>
                  </Group>
                </List.Item>
              );
            })}
          </List>
        </Group>

        <Group mt="md">
          <Text fw={500}>Summary:</Text>
          <List>
            <List.Item>
              <Text>Total Items: {menu.recipes.length}</Text>
            </List.Item>
            <List.Item>
              <Text>Total Revenue: ${totalRevenue.toFixed(2)}</Text>
            </List.Item>
          </List>
        </Group>

        <Text size="sm" c="dimmed" mt="md">
          Created: {new Date(menu.createdAt).toLocaleDateString()}
        </Text>
      </Stack>
    </Modal>
  );
};
