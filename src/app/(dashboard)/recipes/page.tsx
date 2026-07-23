import Link from "next/link";
import { ChefHat, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

// Placeholder for the recipe browser (PRD § Nutrition: recipes, meal plans,
// meal-prep mode). Stubbed for now so the nav entry resolves; full browsing
// lands in a later session.
export default function RecipesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Recipes</h1>
        <p className="mt-1 text-muted-foreground">
          Browse high-protein, budget, and meal-prep recipes.
        </p>
      </div>

      <Card>
        <div className="flex flex-col items-start gap-3 py-6">
          <Icon icon={ChefHat} className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">Recipe browsing is coming soon</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;re building a searchable recipe library with macros, meal
              plans, and shopping lists. In the meantime, you can log meals and
              track your macros in Nutrition.
            </p>
          </div>
          <Link
            href="/nutrition"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Go to Nutrition
            <Icon icon={ArrowRight} size="sm" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
