import Link from "next/link";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getFoodItems } from "@/lib/nutrition/queries";
import {
  deleteFoodItemFormAction,
  toggleFavoriteFoodItemFormAction,
} from "@/lib/nutrition/actions";
import { FoodItemForm } from "./food-item-form";

export default async function FoodsPage() {
  const foods = await getFoodItems();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My foods</h1>
          <p className="mt-1 text-muted-foreground">
            Your personal food library — favorites float to the top of every list.
          </p>
        </div>
        <Link href="/nutrition" className="text-sm text-primary hover:underline">
          Back to today
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Add a food" className="lg:col-span-1">
          <FoodItemForm />
        </Card>

        <Card
          title={`Library (${foods.length})`}
          className="lg:col-span-2"
        >
          {foods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Add a food you eat often and it&apos;ll be one tap to log.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {foods.map((food) => (
                <li
                  key={food.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {food.name}
                      {food.brand && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {food.brand}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Per {food.servingSize} {food.servingUnit}:{" "}
                      {Math.round(food.calories)} kcal · {Math.round(food.proteinG)}g protein
                      · {Math.round(food.carbsG)}g carbs · {Math.round(food.fatG)}g fat
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <form
                      action={toggleFavoriteFoodItemFormAction.bind(
                        null,
                        food.id,
                        !food.isFavorite
                      )}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        aria-label={
                          food.isFavorite ? "Remove from favorites" : "Add to favorites"
                        }
                        className={
                          food.isFavorite ? "text-amber-500" : "text-muted-foreground"
                        }
                      >
                        <Icon
                          icon={Star}
                          className={food.isFavorite ? "fill-current" : ""}
                        />
                      </Button>
                    </form>
                    <form action={deleteFoodItemFormAction.bind(null, food.id)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Deleting a food never changes past logs — logged entries keep the nutrition facts
        from the day you logged them.
      </p>
    </div>
  );
}
