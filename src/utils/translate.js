var CACHE_KEY = 'lego_name_translations';
var API_URL = 'https://api.mymemory.translated.net/get';
var pendingRequests = {};

// Hardcoded set-name translations for popular / newer sets where
// the MyMemory API tends to produce awkward or partial Korean output.
// Keys are matched both as exact set names AND as substrings, so a
// rebrickable name like "Hogwarts Castle: Hospital Wing" or
// "Hogwarts Castle - Hospital Wing" will both resolve.
var SET_NAME_MAP = {
  // Harry Potter 2026 wave
  'Hogwarts Castle: Hospital Wing': '\uD638\uADF8\uC640\uD2B8 \uC131: \uBCD1\uC6D0\uB3D9',
  'Hogwarts Castle: Sorting Hat Ceremony': '\uD638\uADF8\uC640\uD2B8 \uC131: \uAE30\uC219\uC0AC \uC758\uC2DD',
  'Hagrid & Harry\'s Privet Drive Escape': '\uD574\uADF8\uB9AC\uB4DC\uC640 \uD574\uB9AC\uC758 \uD504\uB9AC\uBCB3 \uB4DC\uB77C\uC774\uBE0C \uD0C8\uCD9C',
  'Cornish Pixie': '\uCF54\uB2C8\uC2DC \uD53D\uC2DC',
  'Cauldron: Secret Potions Classroom': '\uAC00\uB9C8\uC194: \uBE44\uBC00\uC758 \uBA38\uADF8\uC57D \uAD50\uC2E4',
  'Philosopher\'s Stone Collectors\' Edition': '\uB9C8\uBC95\uC0AC\uC758 \uB3CC \uCEEC\uB809\uD130\uC988 \uC5D0\uB514\uC158',
  'Sorcerer\'s Stone Collectors\' Edition': '\uB9C8\uBC95\uC0AC\uC758 \uB3CC \uCEEC\uB809\uD130\uC988 \uC5D0\uB514\uC158',
  'Luna Lovegood\'s House': '\uB8E8\uB098 \uB7EC\uBE0C\uAD7F\uC758 \uC9D1',
  'Hogwarts House Symbol': '\uD638\uADF8\uC640\uD2B8 \uAE30\uC219\uC0AC \uC0C1\uC9D5',
  'Hogwarts Crest': '\uD638\uADF8\uC640\uD2B8 \uBB38\uC7A5',
  'Hogwarts Castle: East Wing': '\uD638\uADF8\uC640\uD2B8 \uC131: \uB3D9\uCABD \uB0A0\uAC1C',
  // Harry Potter older popular
  'Hogwarts Castle': '\uD638\uADF8\uC640\uD2B8 \uC131',
  'Hogwarts Hospital Wing': '\uD638\uADF8\uC640\uD2B8 \uBCD1\uC6D0\uB3D9',
  'Hogwarts Express': '\uD638\uADF8\uC640\uD2B8 \uADF8\uAE09 \uC5F4\uCC28',
  'Diagon Alley': '\uB2E4\uC774\uC560\uACE8\uB9AC',
  'The Battle of Hogwarts': '\uD638\uADF8\uC640\uD2B8 \uC804\uD22C',
  'Hogwarts Astronomy Tower': '\uD638\uADF8\uC640\uD2B8 \uCC9C\uBB38\uD0D1',
  'Hogwarts Whomping Willow': '\uD638\uADF8\uC640\uD2B8 \uD138\uB098\uBB34',
  'Hogwarts: Dumbledore Office': '\uD638\uADF8\uC640\uD2B8: \uB364\uBE14\uB3C4\uC5B4 \uAD50\uC7A5\uC2E4',
  'Hogwarts: Polyjuice Potion Mistake': '\uD638\uADF8\uC640\uD2B8: \uD3F4\uB9AC\uC8FC\uC2A4 \uB9C8\uBC95\uC57D \uC2E4\uC218',
  'Hogwarts: Room of Requirement': '\uD638\uADF8\uC640\uD2B8: \uD544\uC694\uC758 \uBC29',
  'Hogwarts: Grand Staircase': '\uD638\uADF8\uC640\uD2B8: \uB300\uACC4\uB2E8',
  'Hogwarts Moment: Charms Class': '\uD638\uADF8\uC640\uD2B8 \uC21C\uAC04: \uB9C8\uBC95 \uC218\uC5C5',
  'Hogwarts Moment: Defence Against the Dark Arts Class': '\uD638\uADF8\uC640\uD2B8 \uC21C\uAC04: \uC5B4\uB460\uC758 \uB9C8\uC220 \uBC29\uC5B4\uBC95 \uC218\uC5C5',
  'Hogwarts Moment: Herbology Class': '\uD638\uADF8\uC640\uD2B8 \uC21C\uAC04: \uC57D\uCD08\uD559 \uC218\uC5C5',
  'Hogwarts Moment: Potions Class': '\uD638\uADF8\uC640\uD2B8 \uC21C\uAC04: \uB9C8\uBC95\uC57D \uC218\uC5C5',
  'Hogwarts Moment: Transfiguration Class': '\uD638\uADF8\uC640\uD2B8 \uC21C\uAC04: \uBCC0\uC2E0\uC220 \uC218\uC5C5',
  'Hogwarts Moment: Divination Class': '\uD638\uADF8\uC640\uD2B8 \uC21C\uAC04: \uC810\uD0D0\uD559 \uC218\uC5C5',
  // Star Wars classics
  'Millennium Falcon': '\uBC00\uB808\uB2C8\uC5C4 \uD314\uCF58',
  'AT-AT': '\uC81C\uAD6D \uACF5\uACA9\uAE30\uAC11 \uC6CC\uCEE4 AT-AT',
  'Mos Eisley Cantina': '\uBAA8\uC2A4 \uC544\uC774\uC2A4\uB9AC \uCE74\uD2F0\uB098',
  'Imperial Star Destroyer': '\uC81C\uAD6D \uC2A4\uD0C0 \uB514\uC2A4\uD2B8\uB85C\uC774\uC5B4',
  'Death Star': '\uB370\uC2A4 \uC2A4\uD0C0',
  'Republic Gunship': '\uACF5\uD654\uAD6D \uAC74\uC26D',
  // Marvel
  'Sanctum Sanctorum': '\uC0CC\uD06C\uD140 \uC0CC\uD06C\uD1A0\uB7FC',
  'Avengers Tower': '\uC5B4\uBCB4\uC838\uC2A4 \uD0C0\uC6CC',
  'Daily Bugle': '\uB370\uC77C\uB9AC \uBDF0\uAE00',
  // Modular / Icons
  'Boutique Hotel': '\uBD80\uD2F0\uD06C \uD638\uD154',
  'Jazz Club': '\uC7AC\uC988 \uD074\uB7FD',
  'Natural History Museum': '\uC790\uC5F0\uC0AC\uBC15\uBB3C\uAD00',
  'Notre-Dame de Paris': '\uD30C\uB9AC \uB178\uD2B8\uB974\uB2F4 \uB300\uC131\uB2F9',
  'Tower Bridge': '\uD0C0\uC6CC \uBE0C\uB9AC\uC9C0',
  'Eiffel Tower': '\uC5D0\uD3E0\uD0D1',
  'Titanic': '\uD0C0\uC774\uD0C0\uB2C9',
  'Colosseum': '\uCF5C\uB85C\uC138\uC6C0',
  // Misc popular
  'Bugatti Bolide': '\uBD80\uAC00\uD2F0 \uBCFC\uB77C\uC774\uB4DC',
  'Lion Knights Castle': '\uC0AC\uC790 \uAE30\uC0AC \uC131',
  'Disney Castle': '\uB514\uC988\uB2C8 \uC131',
};

// Hardcoded theme name translations to avoid API encoding issues
var THEME_NAME_MAP = {
  'The Lord of the Rings': '\uBC18\uC9C0\uC758 \uC81C\uC655',
  'The Hobbit': '\uD638\uBE57',
  'Harry Potter': '\uD574\uB9AC \uD3EC\uD130',
  'Star Wars': '\uC2A4\uD0C0\uC6CC\uC988',
  'Super Heroes': '\uC288\uD37C \uD788\uC5B4\uB85C',
  'Marvel Super Heroes': '\uB9C8\uBE14 \uC288\uD37C \uD788\uC5B4\uB85C',
  'DC Super Heroes': 'DC \uC288\uD37C \uD788\uC5B4\uB85C',
  'Disney': '\uB514\uC988\uB2C8',
  'Disney Princess': '\uB514\uC988\uB2C8 \uD504\uB9B0\uC138\uC2A4',
  'Speed Champions': '\uC2A4\uD53C\uB4DC \uCC54\uD53C\uC5B8\uC2A4',
  'Technic': '\uD14C\uD06C\uB2C9',
  'Creator': '\uD06C\uB9AC\uC5D0\uC774\uD130',
  'Creator Expert': '\uD06C\uB9AC\uC5D0\uC774\uD130 \uC5D1\uC2A4\uD37C\uD2B8',
  'Creator 3-in-1': '\uD06C\uB9AC\uC5D0\uC774\uD130 3in1',
  'City': '\uC2DC\uD2F0',
  'Friends': '\uD504\uB80C\uC988',
  'Ninjago': '\uB2CC\uC790\uACE0',
  'Duplo': '\uB4C0\uD50C\uB85C',
  'Architecture': '\uC544\uD0A4\uD14D\uCC98',
  'Ideas': '\uC544\uC774\uB514\uC5B4',
  'Icons': '\uC544\uC774\uCF58\uC988',
  'Minecraft': '\uB9C8\uC778\uD06C\uB798\uD504\uD2B8',
  'Jurassic World': '\uC25F\uB77C\uAE30 \uC6D4\uB4DC',
  'Jurassic Park': '\uC25F\uB77C\uAE30 \uACF5\uC6D0',
  'Botanical Collection': '\uBCF4\uD0C0\uB2C8\uCEEC \uCEEC\uB809\uC158',
  'Classic': '\uD074\uB798\uC2DD',
  'Monkie Kid': '\uBA3D\uD0A4\uD0A4\uB4DC',
  'Super Mario': '\uC288\uD37C \uB9C8\uB9AC\uC624',
  'Indiana Jones': '\uC778\uB514\uC544\uB098 \uC874\uC2A4',
  'Castle': '\uCE90\uC2AC',
  'Pirates': '\uD574\uC801',
  'Space': '\uC6B0\uC8FC',
  'Town': '\uD0C0\uC6B4',
  'Trains': '\uAE30\uCC28',
  'BrickHeadz': '\uBE0C\uB9AD\uD5E4\uC988',
  'Powered Up': '\uD30C\uC6CC\uB4DC \uC5C5',
  'Mindstorms': '\uB9C8\uC778\uB4DC\uC2A4\uD1B0',
  'Education': '\uC5D0\uB4C0\uCF00\uC774\uC158',
  'Hidden Side': '\uD788\uB4E0 \uC0AC\uC774\uB4DC',
  'Nexo Knights': '\uB113\uC18C \uB098\uC774\uCE20',
  'Legends of Chima': '\uD0A4\uB9C8\uC758 \uC804\uC124',
  'Bionicle': '\uBC14\uC774\uC624\uB2C8\uD074',
  'Hero Factory': '\uD788\uC5B4\uB85C \uD329\uD1A0\uB9AC',
  'Ghostbusters': '\uACE0\uC2A4\uD2B8\uBC84\uC2A4\uD130\uC988',
  'Back to the Future': '\uBC31 \uD22C \uB354 \uD4E8\uCC98',
  'Overwatch': '\uC624\uBC84\uC6CC\uCE58',
  'Stranger Things': '\uAE30\uBB18\uD55C \uC774\uC57C\uAE30',
  'Pirates of the Caribbean': '\uCE90\uB9AC\uBE44\uC548\uC758 \uD574\uC801',
  'Transformers': '\uD2B8\uB79C\uC2A4\uD3EC\uBA38',
  'Avatar': '\uC544\uBC14\uD0C0',
  'Sonic the Hedgehog': '\uC18C\uB2C9 \uB354 \uD5E4\uC9C0\uD639',
  'DreamZzz': '\uB4DC\uB9BC\uC988',
  'Wicked': '\uC704\uD0A4\uB4DC',
  'Animal Crossing': '\uB3D9\uBB3C\uC758 \uC232',
  'Fortnite': '\uD3EC\uD2B8\uB098\uC774\uD2B8',
  'The Simpsons': '\uC2EC\uC2A8',
  'Scooby-Doo': '\uC2A4\uCFE0\uBE44\uB450',
  'Sesame Street': '\uC138\uC11C\uBBF8 \uC2A4\uD2B8\uB9AC\uD2B8',
  'Adventurers': '\uC5B4\uB4DC\uBCA4\uCC98\uB7EC',
  'Vikings': '\uBC14\uC774\uD0B9',
  'Kingdoms': '\uD0B9\uB364',
  'Fantasy Era': '\uD310\uD0C0\uC9C0 \uC2DC\uB300',
  'BrickLink Designer Program': 'BDP \uD380\uB529',
  'Modular Buildings': '\uBAA8\uB4C8\uB7EC \uBE4C\uB529',
  'Seasonal': '\uC2DC\uC98C',
  'Winter Village': '\uACA8\uC6B8 \uB9C8\uC744',
  'Elves': '\uC5D8\uD504',
  'The LEGO Movie': '\uB808\uACE0 \uBB34\uBE44',
  'The LEGO Movie 2': '\uB808\uACE0 \uBB34\uBE44 2',
  'The LEGO Batman Movie': '\uB808\uACE0 \uBC30\uD2B8\uB9E8 \uBB34\uBE44',
  'The LEGO Ninjago Movie': '\uB808\uACE0 \uB2CC\uC790\uACE0 \uBB34\uBE44',
  'Gabby\'s Dollhouse': '\uAC1C\uBE44\uC758 \uB9E4\uC9C1\uD558\uC6B0\uC2A4',
  'Art': '\uC544\uD2B8',
  'Vidiyo': '\uBE44\uB514\uC694',
  'Dots': '\uB3C4\uCE20',
  'Trolls World Tour': '\uD2B8\uB864\uC988 \uC6D4\uB4DC \uD22C\uC5B4',
  'Unikitty!': '\uC720\uB2C8\uD0A4\uD2F0',
  'Spidey': '\uC2A4\uD30C\uC774\uB354',
  'Marvel': '\uB9C8\uBE14',
  'DC': 'DC',
  'Toy Story': '\uD1A0\uC774\uC2A4\uD1A0\uB9AC',
  'Frozen': '\uACA8\uC6B8\uC655\uAD6D',
  'The Little Mermaid': '\uC778\uC5B4\uACF5\uC8FC',
  'Encanto': '\uC5D4\uCE78\uD1A0',
  'Wish': '\uC18C\uC6D0',
  'Moana': '\uBAA8\uC544\uB098',
  'Aladdin': '\uC54C\uB77C\uB458',
  'Mulan': '\uBDC4\uB780',
  'Raya and the Last Dragon': '\uB77C\uC57C\uC640 \uB9C8\uC9C0\uB9C9 \uB4DC\uB798\uACE4',
  'Promotional': '\uD504\uB85C\uBAA8\uC158',
  'Books': '\uB3C4\uC11C',
  'Gear': '\uAD7F\uC988',
  'Collectible Minifigures': '\uC218\uC9D1\uD615 \uBBF8\uB2C8\uD53C\uADDC\uC5B4',
  'Minifigures': '\uBBF8\uB2C8\uD53C\uADDC\uC5B4',
  'Red': '\uBE68\uAC15',
  'Blue': '\uD30C\uB791',
  'Yellow': '\uB178\uB791',
  'Green': '\uCD08\uB85D',
  'Black': '\uAC80\uC815',
  'White': '\uD558\uC591',
  'Orange': '\uC8FC\uD669',
  'Brown': '\uAC08\uC0C9',
  'Bricks': '\uBE0C\uB9AD',
  'Plates': '\uD50C\uB808\uC774\uD2B8',
  'Tiles': '\uD0C0\uC77C',
  'Slopes': '\uC2AC\uB85C\uD504',
  'Animals': '\uB3D9\uBB3C',
  'Plants': '\uC2DD\uBB3C',
  'Other': '\uAE30\uD0C0',
  'Train': '\uAE30\uCC28',
  'Boats': '\uBCF4\uD2B8',
  'Vehicles': '\uCC28\uB7C9',
  'Sports': '\uC2A4\uD3EC\uCE20',
  'Clothing': '\uC758\uC0C1',
  'Tools': '\uB3C4\uAD6C',
  'Weapons': '\uBB34\uAE30',
};

function getCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch(e) { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch(e) {}
}

function lookupSetName(name) {
  if (!name) return null;
  if (SET_NAME_MAP[name]) return SET_NAME_MAP[name];
  // Substring match: covers "Hogwarts Castle: Hospital Wing" appearing
  // inside longer rebrickable titles, or with different separators.
  var keys = Object.keys(SET_NAME_MAP);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (k.length >= 6 && name.indexOf(k) !== -1) return SET_NAME_MAP[k];
  }
  return null;
}

export function getCachedTranslation(name) {
  if (!name) return null;
  if (THEME_NAME_MAP[name]) return THEME_NAME_MAP[name];
  var setHit = lookupSetName(name);
  if (setHit) return setHit;
  var cache = getCache();
  return cache[name] || null;
}

export async function translateName(name) {
  if (!name) return name;
  if (THEME_NAME_MAP[name]) return THEME_NAME_MAP[name];
  var setHit = lookupSetName(name);
  if (setHit) return setHit;
  var cached = getCachedTranslation(name);
  if (cached) return cached;
  if (pendingRequests[name]) return pendingRequests[name];
  pendingRequests[name] = (async function() {
    try {
      var res = await fetch(API_URL + '?q=' + encodeURIComponent(name) + '&langpair=en|ko');
      var data = await res.json();
      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        var translated = data.responseData.translatedText;
        if (translated.toLowerCase() !== name.toLowerCase()) {
          var cache = getCache();
          cache[name] = translated;
          saveCache(cache);
          return translated;
        }
      }
    } catch(e) {}
    return name;
  })();
  var result = await pendingRequests[name];
  delete pendingRequests[name];
  return result;
}
