// Korean to English LEGO search keyword dictionary
// Sorted by priority: exact phrases first, then single words

var PHRASE_MAP = [
  // Themes - multi-word
  ['\uC2A4\uD0C0\uC6CC\uC988', 'Star Wars'],
  ['\uC2A4\uD0C0 \uC6CC\uC988', 'Star Wars'],
  ['\uD574\uB9AC\uD3EC\uD130', 'Harry Potter'],
  ['\uD574\uB9AC \uD3EC\uD130', 'Harry Potter'],
  ['\uC288\uD37C\uD788\uC5B4\uB85C', 'Super Heroes'],
  ['\uC288\uD37C \uD788\uC5B4\uB85C', 'Super Heroes'],
  ['\uC2A4\uD53C\uB4DC \uCC54\uD53C\uC5B8\uC2A4', 'Speed Champions'],
  ['\uC2A4\uD53C\uB4DC\uCC54\uD53C\uC5B8\uC2A4', 'Speed Champions'],
  ['\uBC18\uC9C0\uC758 \uC81C\uC655', 'Lord of the Rings'],
  ['\uBC18\uC9C0\uC758\uC81C\uC655', 'Lord of the Rings'],
  ['\uC778\uB514\uC544\uB098 \uC874\uC2A4', 'Indiana Jones'],
  ['\uC778\uB514\uC544\uB098\uC874\uC2A4', 'Indiana Jones'],
  ['\uC544\uC774\uC5B8\uB9E8', 'Iron Man'],
  ['\uC544\uC774\uC5B8 \uB9E8', 'Iron Man'],
  ['\uC2A4\uD30C\uC774\uB354\uB9E8', 'Spider-Man'],
  ['\uC2A4\uD30C\uC774\uB354 \uB9E8', 'Spider-Man'],
  ['\uCE90\uD53C\uD2C8 \uC544\uBA54\uB9AC\uCE74', 'Captain America'],
  ['\uB370\uC2A4\uC2A4\uD0C0', 'Death Star'],
  ['\uB370\uC2A4 \uC2A4\uD0C0', 'Death Star'],
  ['\uBC00\uB808\uB2C8\uC5C4 \uD314\uCF58', 'Millennium Falcon'],
  ['\uBC00\uB808\uB2C8\uC5C4\uD314\uCF58', 'Millennium Falcon'],
  ['\uC2A4\uD0C0 \uB514\uC2A4\uD2B8\uB85C\uC774\uC5B4', 'Star Destroyer'],
  ['\uC2A4\uD0C0\uB514\uC2A4\uD2B8\uB85C\uC774\uC5B4', 'Star Destroyer'],
  ['\uD0C0\uC774 \uD30C\uC774\uD130', 'TIE Fighter'],
  ['\uD0C0\uC774\uD30C\uC774\uD130', 'TIE Fighter'],
  ['\uC5D1\uC2A4\uC719', 'X-wing'],
  ['\uC5D0\uD384\uD0D1', 'Eiffel Tower'],
  ['\uC5D0\uD384 \uD0D1', 'Eiffel Tower'],
  ['\uD0C0\uC774\uD0C0\uB2C9', 'Titanic'],
  ['\uCF5C\uB85C\uC138\uC6C0', 'Colosseum'],
  ['\uD638\uADF8\uC640\uD2B8', 'Hogwarts'],
  ['\uB180\uC774\uACF5\uC6D0', 'Amusement Park'],
  ['\uB86C\uB7EC\uCF54\uC2A4\uD130', 'Roller Coaster'],
  ['\uB300\uAD00\uB78C\uCC28', 'Ferris Wheel'],
  ['\uACBD\uCC30\uC11C', 'Police Station'],
  ['\uACBD\uCC30\uC120', 'Police Station'],
  ['\uC18C\uBC29\uC11C', 'Fire Station'],
  ['\uC18C\uBC29\uCC28', 'Fire Truck'],
  ['\uBCF4\uD0C0\uB2C8\uCEEC', 'Botanical'],
  ['\uB9C8\uC778\uD06C\uB798\uD504\uD2B8', 'Minecraft'],
  ['\uB9C8\uC778\uB4DC\uC2A4\uD1B0', 'Mindstorms'],
  ['\uBC14\uC774\uC624\uB2C8\uD074', 'Bionicle'],
  ['\uB808\uACE0 \uD14C\uD06C\uB2C9', 'Technic'],
  ['\uB808\uACE0 \uC2DC\uD2F0', 'City'],
  ['\uB808\uACE0 \uD504\uB80C\uC988', 'Friends'],
  ['\uBD80\uD2F0\uD06C \uD638\uD154', 'Boutique Hotel'],
  ['\uC7AC\uC988 \uD074\uB7FD', 'Jazz Club'],
  ['\uC7AC\uC988\uD074\uB7FD', 'Jazz Club'],
  ['\uCF58\uC11C\uD2B8 \uD640', 'Concert Hall'],
];

var WORD_MAP = {
  // Themes
  '\uBAA8\uB4C8\uB7EC': 'Modular',
  '\uD14C\uD06C\uB2C9': 'Technic',
  '\uD06C\uB9AC\uC5D0\uC774\uD130': 'Creator',
  '\uC2DC\uD2F0': 'City',
  '\uD504\uB80C\uC988': 'Friends',
  '\uB2CC\uC790\uACE0': 'Ninjago',
  '\uB4C0\uD50C\uB85C': 'Duplo',
  '\uB514\uC988\uB2C8': 'Disney',
  '\uB9C8\uBE14': 'Marvel',
  '\uBC30\uD2B8\uB9E8': 'Batman',
  '\uC544\uD0A4\uD14D\uCC98': 'Architecture',
  '\uB808\uC774\uC11C': 'Racer',
  '\uD638\uBE57': 'Hobbit',
  '\uBAAC\uD0A4\uD0A4\uB4DC': 'Monkie Kid',

  // Vehicles
  '\uC790\uB3D9\uCC28': 'Car',
  '\uD2B8\uB7ED': 'Truck',
  '\uBC84\uC2A4': 'Bus',
  '\uBE44\uD589\uAE30': 'Airplane',
  '\uD5EC\uB9AC\uCF65\uD130': 'Helicopter',
  '\uD5EC\uB9AC': 'Helicopter',
  '\uAE30\uCC28': 'Train',
  '\uC5F4\uCC28': 'Train',
  '\uBC30': 'Ship',
  '\uBCF4\uD2B8': 'Boat',
  '\uC6B0\uC8FC\uC120': 'Spaceship',
  '\uB85C\uCF13': 'Rocket',
  '\uC624\uD1A0\uBC14\uC774': 'Motorcycle',
  '\uBC30\uD2B8\uBAA8\uBE4C': 'Batmobile',
  '\uB808\uC774\uC2F1': 'Racing',
  '\uB808\uC774\uC2F1\uCE74': 'Race Car',
  '\uD3EC\uBBAC\uB7EC': 'Formula',
  '\uD398\uB77C\uB9AC': 'Ferrari',
  '\uB78C\uBCF4\uB974\uAE30\uB2C8': 'Lamborghini',
  '\uD3EC\uB974\uC250': 'Porsche',
  '\uBD80\uAC00\uD2F0': 'Bugatti',
  '\uBA54\uB974\uC138\uB370\uC2A4': 'Mercedes',
  '\uBE44\uC5E0\uB354\uBE14\uC720': 'BMW',

  // Buildings
  '\uC9D1': 'House',
  '\uAC74\uBB3C': 'Building',
  '\uC131': 'Castle',
  '\uBCD1\uC6D0': 'Hospital',
  '\uD559\uAD50': 'School',
  '\uC0C1\uC810': 'Shop',
  '\uAC00\uAC8C': 'Store',
  '\uCE74\uD398': 'Cafe',
  '\uD638\uD154': 'Hotel',
  '\uB808\uC2A4\uD1A0\uB791': 'Restaurant',
  '\uC11C\uC810': 'Bookshop',
  '\uBD80\uD2F0\uD06C': 'Boutique',
  '\uC2DC\uC7A5': 'Market',
  '\uACF5\uD56D': 'Airport',
  '\uC5ED': 'Station',
  '\uB4F1\uB300': 'Lighthouse',
  '\uAD50\uD68C': 'Church',
  '\uC0AC\uC6D0': 'Temple',
  '\uBC15\uBB3C\uAD00': 'Museum',
  '\uB3C4\uC11C\uAD00': 'Library',

  // Characters / Figures
  '\uB85C\uBD07': 'Robot',
  '\uACF5\uB8E1': 'Dinosaur',
  '\uB4DC\uB798\uACE4': 'Dragon',
  '\uD574\uC801': 'Pirates',
  '\uB2CC\uC790': 'Ninja',
  '\uAE30\uC0AC': 'Knight',
  '\uC6B0\uC8FC\uC778': 'Space',
  '\uACBD\uCC30': 'Police',
  '\uC18C\uBC29\uAD00': 'Firefighter',
  '\uC6B0\uC8FC\uBE44\uD589\uC0AC': 'Astronaut',
  '\uC694\uB2E4': 'Yoda',
  '\uB2E4\uC2A4\uBCA0\uC774\uB354': 'Darth Vader',
  '\uB8E8\uD06C': 'Luke',
  '\uB808\uC544': 'Leia',

  // Nature / Botanical
  '\uAF43': 'Flower',
  '\uC2DD\uBB3C': 'Plant',
  '\uB098\uBB34': 'Tree',
  '\uC815\uC6D0': 'Garden',
  '\uBD84\uC7AC': 'Bonsai',
  '\uC7A5\uBBF8': 'Rose',
  '\uB09C\uCD08': 'Orchid',
  '\uD574\uBC14\uB77C\uAE30': 'Sunflower',

  // Other
  '\uBBF8\uB2C8\uD53C\uADDC\uC5B4': 'Minifigure',
  '\uBBF8\uD53C': 'Minifigure',
  '\uD06C\uB9AC\uC2A4\uB9C8\uC2A4': 'Christmas',
  '\uD560\uB85C\uC708': 'Halloween',
  '\uC0DD\uC77C': 'Birthday',
  '\uACB0\uD63C': 'Wedding',
  '\uC774\uC0AC\uBC30': 'Moving',
  '\uCEA0\uD551': 'Camping',
  '\uB18D\uC7A5': 'Farm',
  '\uB3D9\uBB3C\uC6D0': 'Zoo',
  '\uC218\uC871\uAD00': 'Aquarium',
  '\uC218\uC601\uC7A5': 'Swimming Pool',
  '\uC6B4\uB3D9\uC7A5': 'Stadium',
  '\uCD95\uAD6C': 'Soccer',
  '\uB18D\uAD6C': 'Basketball',
  '\uC2A4\uCF00\uC774\uD2B8': 'Skate',
  '\uC11C\uD551': 'Surfing',
  '\uC74C\uC545': 'Music',
  '\uAE30\uD0C0': 'Guitar',
  '\uD53C\uC544\uB178': 'Piano',
  '\uC601\uD654': 'Movie',
  '\uC8FC\uB77C\uAE30\uACF5\uC6D0': 'Jurassic',
  '\uC8FC\uB77C\uAE30': 'Jurassic',
  '\uD2B8\uB79C\uC2A4\uD3EC\uBA38': 'Transformers',
  '\uC544\uBC14\uD0C0': 'Avatar',
  '\uC18C\uB2C9': 'Sonic',
  '\uB9C8\uB9AC\uC624': 'Mario',
  '\uD3EC\uCF13\uBAAC': 'Pokemon',
  '\uC624\uBC84\uC6CC\uCE58': 'Overwatch',
  '\uB9C8\uC778\uD06C': 'Minecraft',
  '\uD3EC\uD2B8\uB098\uC774\uD2B8': 'Fortnite',
  '\uD0C0\uC6B4': 'Town',
  '\uB9C8\uC744': 'Village',
  '\uC628\uCC9C': 'Hot Spring',
  '\uC5BC\uC74C': 'Ice',
  '\uBD81\uADF9': 'Arctic',
  '\uC815\uAE00': 'Jungle',
  '\uC0AC\uB9C9': 'Desert',
  '\uBC14\uB2E4': 'Ocean',
  '\uD574\uBCC0': 'Beach',
  '\uC0B0': 'Mountain',
  '\uD654\uC0B0': 'Volcano',
};

// Translate Korean search query to English for Rebrickable API
export function translateSearchQuery(query) {
  if (!query) return query;
  var result = query.trim();

  // If query is purely numbers (set number), return as-is
  if (/^\d[\d\-]*$/.test(result)) return result;

  // If query is already all ASCII (English), return as-is
  if (/^[\x00-\x7F]+$/.test(result)) return result;

  // Try phrase replacements first (longer matches take priority)
  for (var i = 0; i < PHRASE_MAP.length; i++) {
    var ko = PHRASE_MAP[i][0];
    var en = PHRASE_MAP[i][1];
    if (result.indexOf(ko) !== -1) {
      result = result.replace(ko, en);
    }
  }

  // Then try word-level replacements for remaining Korean characters
  var keys = Object.keys(WORD_MAP);
  for (var j = 0; j < keys.length; j++) {
    var koWord = keys[j];
    if (result.indexOf(koWord) !== -1) {
      result = result.replace(koWord, WORD_MAP[koWord]);
    }
  }

  return result.trim();
}
