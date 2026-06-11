export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (import.meta.env.PROD) {
    return `/.netlify/functions/api${normalizedPath}`;
  }
  return `/api${normalizedPath}`;
};
