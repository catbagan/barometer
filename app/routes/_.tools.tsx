import { redirect } from "@remix-run/react";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import stylesUrl from "~/styles/_.css?url";
import { getSession } from "~/services/auth.service";
import { Session } from "~/types/index.type";
import { Title } from "@mantine/core";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export const loader: LoaderFunction = async ({ request }): Promise<Session> => {
  const session = await getSession(request);
  if (session == null) {
    throw redirect("/auth/login");
  }

  return session;
};

export default function Tools() {
  return (
    <>
      <Title m="md">Tools</Title>
    </>
  );
}
