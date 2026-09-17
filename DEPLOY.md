# Deploy to GitHub Pages

Site URL: https://powwow8806.github.io/democasino/

## Option A — branch / docs folder

1. Push this repo to `powwow8806/democasino`.
2. In GitHub: **Settings → Pages**.
3. Source: **Deploy from a branch**.
4. Branch: `gh-pages`, folder: `/docs` (or copy `dist/` into `docs/` on that branch).
5. Save and wait for the Pages build.

## Option B — upload dist only

1. Unzip `democasino-pages.zip` (root contains `index.html`).
2. Put those files on the `gh-pages` branch (repo root) or into `/docs` on the selected branch.
3. Enable Pages from that branch/folder as above.

SPA note: `404.html` is a copy of `index.html` so client-side routes work on refresh.
