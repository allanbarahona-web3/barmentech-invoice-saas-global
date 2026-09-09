import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, ProductInput } from "./product.schema";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} from "./product.storage";

const QUERY_KEYS = {
  products: ["products"] as const,
  product: (id: string) => ["products", id] as const,
  search: (query: string) => ["products", "search", query] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: listProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.product(id),
    queryFn: () => getProductById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.search(query),
    queryFn: () => searchProducts(query),
    enabled: query.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(input),
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.setQueryData(QUERY_KEYS.product(newProduct.id), newProduct);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) =>
      updateProduct(id, input),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.setQueryData(QUERY_KEYS.product(updatedProduct.id), updatedProduct);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.product(deletedId) });
    },
  });
}
