import { Outlet, useLoaderData } from "@remix-run/react";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import stylesUrl from "~/styles/_.css?url";
import { Sidebar } from "~/components/sidebar";
import { getSession } from "~/services/auth.service";
import { Session } from "~/types/index.type";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  return session;
};

export default function AppLayout() {
  const maybeSession = useLoaderData() as Session | null;
  return (
    <div id="app">
      <Sidebar isLoggedIn={maybeSession?.userId != null} />
      <div id="detail">
        <Outlet />
      </div>
    </div>
  );
}
