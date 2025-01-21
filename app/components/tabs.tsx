import { LinksFunction } from "@remix-run/node";
import stylesUrl from "./tabs.css?url";
import { useNavigate } from "@remix-run/react";

interface TabsProps {
  activeTab: "ingredients" | "recipes" | "menus";
  setActiveTab: (tab: "ingredients" | "recipes" | "menus") => void;
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export function Tabs({ activeTab, setActiveTab }: TabsProps) {
  const navigate = useNavigate();

  return (
    <div className="tabs">
      <button
        className={`tab ingredients-tab ${
          activeTab === "ingredients" ? "active" : ""
        }`}
        onClick={() => {
          setActiveTab("ingredients");
        }}
      >
        Ingredients
      </button>
      <button
        className={`tab recipes-tab ${activeTab === "recipes" ? "active" : ""}`}
        onClick={() => {
          setActiveTab("recipes");
        }}
      >
        Recipes
      </button>
      <button
        className={`tab menus-tab ${activeTab === "menus" ? "active" : ""}`}
        onClick={() => setActiveTab("menus")}
      >
        Menus
      </button>
    </div>
  );
}
