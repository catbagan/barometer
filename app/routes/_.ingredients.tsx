import { LoaderFunction, redirect } from "@remix-run/node";
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
import { fromIngredientModel, IngredientModel } from "~/db/ingredient.server";
import { Ingredient, Size, IngredientResponse } from "~/types/index.type";
import React from "react";
import { isLoggedIn } from "~/services/auth.service";
import { DANIEL_USER_ID } from "~/shared/const";
import mongoose from "mongoose";

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
}

// Memoize the header component
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

// Pre-process ingredients to include best value size for faster sorting
const processIngredients = (ingredients: Ingredient[]) => {
  return ingredients.map((ingredient) => {
    const bestValue = ingredient.sizes.reduce(
      (prev, curr) => (curr.pricePerOz < prev.pricePerOz ? curr : prev),
      ingredient.sizes[0]
    );

    return {
      ...ingredient,
      bestValue,
    };
  });
};

// Optimized filter function
const filterData = (data: Ingredient[], search: string) => {
  const query = search.toLowerCase().trim();
  if (!query) return data;

  return data.filter(
    (item) =>
      item.brand.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
  );
};

// Optimized sort function using pre-calculated best value
const sortData = (
  data: Array<Ingredient & { bestValue: Size }>,
  {
    sortBy,
    reversed,
    search,
  }: { sortBy: string | null; reversed: boolean; search: string }
) => {
  const filtered = filterData(data, search) as Array<
    Ingredient & { bestValue: Size }
  >;

  if (!sortBy) return filtered;

  return filtered.sort((a, b) => {
    if (reversed) [a, b] = [b, a];

    switch (sortBy) {
      case "brand":
        return a.brand.localeCompare(b.brand);
      case "category":
        return a.category.localeCompare(b.category);
      case "size":
        return a.bestValue.sizeInMl - b.bestValue.sizeInMl;
      case "totalCost":
        return a.bestValue.salePrice - b.bestValue.salePrice;
      case "unitCost":
        return a.bestValue.pricePerOz - b.bestValue.pricePerOz;
      default:
        return 0;
    }
  });
};

// Memoized row component
const IngredientRow = React.memo(
  ({ ingredient }: { ingredient: Ingredient & { bestValue: Size } }) => (
    <Tooltip
      multiline
      style={{ width: 500 }}
      label={JSON.stringify(ingredient)}
      key={ingredient.id}
    >
      <Table.Tr>
        <Table.Td>{ingredient.brand}</Table.Td>
        <Table.Td>{ingredient.category}</Table.Td>
        <Table.Td>{`${ingredient.bestValue.sizeInMl.toFixed(0)} ml`}</Table.Td>
        <Table.Td>{`$${ingredient.bestValue.salePrice.toFixed(2)}`}</Table.Td>
        <Table.Td>{`$${ingredient.bestValue.pricePerOz.toFixed(
          2
        )}/oz`}</Table.Td>
      </Table.Tr>
    </Tooltip>
  )
);

export const loader: LoaderFunction = async ({
  request,
}): Promise<IngredientResponse> => {
  const loginResult = await isLoggedIn(request);
  if (!loginResult.isLoggedIn || loginResult.userId == null) {
    throw redirect("/auth/login");
  }

  try {
    await connectDB();
    const ingredients = (
      await IngredientModel.find({
        $or: [
          { createdBy: new mongoose.Types.ObjectId(loginResult.userId) },
          { createdBy: new mongoose.Types.ObjectId(DANIEL_USER_ID) },
        ],
      })
    ).map((doc) => {
      const ingredient = doc.toObject();
      return fromIngredientModel(ingredient);
    });
    return { ingredients };
  } catch (error) {
    console.error("Error:", error);
    return { ingredients: [] };
  }
};

export default function Ingredients() {
  const { revalidate } = useRevalidator();
  const { ingredients } = useLoaderData<IngredientResponse>();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  // Pre-process ingredients once on load
  const processedIngredients = useMemo(
    () => processIngredients(ingredients),
    [ingredients]
  );

  // Memoize sorted data
  const sortedData = useMemo(
    () =>
      sortData(processedIngredients, {
        sortBy,
        reversed: reverseSortDirection,
        search,
      }),
    [processedIngredients, sortBy, reverseSortDirection, search]
  );

  // Memoize sort handler
  const setSorting = useCallback((field: string) => {
    setSortBy((sortBy) => {
      const reversed = field === sortBy;
      setReverseSortDirection(reversed);
      return field;
    });
  }, []);

  // Memoize search handler
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(event.currentTarget.value);
    },
    []
  );

  return (
    <>
      <ScrollArea m="md">
        <Flex gap="sm">
          <TextInput
            flex="auto"
            placeholder="Search by brand or category"
            mb="md"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={search}
            onChange={handleSearchChange}
          />
          <Button size="sm">Add custom ingredient</Button>
        </Flex>
        <Table horizontalSpacing="md" verticalSpacing="xs" miw={700}>
          <Table.Thead>
            <Table.Tr>
              {[
                { key: "brand", label: "Ingredient Name" },
                { key: "category", label: "Category" },
                { key: "size", label: "Size" },
                { key: "totalCost", label: "Total Cost" },
                { key: "unitCost", label: "Unit Cost" },
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
              sortedData.map((ingredient) => (
                <IngredientRow key={ingredient.id} ingredient={ingredient} />
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={5}>
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
