import { useEffect } from "react";
import { useApp } from "./store/AppContext";
import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import Chat from "./components/Chat";
import Plans from "./components/Plans";

export default function App() {
  const { state } = useApp();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme || "dark");
  }, [state.theme]);

  if (state.screen === "auth") return <Auth />;
  if (state.screen === "onboarding") return <Onboarding />;
  if (state.screen === "plans") return <Plans />;
  return <Chat />;
}
