# Bővítési feladat – magyar "ritka válasz" kvíz elfogadott válaszai

Egy Krillion-szerű játék kérdésbankját bővíted. A játékos egy választ gépel be; ha nincs a listán, a játék elutasítja. A felhasználó panasza: túl sok jogos válasz kerül elutasításra. **Cél: minden kérdésnél a lehető legteljesebb, de 100%-ban helyes válaszlista.**

Formátum: `{"id","cat","q","hint","a":[["Fő név|alias|alias", tier], ...]}`. Tier: 1=Plankton 10p (2–4 legnyilvánvalóbb), 2=Túl okos 15p (következő 2–4 nagyon gyakori), 3=Kishal 30p (ismert), 4=Ritka 60p, 5=Mélytengeri 85p, 6=Egy a krillióhoz 100p (nagyon ritka, de helyes). A játék a kis/nagybetűt, ékezetet, szóközt, írásjelet figyelmen kívül hagyja, és 5+ betűnél 1 betű elírást tolerál – ezeket NE add meg aliasként.

## Teendő minden kérdésnél, a megadott fájl(ok)ban HELYBEN
1. Gondold végig, mit gépelne be egy átlagos magyar játékos: hétköznapi nevek, gyűjtőnevek, köznyelvi formák, márkanevek (ha a kérdés megengedi), magyar és eredeti nevek, rövid nevek, vezetéknév személyeknél, gyakori másik írásmód (pl. "Coca-Cola|kóla|coca cola"). Add hozzá mindet, ami helyes és még hiányzik.
2. Bővítsd a ritkább, de helyes válaszokkal is (4–6 tier), ahol a halmaz ezt engedi. Zárt halmaznál (pl. megyék, bolygók, elemek) legyen teljes.
3. Ellenőrizd a meglévő elemeket is: ha egy alias hiányzik (pl. magyar név mellől az angol), pótold.
4. Méret: ahol a halmaz nagy, célozz kérdésenként legalább 80–150 elfogadott választ. Mennyiségért ne áldozz helyességet: ha nem vagy biztos, hagyd ki.
5. Új válasz nem lehet egy meglévő válasz aliasa (ne legyen duplikátum); egy alias ne szerepeljen két válasznál ugyanazon kérdésen belül; ne adj 1–2 betűs általános aliast, ami félrevezető egyezést okoz.
6. Ne változtasd a kérdések szövegét, id-jét, a meglévő válaszok tierjét (kivéve nyilvánvaló hiba), és ne törölj meglévő választ.
7. Szkripttel dolgozz (Python): olvasd be a JSON-t, add hozzá a listákat, írd vissza `json.dump(..., ensure_ascii=False, indent=1)`-gyel. A végén futtasd: `cd /home/claude/krillion && python3 tools/build.py` – a te fájljaidra jelzett problémákat javítsd.

## Kimenet
- A bővített fájl(ok) helyben.
- Csak 2–3 soros összefoglaló a fő beszélgetésbe (hány válasz lett hozzáadva összesen, legkisebb/átlagos válaszszám kérdésenként, bizonytalan területek).

## Ne csináld
- Ne nyúlj más fájlokhoz (app.js, index.html, más témák json-jai, tools/).
