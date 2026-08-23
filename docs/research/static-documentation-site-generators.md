# Research: Static documentation site generator for zxb-ai-agent

## Summary

**Recommendation: adopt Astro Starlight**, with Markdown under the existing repository and an Astro GitHub Pages workflow. It best matches the top priority: prerendered static output plus Pagefind search by default, while also providing Simplified Chinese UI/i18n, navigation, code highlighting, and an accessibility-oriented docs theme. VitePress is a close second; Docusaurus is heavier and lacks official built-in local search; Material for MkDocs must not be selected for a new site because it is in final maintenance and reaches end of life on **November 5, 2026**.

This is an architecture-based decision, not a synthetic benchmark result. Official sources do not publish a controlled four-way benchmark or comparable installed dependency counts, so the implementation should retain a small performance and Chinese-search acceptance test.

## Decision context

- Repository: Java/Spring AI learning project; Markdown remains the source of truth in the same repository.
- Hosting: GitHub Actions builds and deploys static files to GitHub Pages.
- Priority order: static browsing performance first; then local/static search, navigation, code highlighting, stable links, accessibility, maintenance, footprint, and deployment simplicity.
- Chinese: a Chinese-only root locale is sufficient initially, but the tool should not block later multilingual content.

## Comparison

| Criterion | Astro Starlight | VitePress | Docusaurus | Material for MkDocs |
|---|---|---|---|---|
| Static browsing model | **Best fit.** Starlight's default Pagefind integration is for static sites; Pagefind cannot be enabled when pages are not prerendered. Astro's default output is static. [Starlight config](https://starlight.astro.build/reference/configuration/) [Astro rendering](https://docs.astro.build/en/basics/rendering-modes/) | Strong. Generates static HTML, then hydrates into a Vue SPA; static content is separated to reduce JS and hydration cost. [Architecture](https://vitepress.dev/guide/what-is-vitepress) | Acceptable but more client runtime. Generates HTML for every route and then runs a React SPA with client routing/code splitting. [Introduction](https://docusaurus.io/docs) | Strong static baseline, but long-term viability fails. MkDocs builds a static site and Material search works offline. [Overview](https://squidfunk.github.io/mkdocs-material/) |
| Built-in local/static search | **Yes, zero-config Pagefind by default**, described as fast and low-bandwidth. The index is built from deployed static output. [Search](https://starlight.astro.build/guides/site-search/) | **Yes, opt-in**, fuzzy full-text MiniSearch using an in-browser index. [Search](https://vitepress.dev/reference/default-theme-search) | **No official built-in local search.** Official first-class support is Algolia; local search options are community plugins and download the index to the browser. [Search](https://docusaurus.io/docs/search) | **Yes**, default multilingual client-side Lunr search; no third-party service and offline capable. [Search](https://squidfunk.github.io/mkdocs-material/setup/setting-up-site-search/) |
| Chinese support | Built-in `zh-CN` UI, Chinese-only root locale, locale routing/fallback, and translatable Pagefind UI. [i18n](https://starlight.astro.build/guides/i18n/) | Locale routing and Chinese search UI strings are configurable. Official docs expose custom tokenization hooks but make no explicit Chinese tokenization guarantee. [i18n](https://vitepress.dev/guide/i18n) [search](https://vitepress.dev/reference/default-theme-search) | Mature filesystem-based i18n and localized routes, but translating theme/plugin strings adds workflow surface. [i18n](https://docusaurus.io/docs/i18n/introduction) | UI is available in 60+ languages and search is multilingual; official search page does not explicitly document Chinese segmentation quality. [Overview](https://squidfunk.github.io/mkdocs-material/) [search](https://squidfunk.github.io/mkdocs-material/setup/setting-up-site-search/) |
| Navigation and code | Docs-first sidebar/navigation, Markdown/MDX, and built-in code highlighting. [Starlight](https://starlight.astro.build/) [pages](https://starlight.astro.build/guides/pages/) | Strong default docs theme, file-based Markdown routes, built-in syntax highlighting and advanced code blocks. [Architecture](https://vitepress.dev/guide/what-is-vitepress) | Full docs/blog/versioning feature set and MDX/React extensibility; more capability than this learning site needs. [Introduction](https://docusaurus.io/docs) | Very mature navigation and code annotations/features. [Navigation](https://squidfunk.github.io/mkdocs-material/setup/setting-up-navigation/) [code blocks](https://squidfunk.github.io/mkdocs-material/reference/code-blocks/) |
| Link stability | Markdown files become stable content routes. Keep explicit slugs for moved pages; GitHub Pages itself cannot apply arbitrary server-side redirects. [Pages](https://starlight.astro.build/guides/pages/) | One Markdown file maps to corresponding HTML; `cleanUrls` is supported by GitHub Pages. Keep paths/slugs stable. [Routing](https://vitepress.dev/guide/routing) | Has an official client-redirects plugin, although static-host redirects remain generated client behavior. [Redirects plugin](https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-client-redirects) | Stable file-based pages, but redirects normally require an additional plugin; future platform migration raises URL risk. [Plugin catalog](https://github.com/mkdocs/catalog) |
| Accessibility | Starlight explicitly positions itself as accessible and its component surface includes a keyboard-focused skip link; still requires project-level audits. [Repository](https://github.com/withastro/starlight) [overrides](https://starlight.astro.build/reference/overrides/) | Default theme has accessible UI patterns, but the official overview makes no conformance claim. Treat as requiring independent audit. [Default theme](https://vitepress.dev/reference/default-theme-config) | Official introduction states attention to accessibility, without a WCAG conformance level. [Introduction](https://docusaurus.io/docs) | Mature theme, but maintenance status outweighs this advantage for a new project. No official WCAG conformance claim was found. |
| Maintenance/reliability | Active official Astro project with automated releases; newer than alternatives, but sufficiently established for a focused docs site. [Releases](https://github.com/withastro/starlight/releases) | Active official Vue project. Use the stable release line, not a `2.0.0-alpha` line. [Releases](https://github.com/vuejs/vitepress/releases) | Active, mature Meta project with frequent releases and the broadest ecosystem. [Releases](https://github.com/facebook/docusaurus/releases) | **Disqualifying:** final maintenance only; critical fixes/security updates through **2026-11-05**, with feature work moved to Zensical. [Official EOL issue](https://github.com/squidfunk/mkdocs-material/issues/8523) [releases](https://github.com/squidfunk/mkdocs-material/releases) |
| Dependency footprint | **Moderate Node stack:** Astro + Starlight and their transitive packages. Pagefind is integrated, avoiding a search service/plugin. [Package manifest](https://github.com/withastro/starlight/blob/main/packages/starlight/package.json) | **Likely smallest Node option:** the application can center on VitePress, with Vue/Vite in its package graph. This is qualitative, not a measured install-count claim. [Package manifest](https://github.com/vuejs/vitepress/blob/main/package.json) | **Largest expected footprint:** React plus a multi-package preset/plugin/theme/bundler architecture. This is qualitative. [Classic template](https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/classic) | Separate Python/MkDocs/Material stack in this Java repository; small authoring surface but adds a second package ecosystem. [Project metadata](https://github.com/squidfunk/mkdocs-material/blob/master/pyproject.toml) |
| GitHub Pages complexity | **Low.** Official `withastro/action` builds/uploads; set `site`, repository `base`, Pages source, and deploy action. [Astro GitHub Pages](https://docs.astro.build/en/guides/deploy/github/) | Low-moderate. Official workflow explicitly sets up Node, installs, builds, uploads `docs/.vitepress/dist`, and deploys; repository `base` is required. [Deployment](https://vitepress.dev/guide/deploy) | Moderate. Requires correct `url`, `baseUrl`, organization/project/deployment branch settings; official docs call Pages workflow setup tedious. [GitHub Pages](https://docusaurus.io/docs/next/deployment/github-pages) [deployment](https://docusaurus.io/docs/deployment) | Low-moderate technically: Python setup plus `mkdocs gh-deploy` pushes `gh-pages`; branch-based publishing uses write permission. [Publishing](https://squidfunk.github.io/mkdocs-material/publishing-your-site/) |

## Findings

1. **Starlight is the best match for static-first browsing and local search.** Pagefind is enabled by default, requires prerendered output, and is specifically designed as low-bandwidth static-site search. This avoids Docusaurus's external Algolia path and avoids loading a monolithic browser search index by design, although the official Starlight page does not publish payload measurements. [Starlight search](https://starlight.astro.build/guides/site-search/) [configuration](https://starlight.astro.build/reference/configuration/)
2. **Starlight's GitHub Pages path is officially supported.** Astro documents a first-party `withastro/action` workflow, `site` and repository `base` configuration, artifact upload, and `actions/deploy-pages`; output is a static prerendered site. [Astro GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
3. **Starlight directly supports the Chinese documentation requirement.** Its official i18n guide includes `zh-CN`, a Chinese-only root locale, translated built-in UI, locale fallback/routing, and Pagefind UI translation keys. [Starlight i18n](https://starlight.astro.build/guides/i18n/)
4. **VitePress is the strongest fallback.** It has excellent static HTML delivery, a lean docs-oriented theme, official in-browser MiniSearch, Chinese UI configuration, and simple Pages deployment. It ranks second because every page hydrates into a Vue SPA and its local search uses an in-browser index; official sources provide no four-way payload benchmark proving this is slower in practice. [Architecture](https://vitepress.dev/guide/what-is-vitepress) [search](https://vitepress.dev/reference/default-theme-search)
5. **Docusaurus solves a larger problem than this repository has.** Its React SPA, plugins, versioning, blogs, and rich i18n are useful for large product portals, but increase configuration and dependency surface. More importantly, official local search is absent: local options are community plugins, while official first-class search is Algolia. [Introduction](https://docusaurus.io/docs) [search](https://docusaurus.io/docs/search)
6. **Material for MkDocs is not viable for a new reliable site.** The maintainer explicitly says it is in its final maintenance period, receives only critical fixes/security updates through November 5, 2026, and directs new feature work to Zensical. Its mature navigation and offline multilingual search do not offset planned EOL. [Official EOL issue](https://github.com/squidfunk/mkdocs-material/issues/8523)

## Ranked recommendation

1. **Astro Starlight**: select. Best fit for static-first pages, default Pagefind, Chinese UI/i18n, accessible docs primitives, and first-party GitHub Pages deployment.
2. **VitePress**: fallback. Choose if the team strongly prefers Vue/Vite or a smaller-looking configuration surface; validate Chinese tokenization and search-index transfer size first.
3. **Docusaurus**: reserve for future requirements such as formal versioned docs, a blog/product portal, or deep React customization. It is unnecessarily broad here and requires external/community local-search choices.
4. **Material for MkDocs**: reject for new adoption due to final maintenance and announced EOL.

## Implementation guardrails

- Pin a stable Starlight/Astro release and lock dependencies; do not track prereleases merely to prefer newer technology.
- Keep documentation route names stable. On moves, retain compatibility pages or generated redirect pages because GitHub Pages cannot provide arbitrary origin redirects.
- Configure Chinese as the root locale (`lang: zh-CN`) so existing and future links do not gain an unnecessary locale prefix.
- In CI, run the production build and an internal-link checker before deploying the Pages artifact.
- Before final adoption, test a representative Chinese corpus containing Spring class names, Java symbols, mixed Chinese/English terms, and headings in Pagefind.
- Record cold-load transferred bytes, JavaScript bytes, search-open/search-query transfer, LCP, and accessibility checks on representative desktop/mobile pages. Compare the same corpus against a minimal VitePress build if the results miss the project's budget.

## Risks and residual gaps

- **Medium:** No official controlled benchmark compares these four tools. The static-performance ranking follows documented rendering/search architecture; a repository-specific pilot remains necessary.
- **Medium:** Official Starlight docs confirm Chinese UI localization but do not explicitly guarantee Chinese segmentation/relevance quality. Test the actual learning vocabulary.
- **Low:** Starlight is newer than VitePress, Docusaurus, and Material. Pin stable versions and use the lockfile to limit release churn.
- **Low:** Static GitHub Pages hosting makes URL redirects less capable than a configurable server. Establish a no-breaking-slug policy and test links in CI.
- **Low:** Dependency-footprint statements are qualitative because official manifests are not comparable installed-tree measurements. Measure lockfile package count, install size, build time, and audit results during the pilot.

## Sources

### Kept

- [Starlight: Site Search](https://starlight.astro.build/guides/site-search/) - primary evidence for default Pagefind.
- [Starlight: Configuration Reference](https://starlight.astro.build/reference/configuration/) - primary evidence that Pagefind depends on prerendering.
- [Starlight: Internationalization](https://starlight.astro.build/guides/i18n/) - Chinese locale, routing, fallback, UI and Pagefind translations.
- [Astro: Deploy to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/) - first-party build/deploy workflow and base-path requirements.
- [VitePress: What is VitePress?](https://vitepress.dev/guide/what-is-vitepress) - static HTML, hydration, payload optimization, Markdown and code behavior.
- [VitePress: Search](https://vitepress.dev/reference/default-theme-search) - MiniSearch, localization, indexing and tokenizer hooks.
- [VitePress: Deploy](https://vitepress.dev/guide/deploy) - official Pages workflow and output path.
- [Docusaurus: Introduction](https://docusaurus.io/docs) - React SPA/static generation and feature scope.
- [Docusaurus: Search](https://docusaurus.io/docs/search) - official Algolia versus community local search distinction.
- [Material for MkDocs: EOL issue](https://github.com/squidfunk/mkdocs-material/issues/8523) - maintainer's definitive maintenance/EOL statement.
- [Material for MkDocs: Search](https://squidfunk.github.io/mkdocs-material/setup/setting-up-site-search/) - client-side, offline, multilingual search.
- Official GitHub release and package pages linked in the table - maintenance and qualitative dependency evidence.

### Dropped

- Third-party benchmarks and comparison blogs - excluded by the primary-source-only requirement and because corpus/configuration differences make headline scores unreliable.
- Community Docusaurus local-search plugin pages - relevant to implementation but not official support evidence.
- Search-engine snippets dated beyond the directly verified official pages - excluded to avoid relying on indexing/date anomalies.
- Zensical marketing/comparison material - not one of the requested candidates and unnecessary to establish Material's maintainer-announced EOL.

## Decision

Proceed with a minimal **Astro Starlight proof of concept**, then accept it only if production-output measurements and Chinese Pagefind relevance meet explicit budgets. VitePress is the sole fallback candidate for the same proof corpus.
