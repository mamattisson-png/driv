# MuscleWiki stretch matching audit — 2026-11-04

Scope: only individual `/exercise/<slug>` pages with identical starting posture, equipment, movement and static/dynamic variation. No category-page fallback. Work in PR #30; not approved for merge or deploy.

## Verified rejection of plausible candidates

| DRIV ID | Candidate URL | Decision |
| --- | --- | --- |
| `duvan` | https://musclewiki.com/exercise/pigeon-pose | **REJECT**: MuscleWiki describes right ankle on opposite thigh and pressing knee, while DRIV specifies bent front shin on floor, rear leg extended straight behind and forward fold. Same English name does not establish identical mechanics. |
| `liggande_hamstring` | https://musclewiki.com/exercise/hamstring-stretch-supine-static | **REJECT for now**: MuscleWiki requires a strap and describes dynamic tugging at end range. DRIV permits holding the calf without equipment and prescribes a 30-second static hold. |
| `latsstretch_bank` | https://musclewiki.com/exercise/lat-and-shoulder-external-rotation-stretch-3-kneeling-dowel | **REJECT**: MuscleWiki requires a dowel and external shoulder rotation, while DRIV uses elbows on bench without a dowel. |
| `strx_hamstring_hurdler` | https://musclewiki.com/exercise/hamstring-stretch-seated-single-leg | **REJECT**: MuscleWiki explicitly uses repeated bouncing; DRIV holds 30 seconds without bouncing. |
| `strx_hamstring_hurdler` | https://musclewiki.com/exercise/hamstring-stretch-seated-single-leg-isometric | **REJECT**: MuscleWiki requires sitting against wall and dynamic reach; DRIV does not. |
| `strx_hamstring_chair_seated` | https://musclewiki.com/exercise/hamstring-stretch-seated-single-leg | **REJECT**: DRIV sits on chair with heel on floor and static hip hinge; MuscleWiki has no chair and uses bouncing. |

## Research still pending

Review every unmapped stretch in `ovningar.js`, `stretch-extra.js` and `stretch-guide.js`; inspect existing direct mappings for actual motion correctness, not just URL validity. Some stretches may not exist in MuscleWiki and must remain explicitly unmatched instead of receiving inaccurate links.

This audit is an evidence trail, **not** a completion report.