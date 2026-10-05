---
status: accepted
---

# Sanity pro spravovaný obsah

Akce, plakáty, fotky galerie a odkazy na krátká videa uložíme v Sanity. Vlastní administrační ovládání zůstane přímo v Next.js webu a nebude používat Sanity Studio. Sanity Free jsme zvolili kvůli společnému API pro data a obrázky, 100GB limitu pro soubory a absenci dokumentovaného uspávání neaktivního projektu. Supabase Free má pro soubory 1 GB a může neaktivní projekt pozastavit; ukládání médií do Git repozitáře by dál zvětšovalo už nyní objemnou složku `public` a každá změna by vyžadovala nový deploy.

## Consequences

Zapisovací token smí používat pouze serverová část aplikace. Vlastní formuláře musí samy kontrolovat vstupy, protože validační pravidla Sanity Studia se na přímé API požadavky nevztahují.
