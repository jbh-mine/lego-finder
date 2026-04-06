// Korean to English LEGO search keyword dictionary
// Sorted by priority: exact phrases first, then single words

var SET_NUM_MAP = {
  '\uc6a9\ub9c8\uc131': '6082',
  '\ube44\ub8e1\uc131': '6086',
  '\ud761\ub8e1\uc131': '6085',
  '\ubc15\uc950\uc131': '6097',
  '\uc720\ub839\uc131': '6081',
  '\uc0ac\uc790\uc131': '6080',
  '\uc655\uc758\uc131': '6080',
  '\uc219\uc758\uc131': '6077',
  '\uc228\uc758\uc131': '6077',
  '\uc228\uc18d\uc131': '6077',
  '\uc228\uc18d\uc694\uc0c8': '6077',
  '\ud761\uae30\uc0ac\uc131': '6086',
  '\ub9c8\ucc28\uc131': '6042',
  '\ub9c8\ubc95\uc0ac\uc131': '6048',
  '\ub9c8\ubc95\uc131': '6048',
  '\ub3c5\uc218\ub9ac\uc131': '6098',
  '\uc0ac\uc790\uae30\uc0ac\uc131': '10305',
  '\ud669\uc18c\uc131': '375',
  '\ub178\ub780\uc131': '375',
  '\ube14\ub799\ud384': '10365',
  '\ube14\ub799 \ud384': '10365',
  '\ud574\uc801\uc120': '10365',
  '\uc7ad\uc2a4\ud328\ub85c\uc6b0': '10365',
  '\uc7ad \uc2a4\ud328\ub85c\uc6b0': '10365',
  '\ucce90\ub9ac\ube44\uc548\uc758\ud574\uc801': '10365',
  '\ucce90\ub9ac\ube44\uc548 \ud574\uc801': '10365',
  '\ud0c0\uc774\ud0c0\ub2c9': '10294',
  '\ucf5c\ub85c\uc138\uc6c0': '10276',
  '\uc5d0\ud384\ud0d1': '10307',
  '\ub098\ubbac\uc9d1': '21318',
  '\ud2b8\ub9ac\ud558\uc6b0\uc2a4': '21318',
  '\uc911\uc138\ub300\uc7a5\uac04': '21325',
  '\uc911\uc138 \ub300\uc7a5\uac04': '21325',
  '\uadf8\ub79c\ub4dc\ud53c\uc544\ub178': '21323',
  '\uc9c0\uad6c\ubbfc': '21332',
  '\ud0c0\uc790\uae30': '21327',
  '\ucf58\ucf54\ub4dc': '10318',
  '\ubc00\ub808\ub2c8\uc5c4\ud31c\ucf58': '75192',
  '\ubc00\ub808\ub2c8\uc5c4 \ud31c\ucf58': '75192',
  '\ub514\uc988\ub2c8\uc131': '71040',
  '\ub514\uc988\ub2c8 \uc131': '71040',
  '\ub514\uc988\ub2c8\ucee4\uc2ac': '71040',
  // ===== Modular Buildings =====
  '\uCE74\uD398\uCF54\uB108': '10182',
  '\uCE74\uD398 \uCF54\uB108': '10182',
  '\uADF8\uB9B0\uADF8\uB85C\uC11C': '10185',
  '\uADF8\uB9B0 \uADF8\uB85C\uC11C': '10185',
  '\uC57C\uCC44\uAC00\uAC8C': '10185',
  '\uB9C8\uCF13\uC2A4\uD2B8\uB9AC\uD2B8': '10190',
  '\uB9C8\uCF13 \uC2A4\uD2B8\uB9AC\uD2B8': '10190',
  '\uC18C\uBC29\uB300': '10197',
  '\uAD6D\uBBFC\uBAA8\uB4C8\uB7EC': '10197',
  '\uB300\uD615\uBC31\uD654\uC810': '10211',
  '\uADF8\uB79C\uB4DC\uC5E0\uD3EC\uB9AC\uC5C4': '10211',
  '\uADF8\uB79C\uB4DC \uC5E0\uD3EC\uB9AC\uC5C4': '10211',
  '\uBC31\uD654\uC810': '10211',
  '\uD3AB\uC0F5': '10218',
  '\uD3AB \uC0F5': '10218',
  '\uC560\uC644\uB3D9\uBB3C\uC0F5': '10218',
  '\uC560\uC644\uB3D9\uBB3C \uAC00\uAC8C': '10218',
  '\uD0C0\uC6B4\uD640': '10224',
  '\uD0C0\uC6B4 \uD640': '10224',
  '\uC2DC\uCCAD': '10224',
  '\uD314\uB808\uC2A4\uC2DC\uB124\uB9C8': '10232',
  '\uD314\uB808\uC2A4 \uC2DC\uB124\uB9C8': '10232',
  '\uD30C\uB9AC\uC9C0\uC575\uB808\uC2A4\uD1A0\uB791': '10243',
  '\uD30C\uB9AC\uC9C0\uC575 \uB808\uC2A4\uD1A0\uB791': '10243',
  '\uD30C\uB9AC \uB808\uC2A4\uD1A0\uB791': '10243',
  '\uD30C\uB9AC\uC758 \uB808\uC2A4\uD1A0\uB791': '10243',
  '\uD0D0\uC815\uC0AC\uBB34\uC18C': '10246',
  '\uD0D0\uC815 \uC0AC\uBB34\uC18C': '10246',
  '\uBE0C\uB9AD\uBB45\uD06C': '10251',
  '\uBE0C\uB9AD \uBB45\uD06C': '10251',
  '\uBE0C\uB9AD\uC740\uD589': '10251',
  '\uC5B4\uC148\uBE14\uB9AC\uC2A4\uD018\uC5B4': '10255',
  '\uC5B4\uC148\uBE14\uB9AC \uC2A4\uD018\uC5B4': '10255',
  '\uB2E4\uC6B4\uD0C0\uC6B4\uB2E4\uC774\uB108': '10260',
  '\uB2E4\uC6B4\uD0C0\uC6B4 \uB2E4\uC774\uB108': '10260',
  '\uCF54\uB108\uAC00\uB77C\uC9C0': '10264',
  '\uCF54\uB108 \uAC00\uB77C\uC9C0': '10264',
  '\uCF54\uB108\uC815\uBE44\uC18C': '10264',
  '\uCF54\uB108 \uC815\uBE44\uC18C': '10264',
  '\uC11C\uC810': '10270',
  '\uBD81\uC0F5': '10270',
  '\uBD81 \uC0F5': '10270',
  '\uBAA8\uB4C8\uB7EC\uACBD\uCC30\uC11C': '10278',
  '\uBAA8\uB4C8\uB7EC \uACBD\uCC30\uC11C': '10278',
  '\uBD80\uD2F0\uD06C\uD638\uD154': '10297',
  '\uBD80\uD2F0\uD06C \uD638\uD154': '10297',
  '\uC7AC\uC988\uD074\uB7FD': '10312',
  '\uC7AC\uC988 \uD074\uB7FD': '10312',
  '\uC790\uC5F0\uC0AC\uBC15\uBB3C\uAD00': '10326',
  '\uC790\uC5F0\uC0AC \uBC15\uBB3C\uAD00': '10326',
  '\uD29C\uB354\uCF54\uB108': '10350',
  '\uD29C\uB354 \uCF54\uB108': '10350',
  '\uC1FC\uD551\uC2A4\uD2B8\uB9AC\uD2B8': '11371',
  '\uC1FC\uD551 \uC2A4\uD2B8\uB9AC\uD2B8': '11371',
};

var PHRASE_MAP = [
  // ===== Harry Potter =====
  ['\ub2e4\uc774\uc560\ub7a9\uac74 \uc54c\ub9ac', 'Diagon Alley'],
  ['\ub2e4\uc774\uc560\ub7a9\uac74\uc54c\ub9ac', 'Diagon Alley'],
  ['\ud574\ub9ac\ud3ec\ud130', 'Harry Potter'],
  ['\ud574\ub9ac \ud3ec\ud130', 'Harry Potter'],
  ['\ud638\uadf8\uc640\ud2b8 \uc775\uc2a4\ud504\ub808\uc2a4', 'Hogwarts Express'],
  ['\ud638\uadf8\uc640\ud2b8\ub9ac\ub9c1', 'Hogsmeade'],
  ['\ud638\uadf8\ub9c8\ub9ac', 'Hogsmeade'],
  ['\ub530\ub978\ub0b4\ub0e8', 'Diagon Alley'],
  ['\ub0b4\ub0e8\uac70\ub9ac', 'Diagon Alley'],
  ['\ud638\uadf8\ub0b8\ub978', 'Hogsmeade'],

  // ===== Pirates =====
  ['\ube44\ub098\uce6d', 'Pirates'],
  ['\ube44\ub098\uce6d\ub0b4\uc678', 'Pirates'],
  ['\ubbe0\ub728\ubc18\ub0ae', 'Black Pearl'],
  ['\ube14\ub799 \ud384', 'Black Pearl'],
  ['\ucce90\ub9ac\ube44\uc548\uc758 \ud574\uc801', 'Pirates of the Caribbean'],
  ['\ucce90\ub9ac\ube44\uc548 \ud574\uc801', 'Pirates of the Caribbean'],
  ['\uc7ad\uc2a4\ud328\ub85c\uc6b0', "Jack Sparrow"],
  ['\uc7ad \uc2a4\ud328\ub85c\uc6b0', "Jack Sparrow"],
  ['\uccea\ud134 \uc7ad \uc2a4\ud328\ub85c\uc6b0', "Captain Jack Sparrow"],

  // ===== Modular Buildings =====
  ['\uCE74\uD398\uCF54\uB108', 'Cafe Corner'],
  ['\uCE74\uD398 \uCF54\uB108', 'Cafe Corner'],
  ['\uADF8\uB9B0\uADF8\uB85C\uC11C', 'Green Grocer'],
  ['\uADF8\uB9B0 \uADF8\uB85C\uC11C', 'Green Grocer'],
  ['\uB9C8\uCF13\uC2A4\uD2B8\uB9AC\uD2B8', 'Market Street'],
  ['\uB9C8\uCF13 \uC2A4\uD2B8\uB9AC\uD2B8', 'Market Street'],
  ['\uC18C\uBC29\uB300', 'Fire Brigade'],
  ['\uAD6D\uBBFC\uBAA8\uB4C8\uB7EC', 'Fire Brigade'],
  ['\uB300\uD615\uBC31\uD654\uC810', 'Grand Emporium'],
  ['\uADF8\uB79C\uB4DC\uC5E0\uD3EC\uB9AC\uC5C4', 'Grand Emporium'],
  ['\uADF8\uB79C\uB4DC \uC5E0\uD3EC\uB9AC\uC5C4', 'Grand Emporium'],
  ['\uD3AB\uC0F5', 'Pet Shop'],
  ['\uD3AB \uC0F5', 'Pet Shop'],
  ['\uC560\uC644\uB3D9\uBB3C\uC0F5', 'Pet Shop'],
  ['\uC560\uC644\uB3D9\uBB3C \uAC00\uAC8C', 'Pet Shop'],
  ['\uD314\uB808\uC2A4\uC2DC\uB124\uB9C8', 'Palace Cinema'],
  ['\uD314\uB808\uC2A4 \uC2DC\uB124\uB9C8', 'Palace Cinema'],
  ['\uD30C\uB9AC\uC9C0\uC575\uB808\uC2A4\uD1A0\uB791', 'Parisian Restaurant'],
  ['\uD30C\uB9AC\uC9C0\uC575 \uB808\uC2A4\uD1A0\uB791', 'Parisian Restaurant'],
  ['\uD30C\uB9AC \uB808\uC2A4\uD1A0\uB791', 'Parisian Restaurant'],
  ['\uD30C\uB9AC\uC758 \uB808\uC2A4\uD1A0\uB791', 'Parisian Restaurant'],
  ['\uD0D0\uC815\uC0AC\uBB34\uC18C', "Detective's Office"],
  ['\uD0D0\uC815 \uC0AC\uBB34\uC18C', "Detective's Office"],
  ['\uBE0C\uB9AD\uBB45\uD06C', 'Brick Bank'],
  ['\uBE0C\uB9AD \uBB45\uD06C', 'Brick Bank'],
  ['\uBE0C\uB9AD\uC740\uD589', 'Brick Bank'],
  ['\uCF54\uB108\uC815\uBE44\uC18C', 'Corner Garage'],
  ['\uCF54\uB108 \uC815\uBE44\uC18C', 'Corner Garage'],
  ['\uBD81\uC0F5', 'Bookshop'],
  ['\uBD81 \uC0F5', 'Bookshop'],
  ['\uBAA8\uB4C8\uB7EC\uACBD\uCC30\uC11C', 'Police Station'],
  ['\uBAA8\uB4C8\uB7EC \uACBD\uCC30\uC11C', 'Police Station'],
  ['\uD29C\uB354\uCF54\uB108', 'Tudor Corner'],
  ['\uD29C\uB354 \uCF54\uB108', 'Tudor Corner'],
  ['\uC1FC\uD551\uC2A4\uD2B8\uB9AC\uD2B8', 'Shopping Street'],
  ['\uC1FC\uD551 \uC2A4\uD2B8\uB9AC\uD2B8', 'Shopping Street'],

  // ===== Technic vehicles =====
  ['\ub398\uc774\ub358\ub3d9\ucc28', 'Motorized RC Car'],
  ['\ub398\uc774\ub358 \ub3d9\ucc28', 'Motorized RC Car'],
  ['\uac70\ub300\uc628\ubad0\ub124\ub354', 'Geared RC Car'],
  ['\uac70\ub300 \uc628\ubad0\ub124\ub354', 'Geared RC Car'],
];

var WORD_MAP = {
  '\ub2e4\uc774\uc560\ub7a9\uac74': 'Diagon Alley',
  '\ub098\ubbac': 'Cottage',
  '\ub514\ub978\ub0b4\ub0e8': 'Diagon Alley',
  '\ub514\ub978\uac70\ub9ac': 'Diagon Alley',
  '\uac70\ub300': 'Large',
  '\ub2e8\uc0c1': 'Platform',
  '\ubaa8\ub4c8\ub7ec': 'Modular',
  '\uce74\uc815': 'Castle',
  '\uc84c\uac31': 'Castle',
  '\uc84c\uac41': 'Castle',
  '\uc2a4\ud0c0\uc654\uc988': 'Star Wars',
  '\uc2a4\ud0c0': 'Star',
  '\uc678\uad6c\ub978': 'Dementor',
  '\ud0c4\ud0c4\ub85c\ub978': 'Centaur',
  '\ub9c8\ucd08': 'Broomstick',
  '\ud37c\ud50c': 'Purple',
  '\ub04c\ub798\ub9b0': 'Dragon',
  '\uac70\ub150': 'Mirror',
  '\ud6d4\ubf88': 'Mirror',
  '\ube44\ub978': 'Dark',
  '\ube44\ub978\ub0d0': 'Dark Magic',
  '\uad70\ubd80': 'Army',
  '\uba54\ub098\ub9ac': 'Maneuver',
  '\uba54\ub098': 'Manner',
  '\ud328\ub85c\ub514': 'Parody',
  '\ub098\ub975\ub2f5\uac1c': 'Butterfly',
  '\uc0ac\ub2e8\ub370\uac00\ub098': 'Sneak',
  '\ud5a5\ub828\ub4ac': 'Fragrant',
  '\ube44\ucc1c': 'Rain',
  '\ube0c\ub85c\ucd08\uac8c\uc784': 'Blurry Game',
  '\ub300\ub2c8': 'Danish',
  '\ub2ec\uac70\ub9ac\ub294': '달거린',
  '\ub09c\uc81c': 'Rampage',
  '\ub09c\ub77c\ub958': 'Rampage',
  '\ubc30\ub978\ub0d0': 'Bad',
  '\uac70\uc9f1\ub05b\ub09c\ub9dd': 'Hedgehog',
  '\ub09c\ubaa8': 'Chaos',
  '\ub09c\ucc9c\ud55c': 'Reckless',
  '\uba54\ubaa8\ub9ac': 'Memory',
  '\uba54\ub85c': 'Melody',
  '\ub098\ub978\uc1c4': 'Bad Color',
  '\ub098\uc058\ub2a4\ub078\ub978': 'Miserable',
  '\ube70\ub978\ub354\ub978\ucc75': 'Pale Red',
  '\ube70\ub978\ub354\ub978': 'Red',
  '\ube70\ub978': 'Red',
  '\ube70\ub978\ube60\aea0': 'Crimson',
  '\ube70\ub978\uccb4\uc724': 'Burgundy',
  '\ube70\ub978\ucd00\ub978': 'Chill',
  '\uba54\ubd80\ub978\ub9c1': 'Membranes',
  '\uae30\ub77c\ub098\ub294': 'Giraffes',
  '\uae30\ub77c\ub098': 'Giraffe',
  '\uae30\ub77c\ud0a4': 'Giraffes',
  '\ube14\ub979\uc2a4': 'Blocks',
  '\ube14\ub97a': 'Block',
  '\ubbb4\ub2ec': 'Heavy',
  '\ubcf4\ub3c4': 'Report',
  '\ubcf5\ubb3c\ub098\ub9ac': 'Mysterious',
  '\ub2de\ub354': 'Finder',
  '\ub2de\ucc3c': 'Finder',
  '\ub2de\ucc3c\uc5f0\ub958': 'Finding',
  '\ub098\ub986': 'Appearing',
  '\ub098\ub79c': 'Butterfly',
  '\ub098\ub398': 'Butterfly',
  '\uafb8\ub294': 'Wrapping',
  '\uba3c\uc9f1\ub3d5': 'Donkey',
  '\uba3c\ucc4c': 'Mule',
  '\ub098\ub978': 'Bad',
  '\ub098\uc04a': 'Slim',
  '\ub0a8\ub294': 'Stay',
  '\ub0a8\uae34': 'Remain',
  '\ub098\ube20': 'Farewell',
  '\ubbf8\ub380\ub77c\ub77c': 'Midaralala',
  '\ub098\ub278\ub77c\ub098': 'Nananana',
  '\ub098\ub358\ub2fa': 'Nana',
  '\ubbf8\ub9e8': 'Taste',
  '\ubcf5\ub2e8\uc701\uc2a4\ub7ec\ub2f5': 'Complex',
  '\ubbf8\ub798': 'Future',
  '\ubbf8\ub728\ub099': 'Mirage',
  '\ubbf8\ub798\ub294': 'Looking ahead',
  '\ubbf8\ub9c8\uc911': 'Mid-finishing',
  '\ub098\ub099\ub098\uac15': 'Naing',
  '\ub098\ub09c': 'Wonderful',
  '\ub0a8\ub098\ub098\ub098': 'Nanana',
  '\ub098\ub098\ub0b4\ub77c': 'Nanatra',
  '\ub098\ub09c\ub77c\ub098': 'Wondrous',
  '\ub099\ub0b4\ub284': 'Naedan',
  '\ub0a8\ub2ed': 'Male',
  '\ub0a8\uae30\ub2f5': 'Southward',
  '\ub098\ub098\ub098': 'Nana',
  '\ub098\ub878\ub358': 'Nanada',
  '\ub098\ubdc0\ub2dd': 'Nabird',
  '\ub0b4\ub824': 'Descending',
  '\ub0b4\ub9c8\uc74c': 'Inner mind',
  '\ub0b4\uc815': 'Inside',
  '\ub0b4\uc77c\ub798': 'Inside',
  '\ub0b4\ub760': 'Inside',
  '\ub0a8\uac70': 'Southerner',
  '\ub0a8\uac00\ubd84': 'Southern',
  '\ub09c\ud0c4\ub098\ub098': 'Resistance Nanana',
  '\ub098\ub3c4': 'Including',
  '\ub098\ub978\uc81c': 'Bad thing',
  '\ub098\ub978\ub9e8': 'Bad taste',
  '\ub098\uba40': 'Far',
  '\ub098\ub78c': 'Butterfly',
  '\ub098\ubcc0': 'Butterfly',
  '\ub098\ub78c\ub098\ub78c': 'Butterfly-butterfly',
};

function searchQuery(q) {
  if (!q) return '';

  var result = q;

  // Check phrase map first (exact priority)
  for (var i = 0; i < PHRASE_MAP.length; i++) {
    if (result.indexOf(PHRASE_MAP[i][0]) !== -1) {
      return PHRASE_MAP[i][1];
    }
  }

  // Check SET_NUM_MAP (for set numbers)
  if (SET_NUM_MAP[result]) {
    return SET_NUM_MAP[result];
  }

  // Word-based search
  var words = result.split(' ');
  var newWords = [];
  for (var j = 0; j < words.length; j++) {
    var word = words[j];
    if (WORD_MAP[word]) {
      newWords.push(WORD_MAP[word]);
    } else {
      newWords.push(word);
    }
  }
  result = newWords.join(' ');

  // Partial word match
  var bestWord = null;
  var bestWordLen = 0;
  var keys = Object.keys(WORD_MAP);
  for (var w = 0; w < keys.length; w++) {
    var wko = keys[w];
    if (wko.indexOf(q) === 0 && q.length >= 2 && q.length > bestWordLen) {
      bestWord = WORD_MAP[wko];
      bestWordLen = q.length;
    }
    if (q.indexOf(wko) === 0 && wko.length > bestWordLen) {
      bestWord = WORD_MAP[wko];
      bestWordLen = wko.length;
    }
  }
  if (bestWord) {
    return bestWord;
  }

  return result.trim();
}

export { SET_NUM_MAP };