# Mélymerülés – ritka válaszok játéka

Magyar nyelvű, Krillion-szerű böngészős kvízjáték. Minden kérdés egy kategória, és minél ritkább a helyes válaszod, annál mélyebbre merülsz.

- **Egyjátékos mód:** azonnal indul, fiók nélkül.
- **Szoba (többjátékos):** a gazda létrehoz egy szobát, és elküldi a linket vagy az 5 betűs kódot. Mindenki a saját eszközén játszik, ugyanazokat a kérdéseket kapja, és minden kör után közös eredménytábla jelenik meg (az utolsó kör és a session összesítője). A kapcsolatot a PeerJS ingyenes nyilvános szervere hozza létre, fiók nem kell. A gazda oldala maradjon nyitva.
- 7 kérdés körönként, kérdésenként 25 mp. Az elfogadott válasz a ritkaságától függően 10–100 pontot ér, szobában +20 pont jár, ha senki más nem adta ugyanazt.
- A kb. 210 kérdés egy eszközön addig nem ismétlődik, amíg el nem fogy, utána új sorrendben indul újra.

## Fájlok
- `index.html`, `style.css`, `app.js` – a játék
- `questions.js` – a kérdésbank (a `q/*.json` fájlokból készül: `python3 tools/build.py`)
