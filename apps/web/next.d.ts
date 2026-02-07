declare module "next" {
  export interface Metadata {
    title?: string | { default: string; template?: string };
    description?: string;
    [key: string]: unknown;
  }

  export interface NextConfig {
    [key: string]: unknown;
  }
}
