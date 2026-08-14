/*
 * AI Studio GHRAB — veřejná runtime konfigurace Diferenciátoru.
 * Neobsahuje a nikdy nesmí obsahovat API klíče, hesla ani jiné tajné údaje.
 * Aplikační logika používá pouze profily economy / balanced / quality.
 */
window.__GHRAB_RUNTIME_CONFIG__ = {
  schema: "ghrab-runtime-config-v1",
  ai: {
    defaultMode: "direct-gemini",
    selectedMode: "direct-gemini",
    allowedModes: ["direct-gemini"],
    allowUserModeSelection: false,
    automaticFallback: false,
    gatewayUrl: "/api/v1/ai/generate",
    healthUrl: "/api/v1/ai/health",
    requestTimeoutMs: 120000,
    gatewayMaxRetries: 0,
    maxRequestBytes: 18874368,
    maxPartBytes: 12582912,
    directGemini: {
      profileModels: {
        economy: "gemini-3.5-flash-lite",
        balanced: "gemini-3.6-flash",
        quality: "gemini-3.7-flash"
      },
      profileThinkingLevels: {
        economy: ["minimal", "low", "medium", "high"],
        balanced: ["minimal", "low", "medium", "high"],
        quality: ["low", "medium", "high"]
      },
      fallbackModels: ["gemini-3.5-flash-lite"],
      useResponseSchema: false,
      maxOutputTokens: 60000
    }
  },
  telemetry: { enabled: true }
};
