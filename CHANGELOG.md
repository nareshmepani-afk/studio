# Changelog

All notable changes to the Memory Weaver platform will be documented in this file.

## [1.1.0-beta] - 2026-06-29

### Added
- **Statically Ingested Fixtures**: Introduced static layout templates matching structural user patterns. Scaffolds stored under `src/fixtures/`.
- **Dynamic Template Resolution**: Implemented generic resolver utility `templateResolver.ts` mapping route parameters to dynamic chunk loading pathways.
- **Automated Client-Side Cloning**: Integrated auto-cloning transactions inside `SoloStage.tsx` to copy template context into private user databases instantly on completion request.
- **Multi-vCPU Serverless Configuration**: Updated v2 Cloud Functions parameter options to request 4 vCPUs and 4GiB memory execution limits for ffmpeg processes.
- **Timeline Alignment Fallback**: Added VFR-to-CFR interpolation filter graph compilers in the transcode trigger service to safeguard against frame stuttering.
- **Structured Telemetry Reporting**: Configured runtime timing analytics outputs saved directly to the database.

### Fixed
- **Staging Domain Mappings**: Corrected duplicate routing locks on `dev.memoryweaver.studio` to align incoming ingress boundaries.
- **IAM Invoker Permissions**: Configured public invoker IAM access rules for the Cloud Run container.
