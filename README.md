# Numbers — Welzijn Portaal

Een welzijnspulse voor Namber: korte vragenrondes, per persoon willekeurig
getrokken, met een dashboard dat live meebeweegt terwijl de antwoorden
binnenkomen.

| Route | Wat het is |
|---|---|
| `/` | Het portaal (demo van de inrichting) |
| `/beheer` | Ronde openen en de links kopiëren — je stuurt ze zelf |
| `/vragen/[token]` | De vragen van één deelnemer, 5 of 12, willekeurig getrokken |
| `/live/[pulse]` | Het dashboard, ververst elke drie seconden |

Zie [`docs/live-rondes.md`](docs/live-rondes.md) voor de volledige route en
[`docs/data-pipeline-plan.md`](docs/data-pipeline-plan.md) voor hoe antwoorden
cijfers en inzichten worden — inclusief waar deze versie daar bewust van
afwijkt. Omgevingsvariabelen staan in `.env.example`.

---

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
