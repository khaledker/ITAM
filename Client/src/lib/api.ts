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
    // If the token expired mid-session, clear it so the next page load forces re-login
    if (res.status === 401) {
      localStorage.removeItem('itam_token');
      localStorage.removeItem('itam_user');
    }
    // If there are detailed validation errors, append them to the message
    let errorMsg = data.message || 'Something went wrong.';
    if (data.errors && Array.isArray(data.errors)) {
      const details = data.errors.map((e: any) => e.message).join(' | ');
      errorMsg = `${errorMsg} ${details}`;
    }

    // Throw the server's error message so callers can display it
    throw new Error(errorMsg);
  }

  return data as T;
}

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  login: (user_name: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ user_name, password }),
      skipAuth: true,
    }),

  me: () => request<User>('/auth/me'),
};

// ── Users ─────────────────────────────────────────────────
export const usersApi = {
  getAll: () => request<User[]>('/users'),
  create: (body: Partial<User>) => request<User>('/users', { method: 'POST', body: JSON.stringify(body) }),
  updateRole: (id: number, role: 'Admin' | 'Manager' | 'User') => request<User>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  getPermissions: (id: number) => request<{ permissions: string[]; locationIds: number[] }>(`/users/${id}/permissions`),
  updatePermissions: (id: number, body: { permissions: string[]; locationIds: number[] }) =>
    request<{ permissions: string[]; locationIds: number[] }>(`/users/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
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
  downloadTicket: async (id: number) => {
    const token = localStorage.getItem('itam_token');
    const res = await fetch(`http://localhost:3000/api/movements/${id}/ticket`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to download ticket');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ticket-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  openTicket: async (id: number) => {
    const token = localStorage.getItem('itam_token');
    const res = await fetch(`http://localhost:3000/api/movements/${id}/ticket`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Failed to open ticket');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const preview = window.open(url, '_blank', 'noopener,noreferrer');
    if (!preview) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  }
};

// ── Employees ─────────────────────────────────────────────
export const employeesApi = {
  getAll: () => request<Employee[]>('/employees'),
  getOne: (id: number) => request<Employee>(`/employees/${id}`),
  getAssets: (id: number) => request<Asset[]>(`/employees/${id}/assets`),
  create: (body: Partial<Employee>) => request<Employee>('/employees', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<Employee>) => request<Employee>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/employees/${id}`, { method: 'DELETE' }),
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
  create: (body: Partial<AssetModel>) => request<AssetModel>('/asset-models', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Dashboard ─────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => request<DashboardSummary>('/dashboard/summary'),
};

// ── Telemetry ─────────────────────────────────────────────
export const telemetryApi = {
  getSummary: () => request<TelemetrySummary>('/telemetry/summary'),
  getLabels: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<DeviceHealthLabel[]>(`/telemetry/labels${query}`);
  },
  getLabelHistory: (assetTag: string) =>
    request<DeviceHealthLabel[]>(`/telemetry/labels/${assetTag}`),
};

// ── Shared types ──────────────────────────────────────────
export interface User {
  id: number;
  user_name: string;
  full_name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'User';
  status: 'pending' | 'active' | 'rejected';
  created_at?: string;
  permissions?: string[];
  locationIds?: number[];
  password?: string;
}

export interface Employee {
  id: number;
  full_name: string;
  email: string;
  department_id: number | null;
  department_name?: string | null;
  created_at?: string;
}

export interface Asset {
  id: number;
  tag: string;
  partNum: string;
  serial_number?: string;
  etat: 'Available' | 'Assigned' | 'inMaintenance' | 'retired';
  createdAt: string;
  modele: { nom: string; marque: string; categorie: string };
  employee?: { id: number; full_name: string } | null;
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
  asset_ids?: string;
  tag?: string;
  asset_count?: number;
  serial_numbers?: string;
  performed_by: number;
  performed_by_name?: string;     // joined from Employee
  purchase_order_number?: string | null;
  receipt_number?: string | null;
  supplier_id?: number | null;
  supplier_name?: string | null;
  destination_id?: number | null;
  reception_dest_name?: string | null;
  expected_return?: string | null;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  assignment_source_id?: number | null;
  assignment_source_name?: string | null;
  reference?: string | null;
  transfer_source_id?: number | null;
  transfer_source_name?: string | null;
  transfer_dest_id?: number | null;
  transfer_dest_name?: string | null;
  reason?: string | null;
  returned_to?: number | null;
  returned_to_name?: string | null;
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

export interface DashboardStats {
  total: number;
  available: number;
  assigned: number;
  in_maintenance: number;
}

export interface RecentMovement {
  id: number;
  date: string;
  status: string;
  asset_tag: string;
  asset_count: number;
  performed_by: string;
  type: 'Reception' | 'Assignment' | 'Transfer' | 'Return' | null;
}

export interface FlaggedAsset {
  id: number;
  assetTag: string;
  assetName: string;
  category: string;
  rule: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  ageDays: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  recentMovements: RecentMovement[];
  flaggedAssets: FlaggedAsset[];
}

export interface DeviceHealthLabel {
  id: number;
  asset_tag: string;
  scored_at: string;
  risk_score: number;
  risk_level: 'Healthy' | 'Watch' | 'At Risk' | 'Critical';
  triggered_rules: TriggeredRule[];
  recommended_action: string;
  asset_id: number | null;
}

export interface TriggeredRule {
  rule_id: string;
  label: string;
  value: any;
  score_contribution: number;
  note: string;
}

export interface TelemetrySummary {
  total_monitored: number;
  healthy: number;
  watch: number;
  at_risk: number;
  critical: number;
  no_telemetry: number;
}

// ── Registration ──────────────────────────────────────────
export const registrationApi = {
  submit: (body: Partial<User>) => request<{ message: string }>('/registration/submit', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<User[]>(`/registration${query}`);
  },
  approve: (id: number) => request<{ message: string }>(`/registration/${id}/approve`, { method: 'PATCH' }),
  reject: (id: number) => request<{ message: string }>(`/registration/${id}/reject`, { method: 'PATCH' }),
};
