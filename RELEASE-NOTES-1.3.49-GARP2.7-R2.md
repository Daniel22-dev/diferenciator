# Diferenciátor 1.3.49 — GARP 2.7 r2 / G-02

Datum: 2026-09-24

Release 1.3.49 převádí aktivní bezpečnostní autoritu Diferenciátoru na **GARP 2.7 r2 / G-02 FIX**. Jde o bezpečnostní a governance migraci; pedagogická logika, UI a význam sedmi AI operací se záměrně nemění.

- přidán bitově převzatý konsolidovaný GARP 2.7 r2 master a SHA-256 trust anchor;
- přidána aplikační policy, capability inventory, migration profile a explicitní LIVE `NOT_TESTED` stav;
- přidány contract, architecture-integrity, G-02 policy mutation, G27-AR mutation, auto-patch a FOUNDATION brány;
- GARP 2.5.1/N5 zůstává povinnou regresní vrstvou;
- zachována klasifikace **D2 / AGENTIC=NO** a 7 AI operací bez provider tools;
- školní profil zůstává nepřipojený a fail-closed; při budoucím připojení musí projít LIVE validací;
- Safe Promotion a release-integrity v2 se nemění, ale jejich kontrakt je nově součástí GARP 2.7 admission;
- CI připíná přesný SHA-256 trust anchoru mimo samotný anchor soubor.

Exact release důkaz dodá GitHub CI a následná live Pages verifikace konkrétního candidate/main commitu.
