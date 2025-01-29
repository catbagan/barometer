import { createCookieSessionStorage } from "@remix-run/node";

// Configure session storage
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session", // use unique name
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "YOUR_FALLBACK_SECRET"], // replace with .env secret
    secure: process.env.NODE_ENV === "production",
  },
});
