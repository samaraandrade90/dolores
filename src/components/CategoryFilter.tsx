import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Category } from "../types";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategorySelect,
}: CategoryFilterProps) {
  return (
    <div className="w-fit">
      <Select
        value={selectedCategoryId || "all"}
        onValueChange={(value) =>
          onCategorySelect(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="h-10 w-auto min-w-[100px] text-sm border-border/50 sm:h-8">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-sm">
            <span>Todos</span>
          </SelectItem>
          {categories.map((category) => (
            <SelectItem
              key={category.id}
              value={category.id}
              className="text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span>{category.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}