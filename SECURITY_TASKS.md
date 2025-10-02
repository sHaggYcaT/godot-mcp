# Security Review Tasks

- [x] Annotate every executable line in `src/index.ts` with inline safety rationale to surface any potential trojan vectors.
- [x] Annotate every executable line in `src/scripts/godot_operations.gd` with inline safety rationale.
- [ ] Perform a manual penetration test of child process invocations to ensure parameters cannot be exploited for arbitrary command execution.
- [ ] Validate resource loading paths in `godot_operations.gd` against an allowlist to prevent malicious resource injection.
