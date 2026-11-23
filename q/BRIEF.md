# Kérdésíró brief – magyar "ritka válasz" kvízjáték (Krillion-szerű)

## Cél
Egy magyar nyelvű böngészős kvízjátékhoz kérdéseket írsz. Minden kérdés egy NYITOTT KATEGÓRIA ("Mondj egy ..."), amire SOK helyes válasz létezik. A játékos egy választ gépel be 25 mp alatt. Minél ritkábban jutna eszébe egy átlagos magyar felnőttnek az adott helyes válasz, annál több pont jár érte. A pontozás a te ritkasági besorolásodon múlik, ezért ez a lényeg.

## Ritkasági szintek (tier)
- 1 = Plankton (10 pont): a 2–4 legnyilvánvalóbb válasz, ami szinte mindenkinek elsőre eszébe jut
- 2 = Túl okos (15 pont): még mindig nagyon gyakori, a "második hullám" (2–4 db)
- 3 = Kishal (30 pont): ismert, de nem első gondolat
- 4 = Ritka (60 pont): kevesen mondanák
- 5 = Mélytengeri (85 pont): csak az igazán jártasaknak jut eszébe
- 6 = Egy a krillióhoz (100 pont): nagyon ritka, de MÉG MINDIG ELLENŐRIZHETŐEN HELYES válasz

## Követelmények
- Pontosan 35 kérdés a megadott témában, változatos alkategóriákkal. Ne legyen két nagyon hasonló kérdés.
- Kérdésenként legalább 20, ideálisan 25–40 helyes válasz. Lehetőleg a TELJES halmaz, ha az kezelhető (pl. megyék, bolygók), különben a legjobb 25–40.
- Minden válasz 100%-ig tényszerűen helyes legyen. Ha bizonytalan vagy egy válaszban, hagyd ki.
- A kérdés legyen egyértelmű, zárt halmaz (ne "Mondj egy szép szót"). Ne kérj évszámot vagy számot válaszként, hanem neveket/szavakat.
- Kerüld azokat a kérdéseket, ahol a válaszok nagyon hosszúak vagy nehezen begépelhetők.
- Aliasok: minden válaszhoz add meg a gyakori alternatív írásmódokat/neveket "|" jellel elválasztva (pl. "Párizs|Paris", "Egyesült Államok|USA|Amerika|Egyesült Államok of America" – csak valós változatok). Ékezet nélküli változatot NEM kell megadni (a játék automatikusan kezeli), kis-nagybetű sem számít. Személyeknél a vezetéknév (ha egyértelmű) legyen alias: "Petőfi Sándor|Petőfi".
- Egy alias ne szerepeljen két különböző válasznál ugyanazon kérdésen belül.
- Tier-eloszlás kérdésenként kb.: 1-esből 2–4, 2-esből 2–4, a többi a 3–6 között, 6-osból legalább 2.
- A kérdés szövege rövid, magyar, felszólító ("Mondj egy ...!" vagy "Nevezz meg egy ...!"), max ~90 karakter. Ha szükséges, adj egy rövid pontosítást a "hint" mezőben (pl. "Elég a vezetéknév."), egyébként hagyd üresen.

## Kimeneti formátum
Egyetlen JSON fájl, egy tömb, pontosan ebben a szerkezetben:
[
  {"id":"PREFIX001","cat":"Témanév","q":"Mondj egy európai fővárost!","hint":"","a":[["Budapest",1],["Párizs|Paris",1],["Vaduz",6]]}
]
- id: a megadott PREFIX + háromjegyű sorszám (001–035).
- cat: rövid magyar témacímke (pl. "Földrajz", "Állatok", "Film").
- a: [válasz-aliasokkal, tier] párok tömbje.
- Érvényes JSON legyen (dupla idézőjel, nincs záró vessző). Ellenőrizd: `python3 -c "import json;d=json.load(open('FÁJL'));print(len(d))"`.

## Mit ne csinálj
- Ne írj semmilyen más fájlt, ne nyúlj más fájlokhoz a mappában.
- Ne másold ki a válaszokat a fő beszélgetésbe; a végén csak egy 2 soros összefoglalót adj vissza (kérdések száma, átlagos válaszszám, fájl útvonala).

## Sikerkritérium
35 érvényes kérdés, mindegyikben ≥20 tényszerűen helyes válasz, ésszerű ritkasági besorolással, a megadott fájlban.
