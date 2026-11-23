# Ellenőrzési feladat – magyar "ritka válasz" kvíz kérdésbankja

Egy Krillion-szerű böngészős játék kérdéseit ellenőrzöd. Minden kérdés egy nyitott kategória ("Mondj egy ...!"), a játékos 25 mp alatt EGY választ gépel be. A válaszlista elemei: ["Fő név|alias|alias", tier]. Tier: 1=Plankton 10p (a 2–4 legnyilvánvalóbb), 2=Túl okos 15p (a következő 2–4 nagyon gyakori), 3=Kishal 30p, 4=Ritka 60p, 5=Mélytengeri 85p, 6=Egy a krillióhoz 100p (nagyon ritka, de helyes). A játék a kis/nagybetűt, ékezetet, szóközt, írásjelet figyelmen kívül hagyja, és 1–2 betűs elírást tolerál.

## Mit kell tenned (a megadott fájlokban, HELYBEN szerkesztve)
1. **Tényhibák**: távolíts el minden választ, ami nem felel meg a kérdés feltételének, vagy amiben nem vagy biztos. Ez a legfontosabb: egy hibás elfogadott válasz rosszabb, mint egy hiányzó.
2. **Kérdés minősége**: ha egy kérdés kétértelmű vagy rosszul feltett, pontosítsd a szövegét vagy a "hint" mezőt (rövid). Ha javíthatatlan, cseréld ki egy új, ugyanabba a témába illő kérdésre (ugyanazzal az id-vel).
3. **Tier-besorolás**: javítsd, ami nyilvánvalóan rossz (pl. egy hétköznapi, mindenkinek eszébe jutó válasz 5-6-os tierben, vagy egy szakmai ritkaság 1-esben). Gondolj egy átlagos magyar felnőttre.
4. **Aliasok**: adj hozzá hiányzó gyakori alternatív neveket/írásmódokat (magyar és nemzetközi név, rövid név, vezetéknév személyeknél). Ügyelj, hogy egy alias ne legyen két válasznál ugyanazon a kérdésen belül, és ne legyen olyan rövid/általános alias, ami félrevezető egyezést okoz (pl. 1-2 betűs).
5. **Hiányzó nyilvánvaló válaszok**: ha egy nagyon gyakori helyes válasz kimaradt, add hozzá a megfelelő tierrel (különben a játékos joggal bosszankodik).
6. Ne változtasd meg a fájlok szerkezetét és az id-ket. A végén ellenőrizd: `python3 -c "import json;print(len(json.load(open('FÁJL'))))"` és futtasd: `cd /home/claude/krillion && python3 tools/build.py` – a kiírt problémák közül a te fájljaidra vonatkozókat javítsd.

## Kimenet
- A javított fájlok helyben.
- Egy rövid változásnapló: /home/claude/krillion/q/review_<NEVED>.md (kérdésenként 1 sor csak ott, ahol változtattál: id – mit és miért).
- A fő beszélgetésbe csak 3-4 soros összefoglalót adj vissza (hány választ töröltél, hány tiert javítottál, hány kérdést cseréltél, a leggyakoribb hibatípus).

## Ne csináld
- Ne nyúlj a többi fájlhoz (app.js, index.html, más témák json-jai).
