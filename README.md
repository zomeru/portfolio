# Portfolio

## Sanity Studio

The Studio lives in `apps/studio` and selects its dataset centrally:

- Local development and the `dev` branch use `development`.
- The `main` branch uses `production`.
- `SANITY_STUDIO_DATASET` explicitly overrides the branch default.

Copy `apps/studio/.env.example` to `apps/studio/.env.local` (or export the variables in your shell), then run:

```sh
pnpm --filter @portfolio/studio dev
```

Create the development dataset once before starting the Studio:

```sh
pnpm --filter @portfolio/studio exec sanity dataset create development
```

The command may prompt for authentication. Configure CORS origins for local Studio development and each hosted Studio in the Sanity project settings.

### GitHub deployment

`.github/workflows/deploy-studio.yml` validates, builds, and deploys only when Studio-related files change. It targets the `development` GitHub environment for `dev` and `production` for `main`.

For each GitHub environment, add these configuration values:

- `SANITY_AUTH_TOKEN` secret: a Sanity token with permission to deploy the Studio.
- `SANITY_STUDIO_PROJECT_ID` variable: `vap9ch2u` (or your replacement project ID).
- `SANITY_STUDIO_APP_ID` variable: the hosted Studio app ID for that environment. Create a separate hosted Studio for development so development deployments cannot replace the production Studio.
