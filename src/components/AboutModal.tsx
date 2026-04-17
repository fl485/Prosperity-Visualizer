import { GithubIcon, LockIcon, XIcon } from "./Icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AboutModal({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-[640px] max-w-[92vw] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Close"
        >
          <XIcon />
        </button>
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <LockIcon className="text-accent-400" />
            <h2 className="text-lg font-semibold text-zinc-100">
              Your strategy never leaves this tab.
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">
            OpenProsperity Visualizer is a 100% client-side, open-source dashboard
            for the IMC Prosperity algorithmic trading competition. We built it
            because by 2am the night before round close, you don&apos;t want to
            wonder whether the analytics tool you&apos;re comparing variant B
            against is quietly cataloging your edge somewhere on someone
            else&apos;s server.
          </p>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            What happens to your file
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-300">
            <li>
              You drop a <code className="font-mono text-accent-300">.log</code>{" "}
              file. The browser&apos;s File API reads it locally — no network.
            </li>
            <li>
              A Web Worker parses the JSON + CSV inside this tab. The data lives
              only in JavaScript memory.
            </li>
            <li>
              Charts render against that in-memory data. Closing the tab wipes
              everything unless you explicitly opt in to{" "}
              <em>Save to browser</em>, which writes to IndexedDB on this
              device only.
            </li>
            <li>
              No accounts. No telemetry. No analytics cookies. No third-party
              scripts. Confirm by inspecting the network panel.
            </li>
          </ol>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            What this is good at
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            <li>Comparing N variants of your algorithm side-by-side.</li>
            <li>Diff mode: PnL of variant B <em>minus</em> baseline at every tick.</li>
            <li>Normalized x-axis: 1k-tick previews vs 10k-tick full days.</li>
            <li>Order-book replay synced with PnL, position, and fills.</li>
          </ul>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Algorithm logs are empty?
          </h3>
          <p className="mt-2 text-sm text-zinc-300">
            IMC&apos;s sandbox only writes to the Algorithm tab when your code
            calls <code className="font-mono text-accent-300">print()</code> (or
            uses the popular jmerle <code className="font-mono">Logger</code>{" "}
            shim, which we decode automatically). If both panes are blank, your
            algo just didn&apos;t emit anything at that tick.
          </p>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Credits
          </h3>
          <p className="mt-2 text-sm text-zinc-300">
            Inspired by{" "}
            <a
              href="https://github.com/jmerle/imc-prosperity-3-visualizer"
              className="text-accent-400 underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              jmerle&apos;s imc-prosperity-3-visualizer
            </a>
            , which set the bar for what a static-SPA Prosperity visualizer
            should look like. This project takes a different angle: comparing
            multiple strategies as the default, and making the local-only
            architecture a marketing feature.
          </p>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-800 pt-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              MIT licensed · Open source
            </span>
            <a
              href="https://github.com/lachy-dauth/prosperity-visualizer"
              target="_blank"
              rel="noreferrer"
              className="btn"
            >
              <GithubIcon /> View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
