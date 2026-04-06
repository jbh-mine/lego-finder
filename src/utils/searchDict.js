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
  '\ucce8\ub9ac\ube44\uc548\uc758\ud574\uc801': '10365',
  '\ucce8\ub9ac\ube44\uc548 \ud574\uc801': '10365',
  '\ud0c0\uc774\ud0c0\ub2c9': '10294',
  '\ucf5c\ub85c\uc138\uc6c0': '10276',
  '\uc5d0\ud384\ud0d1': '10307',
  '\ub098\ubb34\uc9d1': '21318',
  '\ud2b8\ub9ac\ud558\uc6b0\uc2a4': '21318',
  '\uc911\uc138\ub300\uc7a5\uac04': '21325',
  '\uc911\uc138 \ub300\uc7a5\uac04': '21325',
  '\uadf8\ub79c\ub4dc\ud53c\uc544\ub178': '21323',
  '\uc9c0\uad6c\ubcf8': '21332',
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
  ['\ud638\uadf8\uc640\ud2b8 \uc131', 'Hogwarts Castle'],
  ['\ud638\uadf8\uc640\ud2b8\uc131', 'Hogwarts Castle'],
  ['\ud638\uadf8\uc640\ud2b8\ub9ac\ub9c1', 'Hogsmeade'],
  ['\ud638\uadf8\ub9c8\ub9ac', 'Hogsmeade'],
  ['\ub530\ub978\ub0b4\ub0e8', 'Diagon Alley'],
  ['\ub0b4\ub0e8\uac70\ub9ac', 'Diagon Alley'],
  ['\ud638\uadf8\ub0b8\ub978', 'Hogsmeade'],

  // ===== Pirates =====
  ['\ube44\ub098\uce6d', 'Pirates'],
  ['\ube44\ub098\uce6d\ub0b4\uc678', 'Pirates'],
  ['\ube14\ub799 \ud384', 'Black Pearl'],
  ['\ucce8\ub9ac\ube44\uc548\uc758 \ud574\uc801', 'Pirates of the Caribbean'],
  ['\ucce8\ub9ac\ube44\uc548 \ud574\uc801', 'Pirates of the Caribbean'],
  ['\uc7ad\uc2a4\ud328\ub85c\uc6b0', 'Jack Sparrow'],
  ['\uc7ad \uc2a4\ud328\ub85c\uc6b0', 'Jack Sparrow'],
  ['\uccea\ud134 \uc7ad \uc2a4\ud328\ub85c\uc6b0', 'Captain Jack Sparrow'],

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
  '\ub098\ubb34': 'Tree',
  '\ubaa8\ub4c8\ub7ec': 'Modular',
  '\uc2a4\ud0c0\uc6cc\uc988': 'Star Wars',
  '\uc2a4\ud0c0': 'Star',
  '\ub9c8\ubc95': 'Magic',
  '\uc131': 'Castle',
  '\ud574\uc801': 'Pirate',
  '\uc6b0\uc8fc': 'Space',
  '\ub3c4\uc2dc': 'City',
  '\uae30\ucc28': 'Train',
  '\ube44\ud589\uae30': 'Airplane',
  '\ub85c\ubd07': 'Robot',
  '\ub2cc\uc790\uace0': 'Ninjago',
  '\ud14c\ud06c\ub2c9': 'Technic',
  '\ub4c0\ud50c\ub85c': 'Duplo',
  '\ud504\ub80c\uc988': 'Friends',
  '\ubc30\ud2b8\ub9e8': 'Batman',
  '\uc288\ud37c\ud788\uc5b4\ub85c': 'Super Hero',
  '\ub9c8\uc778\ud06c\ub798\ud504\ud2b8': 'Minecraft',
  '\ub9c8\uc778 \ud06c\ub798\ud504\ud2b8': 'Minecraft',
  '\uc544\uc774\ub514\uc5b4': 'Ideas',
  '\ud06c\ub9ac\uc5d0\uc774\ud130': 'Creator',
  '\ud06c\ub9ac\uc5d0\uc774\ud130 \uc804\ubb38\uac00': 'Creator Expert',
  '\uc544\ud0a4\ud14d\ucc98': 'Architecture',
  // ===== Common Korean search terms =====
  '\uACBD\uCC30\uC11C': 'Police Station',
  '\uACBD\uCC30': 'Police',
  '\uC18C\uBC29\uC11C': 'Fire Station',
  '\uC18C\uBC29': 'Fire',
  '\uBCD1\uC6D0': 'Hospital',
  '\uD559\uAD50': 'School',
  '\uACF5\uD56D': 'Airport',
  '\uD56D\uAD6C': 'Harbor',
  '\uD56D\uAD6C\uB3C4\uC2DC': 'Harbor City',
  '\uBC30': 'Ship',
  '\uBC30\uBC30': 'Ship',
  '\uBE44\uD589': 'Flight',
  '\uC18C\uBC29\uCC28': 'Fire Truck',
  '\uACBD\uCC30\uCC28': 'Police Car',
  '\uC790\uB3D9\uCC28': 'Car',
  '\uD2B8\uB7ED': 'Truck',
  '\uBC84\uC2A4': 'Bus',
  '\uD5EC\uB9AC\uCF65\uD130': 'Helicopter',
  '\uC624\uD1A0\uBC14\uC774': 'Motorcycle',
  '\uB18D\uC7A5': 'Farm',
  '\uC815\uAE00': 'Jungle',
  '\uD0D0\uD5D8': 'Exploration',
  '\uC6B0\uC8FC\uC120': 'Spaceship',
  '\uB85C\uCF13': 'Rocket',
  '\uB2EC\uAE30\uC9C0': 'Moon Base',
  '\uD654\uC131': 'Mars',
  '\uACF5\uB8E1': 'Dinosaur',
  '\uC5F0\uB9BD': 'United',
  '\uBC15\uBB3C\uAD00': 'Museum',
  '\uB3C4\uC11C\uAD00': 'Library',
  '\uC2DD\uB2F9': 'Restaurant',
  '\uCE74\uD398': 'Cafe',
  '\uD638\uD154': 'Hotel',
  '\uC601\uD654\uAD00': 'Cinema',
  '\uAC00\uAC8C': 'Shop',
  '\uC0C1\uC810': 'Store',
  '\uC2DC\uC7A5': 'Market',
  '\uB808\uC2A4\uD1A0\uB791': 'Restaurant',
  '\uC740\uD589': 'Bank',
  '\uC6B0\uCCB4\uAD6D': 'Post Office',
  '\uC8FC\uC720\uC18C': 'Gas Station',
  '\uC815\uBE44\uC18C': 'Garage',
};

function translateSearchQuery(q) {
  if (!q) return '';

  var trimmed = q.trim();

  // 1. Check SET_NUM_MAP exact match first (nickname -> set number)
  if (SET_NUM_MAP[trimmed]) {
    return SET_NUM_MAP[trimmed];
  }

  // 2. Check PHRASE_MAP (exact phrase in query)
  for (var i = 0; i < PHRASE_MAP.length; i++) {
    if (trimmed.indexOf(PHRASE_MAP[i][0]) !== -1) {
      return PHRASE_MAP[i][1];
    }
  }

  // 3. Word-based translation (WORD_MAP) - check BEFORE prefix matching
  var words = trimmed.split(' ');
  var newWords = [];
  var anyTranslated = false;
  for (var j = 0; j < words.length; j++) {
    var word = words[j];
    if (WORD_MAP[word]) {
      newWords.push(WORD_MAP[word]);
      anyTranslated = true;
    } else {
      newWords.push(word);
    }
  }
  if (anyTranslated) {
    return newWords.join(' ');
  }

  // 4. Partial word match from WORD_MAP
  var bestWord = null;
  var bestWordLen = 0;
  var keys = Object.keys(WORD_MAP);
  for (var w = 0; w < keys.length; w++) {
    var wko = keys[w];
    if (wko.indexOf(trimmed) === 0 && trimmed.length >= 2 && wko.length > bestWordLen) {
      bestWord = WORD_MAP[wko];
      bestWordLen = wko.length;
    }
    if (trimmed.indexOf(wko) === 0 && wko.length > bestWordLen) {
      bestWord = WORD_MAP[wko];
      bestWordLen = wko.length;
    }
  }
  if (bestWord) {
    return bestWord;
  }

  // 5. SET_NUM_MAP prefix matching (LAST, strict: query must cover >= 60% of key)
  var setKeys = Object.keys(SET_NUM_MAP);
  for (var sk = 0; sk < setKeys.length; sk++) {
    if (setKeys[sk].indexOf(trimmed) === 0 && trimmed.length >= 2 && trimmed.length >= setKeys[sk].length * 0.6) {
      return SET_NUM_MAP[setKeys[sk]];
    }
  }

  return trimmed;
}

export { translateSearchQuery, SET_NUM_MAP };
