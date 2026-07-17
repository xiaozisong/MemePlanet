const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${baseUrl}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? res.statusText);
  return data.data as T;
}

export interface DashboardData {
  online: number;
  activePKs: number;
  memesCreatedToday: number;
  aiCostTodayCents: number;
}

export interface AuditItem {
  id: string;
  type: 'report' | 'meme_audit';
  targetType: string;
  targetId: string;
  reason: string;
  detail: string | null;
  status: string;
  createdAt: string;
  reporterId: string;
}

export interface AuditQueueResponse {
  items: AuditItem[];
}

export interface UserInfo {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  phone: string;
  role: string;
  isPro: boolean;
  level: number;
  memePower: number;
  status: string;
  createdAt: string;
}

export interface UserListResponse {
  list: UserInfo[];
  total: number;
}

export async function fetchDashboard(): Promise<DashboardData> {
  return request<DashboardData>('/admin/dashboard');
}

export async function fetchAuditQueue(): Promise<AuditQueueResponse> {
  return request<AuditQueueResponse>('/admin/audit/queue');
}

export async function performAuditAction(
  auditId: string,
  action: 'approve' | 'reject' | 'takedown',
  reason?: string,
): Promise<{ ok: boolean }> {
  return request(`/admin/audit/${auditId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, reason }),
  });
}

export async function fetchUsers(page = 1): Promise<UserListResponse> {
  return request<UserListResponse>(`/admin/users?page=${page}`);
}

export async function banUser(
  userId: string,
  reason: string,
  until?: string,
): Promise<{ ok: boolean }> {
  return request(`/admin/users/${userId}/ban`, {
    method: 'PATCH',
    body: JSON.stringify({ reason, until }),
  });
}
