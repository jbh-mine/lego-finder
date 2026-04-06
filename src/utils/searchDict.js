// Korean to English LEGO search keyword dictionary
// Sorted by priority: exact phrases first, then single words

var PHRASE_MAP = [
  // ===== Harry Potter =====
  ['\ub2e4\uc774\uc560\uac74 \uc568\ub9ac', 'Diagon Alley'],
  ['\ub2e4\uc774\uc560\uac74\uc568\ub9ac', 'Diagon Alley'],
  ['\ud574\ub9ac\ud3ec\ud130', 'Harry Potter'],
  ['\ud574\ub9ac \ud3ec\ud130', 'Harry Potter'],
  ['\ud638\uadf8\uc640\ud2b8 \uc775\uc2a4\ud504\ub808\uc2a4', 'Hogwarts Express'],
  ['\ud638\uadf8\uc640\ud2b8 \ud2b9\uae09', 'Hogwarts Express'],
  ['\ud638\uadf8\uc640\ud2b8 \uc131', 'Hogwarts Castle'],
  ['\ud638\uadf8\uc640\ud2b8\uc131', 'Hogwarts Castle'],
  ['\uc704\uc990\ub9ac \ubc84\ub85c\uc6b0', 'The Burrow'],
  ['\ube44\ubc00\uc758 \ubc29', 'Chamber of Secrets'],
  ['\uc544\uc988\uce74\ubc18\uc758 \uc8c4\uc218', 'Prisoner of Azkaban'],
  ['\ubd88\uc758 \uc794', 'Goblet of Fire'],
  ['\ubd88\uc0ac\uc870 \uae30\uc0ac\ub2e8', 'Order of the Phoenix'],
  ['\ud63c\ud608 \uc655\uc790', 'Half-Blood Prince'],
  ['\uc8fd\uc74c\uc758 \uc131\ubb3c', 'Deathly Hallows'],
  ['\uae08\uc9c0\ub41c \uc232', 'Forbidden Forest'],
  ['\uc6b0\ub294 \ubc84\ub4dc\ub098\ubb34', 'Whomping Willow'],
  ['\uc2e0\ube44\ud55c \ub3d9\ubb3c\uc0ac\uc804', 'Fantastic Beasts'],
  ['\uc2e0\ube44\ud55c \ub3d9\ubb3c', 'Fantastic Beasts'],

  // ===== Star Wars =====
  ['\uc2a4\ud0c0\uc6cc\uc988', 'Star Wars'],
  ['\uc2a4\ud0c0 \uc6cc\uc988', 'Star Wars'],
  ['\ubc00\ub808\ub2c8\uc5c4 \ud314\ucf58', 'Millennium Falcon'],
  ['\ubc00\ub808\ub2c8\uc5c4\ud314\ucf58', 'Millennium Falcon'],
  ['\ubc00\ub808\ub2c8\uc5c4 \ud384\ucf58', 'Millennium Falcon'],
  ['\ub370\uc2a4\uc2a4\ud0c0', 'Death Star'],
  ['\ub370\uc2a4 \uc2a4\ud0c0', 'Death Star'],
  ['\uc2a4\ud0c0 \ub514\uc2a4\ud2b8\ub85c\uc774\uc5b4', 'Star Destroyer'],
  ['\uc2a4\ud0c0\ub514\uc2a4\ud2b8\ub85c\uc774\uc5b4', 'Star Destroyer'],
  ['\uc784\ud398\ub9ac\uc5bc \uc2a4\ud0c0\ub514\uc2a4\ud2b8\ub85c\uc774\uc5b4', 'Imperial Star Destroyer'],
  ['\ud0c0\uc774 \ud30c\uc774\ud130', 'TIE Fighter'],
  ['\ud0c0\uc774\ud30c\uc774\ud130', 'TIE Fighter'],
  ['\ud0c0\uc774 \uc778\ud130\uc149\ud130', 'TIE Interceptor'],
  ['\uc5d0\uc774\ud2f0\uc5d0\uc774\ud2f0', 'AT-AT'],
  ['\uc5d0\uc774\ud2f0\uc5d0\uc2a4\ud2f0', 'AT-ST'],
  ['\uc5d0\uc774\uc719', 'A-wing'],
  ['\ube44\uc719', 'B-wing'],
  ['\uc640\uc774\uc719', 'Y-wing'],
  ['\uc5d1\uc2a4\uc719', 'X-wing'],
  ['\ubcf4\ubc14 \ud3ab', 'Boba Fett'],
  ['\ubcf4\ubc14\ud3ab', 'Boba Fett'],
  ['\ub2e4\uc2a4 \ubca0\uc774\ub354', 'Darth Vader'],
  ['\ub2e4\uc2a4\ubca0\uc774\ub354', 'Darth Vader'],
  ['\ub2e4\uc4f0 \ubca0\uc774\ub354', 'Darth Vader'],
  ['\uc624\ube44\uc644 \ucf00\ub178\ube44', 'Obi-Wan Kenobi'],
  ['\uc624\ube44\uc644', 'Obi-Wan'],
  ['\uc544\ub098\ud0a8 \uc2a4\uce74\uc774\uc6cc\ucee4', 'Anakin Skywalker'],
  ['\ub8e8\ud06c \uc2a4\uce74\uc774\uc6cc\ucee4', 'Luke Skywalker'],
  ['\uce74\uc77c\ub85c \ub80c', 'Kylo Ren'],
  ['\uce74\uc77c\ub85c\ub80c', 'Kylo Ren'],
  ['\ub9cc\ub2ec\ub85c\ub9ac\uc548', 'Mandalorian'],
  ['\ub77c\uc774\ud2b8\uc138\uc774\ubc84', 'Lightsaber'],
  ['\uc2a4\ub178\uc6b0\uc2a4\ud53c\ub354', 'Snowspeeder'],
  ['\uc2a4\ub178\uc6b0 \uc2a4\ud53c\ub354', 'Snowspeeder'],
  ['\ub79c\ub4dc\uc2a4\ud53c\ub354', 'Landspeeder'],
  ['\uc81c\ub2e4\uc774 \uc0ac\uc6d0', 'Jedi Temple'],
  ['\uc81c\ub2e4\uc774\uc0ac\uc6d0', 'Jedi Temple'],
  ['\ubaa8\uc2a4 \uc544\uc774\uc2ac\ub9ac', 'Mos Eisley'],
  ['\ubaa8\uc2a4\uc544\uc774\uc2ac\ub9ac', 'Mos Eisley'],
  ['\ub808\uc774\uc800 \ud06c\ub808\uc2a4\ud2b8', 'Razor Crest'],

  // ===== Marvel / DC =====
  ['\uc288\ud37c\ud788\uc5b4\ub85c', 'Super Heroes'],
  ['\uc288\ud37c \ud788\uc5b4\ub85c', 'Super Heroes'],
  ['\uc5b4\ubca4\uc838\uc2a4', 'Avengers'],
  ['\uc5b4\ubca4\uc800\uc2a4', 'Avengers'],
  ['\uc544\uc774\uc5b8\ub9e8', 'Iron Man'],
  ['\uc544\uc774\uc5b8 \ub9e8', 'Iron Man'],
  ['\uc2a4\ud30c\uc774\ub354\ub9e8', 'Spider-Man'],
  ['\uc2a4\ud30c\uc774\ub354 \ub9e8', 'Spider-Man'],
  ['\ucea1\ud2f4 \uc544\uba54\ub9ac\uce74', 'Captain America'],
  ['\ucea1\ud2f4\uc544\uba54\ub9ac\uce74', 'Captain America'],
  ['\ube14\ub799 \ud32c\uc11c', 'Black Panther'],
  ['\ube14\ub799\ud32c\uc11c', 'Black Panther'],
  ['\ub2e5\ud130 \uc2a4\ud2b8\ub808\uc778\uc9c0', 'Doctor Strange'],
  ['\ub2e5\ud130\uc2a4\ud2b8\ub808\uc778\uc9c0', 'Doctor Strange'],
  ['\uc6d0\ub354 \uc6b0\uba3c', 'Wonder Woman'],
  ['\uc6d0\ub354\uc6b0\uba3c', 'Wonder Woman'],
  ['\uc564\ud2b8\ub9e8', 'Ant-Man'],
  ['\uc564\ud2b8 \ub9e8', 'Ant-Man'],
  ['\uc6cc\uba38\uc2e0', 'War Machine'],
  ['\uc6cc \uba38\uc2e0', 'War Machine'],
  ['\uc708\ud130 \uc194\uc800', 'Winter Soldier'],
  ['\uc708\ud130\uc194\uc800', 'Winter Soldier'],
  ['\uc2a4\uce7c\ub81b \uc704\uce58', 'Scarlet Witch'],
  ['\uac00\ub514\uc5b8\uc988 \uc624\ube0c \uac24\ub7ed\uc2dc', 'Guardians of the Galaxy'],
  ['\uac00\ub514\uc5b8\uc988', 'Guardians of the Galaxy'],
  ['\uc5b4\ubca4\uc838\uc2a4 \ud0c0\uc6cc', 'Avengers Tower'],
  ['\uc5b4\ubca4\uc838\uc2a4\ud0c0\uc6cc', 'Avengers Tower'],
  ['\uc2a4\ud0c0\ud06c \ud0c0\uc6cc', 'Stark Tower'],
  ['\ubc30\ud2b8\ucf00\uc774\ube0c', 'Batcave'],
  ['\ubc30\ud2b8 \ucf00\uc774\ube0c', 'Batcave'],
  ['\ubc30\ud2b8\ubaa8\ube4c', 'Batmobile'],
  ['\ubc30\ud2b8 \ubaa8\ube4c', 'Batmobile'],

  // ===== Disney =====
  ['\ubbf8\ud0a4\ub9c8\uc6b0\uc2a4', 'Mickey Mouse'],
  ['\ubbf8\ud0a4 \ub9c8\uc6b0\uc2a4', 'Mickey Mouse'],
  ['\ubbf8\ub2c8\ub9c8\uc6b0\uc2a4', 'Minnie Mouse'],
  ['\ubbf8\ub2c8 \ub9c8\uc6b0\uc2a4', 'Minnie Mouse'],
  ['\uaca8\uc6b8\uc655\uad6d', 'Frozen'],
  ['\uc778\uc5b4\uacf5\uc8fc', 'Little Mermaid'],
  ['\ub77c\uc774\uc628 \ud0b9', 'Lion King'],
  ['\ub77c\uc774\uc628\ud0b9', 'Lion King'],
  ['\ud1a0\uc774\uc2a4\ud1a0\ub9ac', 'Toy Story'],
  ['\ud1a0\uc774 \uc2a4\ud1a0\ub9ac', 'Toy Story'],
  ['\ud53c\ud130\ud32c', 'Peter Pan'],
  ['\ud53c\ud130 \ud32c', 'Peter Pan'],
  ['\uc2a4\ud300\ubcf4\ud2b8 \uc70c\ub9ac', 'Steamboat Willie'],
  ['\uc2a4\ud300\ubcf4\ud2b8\uc70c\ub9ac', 'Steamboat Willie'],
  ['\uc7a0\uc790\ub294 \uc232\uc18d\uc758 \uacf5\uc8fc', 'Sleeping Beauty'],
  ['\ubc31\uc124\uacf5\uc8fc', 'Snow White'],
  ['\ubbf8\ub140\uc640 \uc57c\uc218', 'Beauty and the Beast'],
  ['\uc778\ud06c\ub808\ub354\ube14', 'Incredibles'],
  ['\uc778\uc0ac\uc774\ub4dc \uc544\uc6c3', 'Inside Out'],
  ['\uc778\uc0ac\uc774\ub4dc\uc544\uc6c3', 'Inside Out'],

  // ===== Speed Champions =====
  ['\uc2a4\ud53c\ub4dc \ucc54\ud53c\uc5b8\uc2a4', 'Speed Champions'],
  ['\uc2a4\ud53c\ub4dc\ucc54\ud53c\uc5b8\uc2a4', 'Speed Champions'],
  ['\uc2a4\ud53c\ub4dc \ucc54\ud53c\uc5b8', 'Speed Champions'],

  // ===== Lord of the Rings / Hobbit =====
  ['\ubc18\uc9c0\uc758 \uc81c\uc655', 'Lord of the Rings'],
  ['\ubc18\uc9c0\uc758\uc81c\uc655', 'Lord of the Rings'],
  ['\uc778\ub514\uc544\ub098 \uc874\uc2a4', 'Indiana Jones'],
  ['\uc778\ub514\uc544\ub098\uc874\uc2a4', 'Indiana Jones'],

  // ===== Architecture locations =====
  ['\uc5d0\ud3a0\ud0d1', 'Eiffel Tower'],
  ['\uc5d0\ud3a0 \ud0d1', 'Eiffel Tower'],
  ['\uc790\uc720\uc758 \uc5ec\uc2e0\uc0c1', 'Statue of Liberty'],
  ['\uc790\uc720\uc758\uc5ec\uc2e0\uc0c1', 'Statue of Liberty'],
  ['\ud0c0\uc9c0\ub9c8\ud560', 'Taj Mahal'],
  ['\ud0c0\uc9c0 \ub9c8\ud560', 'Taj Mahal'],
  ['\uc2dc\ub4dc\ub2c8 \uc624\ud398\ub77c \ud558\uc6b0\uc2a4', 'Sydney Opera House'],
  ['\uc2dc\ub4dc\ub2c8\uc624\ud398\ub77c\ud558\uc6b0\uc2a4', 'Sydney Opera House'],
  ['\uc624\ud398\ub77c \ud558\uc6b0\uc2a4', 'Opera House'],
  ['\ub178\uc774\uc288\ubc18\uc288\ud0c0\uc778', 'Neuschwanstein'],
  ['\ud53c\uc0ac\uc758 \uc0ac\ud0d1', 'Leaning Tower of Pisa'],
  ['\ud53c\uc0ac\uc758\uc0ac\ud0d1', 'Leaning Tower of Pisa'],
  ['\ub9cc\ub9ac\uc7a5\uc131', 'Great Wall of China'],
  ['\uc0b0\ud504\ub780\uc2dc\uc2a4\ucf54', 'San Francisco'],
  ['\ube45 \ubca4', 'Big Ben'],
  ['\ube45\ubca4', 'Big Ben'],
  ['\uac1c\uc120\ubb38', 'Arc de Triomphe'],

  // ===== Modular / Creator Expert / Icons =====
  ['\ubd80\ud2f0\ud06c \ud638\ud154', 'Boutique Hotel'],
  ['\uc7ac\uc988 \ud074\ub7fd', 'Jazz Club'],
  ['\uc7ac\uc988\ud074\ub7fd', 'Jazz Club'],
  ['\ucf58\uc11c\ud2b8 \ud640', 'Concert Hall'],
  ['\uc5b4\uc148\ube14\ub9ac \uc2a4\ud018\uc5b4', 'Assembly Square'],
  ['\uc5b4\uc148\ube14\ub9ac\uc2a4\ud018\uc5b4', 'Assembly Square'],
  ['\ube0c\ub9ad \ubc45\ud06c', 'Brick Bank'],
  ['\ube0c\ub9ad\ubc45\ud06c', 'Brick Bank'],
  ['\ub2e4\uc6b4\ud0c0\uc6b4 \ub2e4\uc774\ub108', 'Downtown Diner'],
  ['\ub2e4\uc6b4\ud0c0\uc6b4\ub2e4\uc774\ub108', 'Downtown Diner'],
  ['\ud330\ub9ac\uc2a4 \uc2dc\ub124\ub9c8', 'Palace Cinema'],
  ['\ucf54\ub108 \uac00\ub77c\uc9c0', 'Corner Garage'],
  ['\ud0c0\uc6b4 \ud640', 'Town Hall'],
  ['\ud0c0\uc6b4\ud640', 'Town Hall'],
  ['\uc790\uc5f0\uc0ac \ubc15\ubb3c\uad00', 'Natural History Museum'],
  ['\ud2b8\ub9ac\ud558\uc6b0\uc2a4', 'Tree House'],
  ['\ud2b8\ub9ac \ud558\uc6b0\uc2a4', 'Tree House'],
  ['\ub098\ubb34 \uc9d1', 'Tree House'],
  ['\ub098\ubb34\uc9d1', 'Tree House'],
  ['\ud574\uc801\uc120', 'Pirate Ship'],

  // ===== Technic vehicles =====
  ['\ub9e5\ub77c\ub80c \uc138\ub098', 'McLaren Senna'],
  ['\ub9e5\ub77c\ub80c', 'McLaren'],
  ['\ucf54\ub974\ubcb3', 'Corvette'],
  ['\ub79c\ub4dc\ub85c\ubc84', 'Land Rover'],
  ['\ub79c\ub4dc \ub85c\ubc84', 'Land Rover'],

  // ===== Ninjago =====
  ['\ub2cc\uc790\uace0 \uc2dc\ud2f0', 'Ninjago City'],
  ['\ub2cc\uc790\uace0\uc2dc\ud2f0', 'Ninjago City'],

  // ===== Friends =====
  ['\ud558\ud2b8\ub808\uc774\ud06c', 'Heartlake'],
  ['\ud558\ud2b8\ub808\uc774\ud06c \uc2dc\ud2f0', 'Heartlake City'],
  ['\ud558\ud2b8\ub808\uc774\ud06c\uc2dc\ud2f0', 'Heartlake City'],

  // ===== City =====
  ['\ud654\ubb3c \uc5f4\ucc28', 'Cargo Train'],
  ['\ud654\ubb3c\uc5f4\ucc28', 'Cargo Train'],
  ['\uc5ec\uac1d \uc5f4\ucc28', 'Passenger Train'],
  ['\uc5ec\uac1d\uc5f4\ucc28', 'Passenger Train'],
  ['\uc6b0\uc8fc \uae30\uc9c0', 'Space Base'],
  ['\uc6b0\uc8fc\uae30\uc9c0', 'Space Base'],
  ['\uae30\ucc28\uc5ed', 'Train Station'],
  ['\ub808\uace0 \uc2dc\ud2f0', 'City'],
  ['\ub808\uace0 \ud504\ub80c\uc988', 'Friends'],
  ['\ub808\uace0 \ud14c\ud06c\ub2c9', 'Technic'],

  // ===== Games / Entertainment =====
  ['\uc288\ud37c\ub9c8\ub9ac\uc624', 'Super Mario'],
  ['\uc288\ud37c \ub9c8\ub9ac\uc624', 'Super Mario'],
  ['\uc18c\ub2c9 \ub354 \ud5e4\uc9c0\ud639', 'Sonic the Hedgehog'],
  ['\uc18c\ub2c9\ub354\ud5e4\uc9c0\ud639', 'Sonic the Hedgehog'],
  ['\ud329\ub9e8', 'Pac-Man'],
  ['\ud329 \ub9e8', 'Pac-Man'],

  // ===== Botanical =====
  ['\ubcf4\ud0c0\ub2c8\uceec', 'Botanical'],
  ['\ubcf4\ud0c0\ub2c8\uceec \uceec\ub809\uc158', 'Botanical Collection'],

  // ===== Other themes =====
  ['\ud788\ub4e0 \uc0ac\uc774\ub4dc', 'Hidden Side'],
  ['\ud788\ub4e0\uc0ac\uc774\ub4dc', 'Hidden Side'],
  ['\ub125\uc18c \ub098\uc774\uce20', 'Nexo Knights'],
  ['\ub125\uc18c\ub098\uc774\uce20', 'Nexo Knights'],

  // ===== Existing phrases (kept) =====
  ['\ub180\uc774\uacf5\uc6d0', 'Amusement Park'],
  ['\ub864\ub7ec\ucf54\uc2a4\ud130', 'Roller Coaster'],
  ['\ub300\uad00\ub78c\ucc28', 'Ferris Wheel'],
  ['\uacbd\ucc30\uc11c', 'Police Station'],
  ['\uacbd\ucc30\uc120', 'Police Station'],
  ['\uc18c\ubc29\uc11c', 'Fire Station'],
  ['\uc18c\ubc29\ucc28', 'Fire Truck'],
  ['\ub9c8\uc778\ud06c\ub798\ud504\ud2b8', 'Minecraft'],
  ['\ub9c8\uc778\ub4dc\uc2a4\ud1b0', 'Mindstorms'],
  ['\ubc14\uc774\uc624\ub2c8\ud074', 'Bionicle'],
  ['\ud0c0\uc774\ud0c0\ub2c9', 'Titanic'],
  ['\ucf5c\ub85c\uc138\uc6c0', 'Colosseum'],
  ['\ud638\uadf8\uc640\ud2b8', 'Hogwarts'],
];

var WORD_MAP = {
  // ===== Themes =====
  '\ubaa8\ub4c8\ub7ec': 'Modular',
  '\ud14c\ud06c\ub2c9': 'Technic',
  '\ud06c\ub9ac\uc5d0\uc774\ud130': 'Creator',
  '\uc2dc\ud2f0': 'City',
  '\ud504\ub80c\uc988': 'Friends',
  '\ub2cc\uc790\uace0': 'Ninjago',
  '\ub4c0\ud50c\ub85c': 'Duplo',
  '\ub514\uc988\ub2c8': 'Disney',
  '\ub9c8\ube14': 'Marvel',
  '\ubc30\ud2b8\ub9e8': 'Batman',
  '\uc544\ud0a4\ud14d\ucc98': 'Architecture',
  '\ub808\uc774\uc11c': 'Racer',
  '\ud638\ube57': 'Hobbit',
  '\ubabd\ud0a4\ud0a4\ub4dc': 'Monkie Kid',
  '\uc544\uc774\ucf58\uc988': 'Icons',
  '\uc544\uc774\ucf58': 'Icons',
  '\ube44\ub514\uc694': 'Vidiyo',
  '\ud0a4\ub9c8': 'Chima',
  '\uc5d8\ud504': 'Elves',
  '\ud074\ub798\uc2dd': 'Classic',
  '\uc5d0\ub4c0\ucf00\uc774\uc158': 'Education',

  // ===== Harry Potter characters & places =====
  '\ub2e4\uc774\uc560\uac74': 'Diagon',
  '\ud638\uadf8\uc2a4\ubbf8\ub4dc': 'Hogsmeade',
  '\uc704\uc990\ub9ac': 'Weasley',
  '\ub364\ube14\ub3c4\uc5b4': 'Dumbledore',
  '\ubcfc\ub4dc\ubaa8\ud2b8': 'Voldemort',
  '\ud5e4\ub974\ubbf8\uc628\ub290': 'Hermione',
  '\ud5e4\ub974\ubbf8\uc628': 'Hermione',
  '\ud5c8\ub9c8\uc774\uc624\ub2c8': 'Hermione',
  '\uc2dc\ub9ac\uc6b0\uc2a4': 'Sirius',
  '\uc2a4\ub124\uc774\ud504': 'Snape',
  '\ub9d0\ud3ec\uc774': 'Malfoy',
  '\ub4dc\ub808\uc774\ucf54': 'Draco',
  '\ud574\uadf8\ub9ac\ub4dc': 'Hagrid',
  '\uadf8\ub9ac\ud540\ub3c4\ub974': 'Gryffindor',
  '\uc2ac\ub9ac\ub370\ub9b0': 'Slytherin',
  '\ub798\ubc88\ud074\ub85c': 'Ravenclaw',
  '\ub808\uc774\ube10\ud074\ub85c': 'Ravenclaw',
  '\ud6c4\ud50c\ud478\ud504': 'Hufflepuff',
  '\ud5c8\ud50c\ud478\ud504': 'Hufflepuff',
  '\ud034\ub514\uce58': 'Quidditch',
  '\uc544\uc988\uce74\ubc18': 'Azkaban',
  '\ubc84\ub85c\uc6b0': 'Burrow',
  '\ud504\ub9ac\ubcb3': 'Privet',

  // ===== Star Wars characters =====
  '\ub8e8\ud06c': 'Luke',
  '\ub808\uc544': 'Leia',
  '\ub808\uc774\uc544': 'Leia',
  '\uc544\ub098\ud0a8': 'Anakin',
  '\ud330\ud37c\ud2f4': 'Palpatine',
  '\uc694\ub2e4': 'Yoda',
  '\uadf8\ub85c\uad6c': 'Grogu',
  '\uce04\ubc14\uce74': 'Chewbacca',
  '\uc774\uc6cc\ud06c': 'Ewok',
  '\ud074\ub860': 'Clone',
  '\uc2a4\ud1b0\ud2b8\ub8e8\ud37c': 'Stormtrooper',
  '\uc81c\ub2e4\uc774': 'Jedi',
  '\uc2dc\uc2a4': 'Sith',
  '\uc790\ubc14': 'Jabba',
  '\uc544\uc18c\uce74': 'Ahsoka',

  // ===== Marvel / DC characters =====
  '\ud1a0\ub974': 'Thor',
  '\ud5d0\ud06c': 'Hulk',
  '\ud0c0\ub178\uc2a4': 'Thanos',
  '\ub85c\ud0a4': 'Loki',
  '\ud314\ucf58': 'Falcon',
  '\ube44\uc804': 'Vision',
  '\uc644\ub2e4': 'Wanda',
  '\uadf8\ub8e8\ud2b8': 'Groot',
  '\uac00\ubaa8\ub77c': 'Gamora',
  '\ub4dc\ub799\uc2a4': 'Drax',
  '\ub370\ub4dc\ud480': 'Deadpool',
  '\uc6b8\ubc84\ub9b0': 'Wolverine',
  '\uc5d1\uc2a4\ub9e8': 'X-Men',
  '\uc288\ud37c\ub9e8': 'Superman',
  '\ud50c\ub798\uc2dc': 'Flash',
  '\uc544\ucfe0\uc544\ub9e8': 'Aquaman',
  '\uc870\ucee4': 'Joker',
  '\uace0\ub2f4': 'Gotham',

  // ===== Disney characters =====
  '\uc5d8\uc0ac': 'Elsa',
  '\uc548\ub098': 'Anna',
  '\uc62c\ub77c\ud504': 'Olaf',
  '\ubaa8\uc544\ub098': 'Moana',
  '\ub77c\ud478\uc824': 'Rapunzel',
  '\uc2e0\ub370\ub810\ub77c': 'Cinderella',
  '\uc54c\ub77c\ub518': 'Aladdin',
  '\uc790\uc2a4\ubbfc': 'Jasmine',
  '\ubbac\ub780': 'Mulan',
  '\uc544\ub9ac\uc5d8': 'Ariel',
  '\ub9d0\ub808\ud53c\uc13c\ud2b8': 'Maleficent',
  '\uc2a4\ud2f0\uce58': 'Stitch',
  '\ud53c\ub178\ud0a4\uc624': 'Pinocchio',
  '\uc704\ub2c8\ub354\ud478': 'Winnie the Pooh',
  '\uc5d4\uce78\ud1a0': 'Encanto',
  '\uc704\uc2dc': 'Wish',

  // ===== Games / Entertainment =====
  '\ub9c8\ub9ac\uc624': 'Mario',
  '\ub8e8\uc774\uc9c0': 'Luigi',
  '\ud53c\uce58': 'Peach',
  '\ucfe0\ud30c': 'Bowser',
  '\ubc14\uc6b0\uc800': 'Bowser',
  '\uc18c\ub2c9': 'Sonic',
  '\ud3ec\ucf13\ubaac': 'Pokemon',
  '\uc624\ubc84\uc6cc\uce58': 'Overwatch',
  '\ud3ec\ud2b8\ub098\uc774\ud2b8': 'Fortnite',
  '\uc544\ud0c0\ub9ac': 'Atari',
  '\ub2cc\ud150\ub3c4': 'Nintendo',

  // ===== Ninjago characters =====
  '\ub85c\uc774\ub4dc': 'Lloyd',
  '\uce74\uc774': 'Kai',
  '\uc81c\uc774': 'Jay',
  '\ucf5c': 'Cole',
  '\uac00\ub9c8\ub3c8': 'Garmadon',

  // ===== Vehicles =====
  '\uc790\ub3d9\ucc28': 'Car',
  '\ud2b8\ub7ed': 'Truck',
  '\ubc84\uc2a4': 'Bus',
  '\ube44\ud589\uae30': 'Airplane',
  '\ud5ec\ub9ac\ucf65\ud130': 'Helicopter',
  '\ud5ec\ub9ac': 'Helicopter',
  '\uae30\ucc28': 'Train',
  '\uc5f4\ucc28': 'Train',
  '\ubc30': 'Ship',
  '\ubcf4\ud2b8': 'Boat',
  '\uc6b0\uc8fc\uc120': 'Spaceship',
  '\ub85c\ucf13': 'Rocket',
  '\uc624\ud1a0\ubc14\uc774': 'Motorcycle',
  '\ub808\uc774\uc2f1': 'Racing',
  '\ub808\uc774\uc2f1\uce74': 'Race Car',
  '\ud3ec\ubbac\ub7ec': 'Formula',
  '\ud398\ub77c\ub9ac': 'Ferrari',
  '\ub78c\ubcf4\ub974\uae30\ub2c8': 'Lamborghini',
  '\ud3ec\ub974\uc250': 'Porsche',
  '\ubd80\uac00\ud2f0': 'Bugatti',
  '\uba54\ub974\uc138\ub370\uc2a4': 'Mercedes',
  '\ubca4\uce20': 'Mercedes-Benz',
  '\ube44\uc5e0\ub354\ube14\uc720': 'BMW',
  '\uc544\uc6b0\ub514': 'Audi',
  '\ud3ec\ub4dc': 'Ford',
  '\ubb34\uc2a4\ud0d5': 'Mustang',
  '\uba38\uc2a4\ud0f1': 'Mustang',
  '\ucea0\ud551\uce74': 'Camper Van',
  '\ud53c\uc544\ud2b8': 'Fiat',
  '\ubca0\uc2a4\ud30c': 'Vespa',
  '\uc9c0\ud504': 'Jeep',

  // ===== Heavy equipment =====
  '\uad74\uc0ad\uae30': 'Excavator',
  '\ud3ec\ud06c\ub808\uc778': 'Excavator',
  '\ud06c\ub808\uc778': 'Crane',
  '\ubd88\ub3c4\uc800': 'Bulldozer',
  '\ub364\ud504\ud2b8\ub7ed': 'Dump Truck',
  '\ubbf9\uc11c': 'Mixer',
  '\ub85c\ub354': 'Loader',

  // ===== Buildings =====
  '\uc9d1': 'House',
  '\uac74\ubb3c': 'Building',
  '\uc131': 'Castle',
  '\ubcd1\uc6d0': 'Hospital',
  '\ud559\uad50': 'School',
  '\uc0c1\uc810': 'Shop',
  '\uac00\uac8c': 'Store',
  '\uce74\ud398': 'Cafe',
  '\ud638\ud154': 'Hotel',
  '\ub808\uc2a4\ud1a0\ub791': 'Restaurant',
  '\uc11c\uc810': 'Bookshop',
  '\ubd80\ud2f0\ud06c': 'Boutique',
  '\uc2dc\uc7a5': 'Market',
  '\uacf5\ud56d': 'Airport',
  '\uc5ed': 'Station',
  '\ub4f1\ub300': 'Lighthouse',
  '\uad50\ud68c': 'Church',
  '\uc0ac\uc6d0': 'Temple',
  '\ubc15\ubb3c\uad00': 'Museum',
  '\ub3c4\uc11c\uad00': 'Library',
  '\uadf9\uc7a5': 'Theater',
  '\ubc31\uc545\uad00': 'White House',
  '\uad81\uc804': 'Palace',
  '\ub300\uc7a5\uac04': 'Blacksmith',

  // ===== Characters / Figures =====
  '\ub85c\ubd07': 'Robot',
  '\uacf5\ub8e1': 'Dinosaur',
  '\ub4dc\ub798\uace4': 'Dragon',
  '\ud574\uc801': 'Pirates',
  '\ub2cc\uc790': 'Ninja',
  '\uae30\uc0ac': 'Knight',
  '\uc6b0\uc8fc\uc778': 'Space',
  '\uacbd\ucc30': 'Police',
  '\uc18c\ubc29\uad00': 'Firefighter',
  '\uc6b0\uc8fc\ube44\ud589\uc0ac': 'Astronaut',
  '\ubc14\uc774\ud0b9': 'Viking',

  // ===== Nature / Botanical =====
  '\uaf43': 'Flower',
  '\uc2dd\ubb3c': 'Plant',
  '\ub098\ubb34': 'Tree',
  '\uc815\uc6d0': 'Garden',
  '\ubd84\uc7ac': 'Bonsai',
  '\uc7a5\ubbf8': 'Rose',
  '\ub09c\ucd08': 'Orchid',
  '\ud574\ubc14\ub77c\uae30': 'Sunflower',
  '\ud2a4\ub9bd': 'Tulip',
  '\uc120\uc778\uc7a5': 'Cactus',
  '\ubc9a\uaf43': 'Cherry Blossom',
  '\ub77c\ubca4\ub354': 'Lavender',
  '\uc5f0\uaf43': 'Lotus',
  '\ubd80\ucf00': 'Bouquet',

  // ===== Architecture cities =====
  '\ub7f0\ub358': 'London',
  '\ud30c\ub9ac': 'Paris',
  '\ub3c4\ucfc4': 'Tokyo',
  '\ub274\uc695': 'New York',
  '\ub450\ubc14\uc774': 'Dubai',
  '\ub85c\ub9c8': 'Rome',
  '\uc2f1\uac00\ud3ec\ub974': 'Singapore',
  '\ubca0\ub124\uce58\uc544': 'Venice',
  '\ubca0\ub97c\ub9b0': 'Berlin',
  '\ub77c\uc2a4\ubca0\uac00\uc2a4': 'Las Vegas',
  '\uc2dc\uce74\uace0': 'Chicago',
  '\uc0c1\ud558\uc774': 'Shanghai',
  '\ud53c\ub77c\ubbf8\ub4dc': 'Pyramid',
  '\uc544\ud06c\ub85c\ud3f4\ub9ac\uc2a4': 'Acropolis',

  // ===== Ideas / Icons =====
  '\uae00\ub85c\ube0c': 'Globe',
  '\uc9c0\uad6c\ubcf8': 'Globe',
  '\ud0c0\uc790\uae30': 'Typewriter',
  '\ud3f4\ub77c\ub85c\uc774\ub4dc': 'Polaroid',
  '\uce74\uba54\ub77c': 'Camera',
  '\uc138\uacc4\uc9c0\ub3c4': 'World Map',

  // ===== Seasonal / Events =====
  '\ubbf8\ub2c8\ud53c\uaddc\uc5b4': 'Minifigure',
  '\ubbf8\ud53c': 'Minifigure',
  '\ud06c\ub9ac\uc2a4\ub9c8\uc2a4': 'Christmas',
  '\ud560\ub85c\uc708': 'Halloween',
  '\uc0dd\uc77c': 'Birthday',
  '\uacb0\ud63c': 'Wedding',
  '\ubc1c\ub80c\ud0c0\uc778': 'Valentine',
  '\ubd80\ud65c\uc808': 'Easter',
  '\uc124\ub0a0': 'Lunar New Year',
  '\uc0c8\ud574': 'New Year',

  // ===== Activities / Places =====
  '\ucea0\ud551': 'Camping',
  '\ub18d\uc7a5': 'Farm',
  '\ub3d9\ubb3c\uc6d0': 'Zoo',
  '\uc218\uc871\uad00': 'Aquarium',
  '\uc218\uc601\uc7a5': 'Swimming Pool',
  '\uc6b4\ub3d9\uc7a5': 'Stadium',
  '\ucd95\uad6c': 'Soccer',
  '\ub18d\uad6c': 'Basketball',
  '\uc2a4\ucf00\uc774\ud2b8': 'Skate',
  '\uc11c\ud551': 'Surfing',
  '\uc74c\uc545': 'Music',
  '\uae30\ud0c0': 'Guitar',
  '\ud53c\uc544\ub178': 'Piano',
  '\uc601\ud654': 'Movie',

  // ===== Jurassic / Other IPs =====
  '\uc96c\ub77c\uae30\uacf5\uc6d0': 'Jurassic',
  '\uc96c\ub77c\uae30': 'Jurassic',
  '\uc8fc\ub77c\uae30\uacf5\uc6d0': 'Jurassic',
  '\uc8fc\ub77c\uae30': 'Jurassic',
  '\ud2b8\ub79c\uc2a4\ud3ec\uba38': 'Transformers',
  '\uc544\ubc14\ud0c0': 'Avatar',
  '\uc6d0\ud53c\uc2a4': 'One Piece',
  '\ub098\ub8e8\ud1a0': 'Naruto',

  // ===== Nature =====
  '\ud0c0\uc6b4': 'Town',
  '\ub9c8\uc744': 'Village',
  '\uc628\ucc9c': 'Hot Spring',
  '\uc5bc\uc74c': 'Ice',
  '\ubd81\uadf9': 'Arctic',
  '\uc815\uae00': 'Jungle',
  '\uc0ac\ub9c9': 'Desert',
  '\ubc14\ub2e4': 'Ocean',
  '\ud574\ubcc0': 'Beach',
  '\uc0b0': 'Mountain',
  '\ud654\uc0b0': 'Volcano',
  '\uc12c': 'Island',
  '\ub3d9\uad74': 'Cave',
  '\uc232': 'Forest',
  '\ud638\uc218': 'Lake',
  '\ud3ed\ud3ec': 'Waterfall',

  // ===== Common LEGO terms =====
  '\ud55c\uc815\ud310': 'Exclusive',
  '\ub514\uc2a4\ud50c\ub808\uc774': 'Display',
  '\uba54\uce74': 'Mech',
  '\uc880\ube44': 'Zombie',
  '\uc720\ub839': 'Ghost',
  '\ubc40\ud30c\uc774\uc5b4': 'Vampire',
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
  var matched = false;
  for (var i = 0; i < PHRASE_MAP.length; i++) {
    var ko = PHRASE_MAP[i][0];
    var en = PHRASE_MAP[i][1];
    if (result.indexOf(ko) !== -1) {
      result = result.replace(ko, en);
      matched = true;
    }
  }

  // Then try word-level replacements for remaining Korean characters
  var keys = Object.keys(WORD_MAP);
  for (var j = 0; j < keys.length; j++) {
    var koWord = keys[j];
    if (result.indexOf(koWord) !== -1) {
      result = result.replace(koWord, WORD_MAP[koWord]);
      matched = true;
    }
  }

  // If no exact match found, try prefix matching
  // e.g. user types partial Korean like "\ub2e4\uc774\uc560" -> matches "\ub2e4\uc774\uc560\uac74" -> "Diagon"
  if (!matched && result === query.trim()) {
    var q = result;

    // Check phrase prefixes (query is start of a phrase key)
    var bestPhrase = null;
    var bestPhraseLen = 0;
    for (var p = 0; p < PHRASE_MAP.length; p++) {
      var pko = PHRASE_MAP[p][0];
      var pen = PHRASE_MAP[p][1];
      if (pko.indexOf(q) === 0 && q.length >= 2 && q.length > bestPhraseLen) {
        bestPhrase = pen;
        bestPhraseLen = q.length;
      }
      if (q.indexOf(pko) === 0 && pko.length > bestPhraseLen) {
        bestPhrase = pen;
        bestPhraseLen = pko.length;
      }
    }
    if (bestPhrase) {
      return bestPhrase;
    }

    // Check word prefixes
    var bestWord = null;
    var bestWordLen = 0;
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
  }

  return result.trim();
}
