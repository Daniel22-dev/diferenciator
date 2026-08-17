
const RELEASE = Object.freeze({
  version: '1.3.32',
  date: '2026-08-17',
  build: '__BUILD__', // build skript (scripts/build.mjs) nahradí __BUILD__ za krátký git hash; bez nahrazení se v changelogu nezobrazí
  status: 'řízený pilot',
  changes: [
    '1.3.32: Visual Intent Routing + structure/scoring UX hotfix — TASK_IMAGE se rekonstruuje, zachovávají se počty položek a bodovatelnost, obrazová hláška je konkrétní, checkbox extension je opravený a PDF blokuje strukturální/scoring drift.',
    '1.3.31: GARP audit fixes — fail-closed tracer a chemie, bezpečný tisk po hydrataci, korektní anotace 16:9, úplná offline mapa a skutečná výkonová rezerva bez zvýšení budgetů.',
    '1.3.30: Deep subject engines — EDU_TRACE, EDU_REACTION, EDU_ANNOTATE, období/nejistota v timeline a validované free-body diagramy.',
    '1.3.29: Cross-subject engines — flow, timeline, Mendelovská genetika/rodokmeny a fyzikální vektory/spojná čočka; předmětově specifický routing.',
    '1.3.28: Komplexní odborné enginy — víceřádková partitura, SMILES a valenční kontrola chemie, elektrická schémata, GeoJSON mapy, TeX/MathML + školní CAS, DrawingML rekonstrukce Office objektů a živá providerová multimedia QA brána.',
    '1.3.27: Multimédia a odborné renderery — přímý audio/video vstup s ochranou poslechového transkriptu, deterministické grafy, souřadnicová geometrie, jednoduchý notový a chemický 2D renderer, slepé mapové presety a převod nativních Office grafů do renderovatelných dat.',
    '1.3.26: Gymnasium coverage — 111 školních názvů, rozšířené STEM, PPTX/XLSX obrázky, datový přepis nativních grafů/SmartArt a neměnné zachované vizuály.',
    '1.3.25: GARP follow-up po auditu 1.3.24 — direct multimodální timeout sjednocen na 120 s, Důkladný profil převeden na Gemini 3.7 Flash a profilová QA nově hlídá pořadí schopností. Direct 3.7 navíc bezpečně převádí nepodporované minimal thinking na low.',
    '1.3.24: Stabilizační GARP review — opraven school-server service-worker precache, transakční generování, testovací hash, obnova tisku, kanonické storage klíče a zmrazené výkonnostní stropy.',
    '1.3.23: All-subject release gate — univerzální předmětová vrstva pro jazyky, zeměpis, dějepis, ZSV, informatiku, hudební/výtvarnou/tělesnou výchovu a humanitní předměty vedle STEM.',
    '1.3.22: Fotografie, skeny a PDF — lokální otočení, ořez a čtecí kopie, SCAN_REPORT, stránkové vizuální čtení PDF a přesné doplňkové výřezy.',
    '1.3.21: STEM přesnost — matematické/chemické/fyzikální zobrazení, Word Equation; deterministická kontrola výpočtů, jednotek a chemické bilance.',
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
