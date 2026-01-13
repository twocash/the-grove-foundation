# Known Limitations: Research Pipeline v1.0

> Honest documentation of current capabilities and constraints

## Overview

The Research Pipeline v1.0 is a proof-of-concept demonstrating AI-driven research automation. This document outlines known limitations for transparency and expectation management.

---

## Rate Limits & Timeouts

| Constraint | Value | Impact |
|------------|-------|--------|
| Overall timeout | 90 seconds | Broad queries may fail |
| Max API calls | 20 per execution | Limits research depth |
| Gemini quota | Model-dependent | May throttle during high usage |
| Concurrent executions | 1 per session | Sequential only |

### Timeout Behavior
- Research phase: Partial results preserved
- Writing phase: Evidence available even if document generation fails
- User sees retry option with preserved context

---

## Query Types

### Supported
- **Factual research questions** — "What is the Ratchet Effect?"
- **Comparative analysis** — "How does X compare to Y?"
- **Historical topics** — "What was the impact of...?"
- **Technical explanations** — "How does distributed consensus work?"
- **Economic analysis** — "What are the cost implications of...?"

### Not Supported
- **Real-time data** — Stock prices, live events, current weather
- **Personal opinions** — "What do you think about...?"
- **Authenticated content** — Paywalled articles, private repositories
- **Image/video analysis** — Media content interpretation
- **Multi-language queries** — Non-English sources have reduced quality

---

## Edge Cases

### Partial Branch Failures
- **Behavior:** Document generated with available evidence
- **User notification:** Yellow banner indicating failed branches
- **Impact:** Reduced confidence score, fewer citations
- **Recommendation:** Retry with more specific query

### Very Broad Queries
- **Example:** "Tell me everything about AI"
- **Behavior:** Likely to timeout
- **Impact:** May produce incomplete or generic results
- **Recommendation:** Use specific, focused questions

### Niche Topics
- **Behavior:** May return insufficient evidence
- **Impact:** Empty state shown to user
- **Recommendation:** Try alternative phrasing or broader terms

---

## Known Issues

### Document Generation
| Issue | Status | Workaround |
|-------|--------|------------|
| Long documents truncate at ~5000 words | Known | Split into sub-queries |
| Occasional citation number misalignment | Known | Verify in citations section |
| Markdown formatting inconsistencies | Minor | Copy to editor for cleanup |

### Sources & Citations
| Issue | Status | Workaround |
|-------|--------|------------|
| Some URLs behind paywalls | Expected | Use alternative sources |
| Occasional dead links | Expected | Verify links manually |
| Domain extraction edge cases | Minor | Check URL for context |

### UI/UX
| Issue | Status | Workaround |
|-------|--------|------------|
| Progress indicators may lag | Minor | Wait for completion |
| Dark mode contrast in some states | Minor | Toggle to light mode |
| Mobile layout overflow | Minor | Use desktop view |

---

## Performance Characteristics

### Typical Execution Times
| Query Type | Time Range |
|------------|------------|
| Simple factual | 20-40 seconds |
| Comparative analysis | 40-60 seconds |
| Complex multi-faceted | 60-90 seconds |
| Timeout threshold | 90 seconds |

### Resource Usage
| Resource | Typical | Maximum |
|----------|---------|---------|
| API calls | 8-12 | 20 |
| Sources found | 3-8 | 15 |
| Document length | 800-1500 words | ~5000 words |
| Memory (client) | ~50MB | ~100MB |

---

## Security Considerations

### Data Privacy
- Research queries sent to Gemini API
- Results stored in browser localStorage
- Knowledge base stored in GCS (server-side)
- No user authentication in v1.0

### Content Safety
- Gemini safety filters apply
- No explicit content generation
- Source URLs not validated for safety

---

## Future Improvements (Planned)

| Feature | Priority | Notes |
|---------|----------|-------|
| Parallel branch execution | High | Reduce total time |
| Source quality scoring | High | Better evidence ranking |
| Multi-language support | Medium | Expand beyond English |
| PDF/document upload | Medium | Direct file research |
| User authentication | High | Grove ID integration |
| Collaborative research | Low | Shared sprouts |

---

## Feedback & Issues

If you encounter issues not listed here:

1. **Check console** for error messages
2. **Try refresh** to clear transient state
3. **Report** via GitHub issues with:
   - Query that caused the issue
   - Browser/OS information
   - Console error messages
   - Screenshots if applicable

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-01-13 | Initial release with error handling |

---

*This document is updated as limitations are discovered and addressed.*
