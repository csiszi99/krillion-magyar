# Ellenőrzés: újonnan hozzáadott válaszok

Egy magyar "ritka válasz" kvíz (a játékos egy választ gépel, a lista alapján fogadja el vagy utasítja el) válaszlistáit egy másik modell kibővítette. A te dolgod **csak az új elemek** ellenőrzése. A hibás elfogadás rosszabb, mint egy hiányzó válasz.

Bemenet: a megadott diff-fájl (kérdésenként: ÚJ VÁLASZOK tierrel, ÚJ ALIASOK). A tényleges adat: /home/claude/krillion/q/<fájl>.json.

## Teendő
1. Olvasd végig a diffet. Minden új válasznál döntsd el: helyesen felel-e a kérdésre (a hint-et is figyelembe véve)? Minden új aliasnál: valóban ugyanarra a dologra utal-e, és nem túl általános-e (nem okoz-e téves egyezést más válasszal)?
2. **Ha egy új válasz egy meglévő válasz másik alakja/beceneve/szinonimája (pl. "X vára", "X-hegység", "X kutya", rövidített cím), NE töröld, hanem tedd át aliasként a meglévő elemhez** (így a játékos beírása továbbra is elfogadott marad). A hibás vagy kétes elemeket töröld a JSON-ból szkripttel (új választ egészében, rossz aliast csak az adott aliast). Nyilvánvalóan rossz tiert (pl. mindenki által ismert válasz 6-os szinten) javíts.
3. A végén: `cd /home/claude/krillion && python3 tools/build.py` – a te fájljaidra jelzett hibákat javítsd.
4. Írj változásnaplót: /home/claude/krillion/q/review2_<NEVED>.md (csak a törölt/javított elemek, kérdésenként egy sor, rövid indokkal).

## Kimenet a fő beszélgetésbe
3–4 sor: hány új elemet néztél át, hányat töröltél/javítottál, a leggyakoribb hibatípus (ez a bővítő briefjének javításához kell).

## Ne csináld
- Ne adj hozzá új válaszokat, ne nyúlj a régi (diffben nem szereplő) elemekhez, se más fájlokhoz.
