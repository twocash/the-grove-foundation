# SPEC: lens-offer-v1

**Full specification located at:** `docs/features/lens-offer-spec-v1.md`

This sprint implements inline lens offers in the Kinetic Stream as specified in the feature document.

---

## Quick Reference

### Schema Addition
- `LensOfferStreamItem` extends `BaseStreamItem`
- Fields: `lensId`, `lensName`, `reason`, `previewText`, `status`, `sourceResponseId`
- Status: `'pending' | 'accepted' | 'dismissed'`

### Parser
- Extracts `<lens_offer id="..." name="..." reason="..." preview="..." />` tags
- Returns `{ offer, cleanContent }`

### Component
- Glass-molded card with Sparkles icon
- Accept action: activates lens + auto-submits pivot query
- Dismiss action: collapses card

### Integration
- Parse after navigation, before rhetoric
- Use existing `selectLens` from `useLensState`
- Track provenance via `sourceResponseId`

---

*See full specification for detailed implementation.*
