import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/types";

type Props = {
  products: Product[];
  isLoading: boolean;
  submittingProductId: string | null;
  onBack: () => void;
  onSelect: (product: Product) => Promise<void>;
};

function formatPrice(amount: number, currency: string, interval: string) {
  const value = new Intl.NumberFormat("fr-BE", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
  return `${value} / ${interval}`;
}

export function ProductsStep({ products, isLoading, submittingProductId, onBack, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Choose your plan</h2>
        <p className="mt-1 text-sm text-[#70758d]">Select a product and continue to Stripe checkout.</p>
      </div>

      {isLoading ? <p className="text-sm text-[#70758d]">Loading products...</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        {products.map((product) => (
          Array.isArray(product.features) ? (
          <article
            key={product.id}
            className={`rounded-2xl border p-4 shadow-sm ${product.is_highlighted ? "border-brand-500 bg-brand-500/5" : "border-[#e7eaf5] bg-white/80"}`}
          >
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="mt-1 text-sm text-[#70758d]">{product.description ?? "Built for event teams."}</p>
            <p className="mt-3 text-xl font-bold">{formatPrice(product.price_amount, product.price_currency, product.billing_interval)}</p>
            <ul className="mt-3 space-y-1 text-sm text-[#3a3f56]">
              {product.features.slice(0, 3).map((feature, index) => (
                <li key={`${product.id}-${index}`}>• {feature}</li>
              ))}
            </ul>
            <Button
              className="mt-4 w-full"
              disabled={Boolean(submittingProductId)}
              onClick={() => void onSelect(product)}
            >
              {submittingProductId === product.id ? "Redirecting..." : "Subscribe"}
            </Button>
          </article>
          ) : null
        ))}
      </div>

      <Button type="button" variant="ghost" onClick={onBack}>
        Back
      </Button>
    </div>
  );
}
