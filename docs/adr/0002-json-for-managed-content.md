---
status: accepted
---

# JSON soubory pro spravovaný obsah

Web čte spravovaný obsah z ověřovaných JSON souborů v repozitáři. Obrázkové soubory zůstávají v `public/` a JSON obsahuje jejich lokální cesty. Veřejná stránka a stránka `/admin` používají stejný zdroj dat.

Rozhodnutí odstraňuje externí službu pro ukládání obsahu. Git uchovává historii změn. Každá změna JSONu v repozitáři spustí nový deployment.

## Consequences

- Data akcí, galerie a krátkých videí se validují při načtení. Neplatný záznam se nezobrazí a ostatní záznamy zůstanou dostupné.
- Plakáty a fotky jsou verzované společně s JSON soubory.
- Při místním vývoji ukládá admin změny přímo do JSON souboru. Na Vercelu zapisuje JSON přes GitHub Contents API, protože souborový systém funkce neposkytuje trvalý zápis.
- Produkční admin potřebuje fine-grained GitHub token s oprávněním `Contents: Read and write`. Změna se na veřejném webu projeví po dokončení deploymentu spuštěného commitem.
- Admin zatím spravuje pouze akce. Fotky galerie a krátká videa zůstávají verzované v příslušných JSON souborech a editují se změnou repozitáře.
