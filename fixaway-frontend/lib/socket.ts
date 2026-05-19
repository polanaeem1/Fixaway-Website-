/**
 * lib/socket.ts  – Real-time bridge
 *
 * In Express mode  → uses Socket.io (unchanged behaviour)
 * In Serverless mode → uses Supabase Realtime Broadcast channels
 *
 * The chat page calls joinOrderRoom / leaveOrderRoom / onMessage exactly as before.
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const isServerless = process.env.NEXT_PUBLIC_SERVERLESS === 'true';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

// ─── Supabase Realtime path ─────────────────────────────────────────────────

let supabaseClient: ReturnType<typeof createClient> | null = null;
const activeChannels: Map<string, RealtimeChannel> = new Map();

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

export function joinOrderRoom(orderId: string) {
  if (isServerless) {
    // subscribe via Supabase Realtime broadcast
    const sb = getSupabaseClient();
    if (activeChannels.has(orderId)) return;
    const channel = sb.channel(`order:${orderId}`);
    channel.subscribe();
    activeChannels.set(orderId, channel);
  } else {
    getSocket()?.emit('join_order', orderId);
  }
}

export function leaveOrderRoom(orderId: string) {
  if (isServerless) {
    const channel = activeChannels.get(orderId);
    if (channel) {
      getSupabaseClient().removeChannel(channel);
      activeChannels.delete(orderId);
    }
  } else {
    getSocket()?.emit('leave_order', orderId);
  }
}

/** Subscribe to incoming messages for an order room. Returns unsubscribe fn. */
export function onOrderMessage(
  orderId: string,
  callback: (msg: any) => void,
): () => void {
  if (isServerless) {
    const sb = getSupabaseClient();
    let channel = activeChannels.get(orderId);
    if (!channel) {
      channel = sb.channel(`order:${orderId}`);
      activeChannels.set(orderId, channel);
    }
    channel.on('broadcast', { event: 'message_received' }, ({ payload }) => {
      callback(payload);
    });
    if (channel.state !== 'joined') channel.subscribe();
    return () => {
      sb.removeChannel(channel!);
      activeChannels.delete(orderId);
    };
  } else {
    const s = getSocket();
    s?.on('message_received', callback);
    return () => s?.off('message_received', callback);
  }
}

export function broadcastLocation(lat: number, lng: number, orderId: string) {
  if (!isServerless) {
    getSocket()?.emit('location_update', { lat, lng, orderId });
  }
  // In serverless mode, location updates use a separate Realtime channel if needed
}

export function disconnectSocket() {
  if (isServerless) {
    activeChannels.forEach((ch) => getSupabaseClient().removeChannel(ch));
    activeChannels.clear();
  } else {
    if (_socket) {
      _socket.disconnect();
      _socket = null;
    }
  }
}

// ─── Socket.io path (only loaded when NOT serverless) ───────────────────────

let _socket: any = null;

function getSocket(): any {
  if (isServerless) return null;
  if (!_socket) {
    // Dynamic import so socket.io-client is not bundled in serverless builds
    throw new Error('Call initSocket(token) first in non-serverless mode');
  }
  return _socket;
}

export async function initSocket(token?: string): Promise<void> {
  if (isServerless) return;
  if (_socket) {
    if (token && (_socket as any).auth?.token !== token) {
      (_socket as any).auth = { token };
      _socket.disconnect().connect();
    }
    return;
  }
  const { io } = await import('socket.io-client');
  _socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
}

// Legacy named export for code that imports { socket }
export { _socket as socket };
