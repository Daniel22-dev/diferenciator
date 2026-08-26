# RELEASE NOTES — Diferenciátor 1.3.33 — GARP security candidate

Datum: 2026-08-26

## Bezpečnostní změny

- GitHub Actions jsou připnuté na immutable commit SHA; pohyblivé major tagy už release gate nepřipustí.
- AI Core dostává pro všechny operace explicitní trust boundary: školní materiál a přílohy jsou nedůvěryhodný obsah, pokyny ukryté ve zdroji nesmějí měnit pravidla aplikace, výstupní kontrakt ani vyžadovat/vyzrazovat tajné údaje.
- P5 obsahuje nový `qa:secrets` scan zdrojů, `dist/` a `dist-school-server/`; nález hlásí pouze typ a soubor, nikoli tajnou hodnotu.
- Sync GHRAB AI Core používá lockfile instalaci bez lifecycle skriptů, auditu a fund síťových volání.
- Access bootstrap už do konzole nevypisuje libovolný objekt chyby, aby se minimalizovalo riziko úniku citlivého kontextu.

## Kompatibilita

Pedagogické funkce, vzhled, datové formáty a běžný pracovní postup se nemění. Serverless profil nadále vědomě dovoluje osobní Gemini klíč pouze pro relaci; school-server profil klientský provider klíč zakazuje a používá školní gateway.

## Stav

Kandidát pro první nezávislou kontrolu Claude. Nasazení až po GARP ověření a úspěšné GitHub Actions bráně.
