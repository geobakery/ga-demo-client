interface ImportMetaEnv {
  VITE_API_URL: string;
  VITE_API_PORT?: string;
  VITE_API_VERSION?: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}
