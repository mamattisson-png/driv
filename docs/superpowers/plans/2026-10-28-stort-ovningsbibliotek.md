# Stort övningsbibliotek Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lägg till flera hundra verkliga tränings- och stretchövningar i den befintliga väljaren.
**Architecture:** Två separata datafiler utökar EX och MW efter ovningar.js. Befintlig väljare, loggning, illustrationer och offlinecache återanvänds.
**Tech Stack:** Befintlig JavaScript, SVG, Python/Playwright och Node.
**Spec:** Användarens instruktion: fler hundra övningar, bred blandning. Stretch guiden och dess design överlåts uttryckligen till Claude och implementeras inte här.

## Global Constraints
- Ingen ny sektion på Hem, ingen klickbar stretchkarta eller annan implementering av Stretch guiden.
- Bevara alla 210 befintliga övningar, identiteter och figurer.
- Nya poster ska vara verkliga, namngivna övningar eller meningsfulla varianter, med svenska instruktioner, korrekt utrustning och rimliga illustrationer.
- Alla poster ska ha en fungerande figur och MuscleWiki-länk; listlänkar märks redan som liknande övningar.
- Behåll offlinefunktion och existerande datamodell.

## Review Focus
- Dubbla namn eller id:n får inte dölja gamla poster.
- Kopierade kropps-/utrustningsflaggor får inte ge fel viktinmatning eller maskinfilter.
- Sekunder och repetitioner ska hållas isär vid loggning.
- Illustrationer ska passa rörelsefamiljen och ha ändliga koordinater.
- Stretch ska gå att lägga till både i dailys och vanliga pass via befintliga flöden.

## Tasks
- [x] Skapa styrka-extra.js med cirka 240 nya styrkeövningar och valideringstest; inga befintliga filer ändras i denna del.
- [x] Skapa stretch-extra.js med cirka 80 nya stretchar/rörlighetsövningar och valideringstest; inga guidefunktioner byggs.
- [x] Ladda datafilerna i index.html efter ovningar.js och lägg till i service workerns cache. Uppdatera README med verifierade antal.
- [x] Verifiera unika namn/id:n, oförändrade gamla EX/SVG, korrekt utrustning, närliggande wiki-källor och giltiga muskler. Testa nya poster i väljare, pass och dailys.
- [ ] Separat kodgranskning, full testsvit och CI. Publicera biblioteksändringen enligt tidigare önskemål; Stretch guiden lämnas åt Claude.

## Verifiering och granskningsrättningar

240 styrkeövningar och 83 stretchar/rörlighetsövningar tillagda: totalt 533, varav 109 stretch/rörlighet. Före sista granskningsrättningarna passerade hela sviten med 161 tester, inklusive sju nya integrationstester. Alla 210 tidigare EX-poster och deras SVG bevaras.

Oberoende granskning hittade handledsanimationer som böjde armbågen samt höft-/fotrotationer som flyttade fel led. För dessa visas nu en stödd startposition. Regressionskontrollen återskapade 16 fel före rättning och passerar efteråt. Insida lår får en egen metadataetikett så adduktionsövningar inte fyller framsida lår. Copenhagenplankan har knästöd på bänken. Inga guidefunktioner eller hemskärmsändringar har gjorts. Små anatomiska rörelser och grepp/tempo kan inte alltid illustreras i detalj och beskrivs därför i instruktionerna.

Slutverifiering efter rättning: 161 tester passerar (162,34 s). Samtliga tre Node-katalogkontroller, JavaScript-syntax och git diff --check godkända. CI och publicering genomförs via separat PR. Ingen Stretch guide implementerad.
