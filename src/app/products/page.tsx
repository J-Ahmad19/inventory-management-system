import { ProductsClient } from "@/components/products/products-client";

export const metadata = {
  title: "Products Management | StockFlow",
  description: "Manage products and SKU",
};

export default function ProductsPage() {
  return <ProductsClient />;
}
