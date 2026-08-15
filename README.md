# vcl

Build a **virtual combinatorial library** in the browser: draw a core structure
carrying R groups, draw the fragments that may replace them, and enumerate every
combination together with its predicted properties.

Deployed at <https://vcl.cheminfo.org>.

This application replaces the older
[cheminfo visualizer view](https://www.cheminfo.org/?viewURL=https%3A%2F%2Fcouch.cheminfo.org%2Fcheminfo-public%2F65f84b002399eb79ec0f8bf145fbd24f%2Fview.json&loadversion=true&fillsearch=Virtual+combinatorial+library)
of the same name.

## What it does

1. **Core** — draw the scaffold and mark up to four substitution points, `R1` to
   `R4`: hover an atom in the editor, type `R1` and press Enter.
2. **Fragments** — draw each building block with exactly one R atom marking where
   it attaches, and tick which core positions it may occupy.
3. **Generate** — every combination is enumerated in a Web Worker, so the page
   stays responsive. The default pyridine library expands 4096 combinations into
   3872 distinct molecules.
4. **Explore** — brush any axis of the parallel coordinates plot to filter the
   library; the table and the downloads follow the selection.
5. **Download** — SDF, SMILES or CSV of the filtered set.

Everything runs client-side: no structure ever leaves the browser.

The enumeration itself is [`combineSmiles`](https://github.com/cheminfo/openchemlib-utils)
from `openchemlib-utils`; structures are drawn and rendered with
[`react-ocl`](https://github.com/zakodium-oss/react-ocl) and the predicted
properties come from [OpenChemLib](https://github.com/cheminfo/openchemlib-js).

## Local development

```sh
npm install
npm run dev
```

The dev server listens on <http://localhost:10812> (the host port `10811` plus
one).

```sh
npm run test     # unit tests, type-check, eslint and prettier
npm run build    # production bundle into dist/
```

## Deployment

Copy the env template and pick a deployment mode by uncommenting exactly one
`COMPOSE_FILE` line:

```sh
cp .env.example .env
docker compose up -d
```

| Mode                     | `COMPOSE_FILE`             | Exposure                                    |
| ------------------------ | -------------------------- | ------------------------------------------- |
| Port published (default) | `compose.yaml`             | Publishes `PORT` on the host                |
| Traefik                  | `compose.traefik.yaml`     | `vcl.cheminfo.org` on the `traefik` network |
| Cloudflare Tunnel        | `compose.cloudflared.yaml` | No published port                           |

Build from the checkout instead of pulling the released image with
`docker compose up -d --build`.

## Deploy and rollback

Never deploy with `git pull && docker compose up -d --build`: the build
overwrites the running tag in place and `git pull` moves the source at the same
time, so there is nothing left to go back to. Use `./deploy.sh`.

```sh
./deploy.sh                                  # pull, build, start, health-check, auto-revert on failure
./deploy.sh rollback                         # back to the previous known-good deploy
./deploy.sh rollback 20260801-1332-a1b2c3d   # back to a specific one
./deploy.sh list                             # what is running, and what can be rolled back to
./deploy.sh prune                            # drop images older than the last 10 deploys
```

Each deploy builds an immutable tag `<utc date>-<utc hhmm>-<short sha>`, writes
it to `IMAGE_TAG` in `.env`, and appends `date tag commit` to
`.deploy/history`. The new container is probed on `/` from inside the container
— the traefik and cloudflared modes publish no host port — and automatically
reverted if it does not answer. A rollback rewrites `IMAGE_TAG` and checks out
the recorded commit, so the image and the compose file that goes with it move
back together; it needs no build and no network.

## Environment variables

| Variable       | Default                             | Used by                    | Description                                                                  |
| -------------- | ----------------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| `COMPOSE_FILE` | unset                               | `docker compose`           | Selects the deployment mode. Unset means `compose.yaml`.                     |
| `PORT`         | `10811`                             | every compose file         | Port the container serves on, and publishes for `compose.yaml`.              |
| `IMAGE_NAME`   | `ghcr.io/cheminfo/vcl.cheminfo.org` | every compose file         | Image the compose files run.                                                 |
| `IMAGE_TAG`    | `latest`                            | every compose file         | Rewritten by `./deploy.sh` on each deploy and rollback — never edit by hand. |
| `TUNNEL_TOKEN` | unset                               | `compose.cloudflared.yaml` | Cloudflare Tunnel connector token.                                           |

The Vite dev server port (`10812`, the host port plus one) is a constant in
`vite.config.ts`; there is no env var for it.

## Reference

Vanderveen J. R.; Patiny, L.; Chalifoux C. B.; Jessop M. J.; Jessop P. G.
[_A virtual screening approach to identifying the greenest compound for a task:
application to switchable-hydrophilicity solvents_](https://doi.org/10.1039/C5GC01022E),
_Green Chem._, **2015**.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
