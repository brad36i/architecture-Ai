# Paper Plan

## Working title

Korean:

> 건축 공고 분석 및 제안서 작성을 지원하는 LangChain JS 기반 모노레포 시스템 구축 연구

English:

> Building AI Arch: A LangChain JS Monorepo System for Architecture Notice Analysis and Proposal Support

## Main claim

A small monorepo architecture combining Next.js, Node.js, SQLite, and LangChain JS can adapt an existing R&D workflow product into an architecture-domain project support tool while preserving the original UI structure and enabling local-first experimentation.

## Research questions

1. How can an existing R&D workflow UI be minimally adapted to an architecture project workflow?
2. What backend and data model are sufficient for local project creation, file upload, and proposal draft persistence?
3. How can a LangChain JS agent be integrated while preserving deterministic behavior without external credentials?
4. What evidence should be collected during implementation to write an engineering research paper?

## Expected contribution

- A practical system architecture and implementation record.
- A case study of domain adaptation from R&D planning to architecture project support.
- A reproducible local development workflow and verification log.
- An OpenWiki-based documentation workflow for converting implementation work into academic evidence.

## Proposed paper outline

1. Introduction
2. Background: architecture notices, proposal workflows, and agentic software support
3. System requirements and constraints
4. Monorepo architecture
5. Implementation
   - frontend adaptation
   - backend API
   - SQLite schema
   - file upload pipeline
   - LangChain JS agent integration
6. Verification and smoke testing
7. Discussion
   - preserving original UI vs. domain adaptation
   - local-first prototype advantages
   - limitations and future work
8. Conclusion

## What not to claim

- Do not claim the system writes a final academic paper for the user.
- Do not claim uploaded architecture notices are semantically parsed unless that feature is implemented and verified.
- Do not claim production security or scalability beyond local prototype evidence.
