import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, "data.json");

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

async function readProducts(): Promise<Product[] | void> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const products: Product[] = JSON.parse(data);
    console.log("Product List:", products);
    return products;
  } catch (err) {
    console.error("Error reading file:", err);
  }
}

async function addProduct(newProduct: Omit<Product, "id">): Promise<void> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const products: Product[] = JSON.parse(data);

    const productWithId: Product = {
      id: products.length ? products[products.length - 1].id + 1 : 1,
      ...newProduct,
    };

    products.push(productWithId);

    await fs.writeFile(filePath, JSON.stringify(products, null, 2));
    console.log("Product added successfully!");
  } catch (err) {
    console.error("Error writing file:", err);
  }
}

async function updateProduct(id: number, updatedFields: Partial<Omit<Product, "id">>): Promise<void> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const products: Product[] = JSON.parse(data);

    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      console.log("Product not found!");
      return;
    }

    products[index] = { ...products[index], ...updatedFields };

    await fs.writeFile(filePath, JSON.stringify(products, null, 2));
    console.log("Product updated successfully!");
  } catch (err) {
    console.error("Error updating file:", err);
  }
}

async function deleteProduct(id: number): Promise<void> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    let products: Product[] = JSON.parse(data);

    const initialLength = products.length;
    products = products.filter((p) => p.id !== id);

    if (products.length === initialLength) {
      console.log("Product not found!");
      return;
    }

    await fs.writeFile(filePath, JSON.stringify(products, null, 2));
    console.log(`Product with ID ${id} deleted successfully!`);
  } catch (err) {
    console.error("Error deleting product:", err);
  }
}

(async () => {
  await readProducts();

  await addProduct({
    name: "Headphones",
    price: 2500,
    category: "Electronics",
  });

  await updateProduct(2, { price: 900 });

  await deleteProduct(1);

  await readProducts();
})();
