# Plakáty akcí

V editoru existující akce vyberte JPEG, PNG nebo WebP do 3,5 MB. Před uložením se zobrazí náhled. Tlačítko "Uložit plakát" přidá nebo nahradí plakát. "Odebrat plakát" odstraní plakát a zachová akci.

Server ověřuje obsah obrázku dekódováním. Přijímá neanimované obrázky do 40 milionů pixelů a ukládá původní soubor bez úprav do `public/posters/`. Cestu zapisuje do `src/content/events.json`.

Místní vývoj zapisuje soubory přímo. Produkce používá nastavení `GITHUB_REPOSITORY`, `GITHUB_CONTENTS_TOKEN` a volitelně `GITHUB_CONTENTS_BRANCH`. Obrázek, záznam akce a odstranění nepoužívaného původního souboru ukládá jedním commitem přes GitHub API. Veřejný web změnu zobrazí po dokončení nasazení. Na preview nasazeních jsou změny plakátů zakázané.

Původní soubor zůstane zachovaný, pokud na jeho název odkazuje další akce nebo jiný textový soubor v repozitáři. Kontrola zahrnuje také galerii a zdrojový kód. Symbolické odkazy se nemažou. Pokud nelze odkazy ověřit, změna se neuloží.
