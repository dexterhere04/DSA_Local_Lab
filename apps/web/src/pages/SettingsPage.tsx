import { useEffect, useState } from "react";
import { api, type HealthState, type SettingsState } from "../services/api";

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [health, setHealth] = useState<HealthState | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSettings()
      .then((value) => setSettings(value))
      .catch((err: Error) => setError(err.message));
    api
      .getHealth()
      .then((value) => setHealth(value))
      .catch(() => setHealth(null));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const payload: Partial<SettingsState> & { openaiApiKey?: string } = {
        openaiBaseUrl: settings.openaiBaseUrl,
        openaiModel: settings.openaiModel,
        javaBin: settings.javaBin,
        javacBin: settings.javacBin,
        executionTimeoutMs: settings.executionTimeoutMs
      };
      if (apiKey.trim()) {
        payload.openaiApiKey = apiKey.trim();
      }
      const next = await api.updateSettings(payload);
      setSettings(next);
      setApiKey("");
      setSaved(true);
      const h = await api.getHealth();
      setHealth(h);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
          <div className="spinner" />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in max-w-xl">
      <div className="mb-6">
        <h2 className="font-serif text-2xl tracking-[-0.02em] text-[var(--text)] mb-2">Settings</h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Configure the AI provider and local Java runtime. Changes are stored in your local config.
        </p>
      </div>

      {health && !health.java.available && (
        <div className="mb-4 rounded-md border border-[var(--error-border)] bg-[var(--error-dim)] p-3 text-sm text-[var(--error)]">
          Java runtime not found. Install a JDK (Java 8+) and ensure <span className="font-mono">java</span> and{" "}
          <span className="font-mono">javac</span> are on your PATH, or set their paths below.
        </div>
      )}

      <form onSubmit={onSubmit} className="card space-y-5">
        <div>
          <label className="section-label mb-2 block">OpenAI Base URL</label>
          <input
            className="input"
            value={settings.openaiBaseUrl}
            onChange={(e) => setSettings({ ...settings, openaiBaseUrl: e.target.value })}
          />
        </div>

        <div>
          <label className="section-label mb-2 block">Model</label>
          <input
            className="input"
            value={settings.openaiModel}
            onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
          />
        </div>

        <div>
          <label className="section-label mb-2 block">API Key</label>
          <input
            className="input"
            type="password"
            placeholder={settings.hasApiKey ? "•••••••• (leave blank to keep current)" : "sk-..."}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          {settings.hasApiKey && (
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">An API key is currently set.</p>
          )}
        </div>

        <div className="divider" />

        <div>
          <label className="section-label mb-2 block">Java binary</label>
          <input
            className="input"
            value={settings.javaBin}
            onChange={(e) => setSettings({ ...settings, javaBin: e.target.value })}
          />
        </div>

        <div>
          <label className="section-label mb-2 block">javac binary</label>
          <input
            className="input"
            value={settings.javacBin}
            onChange={(e) => setSettings({ ...settings, javacBin: e.target.value })}
          />
        </div>

        <div>
          <label className="section-label mb-2 block">Execution timeout (ms)</label>
          <input
            className="input"
            type="number"
            value={settings.executionTimeoutMs}
            onChange={(e) => setSettings({ ...settings, executionTimeoutMs: Number(e.target.value) })}
          />
        </div>

        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        {saved && <p className="text-sm text-[var(--success)]">Settings saved.</p>}

        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? <div className="spinner" /> : null}
          Save
        </button>
      </form>

      {health?.java.available && (
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">Java detected: {health.java.version}</p>
      )}
    </div>
  );
}
