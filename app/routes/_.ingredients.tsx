import { LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useState, useMemo, useCallback, memo, FormEvent } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
} from "@tabler/icons-react";
import {
  Box,
  Button,
  Card,
  Center,
  Flex,
  Group,
  Modal,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { connectDB } from "~/db/db.server";
import { getIngredientsForUser } from "~/db/ingredient.server";
import { Ingredient, ProductSize, Session } from "~/types/index.type";
import { getSession } from "~/services/auth.service";

interface ThProps {
  key: string;
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
  inlineSwitch?: React.ReactNode;
}

interface LoaderResponse {
  ingredients: Ingredient[];
  session: Session;
}

interface ProcessedIngredient extends Ingredient {
  bestValue?: {
    source: string;
    size: ProductSize;
  };
  totalOptions: number; // Total number of price options across all sources
}

// Memoize the header component
const Th = memo(
  ({ children, reversed, sorted, onSort, inlineSwitch }: ThProps) => {
    const Icon = sorted
      ? reversed
        ? IconChevronUp
        : IconChevronDown
      : IconSelector;
    return (
      <Table.Th>
        <UnstyledButton
          onClick={onSort}
          className="flex justify-between w-full"
        >
          <Group justify="space-between">
            <Text fw={500} fz="sm">
              {children}
            </Text>
            <Center>
              <Icon size={16} stroke={1.5} />
            </Center>
          </Group>
        </UnstyledButton>
        {inlineSwitch}
      </Table.Th>
    );
  }
);
Th.displayName = "Th";

// Pre-process ingredients to include best value size for faster sorting
const processIngredients = (
  ingredients: Ingredient[]
): ProcessedIngredient[] => {
  return ingredients.map((ingredient) => {
    if (ingredient.sources[0].name === "CUSTOM") {
      return {
        ...ingredient,
        totalOptions: 0,
      };
    }

    // Find the best value across all sources and sizes
    let bestValue = {
      source: ingredient.sources[0]?.name,
      size: ingredient.sources[0]?.sizes[0],
    };

    // Count total number of prices
    let totalOptions = 0;

    ingredient.sources.forEach((source) => {
      totalOptions += source.sizes.length;
      source.sizes.forEach((size) => {
        if (!bestValue.size || size.unitPrice < bestValue.size.unitPrice) {
          bestValue = {
            source: source.name,
            size,
          };
        }
      });
    });

    return {
      ...ingredient,
      bestValue,
      totalOptions,
    };
  });
};

// Optimized filter function
const filterData = (data: ProcessedIngredient[], search: string) => {
  const query = search.toLowerCase().trim();
  if (!query) return data;

  return data.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.alcoholType?.toLowerCase().includes(query)
  );
};

// Optimized sort function using pre-calculated best value
const sortData = (
  data: ProcessedIngredient[],
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
      case "category":
        return (a.alcoholType || "").localeCompare(b.alcoholType || "");
      case "source":
        return a.bestValue && b.bestValue
          ? a.bestValue.source.localeCompare(b.bestValue.source)
          : 1;
      case "size":
        return a.bestValue?.size && b.bestValue?.size
          ? a.bestValue.size.quantity - b.bestValue.size.quantity
          : 1;
      case "totalPrice":
        return a.bestValue?.size && b.bestValue?.size
          ? a.bestValue.size.price - b.bestValue.size.price
          : 1;
      case "unitPrice":
        return a.bestValue?.size && b.bestValue?.size
          ? a.bestValue.size.unitPrice - b.bestValue.size.unitPrice
          : 1;
      default:
        return 0;
    }
  });
};

// Memoized row component
const IngredientRow = memo(
  ({
    ingredient,
    onRowClick,
    isMetric,
  }: {
    ingredient: ProcessedIngredient;
    onRowClick: (ingredient: ProcessedIngredient) => void;
    isMetric: boolean;
  }) => (
    <Table.Tr
      onClick={() => onRowClick(ingredient)}
      style={{
        cursor: "pointer",
      }}
    >
      <Table.Td>{ingredient.name}</Table.Td>
      <Table.Td>{ingredient.alcoholType || "-"}</Table.Td>
      <Table.Td>
        {ingredient.bestValue
          ? `${ingredient.bestValue.size.quantity.toFixed(0)} ml`
          : "-"}
      </Table.Td>
      <Table.Td>
        {ingredient.bestValue
          ? `$${ingredient.bestValue.size.price.toFixed(2)}`
          : "-"}
      </Table.Td>
      <Table.Td>
        {ingredient.bestValue
          ? isMetric
            ? `$${ingredient.bestValue.size.unitPrice.toFixed(2)}/ml`
            : `$${(ingredient.bestValue.size.unitPrice / 0.033814).toFixed(
                2
              )}/oz`
          : "-"}
      </Table.Td>
      <Table.Td>{ingredient.totalOptions}</Table.Td>
    </Table.Tr>
  )
);
IngredientRow.displayName = "IngredientRow";

export const loader: LoaderFunction = async ({
  request,
}): Promise<LoaderResponse> => {
  const session = await getSession(request);
  if (session == null) {
    throw redirect("/auth/login");
  }

  try {
    await connectDB();
    const ingredients = await getIngredientsForUser(session.userId);
    return { ingredients, session };
  } catch (error) {
    console.error("Error:", error);
    return { ingredients: [], session };
  }
};

export default function Ingredients() {
  const { revalidate } = useRevalidator();
  const { ingredients, session } = useLoaderData<LoaderResponse>();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [selectedIngredient, setSelectedIngredient] =
    useState<ProcessedIngredient | null>(null);

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

  // Unit rate units
  const [isMetric, setIsMetric] = useState(false);

  const [isAddIngredientModalOpened, setIsAddIngredientModalOpened] =
    useState(false);

  return (
    <>
      <Title m="md">Ingredients</Title>
      <Box m="md">
        <Flex gap="sm">
          <TextInput
            flex="auto"
            placeholder="Search by name or category"
            mb="md"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={search}
            onChange={handleSearchChange}
          />
          <Button size="sm" onClick={() => setIsAddIngredientModalOpened(true)}>
            Add custom ingredient
          </Button>
        </Flex>
        <Text size="sm" color="gray" mb="md">
          If multiple prices are available, the lowest unit price is shown.
          Click on a row to view all sizes and prices.
        </Text>
      </Box>
      <Table.ScrollContainer h={"80vh"} minWidth={100}>
        <Table
          horizontalSpacing="sm"
          verticalSpacing="sm"
          highlightOnHover
          stickyHeader
        >
          <Table.Thead>
            <Table.Tr>
              {[
                { key: "name", label: "Name" },
                { key: "category", label: "Category" },
                { key: "size", label: "Size" },
                { key: "totalPrice", label: "Price" },
                { key: "unitPrice", label: "Unit Price" },
                { key: "pricesAvailable", label: "Prices Available" },
              ].map(({ key, label }) => (
                <Th
                  key={key}
                  sorted={sortBy === key}
                  reversed={reverseSortDirection}
                  onSort={() => setSorting(key)}
                  inlineSwitch={
                    key === "unitPrice" ? (
                      <Switch
                        checked={isMetric}
                        onLabel="ml"
                        offLabel="oz"
                        onChange={(event) =>
                          setIsMetric(event.currentTarget.checked)
                        }
                      />
                    ) : undefined
                  }
                >
                  {label}
                </Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedData.length > 0 ? (
              sortedData.map((ingredient) => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  onRowClick={setSelectedIngredient}
                  isMetric={isMetric}
                />
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text fw={500} ta="center">
                    Nothing found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Modal
        opened={selectedIngredient !== null}
        onClose={() => setSelectedIngredient(null)}
        title={
          <Text size="xl" fw={700}>
            {selectedIngredient?.name}
          </Text>
        }
        size="lg"
      >
        {selectedIngredient && (
          <>
            <Card shadow="sm" m="md" radius="md">
              {/* Ingredient Details Header */}
              <Stack gap="xs" mb="md">
                <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                  Ingredient Details
                </Text>
                <Group>
                  <Text size="sm" fw={500}>
                    Category:
                  </Text>
                  <Text size="sm">
                    {selectedIngredient.alcoholType || "N/A"}
                  </Text>
                </Group>
                {selectedIngredient.proof && (
                  <Group>
                    <Text size="sm" fw={500}>
                      Proof:
                    </Text>
                    <Text size="sm">{selectedIngredient.proof}</Text>
                  </Group>
                )}
              </Stack>
            </Card>
            <Card shadow="sm" m="md" radius="md">
              {/* Prices Table */}
              <Text c="dimmed" size="sm" tt="uppercase" fw={700} mb="xs">
                Sizes and Prices
              </Text>
              <Table
                striped
                highlightOnHover
                highlightOnHoverColor="var(--mantine-colors-gray-1)"
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Source</Table.Th>
                    <Table.Th>Size</Table.Th>
                    <Table.Th>Price</Table.Th>
                    <Table.Th>Unit Price</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(
                    selectedIngredient?.sources.flatMap((source) =>
                      source.sizes.map((size) => ({
                        sourceName: source.name,
                        ...size,
                      }))
                    ) || []
                  ).map((item, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>{item.sourceName}</Table.Td>
                      <Table.Td>
                        {item.quantity} {item.unit}
                      </Table.Td>
                      <Table.Td>${item.price.toFixed(2)}</Table.Td>
                      <Table.Td>
                        ${item.unitPrice.toFixed(2)}/{item.unit}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </>
        )}
      </Modal>
      <AddIngredientModal
        opened={isAddIngredientModalOpened}
        onClose={() => {
          setIsAddIngredientModalOpened(false);
          revalidate();
        }}
        userId={session.userId}
      />
    </>
  );
}

interface AddIngredientModalProps {
  opened: boolean;
  onClose: () => void;
  userId: string;
}

const AddIngredientModal = ({
  opened,
  onClose,
  userId,
}: AddIngredientModalProps) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          createdBy: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create ingredient");
      }

      onClose();
    } catch (error) {
      console.error("Error creating ingredient:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="xl" fw={700}>
          Add custom ingredient
        </Text>
      }
      closeOnClickOutside={!isSubmitting}
    >
      <Text color="gray" size="xs" mb="sm">
        Custom ingredient pricing is not yet supported!
      </Text>
      <form onSubmit={handleSubmit}>
        <TextInput
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ingredient name"
          mb="md"
          disabled={isSubmitting}
        />

        <Group justify="flex-end">
          <Button disabled={isSubmitting} variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={isSubmitting} disabled={isSubmitting} type="submit">
            Add Ingredient
          </Button>
        </Group>
      </form>
    </Modal>
  );
};
