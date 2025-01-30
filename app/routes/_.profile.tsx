import {
  Outlet,
  redirect,
  useLoaderData,
  useOutletContext,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import stylesUrl from "~/styles/_.css?url";
import { Sidebar2 } from "~/components/sidebar2";
import { isLoggedIn } from "~/services/auth.service";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export const loader: LoaderFunction = async ({ request }): Promise<any> => {
  const loginResult = await isLoggedIn(request);
  if (!loginResult.isLoggedIn || loginResult.userId == null) {
    throw redirect("/auth/login");
  }

  return loginResult;
};

export default function Profile() {
  const data = useLoaderData<any>();
  const isLoggedIn: boolean = useOutletContext();
  return (
    <div id="app">
      <h1>My Account</h1>
      <h3>My user id: {data.userId}</h3>
    </div>
  );
}
