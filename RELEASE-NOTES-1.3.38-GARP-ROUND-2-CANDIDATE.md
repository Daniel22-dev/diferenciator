# Diferenciátor 1.3.38 — GARP 2.3 kandidát pro Claude kolo 2

- Opravuje potvrzený HIGH C-01 z první nezávislé kontroly Claude: nedůvěryhodný text již nelze povýšit do `systemInstruction` přes markerové dělení.
- Všechny produkční AI cesty používají explicitní `appInstructions`; datová vrstva prochází centrálním privacy preflightem.
- Deterministické STEM validační hlášky už necitují cizí/modelový obsah; odkazují pouze na číslo řádku.
- Privacy preflight je fail-closed při neznámém rozhodnutí.
- Studio návrat odstraňuje query/fragment a userinfo.
- Performance gate používá build file manifest a není závislý na pořadí QA reportů v `dist/`.
- Žádná reálná studentská data nebyla použita; kandidát vyžaduje druhou nezávislou kontrolu Claude před Integrity GREEN.
