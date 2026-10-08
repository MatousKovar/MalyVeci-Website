This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Akce a spravovaný obsah

Veřejný web čte akce z `src/content/events.json`. Admin při místním vývoji zapisuje změny přímo do tohoto souboru. V produkci vytvoří commit přes GitHub API. Vercel pak spustí nový deployment a veřejný web změnu ukáže po jeho dokončení.

Pro zápis z produkčního adminu nastav ve Vercelu `GITHUB_REPOSITORY` na `MatousKovar/MalyVeci-Website` a `GITHUB_CONTENTS_TOKEN` na fine-grained personal access token omezený na tento repozitář s oprávněním `Contents: Read and write`. Proměnné přidej jen do Production. `GITHUB_CONTENTS_BRANCH` může určit jinou cílovou větev; výchozí hodnota je `main`. Token uchovávej jako neveřejnou proměnnou. GitHub vyžaduje pro vytvoření nebo změnu souboru v repozitáři oprávnění `Contents: write` ([GitHub REST API](https://docs.github.com/en/rest/repos/contents#fine-grained-access-tokens-for-create-or-update-file-contents)).

## Admin login

`/admin` accepts one shared admin password. Run `npm run admin:secrets` to choose it. The script hides the password while you type, writes its scrypt hash and a signing secret to `.env.local`, and never prints either value. Restart the dev server to load them. For Vercel, copy `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` from `.env.local` into the project environment variables, then redeploy. Add them to Production and Preview only if those deployments should allow admin login.

The app stores only a scrypt password hash. After a successful login, it signs an HttpOnly, SameSite cookie that expires after 30 days. Write actions call `requireAdminSession()` from `src/lib/admin/session.ts` before changing data.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
