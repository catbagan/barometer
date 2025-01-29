import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import { logout } from "~/services/auth.service";

export const action: ActionFunction = async ({ request }) => {
  return logout(request);
};

export const loader: LoaderFunction = async () => {
  return redirect("/");
};