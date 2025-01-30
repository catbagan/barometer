import {
  ActionFunction,
  LoaderFunction,
  redirect,
  json,
} from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import { authenticator } from "~/services/auth.service";
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
  Group,
  Alert,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";

export default function Login() {
  const actionData = useActionData() as { error: string };

  return (
    <Container size={420} my={40}>
      <Title>Welcome to Barometer</Title>
      <Text size="sm" mt={5}>
        Don't have an account yet?{" "}
        <Link
          to="/auth/register"
          style={{ color: "inherit", textDecoration: "underline" }}
        >
          Create account
        </Link>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Form method="post">
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
            autoComplete="current-password"
            mb="md"
          />
          {/*<Group mt="lg">
            <Link
              to="/auth/forgot-password"
              style={{ color: "inherit", fontSize: "14px" }}
            >
              Forgot password?
            </Link>
          </Group>*/}
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
            Sign in
          </Button>
        </Form>
      </Paper>
    </Container>
  );
}

export const action: ActionFunction = async ({ request }) => {
  try {
    const user = await authenticator.authenticate("user-pass", request);
    const session = await sessionStorage.getSession(
      request.headers.get("cookie")
    );
    session.set("user", user);
    return redirect("/", {
      headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
    });
  } catch (error) {
    console.error(error)
    // Handle authentication errors
    return { error: "Invalid credentials. Please try again." };
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
  return json({});
};
