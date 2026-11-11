# MuscleWiki – verifieringslogg för stretchbiblioteket

## Oberoende textkontroll 2026-11-11

- Den aktuella [granskningskön](docs/stretch-musclewiki-review-queue.md) omfattar **125 unika stretchövningar**: **31** med granskad direktlänk (`verified`), **94** utan verifierad exakt motsvarighet (`no_exact_match`), **0** väntande.
- Fördelning: `ovningar.js` **15/26** med direktlänk; `stretch-extra.js` **11/83**; `stretch-guide.js` **5/16**.
- Samtliga **30 unika MuscleWiki-adresser** bakom de 31 direktlänkarna har öppnats och deras publika *textinstruktioner* jämförts med respektive DRIV-övnings startposition, rörelse, utrustning och variant. Inga uppenbara felmatchningar hittades i denna textgranskning. Detta verifierar **inte** videornas visuella rörelse eller att sidorna förblir oförändrade.
- Kodens nuvarande direktlänkar för stretch går till individuella `/exercise/<slug>`-sidor; generiska `/exercises/`-kategorier ska inte visas som stretchdemonstrationer. Regressionstestet `tests/test_stretch_extra.cjs` kontrollerar nu att granskningskö, 31 direktlänkar och 94 avsiktligt olänkade övningar överensstämmer.
- [GitHub Actions 43059437382](https://github.com/mamattisson-png/driv/actions/runs/43059437382) var grön för teständringen, men **PR #30 har fortfarande mergekonflikter** och mobil-/funktionstester är inte dokumenterat godkända. Ingen merge eller publicering får göras utan användarens godkännande.

## Historisk inventering från 2026-11-04

*Texten nedan behålls som tidigare arbetsunderlag. Siffror och kvarstående uppgifter där är äldre och ersätts av statusen ovan samt den aktuella granskningskön.*

Senast inventerad: 2026-11-04. Denna fil är intern arbetsstatus för PR #30, **inte** ett intyg om att länkarna är färdiga.

## Omfattning

- `ovningar.js`: 26 grundövningar med `cat: "stretch"`; 16 har individuella `MW`-länkar och 10 saknar.
- `stretch-extra.js`: 83 övningar; 8 har `exercise/`-länk och 75 saknar.
- `stretch-guide.js`: 16 extra övningar; deras individuella länkar måste inventeras separat mot `MW`.
- Totalt: **125** stretchövningar; länkstatus är inte samma sak som verifierad korrekt rörelsematchning.

## Grundövningar utan individuell direktlänk

`duvan`, `varldens_basta`, `djup_knaboj`, `halv_split`, `liggande_hamstring`, `sittande_vridning`, `trad_nalen`, `arm_over_brost`, `latsstretch_bank`, `grodan`.

## Kontrollerade kandidater som INTE ska användas utan ytterligare belägg

- `duvan`: MuscleWikis `pigeon-pose` beskriver ankeln ovanpå motsatt lår, inte DRIV:s främre ben på golvet med bakre ben rakt bakåt.
- `latsstretch_bank`: `lat-and-shoulder-external-rotation-stretch-3-kneeling-dowel` kräver en stav i händerna; DRIV beskriver ingen stav.
- `wall_slide`: `wall-angels` har ryggen mot väggen, medan DRIV har ansiktet mot väggen och underarmarna mot den. `shoulder-flexion-wall-stretch` är enarmad och matchar inte heller.
- `side_lunge_hold`: `adductor-stretch-dynamic-standing-alternate` är dynamisk och matchar inte den statiska hållningen.
- `liggande_hamstring`: `hamstring-stretch-supine-static` använder band och beskriver dessutom dynamiska drag; DRIV tillåter grepp om vaden utan band och föreskriver statisk hållning.
- `wall_hamstring`: `hamstrings-stretch-variation-one` har benen mot en vägg, inte DRIV:s specifika dörrkarmsposition.

## Verifierade befintliga direktlänkar (stickprov)

- `strx_puppy` → `exercise/puppy-pose`: alla fyra, händer framåt, höften över knäna.
- `strx_quad_prone` → `exercise/quad-stretch-floor-prone`: magliggande, böj knä och ta tag i foten; MuscleWiki nämner band som frivilligt alternativ.
- `strx_wrist_flexor` → `exercise/wrist-flexor-stretch-seated`: arm fram, handflata upp och passiv handledsextension; **sittande position måste kontrolleras mot DRIV:s illustrerade stående position** innan denna räknas som fullständigt exakt.
- `strx_wrist_extensor` → `exercise/wrist-extensor-stretch-seated`: handledsflexion med andra handen; **sittande/stående-position behöver kontrolleras**.
- `strx_hamstring_stagger` → `exercise/hamstrings-stretch-variation-two`: ena foten framför andra och bakre knät böjt, främre ben rakt.

## Arbetsregel

Kräv att startposition, kroppsläge, redskap, rörelse och statisk/dynamisk variant stämmer. Länka aldrig till en generisk kategorisida. Räkna inte en fungerande URL som verifierad förrän själva instruktionerna har jämförts. Fortsätt med de 75 olänkade extraövningarna, 10 olänkade grundövningarna och separat genomgång av 16 guideövningar. Uppdatera inventeringen vid varje förändring. Inga delnotiser till användaren.
