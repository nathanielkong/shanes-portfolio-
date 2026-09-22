# Shane Soon — Creative Portfolio

A faithful, self-hosted recreation of Shane Soon’s creative portfolio. It includes the complete home page, contact page, and seven project case studies with locally stored artwork, responsive scaling, scroll reveals, navigation, and the Sarawak Youth Talent slideshow.

## Local preview

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Netlify

The repository includes `netlify.toml`. Netlify will automatically run:

```bash
npm run build:netlify
```

and publish the generated `out` directory.

To deploy from a connected terminal:

```bash
npx netlify-cli login
npx netlify-cli deploy --prod --dir=out
```

## Validation

```bash
npm test
npm run build:netlify
```

The source portfolio pages are in `content/`; `scripts/import-readymag.mjs` can refresh the localized reference assets and generated markup.
