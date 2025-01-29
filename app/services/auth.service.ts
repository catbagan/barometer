import { Authenticator } from "remix-auth";
import bcrypt from "bcryptjs";
import { User } from "~/types/index.type";
import { FormStrategy } from "remix-auth-form";
import { connectDB } from "~/db/db.server";
import { UserModel } from "~/db/user.server";
import { redirect } from "@remix-run/node";
import { sessionStorage } from "./session.service";

export let authenticator = new Authenticator<User>();

// Tell the Authenticator to use the form strategy
authenticator.use(
  new FormStrategy(async ({ form }) => {
    let email = form.get("email");
    let password = form.get("password");
    // the type of this user must match the type you pass to the Authenticator
    // the strategy will automatically inherit the type if you instantiate
    // directly inside the `use` method
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    return await login(email.toString(), password.toString());
  }),
  // each strategy has a name and can be changed to use another one
  // same strategy multiple times, especially useful for the OAuth2 strategy.
  "user-pass"
);

const login = async (email: string, password: string): Promise<User> => {
  await connectDB();

  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isValidPassword = await comparePasswords(password, user.password);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  // Return user without sensitive data
  return {
    id: user._id.toHexString(),
    email: user.email,
    name: user.name,
  };
};

export const logout = async (request: Request): Promise<Response> => {
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  return redirect("/auth/login", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
};

export const register = async (
  name: string,
  email: string,
  password: string
): Promise<User> => {
  await connectDB();

  // Check if user already exists
  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Validate password strength
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const user = await UserModel.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  // Return user without sensitive data
  return {
    id: user._id.toHexString(),
    email: user.email,
    name: user.name,
  };
};

// Helper function to validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate password strength
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

const SALT_ROUNDS = 12; // Standard recommendation for bcrypt rounds

export const hashPassword = async (password: string): Promise<string> => {
  if (!password) {
    throw new Error("Password is required");
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Error creating password hash");
  }
};

export const comparePasswords = async (
  plainTextPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  if (!plainTextPassword || !hashedPassword) {
    throw new Error("Both password and hash are required");
  }

  try {
    const result = await bcrypt.compare(plainTextPassword, hashedPassword);
    return result;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    throw new Error("Error comparing passwords");
  }
};

export const isLoggedIn = async (
  request: Request
): Promise<{ isLoggedIn: boolean; userId: string | null }> => {
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  let user = session.get("user");
  return {
    isLoggedIn: user != null,
    userId: user.id,
  };
};
