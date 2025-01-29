import { Container, Title, Text, Grid, Paper, Group } from '@mantine/core';
import { IconGlass, IconCalculator, IconBook, IconBuildingStore } from '@tabler/icons-react';

export default function Index() {
  const features = [
    {
      title: "Vermont Liquor Database",
      description: "Access real-time prices and ingredients from the Vermont liquor store database through our automated scraping system.",
      icon: IconBuildingStore
    },
    {
      title: "Recipe Creation",
      description: "Craft and customize cocktail recipes using different brands of spirits, allowing for endless creativity and cost optimization.",
      icon: IconGlass
    },
    {
      title: "Menu Management",
      description: "Create and organize multiple menus featuring your signature cocktails, perfect for different occasions or venues.",
      icon: IconBook
    },
    {
      title: "Price Analysis Tools",
      description: "Calculate and optimize profit margins across different spirits, recipes, and complete menus to maximize your business potential.",
      icon: IconCalculator
    }
  ];

  return (
    <Container size="lg" my={40}>
      <Title mb="xl">Welcome to BarOMeter</Title>
      <Text color="dimmed" size="lg" mb={50}>
        Your complete toolkit for intelligent bar management and cocktail creation
      </Text>

      <Grid>
        {features.map((feature, index) => (
          <Grid.Col key={index} xs={12} sm={6}>
            <Paper shadow="md" p="xl" radius="md" withBorder>
              <Group>
                <feature.icon size={32} stroke={1.5} />
                <Title order={3}>{feature.title}</Title>
              </Group>
              <Text color="dimmed" mt="sm">
                {feature.description}
              </Text>
            </Paper>
          </Grid.Col>
        ))}
      </Grid>

      <Text mt={50} color="dimmed">
        Get started by exploring our features above
      </Text>
    </Container>
  );
}