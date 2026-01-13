export function isAdminEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_ADMIN === 'true';
}

