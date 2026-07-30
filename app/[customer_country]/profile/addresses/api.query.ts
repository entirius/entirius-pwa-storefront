import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import {
  API_USER_ADDRESSES_ROUTE,
  API_USER_ADDRESSES_DEFAULTS_ROUTE,
} from "@/API/api.routes";

export type CustomerAddress = {
  address_id: string;
  firstname: string;
  lastname: string;
  street: string;
  city: string;
  postcode: string;
  telephone: string;
  dialling_code: string;
  country_code: string;
  is_company: boolean;
  company: string | null;
  tax_id: string | null;
};

export type AddressDefaults = {
  billing_address: string | null;
  shipping_address: string | null;
};

const api = () => create_api(make_client_access());

// GET returns a map { address_id → CustomerAddress }; flatten to an array.
export const addresses_query = () => ({
  queryKey: ["addresses"] as const,
  queryFn: async (): Promise<CustomerAddress[]> => {
    const [error, data] = await api().FETCH_METHOD<{
      data: Record<string, CustomerAddress>;
    }>(API_USER_ADDRESSES_ROUTE, { method: "GET" });
    if (error) throw new Error("Failed to load addresses");
    return Object.values(data?.data ?? {});
  },
});

export const defaults_query = () => ({
  queryKey: ["address-defaults"] as const,
  queryFn: async (): Promise<AddressDefaults> => {
    const [error, data] = await api().FETCH_METHOD<{ data: AddressDefaults }>(
      API_USER_ADDRESSES_DEFAULTS_ROUTE,
      { method: "GET" },
    );
    if (error) throw new Error("Failed to load default addresses");
    return data?.data ?? { billing_address: null, shipping_address: null };
  },
});

export async function add_address(body: unknown): Promise<void> {
  const [error] = await api().FETCH_METHOD(API_USER_ADDRESSES_ROUTE, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (error) throw new Error("Failed to add address");
}

// Update requires the full address body (backend rejects partials).
export async function update_address(id: string, body: unknown): Promise<void> {
  const [error] = await api().FETCH_METHOD(API_USER_ADDRESSES_ROUTE, {
    method: "PATCH",
    querys: { id },
    body: JSON.stringify(body),
  });
  if (error) throw new Error("Failed to update address");
}

export async function remove_address(id: string): Promise<void> {
  const [error] = await api().FETCH_METHOD(API_USER_ADDRESSES_ROUTE, {
    method: "DELETE",
    querys: { id },
  });
  if (error) throw new Error("Failed to delete address");
}

export async function set_defaults(body: {
  billing_address?: string | null;
  shipping_address?: string | null;
}): Promise<void> {
  const [error] = await api().FETCH_METHOD(API_USER_ADDRESSES_DEFAULTS_ROUTE, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (error) throw new Error("Failed to set default address");
}
