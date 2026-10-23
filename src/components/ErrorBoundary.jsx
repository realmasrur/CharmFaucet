import { Component } from "react";

// Shows the actual error on screen instead of a blank page.
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("CHARM faucet crashed:", error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto mt-16 max-w-md rounded-3xl bg-white p-6 text-center shadow-xl ring-1 ring-black/5">
        <h1 className="text-lg font-bold text-neutral-900">Something went wrong</h1>
        <p className="mt-2 break-words font-mono text-xs text-red-600">{String(this.state.error?.message || this.state.error)}</p>
        <button onClick={() => { try { sessionStorage.clear(); } catch {} window.location.reload(); }}
          className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white">Reload</button>
      </div>
    );
  }
}
