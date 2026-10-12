import { ClientItem } from '@/types';
import { SEED_CLIENTS_FULL } from './seed-data';
import { supabase } from './supabase';

export function getStoredClients(): ClientItem[] {
  if (typeof window === 'undefined') return SEED_CLIENTS_FULL;
  try {
    const raw = localStorage.getItem('ambizcon_clients_list_v2');
    if (!raw) {
      localStorage.setItem('ambizcon_clients_list_v2', JSON.stringify(SEED_CLIENTS_FULL));
      return SEED_CLIENTS_FULL;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length >= 20 ? parsed : SEED_CLIENTS_FULL;
  } catch (e) {
    return SEED_CLIENTS_FULL;
  }
}

export function saveStoredClients(clients: ClientItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('ambizcon_clients_list_v2', JSON.stringify(clients));
  } catch (e) {}
}

export function addClient(
  name: string,
  addedBy: string,
  addedByRole: string,
  category: string = 'Business / Other Services'
): ClientItem {
  const current = getStoredClients();
  const isAdmin = addedByRole === 'Super Admin' || addedByRole === 'Admin';
  const newClient: ClientItem = {
    id: `client_${Date.now()}`,
    name: name.trim(),
    category,
    status: isAdmin ? 'active' : 'pending_admin_approval',
    addedBy,
    addedByRole,
    createdAt: new Date().toISOString(),
  };
  const updated = [newClient, ...current];
  saveStoredClients(updated);

  // Sync to Supabase PostgreSQL
  supabase
    .from('clients')
    .upsert(
      {
        id: newClient.id,
        name: newClient.name,
        category: newClient.category,
        status: newClient.status,
        added_by: newClient.addedBy,
        added_by_role: newClient.addedByRole,
        created_at: newClient.createdAt,
      },
      { onConflict: 'id' }
    )
    .then(() => {});

  return newClient;
}

export function approveClient(clientId: string): ClientItem[] {
  const current = getStoredClients();
  const updated = current.map((c) => (c.id === clientId ? { ...c, status: 'active' as const } : c));
  saveStoredClients(updated);

  // Sync approval to Supabase PostgreSQL
  supabase
    .from('clients')
    .update({ status: 'active' })
    .eq('id', clientId)
    .then(() => {});

  return updated;
}
