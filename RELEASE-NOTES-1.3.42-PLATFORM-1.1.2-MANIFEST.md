# Diferenciátor 1.3.42 – Platform 1.1.2 Studio manifest alignment

Patch pro koordinovanou GHRAB Platform 1.1.2 release wave.

- `src/studio-manifest.template.json` nyní odpovídá skutečnému runtime/consumer stavu: Platform 1.1.2 a `>=1.1.2 <2.0.0`.
- Cache jméno v šabloně je navázáno na `__APP_VERSION__`, aby se při dalších patch verzích nemohlo znovu rozjet.
- Suite-session runtime, storage ownership a cleanup policy se funkčně nemění.
- Kandidát zůstává neprodukční do společného ověření celé wave.
