# GARP 2.7 cross-app review — Diferenciátor 1.3.49

Datum: 2026-09-24

## Rozhraní vůči AI Studiu

- appId zůstává `differentiator`;
- Studio manifest, launch/manual URL, Platform 1.1.2 contract a Studio Bridge zůstávají kompatibilní;
- `app-updated` se odesílá až po ověření živého `release-integrity.json`;
- Safe Promotion zůstává `candidate -> PR -> protected main`;
- změna GARP baseline vyžaduje následnou aktualizaci `src/config/release-promotion-policy.json` v AI Studiu.

## Rozhraní vůči AI Core / Platform

- AI Core zůstává 1.0.0, přesně 7 operací;
- GHRAB Platform zůstává 1.1.2;
- žádná nová provider capability ani cross-app oprávnění nejsou přidána;
- suite-session a target-scoped handoff semantics se nemění.

## Závěr

Migrace nevytváří breaking změnu veřejných cross-app kontraktů. Ekosystémový dopad je metadata/assurance: AI Studio musí po ověřeném release přepnout Diferenciátor na schválenou baseline GARP 2.7 a současně opravit již migrovaný Generátor, který ve Správě dosud vykazuje starou baseline.
