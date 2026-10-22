"use strict";
// Livsmedel och tolkning av fritext som "1 dl mjölk, 2 ägg och 150 g kyckling".
// Värden per 100 g. Enhetsvikter i gram: dl, st, msk, tsk, skiva, portion, bit, burk, glas, skopa, nave, pase.
// Ungefärliga värden för vanliga livsmedel i Sverige.

const FOODS = [
  // Mejeri
  { n: ["lättmjölk"], kcal: 37, p: 3.5, dl: 100, glas: 200 },
  { n: ["standardmjölk", "helmjölk"], kcal: 60, p: 3.4, dl: 100, glas: 200 },
  { n: ["mjölk", "mellanmjölk"], kcal: 46, p: 3.5, dl: 100, glas: 200 },
  { n: ["havredryck", "havremjölk"], kcal: 45, p: 1, dl: 100, glas: 200 },
  { n: ["filmjölk", "fil"], kcal: 46, p: 3.5, dl: 100 },
  { n: ["grekisk yoghurt", "turkisk yoghurt"], kcal: 115, p: 4.5, dl: 100 },
  { n: ["yoghurt"], kcal: 60, p: 3.5, dl: 100 },
  { n: ["kvarg"], kcal: 62, p: 11, dl: 100, st: 250 },
  { n: ["keso", "cottage cheese"], kcal: 95, p: 12, dl: 100, st: 250 },
  { n: ["ost", "hårdost", "prästost", "herrgårdsost"], kcal: 350, p: 27, skiva: 10 },
  { n: ["fetaost", "feta"], kcal: 260, p: 17, dl: 50 },
  { n: ["mozzarella"], kcal: 250, p: 18, st: 125 },
  { n: ["smör", "bregott", "margarin"], kcal: 720, p: 0.5, msk: 13, tsk: 5 },
  { n: ["vispgrädde", "grädde"], kcal: 340, p: 2, dl: 100, msk: 15 },
  { n: ["matlagningsgrädde"], kcal: 150, p: 3, dl: 100, msk: 15 },
  { n: ["crème fraiche", "creme fraiche"], kcal: 330, p: 2.3, dl: 100, msk: 15 },
  { n: ["gräddfil"], kcal: 135, p: 2.7, dl: 100, msk: 15 },
  { n: ["ägg"], kcal: 140, p: 12.5, st: 55 },

  // Spannmål och bröd
  { n: ["havregryn"], kcal: 370, p: 13, dl: 35 },
  { n: ["gröt", "havregrynsgröt"], kcal: 70, p: 2.5, dl: 100, portion: 250 },
  { n: ["müsli", "musli", "granola"], kcal: 400, p: 9, dl: 45 },
  { n: ["cornflakes", "flingor"], kcal: 380, p: 7, dl: 12 },
  { n: ["knäckebröd", "knäcke"], kcal: 350, p: 10, st: 12, skiva: 12 },
  { n: ["fralla", "frallor", "småfranska"], kcal: 270, p: 9, st: 60 },
  { n: ["rostbröd", "toast"], kcal: 260, p: 8, skiva: 25, st: 25 },
  { n: ["bröd", "limpa", "brödskiva", "smörgås", "macka"], kcal: 250, p: 8, skiva: 35, st: 35 },
  { n: ["tortilla", "tortillabröd", "wrap"], kcal: 300, p: 8, st: 40 },
  { n: ["pannkaka", "pannkakor"], kcal: 190, p: 7, st: 60 },
  { n: ["okokt pasta", "pasta okokt"], kcal: 360, p: 12, dl: 45, portion: 80 },
  { n: ["pasta", "spaghetti", "makaroner"], kcal: 150, p: 5.5, dl: 50, portion: 220 },
  { n: ["okokt ris", "ris okokt"], kcal: 350, p: 7, dl: 85, portion: 70 },
  { n: ["ris", "jasminris", "basmatiris"], kcal: 130, p: 2.7, dl: 80, portion: 200 },
  { n: ["bulgur"], kcal: 110, p: 3.5, dl: 70, portion: 200 },
  { n: ["couscous"], kcal: 115, p: 4, dl: 70, portion: 200 },
  { n: ["quinoa"], kcal: 120, p: 4.4, dl: 75, portion: 200 },
  { n: ["sötpotatis"], kcal: 86, p: 1.6, st: 150 },
  { n: ["potatismos"], kcal: 100, p: 2, dl: 100, portion: 200 },
  { n: ["pommes", "pommes frites"], kcal: 300, p: 3.5, portion: 150, dl: 40 },
  { n: ["potatis"], kcal: 80, p: 2, st: 90, dl: 70 },

  // Kött, fisk, protein
  { n: ["kycklingfilé", "kycklingbröst", "kyckling"], kcal: 110, p: 23, st: 150, portion: 150 },
  { n: ["kycklinglår"], kcal: 170, p: 19, st: 100 },
  { n: ["kalkon"], kcal: 105, p: 22, portion: 150, skiva: 10 },
  { n: ["nötfärs", "köttfärs"], kcal: 175, p: 20, portion: 150, dl: 70 },
  { n: ["blandfärs"], kcal: 230, p: 18, portion: 150, dl: 70 },
  { n: ["fläskfilé"], kcal: 115, p: 21, portion: 150 },
  { n: ["fläskkotlett", "kotlett"], kcal: 200, p: 20, st: 150 },
  { n: ["entrecote", "biff", "oxfilé"], kcal: 200, p: 22, st: 200, portion: 200 },
  { n: ["köttbullar", "köttbulle"], kcal: 230, p: 14, st: 15, portion: 150 },
  { n: ["bacon"], kcal: 450, p: 12, skiva: 15 },
  { n: ["falukorv", "korv", "grillkorv", "prinskorv"], kcal: 230, p: 10, st: 60, skiva: 30 },
  { n: ["skinka", "kokt skinka"], kcal: 110, p: 18, skiva: 10 },
  { n: ["lax"], kcal: 200, p: 20, portion: 125, st: 125 },
  { n: ["torsk", "sej", "vit fisk"], kcal: 75, p: 17, portion: 125, st: 125 },
  { n: ["tonfisk"], kcal: 105, p: 24, burk: 120 },
  { n: ["räkor"], kcal: 70, p: 16, dl: 60, portion: 100 },
  { n: ["tofu"], kcal: 120, p: 12, portion: 150 },
  { n: ["bönor", "kidneybönor", "svarta bönor"], kcal: 120, p: 8, dl: 70, burk: 230 },
  { n: ["linser"], kcal: 115, p: 9, dl: 80 },
  { n: ["kikärtor"], kcal: 140, p: 8, dl: 70, burk: 230 },
  { n: ["proteinpulver", "proteinpulvret"], kcal: 380, p: 75, skopa: 30, msk: 10 },
  { n: ["proteinshake", "proteindrink"], kcal: 50, p: 10, st: 240, burk: 250, glas: 250 },
  { n: ["proteinbar", "proteinbar"], kcal: 360, p: 33, st: 60 },

  // Frukt och grönt
  { n: ["banan", "bananer"], kcal: 90, p: 1.1, st: 120 },
  { n: ["äpple", "äpplen"], kcal: 52, p: 0.3, st: 150 },
  { n: ["päron"], kcal: 57, p: 0.4, st: 160 },
  { n: ["apelsin", "apelsiner"], kcal: 47, p: 0.9, st: 150 },
  { n: ["clementin", "mandarin"], kcal: 47, p: 0.8, st: 70 },
  { n: ["vindruvor", "druvor"], kcal: 70, p: 0.6, dl: 65 },
  { n: ["blåbär", "hallon", "bär"], kcal: 50, p: 0.8, dl: 60 },
  { n: ["jordgubbar"], kcal: 33, p: 0.7, dl: 60 },
  { n: ["russin"], kcal: 300, p: 3, msk: 10, dl: 60 },
  { n: ["avokado"], kcal: 160, p: 2, st: 140 },
  { n: ["tomat", "tomater"], kcal: 18, p: 0.9, st: 100, dl: 60 },
  { n: ["gurka"], kcal: 12, p: 0.6, st: 300, skiva: 7 },
  { n: ["paprika"], kcal: 30, p: 1, st: 150 },
  { n: ["morot", "morötter"], kcal: 40, p: 0.9, st: 70 },
  { n: ["broccoli"], kcal: 34, p: 3, dl: 35, portion: 100 },
  { n: ["sallad", "spenat"], kcal: 18, p: 1.8, dl: 15, portion: 50 },
  { n: ["lök", "gul lök"], kcal: 40, p: 1, st: 100 },
  { n: ["majs"], kcal: 90, p: 3, dl: 65, burk: 150 },
  { n: ["ärtor", "gröna ärtor"], kcal: 80, p: 5, dl: 65 },
  { n: ["grönsaker", "wokgrönsaker"], kcal: 35, p: 2, dl: 40, portion: 150 },

  // Mer kött och fågel (rå vikt)
  { n: ["ryggbiff", "rostbiff", "fransyska", "innanlår"], kcal: 130, p: 22, portion: 150, st: 150, skiva: 15 },
  { n: ["högrev", "grytbitar", "nötkött", "kalvkött", "kalv"], kcal: 160, p: 20, portion: 150 },
  { n: ["fläskkarré", "karré"], kcal: 200, p: 19, portion: 150, skiva: 100 },
  { n: ["fläsksida", "sidfläsk", "stekfläsk"], kcal: 450, p: 14, skiva: 40 },
  { n: ["pulled pork"], kcal: 200, p: 22, portion: 150 },
  { n: ["lammkött", "lammfärs", "lammstek", "lamm"], kcal: 230, p: 18, portion: 150 },
  { n: ["viltfärs", "älgfärs", "älgkött", "hjortkött", "vilt"], kcal: 120, p: 22, portion: 150 },
  { n: ["kycklingfärs", "kalkonfärs"], kcal: 130, p: 20, portion: 150, dl: 70 },
  { n: ["helstekt kyckling", "grillad kyckling", "grillkyckling"], kcal: 190, p: 26, portion: 200 },
  { n: ["kycklingvingar", "kycklingvinge"], kcal: 220, p: 18, st: 40, portion: 250 },
  { n: ["kycklingnuggets", "nuggets"], kcal: 270, p: 15, st: 18, portion: 150 },
  { n: ["leverpastej"], kcal: 260, p: 11, msk: 15, skiva: 15 },
  { n: ["salami"], kcal: 450, p: 22, skiva: 5 },
  { n: ["chorizo"], kcal: 400, p: 22, st: 70, skiva: 5 },
  { n: ["hamburgare kött", "burgare kött", "hamburgerkött"], kcal: 250, p: 18, st: 150 },

  // Mer fisk och skaldjur
  { n: ["makrill i tomatsås", "makrill"], kcal: 260, p: 19, portion: 125, burk: 125 },
  { n: ["sill", "inlagd sill", "matjessill"], kcal: 200, p: 9, portion: 100, bit: 20 },
  { n: ["kolja", "rödspätta", "gädda", "abborre", "gös"], kcal: 80, p: 18, portion: 125, st: 125 },
  { n: ["regnbåge", "röding"], kcal: 160, p: 20, portion: 125, st: 125 },
  { n: ["kräftor", "hummer", "krabba"], kcal: 85, p: 18, portion: 150, st: 30 },
  { n: ["musslor", "blåmusslor"], kcal: 85, p: 12, portion: 150 },
  { n: ["surimi", "crabsticks"], kcal: 95, p: 8, st: 17 },
  { n: ["fiskbullar"], kcal: 70, p: 6, burk: 375, st: 25 },
  { n: ["kaviar", "kalles"], kcal: 450, p: 10, msk: 15, tsk: 5 },
  { n: ["skagenröra"], kcal: 250, p: 10, msk: 20, portion: 80 },

  // Mer mejeri och ägg
  { n: ["halloumi"], kcal: 320, p: 22, skiva: 30, st: 200, portion: 100 },
  { n: ["parmesan", "parmesanost"], kcal: 400, p: 33, msk: 6, tsk: 2 },
  { n: ["brie", "camembert", "mögelost"], kcal: 330, p: 20, bit: 30 },
  { n: ["färskost", "philadelphia", "mascarpone"], kcal: 260, p: 6, msk: 15, tsk: 5 },
  { n: ["ricotta"], kcal: 140, p: 11, dl: 100, msk: 15 },
  { n: ["riven ost", "pizzaost"], kcal: 330, p: 25, dl: 35, nave: 30 },
  { n: ["skyr", "ab-fil", "a-fil"], kcal: 60, p: 10, dl: 100, st: 150 },
  { n: ["vaniljyoghurt", "fruktyoghurt", "smaksatt yoghurt"], kcal: 85, p: 3.5, dl: 100, st: 150 },
  { n: ["äggvita", "äggvitor"], kcal: 48, p: 11, st: 33 },
  { n: ["kokt ägg", "stekt ägg"], kcal: 155, p: 12.5, st: 55 },
  { n: ["chokladmjölk", "o'boy", "oboy", "pucko"], kcal: 70, p: 3.4, dl: 100, glas: 200, st: 250 },

  // Mer spannmål, bröd och potatis
  { n: ["fullkornsris", "råris"], kcal: 125, p: 2.7, dl: 80, portion: 200 },
  { n: ["fullkornspasta"], kcal: 140, p: 6, dl: 50, portion: 220 },
  { n: ["linspasta", "bönpasta"], kcal: 150, p: 11, dl: 50, portion: 220 },
  { n: ["nudlar kokta", "äggnudlar", "risnudlar"], kcal: 140, p: 4, portion: 200 },
  { n: ["snabbnudlar"], kcal: 450, p: 9, pase: 85, st: 85 },
  { n: ["gnocchi"], kcal: 150, p: 3.5, portion: 250 },
  { n: ["klyftpotatis", "ugnspotatis", "rostad potatis"], kcal: 130, p: 2.2, portion: 200 },
  { n: ["potatisgratäng", "gratäng"], kcal: 140, p: 4, portion: 250 },
  { n: ["pitabröd", "pita"], kcal: 270, p: 9, st: 60 },
  { n: ["naanbröd", "naan"], kcal: 300, p: 9, st: 90 },
  { n: ["bagel"], kcal: 260, p: 10, st: 90 },
  { n: ["croissant"], kcal: 410, p: 8, st: 60 },
  { n: ["skorpor", "skorpa"], kcal: 410, p: 11, st: 12 },
  { n: ["riskakor", "riskaka"], kcal: 390, p: 8, st: 8 },
  { n: ["polarbröd", "tunnbröd"], kcal: 290, p: 8, st: 40 },
  { n: ["havrefras", "special k", "frukostflingor"], kcal: 370, p: 10, dl: 15 },
  { n: ["chiapudding"], kcal: 130, p: 5, portion: 200 },
  { n: ["overnight oats"], kcal: 150, p: 7, portion: 250 },

  // Mer frukt och grönt
  { n: ["mango"], kcal: 60, p: 0.8, st: 300, dl: 70 },
  { n: ["ananas"], kcal: 50, p: 0.5, dl: 70, skiva: 80 },
  { n: ["kiwi"], kcal: 61, p: 1.1, st: 75 },
  { n: ["melon", "vattenmelon", "honungsmelon"], kcal: 34, p: 0.7, bit: 150, skiva: 150 },
  { n: ["persika", "nektarin", "plommon"], kcal: 40, p: 0.9, st: 120 },
  { n: ["dadlar", "dadel"], kcal: 280, p: 2.5, st: 8 },
  { n: ["torkade aprikoser", "torkad frukt", "fikon"], kcal: 250, p: 3, st: 8, nave: 30 },
  { n: ["granatäpple"], kcal: 80, p: 1.7, st: 250 },
  { n: ["körsbär", "lingon", "tranbär"], kcal: 55, p: 0.8, dl: 60 },
  { n: ["fruktsallad", "fruktbitar"], kcal: 55, p: 0.7, dl: 70, portion: 200 },
  { n: ["zucchini", "squash"], kcal: 17, p: 1.2, st: 250 },
  { n: ["aubergine"], kcal: 25, p: 1, st: 300 },
  { n: ["blomkål", "blomkålsris"], kcal: 25, p: 2, dl: 35, portion: 150 },
  { n: ["champinjoner", "svamp", "kantareller"], kcal: 22, p: 3, dl: 30, st: 15 },
  { n: ["sparris"], kcal: 20, p: 2.2, st: 20, portion: 100 },
  { n: ["sockerärtor", "haricots verts", "bönor gröna"], kcal: 35, p: 2.5, dl: 30, portion: 100 },
  { n: ["vitkål", "kål", "grönkål", "brysselkål"], kcal: 30, p: 2, dl: 30, portion: 100 },
  { n: ["rödbetor", "rödbeta"], kcal: 43, p: 1.6, st: 80, skiva: 10 },
  { n: ["rödlök", "vitlök", "purjolök"], kcal: 40, p: 1.2, st: 80, klyfta: 4 },
  { n: ["rucola", "babyspenat", "isbergssallad"], kcal: 20, p: 2, dl: 10, portion: 40 },
  { n: ["oliver"], kcal: 140, p: 1, st: 4, msk: 10 },
  { n: ["edamame", "sojabönor"], kcal: 120, p: 11, dl: 60, portion: 100 },
  { n: ["salladsmix", "grönsallad"], kcal: 25, p: 1.5, portion: 150 },

  // Nötter, frön och pålägg
  { n: ["valnötter", "hasselnötter", "pekannötter", "pistagenötter", "pistage"], kcal: 650, p: 16, dl: 45, nave: 30 },
  { n: ["pumpafrön", "solrosfrön", "frön"], kcal: 570, p: 27, msk: 10, dl: 55 },
  { n: ["chiafrön", "linfrön"], kcal: 490, p: 17, msk: 12, tsk: 4 },
  { n: ["kokos", "kokosflingor", "riven kokos"], kcal: 650, p: 6, msk: 6, dl: 35 },
  { n: ["kokosmjölk"], kcal: 180, p: 1.6, dl: 100, burk: 400 },
  { n: ["mandelsmör", "cashewsmör", "nötsmör"], kcal: 620, p: 21, msk: 16, tsk: 6 },
  { n: ["nutella", "chokladkräm"], kcal: 540, p: 6, msk: 18, tsk: 7 },
  { n: ["hummus"], kcal: 250, p: 8, msk: 20, dl: 100 },
  { n: ["guacamole"], kcal: 150, p: 2, msk: 20, dl: 100 },
  { n: ["tzatziki", "kesella"], kcal: 90, p: 5, msk: 20, dl: 100 },
  { n: ["bearnaisesås", "bearnaise", "hollandaise"], kcal: 600, p: 1, msk: 15, dl: 100 },
  { n: ["vitlökssås", "kebabsås", "dressing"], kcal: 350, p: 1.5, msk: 15, dl: 100 },
  { n: ["brunsås", "gräddsås", "sås"], kcal: 100, p: 2, dl: 100, msk: 15 },
  { n: ["salsa", "tacosås", "tomatsås", "krossade tomater"], kcal: 35, p: 1.3, msk: 15, dl: 100 },
  { n: ["sojasås", "soja"], kcal: 55, p: 8, msk: 15, tsk: 5 },
  { n: ["sweet chili", "chilisås", "bbq-sås", "bbqsås"], kcal: 200, p: 0.5, msk: 15 },
  { n: ["senap", "remoulad", "remouladsås"], kcal: 250, p: 2, msk: 15, tsk: 5 },
  { n: ["lingonsylt", "äppelmos"], kcal: 120, p: 0.2, msk: 15, dl: 100 },

  // Snacks, sött och drycker
  { n: ["popcorn"], kcal: 480, p: 9, dl: 7, pase: 90 },
  { n: ["ostbågar", "cheez doodles"], kcal: 530, p: 7, pase: 160, nave: 25 },
  { n: ["kex", "digestive", "mariekex", "ballerina", "chokladkex"], kcal: 480, p: 6, st: 15 },
  { n: ["dammsugare", "mazarin", "kaka", "kakor", "bakelse"], kcal: 430, p: 5, st: 50 },
  { n: ["cheesecake", "äppelpaj", "paj"], kcal: 320, p: 5, bit: 120 },
  { n: ["gelégodis", "smågodis"], kcal: 340, p: 4, pase: 200, nave: 40, st: 5 },
  { n: ["chokladbit", "chokladkaka", "marabou", "snickers", "kexchoklad"], kcal: 520, p: 7, st: 50, bit: 10 },
  { n: ["energidryck", "red bull", "monster"], kcal: 45, p: 0, burk: 250, st: 250, dl: 100 },
  { n: ["sportdryck", "powerade", "gatorade"], kcal: 25, p: 0, st: 500, dl: 100 },
  { n: ["festis", "saft"], kcal: 40, p: 0, dl: 100, glas: 200, st: 200 },
  { n: ["cider", "drink", "alkoläsk"], kcal: 60, p: 0, burk: 330, st: 330, glas: 250 },
  { n: ["sprit", "vodka", "whisky", "shot"], kcal: 220, p: 0, st: 40 },
  { n: ["varm choklad"], kcal: 75, p: 3, kopp: 250, st: 250 },
  { n: ["milkshake"], kcal: 110, p: 3.5, st: 400, glas: 300 },

  // Maträtter (en portion är en vanlig tallrik)
  { n: ["kebabtallrik"], kcal: 180, p: 10, portion: 600, st: 600 },
  { n: ["kebab i bröd", "kebabrulle", "kebab"], kcal: 230, p: 11, st: 350, portion: 350 },
  { n: ["falafeltallrik"], kcal: 190, p: 6, portion: 550, st: 550 },
  { n: ["falafel"], kcal: 250, p: 8, st: 25, portion: 250 },
  { n: ["big mac", "cheeseburgare", "hamburgermeny"], kcal: 260, p: 12, st: 220 },
  { n: ["tacos", "taco"], kcal: 200, p: 9, st: 120, portion: 400 },
  { n: ["burrito"], kcal: 200, p: 9, st: 350 },
  { n: ["sushi"], kcal: 150, p: 6, bit: 30, st: 30, portion: 350 },
  { n: ["pad thai"], kcal: 180, p: 8, portion: 400, st: 400 },
  { n: ["wok", "nudlar", "nudelwok"], kcal: 150, p: 7, portion: 400, st: 400 },
  { n: ["spaghetti bolognese", "pasta bolognese", "bolognese"], kcal: 150, p: 7, portion: 450, st: 450 },
  { n: ["carbonara", "pasta carbonara", "spaghetti carbonara"], kcal: 210, p: 9, portion: 400, st: 400 },
  { n: ["laxpasta"], kcal: 170, p: 9, portion: 400, st: 400 },
  { n: ["pastasallad"], kcal: 160, p: 6, portion: 350, st: 350 },
  { n: ["lasagne", "lasagnette"], kcal: 160, p: 9, portion: 350, st: 350 },
  { n: ["köttbullar med potatis", "köttbullar och potatis", "köttbullar med mos"], kcal: 150, p: 7, portion: 450, st: 450 },
  { n: ["köttfärssås"], kcal: 150, p: 12, portion: 200, dl: 100 },
  { n: ["korv stroganoff", "biff stroganoff", "stroganoff"], kcal: 150, p: 7, portion: 450, st: 450 },
  { n: ["ramen"], kcal: 90, p: 5, portion: 550, st: 550 },
  { n: ["pyttipanna"], kcal: 140, p: 6, portion: 400, st: 400 },
  { n: ["korv med bröd"], kcal: 250, p: 9, st: 130 },
  { n: ["korv med mos"], kcal: 160, p: 5, portion: 400, st: 400 },
  { n: ["kycklinggryta", "kyckling curry", "kycklingcurry"], kcal: 130, p: 11, portion: 400, st: 400 },
  { n: ["chili con carne", "chili"], kcal: 120, p: 9, portion: 400, st: 400 },
  { n: ["gulaschsoppa", "köttsoppa"], kcal: 70, p: 5, portion: 400, dl: 100 },
  { n: ["ärtsoppa"], kcal: 90, p: 6, portion: 400, dl: 100 },
  { n: ["tomatsoppa", "grönsakssoppa", "soppa"], kcal: 50, p: 1.5, portion: 350, dl: 100 },
  { n: ["omelett"], kcal: 155, p: 11, st: 150, portion: 150 },
  { n: ["äggröra"], kcal: 170, p: 11, portion: 150, dl: 70 },
  { n: ["våffla", "våfflor"], kcal: 300, p: 6, st: 60 },
  { n: ["caesarsallad"], kcal: 140, p: 9, portion: 350, st: 350 },
  { n: ["kycklingsallad"], kcal: 110, p: 12, portion: 350, st: 350 },
  { n: ["poké bowl", "poke bowl", "pokébowl"], kcal: 140, p: 8, portion: 450, st: 450 },
  { n: ["smoothie"], kcal: 70, p: 2, glas: 300, st: 300, dl: 100 },
  { n: ["risotto"], kcal: 140, p: 4, portion: 400, st: 400 },
  { n: ["fish and chips"], kcal: 230, p: 10, portion: 450, st: 450 },
  { n: ["fiskpinnar"], kcal: 200, p: 12, st: 25, portion: 150 },
  { n: ["fläskpannkaka"], kcal: 190, p: 9, portion: 250, bit: 250 },
  { n: ["kåldolmar"], kcal: 140, p: 7, st: 70, portion: 350 },
  { n: ["raggmunk", "raggmunkar"], kcal: 200, p: 5, st: 100 },
  { n: ["kycklingwrap", "wrap med kyckling"], kcal: 200, p: 12, st: 250 },
  { n: ["panini"], kcal: 250, p: 12, st: 200 },
  { n: ["räksmörgås"], kcal: 200, p: 9, st: 250 },
  { n: ["baguette"], kcal: 250, p: 10, st: 250 },
  { n: ["varm macka", "ostmacka"], kcal: 260, p: 11, st: 120 },
  { n: ["semla"], kcal: 300, p: 6, st: 150 },
  { n: ["muffins", "muffin"], kcal: 400, p: 5, st: 80 },
  { n: ["kladdkaka"], kcal: 400, p: 5, bit: 80, st: 80 },
  { n: ["tårta", "prinsesstårta"], kcal: 250, p: 4, bit: 120, st: 120 },
  { n: ["chokladboll", "chokladbollar"], kcal: 450, p: 5, st: 40 },
  { n: ["proteinpudding"], kcal: 70, p: 10, st: 200 },
  { n: ["energibar", "müslibar"], kcal: 400, p: 8, st: 40 },

  // Fett, sött, övrigt
  { n: ["olivolja", "rapsolja", "olja"], kcal: 900, p: 0, msk: 10, tsk: 4 },
  { n: ["jordnötssmör"], kcal: 600, p: 25, msk: 16, tsk: 6 },
  { n: ["mandlar", "mandel", "cashew", "cashewnötter", "nötter", "jordnötter"], kcal: 600, p: 20, dl: 60, nave: 30 },
  { n: ["mörk choklad"], kcal: 550, p: 7, bit: 10, st: 100 },
  { n: ["choklad", "mjölkchoklad"], kcal: 540, p: 7, bit: 10, st: 100 },
  { n: ["godis", "lösgodis"], kcal: 380, p: 2, pase: 200, nave: 40 },
  { n: ["chips"], kcal: 540, p: 6, pase: 175, dl: 10, nave: 25 },
  { n: ["glass"], kcal: 200, p: 3.5, dl: 50, st: 70 },
  { n: ["kanelbulle", "bulle"], kcal: 350, p: 7, st: 80 },
  { n: ["pizza"], kcal: 250, p: 11, st: 350, bit: 45 },
  { n: ["hamburgare", "burgare"], kcal: 250, p: 13, st: 220 },
  { n: ["socker"], kcal: 400, p: 0, tsk: 4, msk: 12 },
  { n: ["honung"], kcal: 320, p: 0.3, tsk: 7, msk: 21 },
  { n: ["sylt"], kcal: 200, p: 0.4, msk: 15, tsk: 5 },
  { n: ["ketchup"], kcal: 100, p: 1, msk: 15 },
  { n: ["majonnäs", "majonäs"], kcal: 700, p: 1, msk: 15, tsk: 5 },
  { n: ["pesto"], kcal: 450, p: 5, msk: 15 },
  { n: ["läsk", "cola"], kcal: 42, p: 0, dl: 100, burk: 330, glas: 200 },
  { n: ["apelsinjuice", "juice"], kcal: 45, p: 0.5, dl: 100, glas: 200 },
  { n: ["öl"], kcal: 43, p: 0.4, dl: 100, burk: 330, st: 330, glas: 400 },
  { n: ["vin", "rödvin", "vitt vin"], kcal: 80, p: 0, dl: 100, glas: 150 },
  { n: ["latte", "cappuccino"], kcal: 50, p: 3.3, st: 250, kopp: 250 },
  { n: ["kaffe", "te"], kcal: 1, p: 0.1, kopp: 150, st: 150 },
];

const UNITS = [
  [["kg", "kilo"], "kg"], [["hg"], "hg"], [["gram", "g"], "g"],
  [["liter", "l"], "l"], [["dl"], "dl"], [["cl"], "cl"], [["ml"], "ml"],
  [["msk", "matsked", "matskedar"], "msk"], [["tsk", "tesked", "teskedar"], "tsk"], [["krm"], "krm"],
  [["skivor", "skiva"], "skiva"], [["portioner", "portion", "port"], "portion"],
  [["bitar", "bit"], "bit"], [["burkar", "burk"], "burk"], [["glas"], "glas"],
  [["koppar", "kopp"], "kopp"], [["skopor", "skopa", "scoop"], "skopa"],
  [["nävar", "näve"], "nave"], [["klyftor", "klyfta"], "klyfta"], [["påsar", "påse"], "pase"], [["styck", "st"], "st"],
];
const NUM_WORDS = { en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, halv: 0.5, halva: 0.5 };
// Standardvikt per enhet när livsmedlet saknar egen (volym räknas som vatten)
const UNIT_DEFAULT = { klyfta: 4, msk: 15, tsk: 5, krm: 1, skiva: 20, portion: 200, bit: 30, burk: 330, glas: 200, kopp: 150, skopa: 30, nave: 30, pase: 200 };

// Namnet måste börja ett ord, så att "laxfilé" inte blir "fil"
function startsWord(text, name) {
  for (let i = text.indexOf(name); i >= 0; i = text.indexOf(name, i + 1)) {
    if (i === 0 || /[\s,(/-]/.test(text[i - 1])) return true;
  }
  return false;
}

function findFood(text) {
  let best = null, len = 0;
  for (const f of FOODS) for (const name of f.n) {
    if (name.length > len && startsWord(text, name)) { best = f; len = name.length; }
  }
  return best;
}

function grams(food, qty, unit) {
  const vol = ml => ml / 100 * (food.dl || 100);
  switch (unit) {
    case "g": return qty;
    case "hg": return qty * 100;
    case "kg": return qty * 1000;
    case "ml": return vol(qty);
    case "cl": return vol(qty * 10);
    case "dl": return vol(qty * 100);
    case "l": return vol(qty * 1000);
    case "st": case null: return qty * (food.st || food.portion || 100);
    default: return qty * (food[unit] || UNIT_DEFAULT[unit] || 100);
  }
}

function parseItem(raw) {
  let s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;
  // "laxfilé 125 g" → "125 g laxfilé"
  const tail = s.match(/^([^\d].*?)\s+(\d+(?:[.,]\d+)?\s*[a-zåäö]*)$/);
  if (tail) s = tail[2] + " " + tail[1];
  let qty = null, unit = null;
  const num = s.match(/^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*/);
  if (num) {
    const v = num[1];
    qty = v.includes("/") ? +v.split("/")[0] / +v.split("/")[1] : +v.replace(",", ".");
    s = s.slice(num[0].length);
  } else {
    const w = s.match(/^(en halv|ett halvt|[a-zåäö]+)\s+/);
    if (w && (NUM_WORDS[w[1]] || w[1].startsWith("en halv") || w[1].startsWith("ett halv"))) {
      qty = NUM_WORDS[w[1]] || 0.5;
      s = s.slice(w[0].length);
    }
  }
  for (const [names, key] of UNITS) {
    const m = names.find(n => s === n || s.startsWith(n + " ") || s.startsWith(n + "."));
    if (m) { unit = key; s = s.slice(m.length).replace(/^\.?\s*/, ""); break; }
  }
  const food = findFood(s);
  if (!food) return { text: raw.trim(), known: false };
  // Utan mängd: en portion, en styck, eller två matskedar för såser och pålägg
  const g = qty == null && !unit
    ? food.portion || food.st || (food.msk ? 2 * food.msk : 100)
    : grams(food, qty == null ? 1 : qty, unit);
  return { text: raw.trim(), known: true, grams: Math.round(g), kcal: Math.round(food.kcal * g / 100), protein: Math.round(food.p * g / 10) / 10 };
}

// Delar på komma (inte decimalkomma), "och", "+" och radbrytning
// "med" delar också, utom när det är en del av en rätt som "korv med bröd"
const MED_DISHES = FOODS.flatMap(f => f.n).filter(n => n.includes(" med "));
function splitMed(part) {
  const low = part.toLowerCase();
  return MED_DISHES.some(n => low.includes(n)) ? [part] : part.split(/\s+med\s+/i);
}

function parseFood(text) {
  const items = text.split(/\s+och\s+|\s*\+\s*|\s*;\s*|\n|,(?!\d)/).flatMap(splitMed).map(parseItem).filter(Boolean);
  const known = items.filter(i => i.known);
  return {
    items,
    kcal: known.reduce((a, i) => a + i.kcal, 0),
    protein: Math.round(known.reduce((a, i) => a + i.protein, 0)),
    unknown: items.filter(i => !i.known).map(i => i.text),
  };
}

