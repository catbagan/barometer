import { Outlet, useOutletContext } from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import stylesUrl from "~/styles/_.css?url";
import { Sidebar } from "~/components/sidebar";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export default function AppLayout() {
  const isLoggedIn: boolean = useOutletContext();
  return (
    <div id="app">
      <Sidebar isLoggedIn={isLoggedIn} />
      <div id="detail">
        <Outlet />
      </div>
    </div>
  );
}
