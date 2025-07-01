// CLIENT-SIDE ONLY: Token helpers using js-cookie

export function setTokenCookie(tokens: { accessToken: string; refreshToken: string }) {
  if (typeof window !== "undefined") {
    import("js-cookie").then(Cookies => {
      Cookies.default.set("tgaAccessToken", tokens.accessToken, { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production", expires: 7 });
      Cookies.default.set("tgaRefreshToken", tokens.refreshToken, { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production", expires: 7 });
    });
  }
}

export function clearTokenCookie() {
  if (typeof window !== "undefined") {
    import("js-cookie").then(Cookies => {
      Cookies.default.remove("tgaAccessToken", { path: "/" });
      Cookies.default.remove("tgaRefreshToken", { path: "/" });
    });
  }
}
