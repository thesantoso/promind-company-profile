# PROMIND company profile

Single-page bilingual company profile for PROMIND, built with React and Vite.

## Run locally

```bash
npm install
npm run dev
```

Build for production with `npm run build`.

## Content and design

The page introduces PROMIND through its service scope, working approach, asset types, and a direct email contact. The Indonesian and English copy is maintained in `src/App.jsx`.

The original PROMIND logo is in `public/images/promind-header-brand.png`. The architectural hero image in `public/images/promind-architecture-editorial.png` was generated for this site as a conceptual editorial visual; it is explicitly labeled as an illustration, not a project or portfolio image.

The “Aktivitas kami” section uses four photographs from the company's earlier operations archive: building operations, engineering, HSE, and tenant relations. The source files were promotional posters with embedded headings and former visual identity. Image edits removed the poster text and former marks while retaining the photographed activities. The final local assets are `public/images/promind-building-operations.jpg`, `promind-engineering.jpg`, `promind-hse.jpg`, and `promind-tenant-relations.jpg`. The website discloses that the archive photos were adjusted for PROMIND's visual identity.

The favicon uses a simplified vector version of the building mark inside the logo’s “O” at `public/favicon.svg`, with 32 px PNG and Apple touch fallbacks.

Design direction: a restrained consulting profile with Promind blue, warm neutral backgrounds, architectural photography, editorial typography, and generous spacing. Energy 2 / rhythm 2 / motion 1. The image gives the page a real-estate context; service rows emphasize scope over decorative cards; the dark blue working-method section creates a clear pause in the narrative.

## Company information

The office address and `corporate@promind.id` come from the project’s PROMIND brand asset and were confirmed by the user. The user also confirmed ISO 41001, ISO 55001, and ISO 9001 certifications. The footer lists the standard numbers without edition years because certificate editions and expiry dates were not provided. No form backend is connected; the contact action opens an email draft.
