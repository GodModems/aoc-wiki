# Age of Chesspires Wiki (Static)

## Run locally
Because this site uses `fetch()` to load markdown pages, open it via a local web server:

```bash
python -m http.server 8080
```

Then open:
- http://localhost:8080

## Add pages
1. Create a markdown file in `content/`, e.g. `content/systems/terrain.md`
2. Add a nav entry in `js/nav.js`:
   ```js
   { title: "Terrain", path: "systems/terrain", tags: ["terrain","map"] }
   ```
