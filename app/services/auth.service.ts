import { Authenticator } from "remix-auth";
import bcrypt from "bcryptjs";
import { Session, User } from "~/types/index.type";
import { FormStrategy } from "remix-auth-form";
import { connectDB } from "~/db/db.server";
import { UserModel } from "~/db/user.server";
import { redirect } from "@remix-run/node";
import { sessionStorage } from "./session.service";

export const authenticator = new Authenticator<User>();

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const email = form.get("email");
    const password = form.get("password");
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    return await login(email.toString(), password.toString());
  }),
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

  return {
    id: user._id.toHexString(),
    email: user.email,
    name: user.name,
  };
};

export const logout = async (request: Request): Promise<Response> => {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
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

  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  return {
    id: user._id.toHexString(),
    email: user.email,
    name: user.name,
  };
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

const SALT_ROUNDS = 12;
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

export const getSession = async (request: Request): Promise<Session | null> => {
  try {
    const session = await sessionStorage.getSession(
      request.headers.get("cookie")
    );
    if (session == null) {
      return null;
    }
    const user = session.get("user");
    if (user == null) {
      return null;
    }
    return {
      userId: user.id,
    };
  } catch (error: unknown) {
    console.error("error checking if user is logged in:", error);
    return null;
  }
};
