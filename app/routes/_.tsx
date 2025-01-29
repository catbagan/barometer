import { Outlet, useLoaderData, useOutletContext } from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import stylesUrl from "~/styles/_.css?url";
import { Sidebar2 } from "~/components/sidebar2";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export default function AppLayout() {
  const isLoggedIn: boolean = useOutletContext();
  return (
    <div id="app">
      <Sidebar2 isLoggedIn={isLoggedIn} />
      <div id="detail">
        <Outlet />
      </div>
    </div>
  );
}
