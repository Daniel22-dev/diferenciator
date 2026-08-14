/* AI Studio GHRAB — školní runtime konfigurace Diferenciátoru.
 * Provider ani konkrétní model nejsou součástí klientské konfigurace.
 */
window.__GHRAB_RUNTIME_CONFIG__ = {
  schema: "ghrab-runtime-config-v1",
  ai: {
    defaultMode: "school-gateway",
    selectedMode: "school-gateway",
    allowedModes: ["school-gateway"],
    allowUserModeSelection: false,
    automaticFallback: false,
    gatewayUrl: "/api/v1/ai/generate",
    healthUrl: "/api/v1/ai/health",
    requestTimeoutMs: 120000,
    gatewayMaxRetries: 1,
    maxRequestBytes: 18874368,
    maxPartBytes: 12582912
  },
  telemetry: { enabled: true }
};
