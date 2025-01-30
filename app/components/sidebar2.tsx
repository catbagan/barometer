import { useState } from "react";
import cocktail from "~/../public/cocktail.png"
import {
  IconLogout,
  IconLogin,
  IconUserPlus,
  IconBottle,
  IconGlassCocktail,
  IconBook,
  IconUser,
  IconHome,
  IconTool,
} from "@tabler/icons-react";
import { Code, Group } from "@mantine/core";
import classes from "./sidebar2.module.css";
import { Form, useNavigate } from "@remix-run/react";

const data = [
  { path: "/", label: "Home", icon: IconHome },
  { path: "/ingredients", label: "Ingredients", icon: IconBottle },
  { path: "/recipes", label: "Recipes", icon: IconGlassCocktail },
  { path: "/menus", label: "Menus", icon: IconBook },
  { path: "/", label: "Tools", icon: IconTool },
];

interface SidebarProps {
  isLoggedIn: boolean;
}

export function Sidebar2({ isLoggedIn }: SidebarProps) {
  const [active, setActive] = useState("Billing");
  const navigate = useNavigate();
  const links = data.map((item) => (
    <a
      className={classes.link}
      data-active={item.label === active || undefined}
      key={item.label}
      onClick={(event) => {
        event.preventDefault();
        setActive(item.label);
        navigate(item.path);
      }}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </a>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} justify="space-between">
          <img src={cocktail} width={32} height={32} alt="Cocktail icon" />
          <Code fw={700}>v0.0.1</Code>
        </Group>
        {links}
      </div>

      <div className={classes.footer}>
        {isLoggedIn ? (
          <>
            <a href="/profile" className={classes.link}>
              <IconUser className={classes.linkIcon} stroke={1.5} />
              <span>My Account</span>
            </a>

            <Form method="post" action="/auth/logout">
              <button type="submit" className={classes.logoutButton}>
                <IconLogout className={classes.linkIcon} stroke={1.5} />
                <span>Logout</span>
              </button>
            </Form>
          </>
        ) : (
          <>
            <a href="/auth/login" className={classes.link}>
              <IconLogin className={classes.linkIcon} stroke={1.5} />
              <span>Sign In</span>
            </a>

            <a href="/auth/register" className={classes.link}>
              <IconUserPlus className={classes.linkIcon} stroke={1.5} />
              <span>Register</span>
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
