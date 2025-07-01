// TypeScript type definitions for js-cookie
// This file is needed for type safety if @types/js-cookie is not installed

declare module "js-cookie" {
  interface CookieAttributes {
    path?: string;
    domain?: string;
    expires?: number | Date;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  }
  interface CookiesStatic {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: CookieAttributes): void;
    remove(name: string, options?: CookieAttributes): void;
  }
  const Cookies: CookiesStatic;
  export default Cookies;
}
