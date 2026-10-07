---
status: accepted
---

# JSON soubory pro spravovaný obsah

Web čte spravovaný obsah z ověřovaných JSON souborů v repozitáři. Obrázkové soubory zůstávají v `public/` a JSON obsahuje jejich lokální cesty. Veřejná stránka a stránka `/admin` používají stejný zdroj dat.

Rozhodnutí omezuje provozní závislosti na externím úložišti pro malý web s několika akcemi, fotkami a odkazy na videa. Git uchovává historii změn. Každá změna obsahu v repozitáři spustí nový deployment.

## Consequences

- Data akcí, galerie a krátkých videí se validují při načtení. Neplatný záznam se nezobrazí a ostatní záznamy zůstanou dostupné.
- Plakáty a fotky jsou verzované společně s JSON soubory.
- Vercel neposkytuje trvalý zápis do souborového systému aplikace. Správce proto musí ukládat změny přes Git, nebo přes jinou trvalou službu. Navazující tickety pro správu řeší zapisovací workflow.
- Issue #27 mění čtení akcí; existující zapisovací akce dočasně stále používají Sanity, dokud je nepřevedou navazující tickety.
