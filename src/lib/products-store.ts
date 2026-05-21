import { useEffect, useState } from "react";

export type ProductCourseItem = { kind: "course"; id: string; courseId: string };
export type ProductGroupItem = { kind: "group"; id: string; title: string; courseIds: string[] };
export type ProductItem = ProductCourseItem | ProductGroupItem;

export type Product = {
  id: string;
  title: string;
  description: string;
  image?: string;
  courseIds: string[];
  prerequisiteId: string | null;
  createdAt: number;
  published: boolean;
  items?: ProductItem[];
  optionalIds?: string[];
  accessibility?: "linear" | "free";
  pricing?: ProductPricing;
};

export type InstallmentPlan = { id: string; months: number };
export type ProductPricing = {
  upfront?: { enabled: boolean; totalPrice: number; discountPct: number };
  installment?: {
    enabled: boolean;
    deposit: number;
    fullPrice: number;
    plans: InstallmentPlan[];
  };
};

const STORAGE_KEY = "metana:products";

const seedProducts: Product[] = [
  {
    id: "seed-web3-track",
    title: "Web3 Career Track",
    description:
      "End-to-end path from full stack fundamentals to shipping audited Solidity contracts on EVM chains.",
    courseIds: ["fullstack", "solidity"],
    prerequisiteId: null,
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    published: true,
    accessibility: "linear",
    items: [
      { kind: "course", id: "c-fs", courseId: "fullstack" },
      { kind: "course", id: "c-sol", courseId: "solidity" },
    ],
    optionalIds: [],
  },
  {
    id: "seed-ai-builder",
    title: "AI Builder Pack",
    description:
      "Master Rust systems programming and ship production LLM apps, RAG pipelines and agentic systems.",
    courseIds: ["rust", "ai-engineering"],
    prerequisiteId: null,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    published: true,
    accessibility: "free",
    items: [
      {
        kind: "group",
        id: "g-foundations",
        title: "Foundations",
        courseIds: ["rust", "ai-engineering"],
      },
    ],
    optionalIds: ["ai-engineering"],
  },
  {
    id: "seed-protocol-engineer",
    title: "Protocol Engineer Bundle",
    description:
      "Deep-dive into Solidity, zero knowledge proving systems and the data tooling protocol teams rely on.",
    courseIds: ["solidity", "zk", "data"],
    prerequisiteId: null,
    image: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&q=80",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    published: true,
    accessibility: "linear",
    items: [
      {
        kind: "group",
        id: "g-core",
        title: "Core protocol",
        courseIds: ["solidity", "zk"],
      },
      { kind: "course", id: "c-data", courseId: "data" },
    ],
    optionalIds: ["data"],
  },
];

function read(): Product[] {
  if (typeof window === "undefined") return seedProducts;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as Product[]) : [];
    const ids = new Set(stored.map((p) => p.id));
    const merged = [...stored, ...seedProducts.filter((p) => !ids.has(p.id))];
    return merged;
  } catch {
    return seedProducts;
  }
}

function write(list: Product[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("metana:products-changed"));
}

export function addProduct(p: Omit<Product, "id" | "createdAt">): Product {
  const product: Product = {
    ...p,
    id: `prod-${Date.now().toString(36)}`,
    createdAt: Date.now(),
  };
  const seedIds = new Set(seedProducts.map((s) => s.id));
  const stored = read().filter((x) => !seedIds.has(x.id));
  stored.unshift(product);
  write(stored);
  return product;
}

export function getProduct(id: string): Product | undefined {
  return read().find((p) => p.id === id);
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => read());
  useEffect(() => {
    const sync = () => setProducts(read());
    sync();
    window.addEventListener("metana:products-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("metana:products-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return products;
}
