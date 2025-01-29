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
import { isLoggedIn } from "./services/auth.service";

export const loader: LoaderFunction = async ({ request }) => {
  const result = {
    isLoggedIn: (await isLoggedIn(request)).isLoggedIn,
  };
  return result;
};

export default function App() {
  const { isLoggedIn } = useLoaderData() as { isLoggedIn: boolean };

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
          <Outlet context={isLoggedIn} />
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
