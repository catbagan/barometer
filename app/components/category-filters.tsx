import { LinksFunction } from "@remix-run/node";
import stylesUrl from "./category-filters.css?url";

interface CategoryFiltersProps {
  categories: string[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export function CategoryFilters({
  categories,
  selectedCategories,
  onToggleCategory,
}: CategoryFiltersProps) {
  return (
    <div className="controls">
      <div className="category-filters">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-pill category-${category} ${
              selectedCategories.includes(category) ? "active" : "inactive"
            }`}
            onClick={() => onToggleCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
