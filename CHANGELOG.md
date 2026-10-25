# Changelog — lims

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-10-25

### CI/CD
- Base freshness guard: fail PR whose base is stale (silent-revert guard) (PR #126)
- Check out PR head, not merge commit

### Fixed
- Guards: require JWT_ACCESS_SECRET from env, remove hardcoded fallback

---

## [b02baa9] - 2026-10-24

### CI/CD
- Merged base freshness guard (PR #126)

---

## [b287355] - 2026-10-23

### CI/CD
- Fix guard: check out PR head, not merge commit

---

## [c83e35b] - 2026-10-22

### CI/CD
- Fail PR whose base is stale (silent-revert guard) — rxsoft-qa#801

---

## [2760f1d] - 2026-10-21

### Fixed
- Guards: require JWT_ACCESS_SECRET from env, remove hardcoded fallback

---

## [e543625] - 2026-10-20

### Added
- Route all LIS notifications through the conversations module (PR #107-#111)

---

## [d90047f] - 2026-10-19

### Added
- Merged LIS TAT feature (PR #125)

---

## [c75d5a9] - 2026-10-18

### Testing
- Unit tests for TAT calculator, service and result serialization (#35)

---

## [fc36a6c] - 2026-10-17

### Added
- Turnaround time (TAT) targets and actual TAT calculation (#35)

---

## [20dcdaf] - 2026-10-16

### Added
- Merged LIMS phase 2 quick wins (PR #124)

---

## [672cbf9] - 2026-10-15

### Docs
- Update progress.md - QA holds, amendments, barcode generation done