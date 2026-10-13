# Plan: Migrate blog.osoco.de to AEM (whole site)

## Overview
Move the whole OSOCO blog (**https://blog.osoco.de/**) into the **Tech Blog** AEM Edge Delivery Services project. The project already uses Document Authoring (DA) as its content source, so finished pages can be uploaded there.

**Scope you chose:**
- **Pages:** every page on the site, grouped into templates (for example homepage, article, tag or category listing, author page, archive)
- **Design:** fonts, colors, spacing and block styling matched to the original
- **Header and navigation:** rebuilt from the original site
- **Footer:** rebuilt from the original site
- **Add-ons:** none (no commerce or forms)

## Approach
1. **Find all pages and map the site.** I'll collect every URL from the sitemap or by crawling, group similar pages into templates, and write a scope report: how many page types there are, which blocks repeat, and how much content there is.
2. **Analyze one example page per template.** I'll take one representative page for each template and break it into sections, default content and block variants. Blocks that repeat across templates will be shared instead of rebuilt.
3. **Build the blocks.** I'll create or adapt the blocks the site needs, such as an article list or cards, article hero, tags and author bio. They'll be defensive about missing cells, with CSS scoped to each block.
4. **Build the import tooling.** I'll map blocks to page structure, then write a parser for each block, plus cleanup and section transformers, and bundle them into one import script.
5. **Import content in bulk.** I'll run the import for every URL, template by template, and bring images over with the content.
6. **Migrate the design.** I'll take global design tokens (fonts, colors, spacing) from the original site, then style each block to match.
7. **Rebuild the header and footer.** I'll rebuild the header and nav for desktop and mobile, including any menus, then the footer. Each is checked against the original.
8. **Validate.** I'll score every imported page for completeness against its source, then compare flagged pages side by side with the original and fix the issues.
9. **Publish and hand off.** I'll upload pages to Document Authoring, commit the code on a feature branch, and open a PR. The PR will include the required `{branch}--techblog--aemysites.aem.page/{path}` preview links.

## Checklist
- [ ] Find every URL on blog.osoco.de (sitemap first, crawl as a fallback)
- [ ] Group pages into templates and write the scope report
- [ ] Review the report with you: confirm the templates, and whether to drop any page types (such as old archives or tag pages)
- [ ] Analyze one example page per template (sections, blocks, variants)
- [ ] Find block variants shared across templates
- [ ] Map block variants to page structure for each template
- [ ] Create or adapt the blocks the site needs
- [ ] Write block parsers and page transformers (cleanup and sections)
- [ ] Bundle the import script and test it on one page per template
- [ ] Run the bulk import for all URLs
- [ ] Migrate the global design (fonts, colors, spacing, typography)
- [ ] Style each block to match the original site
- [ ] Rebuild the header and navigation (desktop and mobile)
- [ ] Rebuild the footer
- [ ] Validate all imported pages for content completeness
- [ ] Compare flagged pages with the original and fix the differences
- [ ] Upload the migrated pages to Document Authoring
- [ ] Create a feature branch, commit the code and open a PR with branch preview links

## Decisions and assumptions
- **Content source:** Document Authoring (aemysites/techblog). Uploading only works if you've enabled "Allow LLM to use my Adobe credentials…" in Settings → LLM Permissions.
- **Code delivery:** all code goes on a feature branch, never straight to `main`, because merging `main` ships code to production. Pushing needs the git permission toggle in Settings.
- **Blog-specific choices:** article dates, authors and tags become page metadata. Listing pages (homepage, tags, archive) may later be better served by a dynamic query-driven block than by static lists; I'll raise this when we review the scope report.
- **Checkpoint:** I'll stop after the scope report for your confirmation before bulk work starts, since the page count drives the effort.

## Next step
This is a plan only. Switch to Execute mode and I'll start with step 1, mapping the site.
