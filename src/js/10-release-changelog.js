
const RELEASE = Object.freeze({
  version: '1.3.48',
  date: '2026-09-18',
  build: '__BUILD__', // build id
  status: 'řízený pilot',
  changes: [
    '1.3.48: MASTER cleanup — pre-release acceptance metadata jsou source-only; P5 blokuje jejich publikaci do runtime a patch ověřuje ostrý auto-patch 1.3.47 → 1.3.48.',
    '1.3.47: GARP 2.5.1 N5 + Safe Promotion + release identity + AI Studio auto-patch enrollment.',
    '1.3.46: GARP R4.',
    '1.3.45: GARP R3.',
    '1.3.44: GARP.',
    '1.3.43: GARP delta.',
    '1.3.42: P1.',
    '1.3.41: Runtime hotfix.',
    '1.3.40: Platform 1.1.2 suite-session.',
    '1.3.39: GARP 2.3.',
    '1.3.38: GARP 2.3.',
    '1.3.37: Privacy.',
    '1.3.36: Access.',
    '1.3.35: GARP.',
    '1.3.34: GARP.',
    '1.3.33: Security.',
    '1.3.32: QA.',
    '1.3.31: Audit.',
    '1.3.30: Engines.',
    '1.3.29: Engines.',
    '1.3.28: Coverage.',
    '1.3.27: Multimedia.',
    '1.3.26: Coverage.',
    '1.3.25: GARP.',
    '1.3.24: Stabilization.',
    '1.3.23: Gate.',
    '1.3.22: Scans/PDF.',
    '1.3.21: STEM.',
  ]
});

const AppModules = Object.freeze({
  api:'Gemini API + klíče',
  fileReaders:'načítání textu a souborů',
  promptBuilder:'stavba promptů pro obtížnosti',
  output:'parser a validátor struktury odpovědi',
  printPdf:'náhled a tisk/PDF',
  uiState:'stav UI, modaly a upozornění',
  qualityCheck:'kontrola kvality výstupu',
  cefr:'jazykové úrovně jen pro jazykové předměty',
  testSystem:'viditelný smoke/mock testovací nástroj v horní liště'
});
