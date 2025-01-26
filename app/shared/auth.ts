import { Authenticator } from "remix-auth";
import { createCookieSessionStorage } from "@remix-run/node";
import { FormStrategy } from "remix-auth-form";
import invariant from "tiny-invariant";
import { User } from "~/types/index.type";

export let authenticator = new Authenticator<User>();

// Tell the Authenticator to use the form strategy
authenticator.use(
  new FormStrategy(async ({ form }) => {
    const email = form.get("email");
    const password = form.get("password");
    invariant(email, "Email is required");
    invariant(password, "Email is required");
    // the type of this user must match the type you pass to the Authenticator
    // the strategy will automatically inherit the type if you instantiate
    // directly inside the `use` method
    return await login(email.toString(), password.toString());
  }),
  // each strategy has a name and can be changed to use another one
  // same strategy multiple times, especially useful for the OAuth2 strategy.
  "user-pass"
);

const login = async (email: string, password: string): Promise<User> => {
  throw new Error("Function not implemented.");
};

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    // secrets: [process.env.SESSION_SECRET], // Add SESSION_SECRET to your .env
    secrets: [],
    secure: process.env.NODE_ENV === "production",
  },
});
