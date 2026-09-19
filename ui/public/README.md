# Public Static Assets (`ui/public`)

> **Parent Documentation**: For the higher-level architecture, see [Frontend Application](../README.md)

The `ui/public` directory stores static, uncompiled assets that are served directly at the root URL path (`/`) by Next.js and the embedded Go HTTP server. Its primary asset is `cytoscape-bundle.js`, a standalone, pre-bundled distribution of the Cytoscape graph library and the Eclipse Klay hierarchical layout algorithm.

---

## Architecture & Rationale for Pre-Bundling

In complex React applications, heavy graph layout libraries like Cytoscape and Eclipse Klay (`klayjs`) introduce unique bundling challenges:
1. **Server-Side Rendering (SSR) Incompatibility**: Klay assumes a DOM or browser-like environment and interacts with global window objects.
2. **Webpack Transpilation Overhead**: Bundling `klayjs` through Next.js Webpack configs can lead to build timeouts, large chunk fragmentation, and module resolution issues.
3. **Synchronous Execution Guarantee**: By pre-bundling Cytoscape and the Klay plugin into a single standalone file, `plan-parse` guarantees that `window.cytoscape` is initialized before client React components mount.

```mermaid
flowchart LR
    subgraph PrebundleSource["Vendor Source Libraries"]
        Cy["Cytoscape.js Core"]
        Klay["cytoscape-klay Plugin"]
        KlayJS["Eclipse Klay Layout Engine"]
        Cy --> Bundle["Standalone Pre-bundler"]
        Klay --> Bundle
        KlayJS --> Bundle
    end

    subgraph PublicDir["ui/public/"]
        Bundle --> Out["cytoscape-bundle.js"]
    end

    subgraph RuntimeLoad["Runtime Delivery"]
        Out --> NextBuild["Next.js Export (ui/out/)"]
        NextBuild --> GoEmbed["Go embed.FS (pkg/server/ui/out)"]
        GoEmbed --> Browser["Browser <script src='/cytoscape-bundle.js'>"]
        GoEmbed --> Browser["Browser Script Injection (/cytoscape-bundle.js)"]
    end
```

---

## Loading Mechanics in the Application

1. **HTML Head Injection**:
   In `ui/app/layout.js`, the script is declared with `async={false}`:
   ```html
   <script src="/cytoscape-bundle.js" async={false}></script>
   ```
2. **Readiness Check**:
   In `ui/app/page.js`, a lightweight readiness probe checks `window.cytoscape` before initializing the canvas:
   ```javascript
   useEffect(() => {
     if (typeof window === "undefined") return;
     if (window.cytoscape) {
       setCyReady(true);
       return;
     }
     const interval = setInterval(() => {
       if (window.cytoscape) {
         setCyReady(true);
         clearInterval(interval);
       }
     }, 50);
     return () => clearInterval(interval);
   }, []);
   ```

---

## Key Files & Assets

| Asset File | Size | Role & Description |
| :--- | :--- | :--- |
| `cytoscape-bundle.js` | ~600 KB | Pre-packaged production bundle exporting `window.cytoscape` with the `klay` layout extension pre-registered. |

---

## Hierarchy & Reference Graph

This section connects to [Root Layout](../app/README.md) which loads the bundle via script tag, and [Embedded Distribution](../../pkg/server/ui/README.md) where it is packaged into the Go binary.

```mermaid
flowchart TD
    UI["ui/ (Frontend Project)"]:::node
    UI_PUBLIC["ui/public/ (Static Assets)"]:::current
    UI_APP["ui/app/ (Root Layout)"]:::node
    SERVER_UI["pkg/server/ui/ (Go Embedding)"]:::node

    UI --> UI_PUBLIC
    UI --> UI_APP
    UI_APP -->|injects script tag for| UI_PUBLIC
    UI_PUBLIC -.->|copied to ui/out & mirrored to| SERVER_UI

    classDef current fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#ffffff;
    classDef node fill:#1e293b,stroke:#475569,stroke-width:1px,color:#f8fafc;
```
