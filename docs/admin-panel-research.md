# Admin panel pro Malý Věci

Stav ověřený k 5. říjnu 2026. Výzkum vychází jen z dokumentace a ceníků provozovatelů.

## Stručný závěr

Statický vzhled dnešního webu není překážka. Projekt používá Next.js 15 s App Routerem a nemá zapnutý statický export. Vercel proto může ke stejné aplikaci automaticky přidat serverové funkce. Next.js umí formuláře přes Server Actions a Vercel Functions mohou obsloužit databázi, přihlášení i upload. [Next.js: mutace dat](https://nextjs.org/docs/app/getting-started/mutating-data), [Vercel Functions](https://vercel.com/docs/functions)

Nelze ale po odeslání formuláře přepsat `src/lib/data.ts` nebo přidat plakát do `public/` a čekat, že změna přežije. Filesystem Vercel Function je jen pro čtení, kromě dočasného `/tmp`. Vercel pro trvalé soubory doporučuje objektové úložiště. [Vercel runtimes](https://vercel.com/docs/functions/runtimes), [Vercel: práce se soubory ve Functions](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions)

Pro tento malý kapelní web bych volil jednu z těchto dvou cest:

1. **Sanity**, pokud má být hotový a pohodlný editor s uploadem, ořezem a náhledem bez vývoje vlastního admin rozhraní. Je to nejkratší cesta k dobrému výsledku.
2. **Supabase**, pokud má být admin opravdu součást webu na `/admin` a do budoucna se počítá s dalšími funkcemi. Je to víc vlastní práce, ale aplikace zůstane plně pod kontrolou.

Gitový Decap CMS dává smysl jako levná mezivarianta bez databáze. Vercel-native sestava s Blobem a samostatným PostgreSQL je funkční, ale pro tento projekt skládá zbytečně mnoho dílů.

## Co je dnes v repozitáři

- Akce jsou TypeScript pole v `src/lib/data.ts`. Změna se projeví až po novém buildu.
- Plakát je jen cesta v `poster_location`; soubor musí být v `public/`.
- Galerie čte obrázky z `public/gallery`. Skript `scripts/gen-gallery.mjs` při buildu vygeneruje `src/lib/gallery-images.ts` včetně rozměrů.
- Datum nemá jednotný formát. Historie používá `4.4.2026` i `2026-05-23` a poslední položka obsahuje neplatné `2027-0ý-2č`. Admin musí ukládat jednoznačné ISO datum `YYYY-MM-DD` a validovat ho před zápisem.
- `src/app/page.tsx` je klientská komponenta, ale to nebrání přidat samostatnou serverovou stránku `/admin`, Route Handlers ani Server Actions.

Minimální datový model akce by měl mít `id`, `title`, `starts_at`, `location`, `description`, `poster`, `is_public`, `created_at` a `updated_at`. `starts_at` je lepší než textové `date`, protože později unese i čas koncertu a správné řazení.

## Srovnání možností

| Varianta | Co dostaneme | Obrázky | Cena pro tento web | Slabina |
| --- | --- | --- | --- | --- |
| Sanity | Hotové Studio, přihlášení, datový model, drafty, uploady a CDN | Ořez a hotspot v editoru, transformace přes URL | Free: 20 uživatelů, 10 000 dokumentů, 100 GB assetů a 100 GB přenosu měsíčně | Data a editor jsou u další služby; vlastní specifické workflow vyžaduje konfiguraci Studia |
| Supabase | Postgres, Auth, Storage a pravidla přístupu v jednom projektu | Upload ano; serverové resize/crop transformace až na Pro | Free: 500 MB DB, 1 GB souborů, 5 GB egress; Pro od 25 USD měsíčně | Vlastní `/admin` se musí navrhnout, naprogramovat a zabezpečit |
| Vercel-native | Vlastní `/admin`, Vercel Functions, Blob a Postgres z Marketplace | Blob ukládá originály; zobrazení může optimalizovat `next/image` | Blob Hobby: 1 GB, 10 000 jednoduchých a 2 000 pokročilých operací, 10 GB přenosu | Vercel Postgres už neexistuje; databáze je Neon, Supabase nebo jiný partner. Auth a editor jsou další rozhodnutí |
| Decap CMS + Git | `/admin` zapisuje obsah a média do repozitáře, push spustí Vercel build | Upload, převod do WebP/JPEG, komprese, resize a pevný ořez v prohlížeči | Decap je open source; náklady mohou zůstat nulové | Změna není živá do dokončení buildu, média zvětšují Git a GitHub backend potřebuje OAuth proxy nebo Decap Turbo |

### 1. Sanity

Sanity Studio generuje editor z TypeScript schématu. Lze ho hostovat na Sanity doméně, samostatně, nebo vložit do Next aplikace. Studio běží jako statická SPA a komunikuje s Content Lake přes API. [Sanity Studio](https://www.sanity.io/docs/studio), [hosting Studia](https://www.sanity.io/docs/studio/deployment)

Pro tento web by vznikl typ `event` s datem, místem, popisem, publikací a polem `poster`. Galerie může být druhý typ nebo dokument s polem obrázků. Frontend by místo importu `events` načetl GROQ dotaz. Po publikaci lze stránku invalidovat webhookem nebo ji číst přes CDN.

Obrázkový typ ve Studiu umí upload, drag and drop, crop a hotspot. Hotspot hlídá důležitou část snímku při různých poměrech stran. CDN umí za běhu měnit velikost, ořez, kvalitu, formát a další parametry přes URL. [Sanity: image field](https://www.sanity.io/docs/studio/image-type), [Sanity: transformace obrázků](https://www.sanity.io/docs/apis-and-sdks/image-urls)

Free plán je pro velikost tohoto webu velkorysý. Aktuálně nabízí 20 míst, 10 000 dokumentů, 100 GB assetů, 100 GB měsíčního přenosu, milion CDN požadavků a bezplatný hosting Studia. Free plán má tvrdé limity místo placených přesahů. Growth stojí 15 USD za uživatele měsíčně. [Sanity pricing](https://www.sanity.io/pricing), [Sanity: kvóty](https://www.sanity.io/docs/help/understanding-quotas)

Verdikt: nejlepší poměr hotového editoru, práce s fotkami a množství implementace. Pro jednoho až několik správců stačí Free. Není nutné budovat vlastní přihlašování ani správu souborů.

### 2. Supabase a vlastní `/admin`

Supabase spojuje PostgreSQL, přihlášení a objektové úložiště. Má oficiální postup pro cookie-based Auth v Next.js App Routeru. Přístup k tabulkám a souborům lze omezit pomocí PostgreSQL Row Level Security. [Supabase Auth pro Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [řízení přístupu ke Storage](https://supabase.com/docs/guides/storage/security/access-control)

Navrhovaná podoba:

- veřejný web smí pouze číst publikované akce;
- přihlášený správce smí vytvářet, měnit a mazat akce a uploadovat do bucketu `posters`;
- `/admin/events` obsahuje seznam a formulář;
- Server Action po uložení zavolá `revalidatePath("/")`;
- browser nebo server před uploadem zkontroluje MIME typ, rozměry a velikost;
- aplikační tajný klíč nikdy nesmí do prohlížeče.

Free obsahuje 500 MB databáze, 1 GB souborů, 5 GB egress a 50 000 měsíčně aktivních uživatelů. Neaktivní Free projekt se po týdnu pozastaví. Pro začíná na 25 USD měsíčně, obsahuje 8 GB DB, 100 GB storage a 250 GB egress. [Supabase pricing](https://supabase.com/pricing), [Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase)

Storage umí serverové změny velikosti, ořez a automatický WebP, ale pouze na Pro a vyšším plánu. Limit vstupu pro transformaci je 25 MB a 50 megapixelů, výstupní rozměr nejvýše 2500 px. Pro zahrnuje 100 originálních obrázků, další stojí 5 USD za 1000. [Supabase image transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)

Verdikt: správná volba pro vlastní značkový admin a budoucí funkce. Pro samotné akce a plakáty je však vývojově dražší než Sanity. Na Free plánu bych resize a kompresi udělal před uploadem v prohlížeči; serverové transformace nejsou dostupné.

### 3. Vercel-native: Blob a Marketplace Postgres

Vercel Blob je vhodný pro veřejné plakáty. Přímý client upload pošle velký soubor z prohlížeče rovnou do Blobu a server vydá jen krátkodobý token, takže soubor neprochází limitem funkce. [Vercel Blob](https://vercel.com/docs/vercel-blob), [client uploads](https://vercel.com/docs/vercel-blob/client-upload)

Hobby zahrnuje 1 GB uložených dat, prvních 10 000 jednoduchých operací, 2 000 pokročilých operací a 10 GB přenosu. Nad rámec jsou uváděné sazby 0,023 USD za GB storage, 0,40 USD za milion jednoduchých operací, 5 USD za milion pokročilých operací a 0,05 USD za GB přenosu. U Hobby se po překročení limitu služba zastaví, neúčtuje přesah. [Vercel Blob pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)

Starý produkt Vercel Postgres už není k dispozici. Vercel ho v prosinci 2024 převedl na Neon a pro nové projekty nabízí PostgreSQL přes Marketplace, například Neon nebo Supabase. Marketplace vloží přihlašovací údaje do environment variables a může sjednotit vyúčtování. [Postgres on Vercel](https://vercel.com/docs/postgres), [Marketplace storage](https://vercel.com/docs/marketplace-storage)

Pro samotné zobrazování umí Vercel optimalizovat lokální i vzdálené obrázky přes `next/image`. Na Hobby je nyní zahrnuto 5 000 transformací, 300 000 cache read units a 100 000 cache write units měsíčně. To je optimalizace doručení, ne editor, ve kterém správce ručně ořízne plakát nebo přidá text. [Vercel Image Optimization](https://vercel.com/docs/image-optimization), [limity a ceny](https://vercel.com/docs/image-optimization/limits-and-pricing)

Verdikt: technicky čisté napojení na současný hosting, ale ne nejjednodušší produkt. Blob řeší soubory, Marketplace Postgres data a ještě zbývá Auth a celé administrační UI. Supabase je pro malý tým soudržnější balík.

### 4. Decap CMS bez databáze

Decap CMS je webový editor nad Git repozitářem. Backend čte a zapisuje soubory přes API GitHubu nebo jiného Git hostingu. Pro tento projekt by se `events` přesunuly z TypeScriptu do JSON, YAML nebo Markdown kolekce a obrázky by dál mohly končit v `public/`. Vercel po každém pushi automaticky vytvoří nový deployment. [Decap backends](https://decapcms.org/docs/backends-overview/), [Vercel Git deployments](https://vercel.com/docs/git)

Decap umí image widget a media library. Současné `media_processing` ještě před uložením v prohlížeči umí JPEG, PNG a WebP převést, zmenšit, komprimovat, odstranit metadata a oříznout na zadaný poměr stran. Není to volný editor plakátu. Je to spíš automatická příprava souboru. [Decap image widget](https://decapcms.org/docs/widgets/image/), [Decap media processing](https://decapcms.org/docs/configuration-options/#media-processing)

GitHub přihlášení vyžaduje OAuth proxy, případně hostovaný Decap Turbo. Editorial workflow může pro každou nepublikovanou změnu vytvořit pull request. [Decap OAuth backend](https://decapcms.org/docs/backends-overview/#using-github-with-an-oauth-proxy), [editorial workflow](https://decapcms.org/docs/editorial-workflows/)

Verdikt: dobrý kompromis, pokud změny probíhají párkrát měsíčně a čekání na build nevadí. Zachová jednoduchý statický provoz a historii všech změn v Gitu. Nevýhodou je růst repozitáře s každou fotkou a méně uhlazené přihlášení než u Sanity.

## Co znamená „modifikovat fotky“

Tady jsou tři odlišné požadavky, které se často směšují:

- Automatická příprava při uploadu: zmenšit, převést na WebP, zkomprimovat a odstranit EXIF. To zvládne Decap v prohlížeči nebo vlastní admin před uploadem.
- Nedestruktivní ořez pro web: uložit originál a v editoru nastavit crop/hotspot. Tohle má dobře vyřešené Sanity.
- Skutečný editor: ruční crop, otočení, flip, text a grafické overlaye. Pro to je vhodný Cloudinary Media Editor, který lze vložit do vlastního adminu. Free plán má 25 měsíčních kreditů; jeden kredit odpovídá 1 GB storage, 1 GB image bandwidth nebo 1000 transformací a spotřeba se sčítá. [Cloudinary Media Editor](https://cloudinary.com/documentation/media_editor), [Cloudinary billing](https://cloudinary.com/documentation/billing_and_plans), [Cloudinary pricing](https://cloudinary.com/pricing)

Cloudinary bych nepřidával, pokud „modifikovat“ znamená jen správně oříznout plakát a zmenšit fotku. Sanity crop/hotspot nebo upload preprocessing stačí. Cloudinary má smysl až pro textové vrstvy, loga, více přednastavených výstupů nebo práci připomínající lehký grafický editor.

## Doporučený postup

### Doporučení A: Sanity

Nejprve převést jen akce a plakáty. Galerie může v první verzi zůstat v `public/gallery`, takže migrace nebude zbytečně velká.

1. Definovat Sanity typ `event` a ověřit český editor na několika testovacích akcích.
2. Importovat současné akce a opravit datum na ISO.
3. Napojit `EventSection` na Sanity dotaz a ponechat stejné komponenty i vzhled.
4. Přidat revalidaci po publikaci.
5. Teprve pokud se Studio osvědčí, přesunout galerii a členy kapely.

Tato varianta nejlépe odpovídá požadavku „přidávat akce a plakáty z webu“ a zároveň nevyžaduje udržovat vlastní auth a formulářový systém.

### Doporučení B: Supabase

Zvolit, pokud je podmínkou vlastní `/admin` na stejné doméně nebo se plánují další aplikační funkce. První iterace by měla obsahovat jen login jednoho správce, CRUD akcí, upload plakátu, validaci a auditní timestampy. Mazání souboru je vhodné oddělit od mazání záznamu a před odstraněním zkontrolovat, zda stejný plakát nepoužívá jiná akce.

## Rozhodnutí jednou větou

Pro malý kapelní web bych nezačínal databází jen proto, že „admin ji obvykle má“. Vzal bych Sanity, protože už obsahuje editor, přihlášení, média a rozumné úpravy obrázků. Supabase bych vybral jen tehdy, když je vlastní administrační rozhraní součástí cíle, ne pouze prostředkem k pohodlnému přidávání akcí.
