// Base API client — automatically attaches JWT token to every request

const BASE_URL = 'http://localhost:3000/api';

type RequestOptions = RequestInit & { skipAuth?: boolean };

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = localStorage.getItem('itam_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    // Throw the server's error message so callers can display it
    throw new Error(data.message || 'Something went wrong.');
  }

  return data as T;
}

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  login: (user_name: string, password: string) =>
    request<{ token: string; employee: Employee }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ user_name, password }),
      skipAuth: true,
    }),

  me: () => request<Employee>('/auth/me'),
};

// ── Assets ────────────────────────────────────────────────
export const assetsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Asset[]>(`/assets${query}`);
  },
  getOne: (id: number) => request<Asset>(`/assets/${id}`),
  getStats: () => request<AssetStats>('/assets/stats'),
  getHistory: (id: number) => request<AssetMovement[]>(`/assets/${id}/history`),
  create: (body: Partial<Asset>) => request<Asset>('/assets', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<Asset>) => request<Asset>(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/assets/${id}`, { method: 'DELETE' }),
};

// ── Movements ─────────────────────────────────────────────
export const movementsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<AssetMovement[]>(`/movements${query}`);
  },
  getOne: (id: number) => request<AssetMovement>(`/movements/${id}`),
  createReception: (body: object) => request<AssetMovement>('/movements/reception', { method: 'POST', body: JSON.stringify(body) }),
  createAssignment: (body: object) => request<AssetMovement>('/movements/assignment', { method: 'POST', body: JSON.stringify(body) }),
  createTransfer: (body: object) => request<AssetMovement>('/movements/transfer', { method: 'POST', body: JSON.stringify(body) }),
  createReturn: (body: object) => request<AssetMovement>('/movements/return', { method: 'POST', body: JSON.stringify(body) }),
  approve: (id: number) => request<AssetMovement>(`/movements/${id}/approve`, { method: 'PATCH' }),
  reject: (id: number) => request<AssetMovement>(`/movements/${id}/reject`, { method: 'PATCH' }),
};

// ── Employees ─────────────────────────────────────────────
export const employeesApi = {
  getAll: () => request<Employee[]>('/employees'),
  getOne: (id: number) => request<Employee>(`/employees/${id}`),
};

// ── Departments ───────────────────────────────────────────
export const departmentsApi = {
  getAll: () => request<Department[]>('/departments'),
};

// ── Suppliers ─────────────────────────────────────────────
export const suppliersApi = {
  getAll: () => request<Supplier[]>('/suppliers'),
};

// ── Locations ─────────────────────────────────────────────
export const locationsApi = {
  getAll: (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return request<Location[]>(`/locations${query}`);
  },
};

// ── Asset Models ──────────────────────────────────────────
export const assetModelsApi = {
  getAll: () => request<AssetModel[]>('/asset-models'),
};

// ── Shared types ──────────────────────────────────────────
export interface Employee {
  id: number;
  user_name: string;
  full_name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Employee';
  actif: boolean;
  department_id: number | null;
}

export interface Asset {
  id: number;
  tag: string;
  partNum: string;
  etat: 'active' | 'maintenance' | 'warning' | 'critical' | 'inactive';
  createdAt: string;
  modele: { nom: string; marque: string; categorie: string };
}

export interface AssetStats {
  total: number;
  available: number;
  assigned: number;
  in_maintenance: number;
  retired: number;
}

export interface AssetMovement {
  id: number;
  date: string;
  status: 'Draft' | 'Approved' | 'Returned' | 'Rejected';
  type: 'Reception' | 'Assignment' | 'Transfer' | 'Return';
  asset_id: number;
  performed_by: number;
  performed_by_name: string;
}

export interface Department {
  id: number;
  code: string;
  libelle: string;
}

export interface Supplier {
  id: number;
  name: string;
  code: string;
  tel?: string;
  contact?: string;
}

export interface Location {
  id: number;
  code: string;
  label: string;
  region?: string;
  site?: string;
  type?: string;
}

export interface AssetModel {
  id: number;
  name: string;
  code: string;
  brand?: string;
  category?: string;
  part_number?: string;
}
