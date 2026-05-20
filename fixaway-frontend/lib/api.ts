const isServerless = process.env.NEXT_PUBLIC_SERVERLESS !== 'false';
const API_BASE = isServerless
  ? process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'https://wftbsondxhiaxmjacqmr.supabase.co/functions/v1'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';


class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data.message || data.error || 'Something went wrong');
  }

  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ success: boolean; data: { user: any; accessToken: string; refreshToken: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  register: (body: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }) =>
    request<{ success: boolean; data: { user: any; accessToken: string; refreshToken: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(body) }
    ),

  getMe: (token: string) =>
    request<{ success: boolean; data: any }>('/auth/me', { token }),

  updateProfile: (token: string, data: any) =>
    request<{ success: boolean; data: any }>('/auth/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),
};

// ─── Wallet ───────────────────────────────────────────────────────────────────
export const walletApi = {
  getBalance: (token: string) =>
    request<{ success: boolean; data: any }>('/wallet/balance', { token }),

  getTransactions: (token: string) =>
    request<{ success: boolean; data: any[] }>('/wallet/transactions', { token }),

  addFunds: (token: string, amount: number) =>
    request<{ success: boolean; data: any }>('/wallet/add-funds', {
      method: 'POST',
      token,
      body: JSON.stringify({ amount }),
    }),

  getEarnings: (token: string) =>
    request<{ success: boolean; data: any }>('/wallet/earnings', { token }),
};

// ─── Service Requests ────────────────────────────────────────────────────────
export const requestsApi = {
  create: (token: string, body: any) =>
    request<{ success: boolean; data: any }>('/requests', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  getMyRequests: (token: string) =>
    request<{ success: boolean; data: any[] }>('/requests', { token }),

  getNearby: (token: string, lat: number, lng: number) =>
    request<{ success: boolean; data: any[] }>(
      `/requests/nearby?lat=${lat}&lng=${lng}`,
      { token }
    ),
};

// ─── Quotations ───────────────────────────────────────────────────────────────
export const quotationsApi = {
  send: (token: string, requestId: string, price: number, note: string) =>
    request<{ success: boolean; data: any }>('/quotations', {
      method: 'POST',
      token,
      body: JSON.stringify({ requestId, price, note }),
    }),

  accept: (token: string, quoteId: string) =>
    request<{ success: boolean; data: any }>(`/quotations/${quoteId}/accept`, {
      method: 'PATCH',
      token,
    }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  getMyOrders: (token: string) =>
    request<{ success: boolean; data: { orders: any[]; total: number } }>('/orders', { token }),

  getActive: (token: string) =>
    request<{ success: boolean; data: any }>('/orders', { token }),

  updateStatus: (token: string, orderId: string, status: string) =>
    request<{ success: boolean; data: any }>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    }),
};

// ─── Technician ───────────────────────────────────────────────────────────────
export const technicianApi = {
  setOnlineStatus: (token: string, isOnline: boolean) =>
    request<{ success: boolean }>('/technicians/status', {
      method: 'PATCH',
      token,
      body: JSON.stringify({ isOnline }),
    }),

  getEarnings: (token: string) =>
    request<{ success: boolean; data: any }>('/wallet/earnings', { token }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: (token: string, page = 1) =>
    request<{ success: boolean; data: any[]; total: number }>(
      `/admin/users?page=${page}`,
      { token }
    ),

  getTransactions: (token: string, page = 1) =>
    request<{ success: boolean; data: { transactions: any[]; total: number } }>(
      `/wallet/transactions?page=${page}`,
      { token }
    ),

  getEarnings: (token: string) =>
    request<{ success: boolean; data: { dailyTotals: number[]; todayTotal: number; barHeights: string[] } }>(
      '/wallet/earnings',
      { token }
    ),

  getTechnicians: (token: string) =>
    request<{ success: boolean; data: any[] }>('/technicians', { token }),

  verifyTechnician: (token: string, techId: string) =>
    request<{ success: boolean }>(`/technicians/${techId}/verify`, {
      method: 'PATCH',
      token,
    }),

  getOrders: (token: string, page = 1) =>
    request<{ success: boolean; data: any[] }>(`/orders/all?page=${page}`, { token }),

  getFraudAlerts: (token: string) =>
    request<{ success: boolean; data: any[] }>('/admin/fraud-alerts', { token }),

  resolveFraudAlert: (token: string, alertId: string, body?: { action: string; reportedUserId?: string; fineAmount?: number }) =>
    request<{ success: boolean }>(`/admin/fraud-alerts/${alertId}/resolve`, {
      method: 'PATCH',
      token,
      body: body ? JSON.stringify(body) : undefined,
    }),

  getStats: (token: string) =>
    request<{ success: boolean; data: any }>('/admin/stats', { token }),
};


// ─── Upload ───────────────────────────────────────────────────────────────────
export const uploadApi = {
  /**
   * Uploads a single media file to Supabase Storage via the backend.
   * Returns the public URL of the uploaded file.
   */
  uploadMedia: async (token: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('media', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new ApiError(res.status, data.message || data.error || 'Upload failed');
    }

    return data.data.url as string;
  },
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (token: string) =>
    request<{ success: boolean; data: { notifications: any[]; total: number; unreadCount: number } }>(
      '/notifications', { token }
    ),
  markAllRead: (token: string) =>
    request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH', token }),
  markOneRead: (token: string, id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH', token }),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  submit: (token: string, orderId: string, rating: number, comment: string) =>
    request<{ success: boolean; data: any }>('/reviews', {
      method: 'POST',
      token,
      body: JSON.stringify({ orderId, rating, comment }),
    }),
};

// ─── Chat ──────────────────────────────────────────────────────────────────────
export const chatApi = {
  getMessages: (token: string, orderId: string) =>
    request<{ success: boolean; data: any[] }>(`/chat/${orderId}`, { token }),

  sendMessage: (token: string, orderId: string, content: string, mediaUrl?: string) =>
    request<{ success: boolean; data: any }>(`/chat/${orderId}`, {
      method: 'POST',
      token,
      body: JSON.stringify({ content, mediaUrl }),
    }),

  reportMessage: (token: string, orderId: string, messageId: string, reason: string) =>
    request<{ success: boolean }>(`/chat/${orderId}/report`, {
      method: 'POST',
      token,
      body: JSON.stringify({ messageId, reason }),
    }),
};

export { ApiError };
