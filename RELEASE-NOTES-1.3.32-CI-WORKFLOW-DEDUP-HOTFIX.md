# Diferenciátor 1.3.32 — CI workflow dedup hotfix

Datum: 2026-08-18

## Důvod

Legacy P3 a Legacy P4 automaticky delegovaly na dlouhý P5 R2 release gate. Současně stejný plný gate běžel v samostatném P5 workflow a znovu také v deploy workflow. Jeden push tak mohl zbytečně opakovat stejnou nákladnou sadu kontrol.

## Změny

- `.github/workflows/p3-quality.yml`: pouze ruční `workflow_dispatch`; při ručním spuštění používá odpovídající `qa:p3:ci`.
- `.github/workflows/p4-release.yml`: pouze ruční `workflow_dispatch`; kompatibilní P4 gate zůstává dostupný na vyžádání.
- `.github/workflows/p5-release-gate.yml`: zůstává automatický na push/PR a jako jediný automaticky spouští celý `qa:p5:ci`.
- `.github/workflows/deploy.yml`: spouští se po úspěšném P5 `workflow_run` pro push do `main`, checkoutuje přesný `head_sha`, provede pouze `npm run build` + `npm run qa:platform` a nasadí GitHub Pages. Ruční deploy zůstává dostupný přes `workflow_dispatch`.
- T28 nyní kontroluje PDF toolchain u workflow, která skutečně přímo spouštějí `qa:p5:ci`.
- Nová T38 hlídá, že Legacy P3/P4 nejsou automatické, deploy P5 neopakuje a navazuje na úspěšný P5 run stejného commitu.

## Dopad

Běžný push/PR již nespouští plný P5 gate přes legacy entrypointy. Deploy rovněž neopakuje celý P5; k nasazení dojde až po úspěchu P5 na příslušném pushi do `main`.
