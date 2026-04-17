import { useEffect, useState } from "react";
import { useStore } from "./lib/store";
import { StrategyRail } from "./components/StrategyRail";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./components/Dashboard";
import { AboutModal } from "./components/AboutModal";
import { loadDemoLog } from "./lib/demoLog";
import { parseLogText } from "./lib/parserClient";
import { pickColor } from "./lib/colors";
import { uid } from "./lib/uid";

const DEMO_LOADED_KEY = "openprosperity:demo-loaded:v1";

export default function App() {
  const prefs = useStore((s) => s.prefs);
  const strategies = useStore((s) => s.strategies);
  const addStrategy = useStore((s) => s.addStrategy);
  const hydrate = useStore((s) => s.hydrateFromIdb);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Apply theme class
  useEffect(() => {
    document.documentElement.classList.toggle("light", prefs.theme === "light");
  }, [prefs.theme]);

  // Hydrate from IDB on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Auto-load demo on first visit
  useEffect(() => {
    let cancelled = false;
    async function maybeLoadDemo() {
      if (strategies.length > 0) return;
      if (localStorage.getItem(DEMO_LOADED_KEY) === "1") return;
      try {
        const text = await loadDemoLog();
        if (cancelled) return;
        if (useStore.getState().strategies.length > 0) return;
        const strat = await parseLogText(text, {
          id: uid("demo"),
          name: "Demo — IMC Day 0 Sample",
          color: pickColor([]),
          filename: "demo.log",
        });
        if (cancelled) return;
        await addStrategy(strat);
        localStorage.setItem(DEMO_LOADED_KEY, "1");
      } catch (err) {
        console.warn("Demo load failed:", err);
      }
    }
    maybeLoadDemo();
    return () => {
      cancelled = true;
    };
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-200">
      <StrategyRail
        collapsed={railCollapsed}
        onToggle={() => setRailCollapsed((v) => !v)}
        onShowAbout={() => setAboutOpen(true)}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar onShowAbout={() => setAboutOpen(true)} />
        {/* overflow-y-scroll (not overflow-auto) forces the scrollbar to
            always be visible — prevents a ResizeObserver loop between the
            react-grid-layout WidthProvider and scrollbar appear/disappear. */}
        <div className="flex-1 overflow-x-hidden overflow-y-scroll">
          <Dashboard />
        </div>
      </main>
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
