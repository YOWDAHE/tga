// app/api/auth/cookieOptions.ts
export const cookieSettings = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as "lax",
    // secure: process.env.NODE_ENV === "production",
    secure: false,
    maxAge: 60 * 60 * 24 * 7,
};
  