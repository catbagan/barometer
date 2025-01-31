import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import "@mantine/core/styles.css";
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { LoaderFunction } from "@remix-run/node";
import { getSession } from "./services/auth.service";
import { Session } from "./types/index.type";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  return session;
};

export default function App() {
  const maybeSession = useLoaderData() as Session | null;

  return (
    <html
      lang="en"
      {...mantineHtmlProps}
      style={{ height: "100vh", margin: 0 }}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ColorSchemeScript />
        <Meta />
        <Links />
      </head>
      <body style={{ height: "100vh", margin: 0 }}>
        <MantineProvider>
          <Outlet context={{ isLoggedIn: maybeSession != null }} />
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
