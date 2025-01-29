import {
  ActionFunction,
  LoaderFunction,
  redirect,
  json,
} from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import { register } from "~/services/auth.service";
import { sessionStorage } from "~/services/session.service";
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Container,
  Button,
  Text,
  Box,
  Alert,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";

export default function Register() {
  const actionData = useActionData() as { error: string };

  return (
    <Container size={420} my={40}>
      <Title>Create your account</Title>
      <Text size="sm" mt={5}>
        Already have an account?{" "}
        <Link
          to="/auth/login"
          style={{ color: "inherit", textDecoration: "underline" }}
        >
          Sign in
        </Link>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Form method="post">
          <TextInput
            label="Name"
            name="name"
            placeholder="Your name"
            required
            mb="md"
          />
          <TextInput
            label="Email"
            name="email"
            placeholder="you@example.com"
            required
            mb="md"
          />
          <PasswordInput
            label="Password"
            name="password"
            placeholder="Your password"
            required
            mb="md"
          />
          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Confirm your password"
            required
            mb="md"
          />
          {actionData?.error && (
            <Alert
              icon={<IconX size="1rem" />}
              title="Error"
              color="red"
              radius="md"
              variant="light"
              mt="md"
            >
              {actionData.error}
            </Alert>
          )}

          <Button fullWidth mt="xl" type="submit">
            Create account
          </Button>
        </Form>
      </Paper>
    </Container>
  );
}

export const checkPassword = (password: string): { error?: string } => {
  return {}
  // const requirements = [
  //   { re: /.{8,}/, label: "at least 8 characters" },
  //   { re: /[0-9]/, label: "include a number" },
  //   { re: /[a-z]/, label: "include a lowercase letter" },
  //   { re: /[A-Z]/, label: "include a uppercase letter" },
  //   { re: /[!@#$%^&*(),.?":{}|<>]/, label: "includes a special character" },
  // ];

  // const failedRequirements = requirements
  //   .filter((req) => !req.re.test(password))
  //   .map((req) => req.label);

  // if (failedRequirements.length > 0) {
  //   return {
  //     error: `Password must have: ${failedRequirements.join(", ")}`,
  //   };
  // }

  // return {};
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const name = form.get("name");
  const email = form.get("email");
  const password = form.get("password");
  const confirmPassword = form.get("confirmPassword");

  if (!name || !email || !password || !confirmPassword) {
    return { error: "All fields are required" };
  }
  const passwordError = checkPassword(password.toString()).error;
  if (passwordError) {
    return { error: passwordError };
  }

  const confirmPasswordError = checkPassword(confirmPassword.toString()).error;
  if (confirmPasswordError) {
    return { error: confirmPasswordError };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  try {
    const user = await register(
      name.toString(),
      email.toString(),
      password.toString()
    );
    const session = await sessionStorage.getSession(
      request.headers.get("cookie")
    );
    session.set("user", user);
    return redirect("/", {
      headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
    });
  } catch (error: any) {
    return { error: error.message };
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const user = session.get("user");

  if (user) {
    return redirect("/");
  }
  return {};
};
