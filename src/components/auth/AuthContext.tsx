// FIX: Consolidate to single source of truth
// This file re-exports from the canonical context location to avoid duplication bugs
export { AuthProvider, useAuth } from '@/context/AuthContext';
export type { AuthUser } from '@/context/AuthContext';
