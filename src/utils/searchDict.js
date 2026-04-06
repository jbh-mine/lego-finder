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
  ['\uc288\ud37c \ud789\uc5b4\ub85c', 'Super Heroes'],
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
  ['\ud328\ub9ac\uc2a4 \uc2dc\ub124\ub9c8', 'Palace Cinema'],
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

  // ===== Common product name phrases =====
  ['\ub098\uc774\ud2b8 \ubc84\uc2a4', 'Knight Bus'],
  ['\ub098\uc774\ud2b8\ubc84\uc2a4', 'Knight Bus'],
  ['\ubc30\ud2c0 \ud329', 'Battle Pack'],
  ['\ubc30\ud2c0\ud329', 'Battle Pack'],
  ['\uc2a4\ud0c0\ud130 \ud329', 'Starter Pack'],
  ['\uc2a4\ud0c0\ud130\ud329', 'Starter Pack'],

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
  '\ud074\ub798\uc2dd': 'Classic',
  '\uc5d0\ub4c0\ucf00\uc774\uc158': 'Education',

  // ===== Harry Potter =====
  '\ub2e4\uc774\uc560\uac74': 'Diagon',
  '\ud638\uadf8\uc2a4\ubbf8\ub4dc': 'Hogsmeade',
  '\ub364\ube14\ub3c4\uc5b4': 'Dumbledore',
  '\ubcfc\ub4dc\ubaa8\ud2b8': 'Voldemort',
  '\ud5e4\ub974\ubbf8\uc628\ub290': 'Hermione',
  '\ud5e4\ub974\ubbf8\uc628': 'Hermione',
  '\uc2a4\ub124\uc774\ud504': 'Snape',
  '\ub9d0\ud3ec\uc774': 'Malfoy',
  '\ud574\uadf8\ub9ac\ub4dc': 'Hagrid',
  '\uadf8\ub9ac\ud540\ub3c4\ub974': 'Gryffindor',
  '\uc2ac\ub9ac\ub370\ub9b0': 'Slytherin',
  '\ud034\ub514\uce58': 'Quidditch',
  '\uc544\uc988\uce74\ubc18': 'Azkaban',

  // ===== Star Wars =====
  '\ub8e8\ud06c': 'Luke',
  '\ub808\uc544': 'Leia',
  '\uc694\ub2e4': 'Yoda',
  '\uadf8\ub85c\uad6c': 'Grogu',
  '\ud074\ub860': 'Clone',
  '\uc2a4\ud1b0\ud2b8\ub8e8\ud37c': 'Stormtrooper',
  '\uc81c\ub2e4\uc774': 'Jedi',
  '\uc544\uc18c\uce74': 'Ahsoka',

  // ===== Marvel / DC =====
  '\ud1a0\ub974': 'Thor',
  '\ud5d0\ud06c': 'Hulk',
  '\ud0c0\ub178\uc2a4': 'Thanos',
  '\ub85c\ud0a4': 'Loki',
  '\ub370\ub4dc\ud480': 'Deadpool',
  '\uc6b8\ubc84\ub9b0': 'Wolverine',
  '\uc5d1\uc2a4\ub9e8': 'X-Men',
  '\uc288\ud37c\ub9e8': 'Superman',
  '\ud50c\ub798\uc2dc': 'Flash',
  '\uc870\ucee4': 'Joker',
  '\uace0\ub2f4': 'Gotham',

  // ===== Disney =====
  '\uc5d8\uc0ac': 'Elsa',
  '\ubaa8\uc544\ub098': 'Moana',
  '\ub77c\ud478\uc824': 'Rapunzel',
  '\uc2e0\ub370\ub810\ub77c': 'Cinderella',
  '\uc54c\ub77c\ub518': 'Aladdin',
  '\uc544\ub9ac\uc5d8': 'Ariel',
  '\uc2a4\ud2f0\uce58': 'Stitch',
  '\uc704\ub2c8\ub354\ud478': 'Winnie the Pooh',
  '\uc5d4\uce78\ud1a0': 'Encanto',

  // ===== Games =====
  '\ub9c8\ub9ac\uc624': 'Mario',
  '\uc18c\ub2c9': 'Sonic',
  '\ud3ec\ucf13\ubaac': 'Pokemon',
  '\uc624\ubc84\uc6cc\uce58': 'Overwatch',
  '\ud3ec\ud2b8\ub098\uc774\ud2b8': 'Fortnite',

  // ===== Vehicles =====
  '\uc790\ub3d9\ucc28': 'Car',
  '\ud2b8\ub7ed': 'Truck',
  '\ubc84\uc2a4': 'Bus',
  '\ube44\ud589\uae30': 'Airplane',
  '\ud5ec\ub9ac\ucf65\ud130': 'Helicopter',
  '\uae30\ucc28': 'Train',
  '\uc5f4\ucc28': 'Train',
  '\ubc30': 'Ship',
  '\ubcf4\ud2b8': 'Boat',
  '\uc6b0\uc8fc\uc120': 'Spaceship',
  '\ub85c\ucf13': 'Rocket',
  '\uc624\ud1a0\ubc14\uc774': 'Motorcycle',
  '\ub808\uc774\uc2f1': 'Racing',
  '\ud398\ub77c\ub9ac': 'Ferrari',
  '\ub78c\ubcf4\ub974\uae30\ub2c8': 'Lamborghini',
  '\ud3ec\ub974\uc250': 'Porsche',
  '\ubd80\uac00\ud2f0': 'Bugatti',
  '\uba54\ub974\uc138\ub370\uc2a4': 'Mercedes',
  '\ube44\uc5e0\ub354\ube14\uc720': 'BMW',
  '\ubb34\uc2a4\ud0d5': 'Mustang',
  '\uad74\uc0ad\uae30': 'Excavator',
  '\ud06c\ub808\uc778': 'Crane',
  '\ubd88\ub3c4\uc800': 'Bulldozer',

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
  '\ubd80\ud2f0\ud06c': 'Boutique',
  '\uc2dc\uc7a5': 'Market',
  '\uacf5\ud56d': 'Airport',
  '\uc5ed': 'Station',
  '\ub4f1\ub300': 'Lighthouse',
  '\ubc15\ubb3c\uad00': 'Museum',
  '\ub3c4\uc11c\uad00': 'Library',
  '\uad81\uc804': 'Palace',

  // ===== Characters =====
  '\ub85c\ubd07': 'Robot',
  '\uacf5\ub8e1': 'Dinosaur',
  '\ub4dc\ub798\uace4': 'Dragon',
  '\ud574\uc801': 'Pirates',
  '\ub2cc\uc790': 'Ninja',
  '\uae30\uc0ac': 'Knight',
  '\uacbd\ucc30': 'Police',
  '\uc18c\ubc29\uad00': 'Firefighter',
  '\uc6b0\uc8fc\ube44\ud589\uc0ac': 'Astronaut',

  // ===== Nature =====
  '\uaf43': 'Flower',
  '\uc2dd\ubb3c': 'Plant',
  '\ub098\ubb34': 'Tree',
  '\uc815\uc6d0': 'Garden',
  '\ubd84\uc7ac': 'Bonsai',
  '\uc7a5\ubbf8': 'Rose',
  '\ub09c\ucd08': 'Orchid',
  '\ud574\ubc14\ub77c\uae30': 'Sunflower',

  // ===== Cities =====
  '\ub7f0\ub358': 'London',
  '\ud30c\ub9ac': 'Paris',
  '\ub3c4\ucfc4': 'Tokyo',
  '\ub274\uc695': 'New York',
  '\ub85c\ub9c8': 'Rome',

  // ===== Events =====
  '\ubbf8\ub2c8\ud53c\uaddc\uc5b4': 'Minifigure',
  '\ubbf8\ud53c': 'Minifigure',
  '\ud06c\ub9ac\uc2a4\ub9c8\uc2a4': 'Christmas',
  '\ud560\ub85c\uc708': 'Halloween',
  '\uc0dd\uc77c': 'Birthday',

  // ===== Activities =====
  '\ucea0\ud551': 'Camping',
  '\ub18d\uc7a5': 'Farm',
  '\ub3d9\ubb3c\uc6d0': 'Zoo',
  '\uc218\uc871\uad00': 'Aquarium',
  '\ucd95\uad6c': 'Soccer',
  '\uc74c\uc545': 'Music',
  '\uae30\ud0c0': 'Guitar',
  '\ud53c\uc544\ub178': 'Piano',
  '\uc601\ud654': 'Movie',

  // ===== IPs =====
  '\uc96c\ub77c\uae30\uacf5\uc6d0': 'Jurassic',
  '\uc96c\ub77c\uae30': 'Jurassic',
  '\uc8fc\ub77c\uae30\uacf5\uc6d0': 'Jurassic',
  '\uc8fc\ub77c\uae30': 'Jurassic',
  '\ud2b8\ub79c\uc2a4\ud3ec\uba38': 'Transformers',
  '\uc544\ubc14\ud0c0': 'Avatar',
  '\ub098\ub8e8\ud1a0': 'Naruto',

  // ===== Nature/Geography =====
  '\ud0c0\uc6b4': 'Town',
  '\ub9c8\uc744': 'Village',
  '\uc5bc\uc74c': 'Ice',
  '\uc815\uae00': 'Jungle',
  '\uc0ac\ub9c9': 'Desert',
  '\ubc14\ub2e4': 'Ocean',
  '\ud574\ubcc0': 'Beach',
  '\uc0b0': 'Mountain',
  '\ud654\uc0b0': 'Volcano',
  '\uc12c': 'Island',
  '\uc232': 'Forest',

  // ===== Common English words (Korean phonetic) =====
  '\ub098\uc774\ud2b8': 'Knight',
  '\uc5b4\ub4dc\ubca4\ucc98': 'Adventure',
  '\ubc30\ud2c0': 'Battle',
  '\uc5b4\ud0dd': 'Attack',
  '\uc5d0\uc2a4\ucf00\uc774\ud504': 'Escape',
  '\ucc3c\ub9b0\uc9c0': 'Challenge',
  '\ubbf8\uc158': 'Mission',
  '\ud329': 'Pack',
  '\uc138\ud2b8': 'Set',
  '\ub9c8\uc2a4\ud130': 'Master',
  '\ud0c0\uc6cc': 'Tower',
  '\uce90\uc2ac': 'Castle',
  '\ud3ec\ud2b8\ub9ac\uc2a4': 'Fortress',
  '\ub358\uc804': 'Dungeon',
  '\uc544\ub808\ub098': 'Arena',
  '\ud30c\uc774\ud130': 'Fighter',
  '\ud5cc\ud130': 'Hunter',
  '\uc6cc\ub9ac\uc5b4': 'Warrior',
  '\uac00\ub4dc': 'Guard',
  '\uce90\ud2f4': 'Captain',
  '\ucee4\ub9e8\ub354': 'Commander',
  '\ud30c\uc77c\ub7ff': 'Pilot',
  '\ub4dc\ub77c\uc774\ubc84': 'Driver',
  '\ub77c\uc774\ub354': 'Rider',
  '\ub808\uc2a4\ud050': 'Rescue',
  '\ud328\ud2b8\ub864': 'Patrol',
  '\uccb4\uc774\uc2a4': 'Chase',
  '\ub808\uc774\uc2a4': 'Race',
  '\uc2a4\ud134\ud2b8': 'Stunt',
  '\uc2a4\ud53c\ub4dc': 'Speed',
  '\uc288\ud37c': 'Super',
  '\uc6b8\ud2b8\ub77c': 'Ultra',
  '\ubbf8\ub2c8': 'Mini',
  '\uc2dc\ud06c\ub9bf': 'Secret',
  '\ubbf8\uc2a4\ud130\ub9ac': 'Mystery',
  '\ud788\ub4e0': 'Hidden',
  '\ub2e4\ud06c': 'Dark',
  '\ub77c\uc774\ud2b8': 'Light',
  '\ub9e4\uc9c1': 'Magic',
  '\uace8\ub4e0': 'Golden',
  '\uc2e4\ubc84': 'Silver',
  '\ud06c\ub9ac\uc2a4\ud138': 'Crystal',
  '\ud30c\uc6cc': 'Power',
  '\uc5d0\ub108\uc9c0': 'Energy',
  '\ud3ec\uc2a4': 'Force',
  '\uc564\uc158': 'Action',
  '\ub9ac\ud134': 'Return',
  '\uc5bc\ud2f0\uba54\uc774\ud2b8': 'Ultimate',
  '\uc2a4\ud398\uc15c': 'Special',
  '\ud504\ub9ac\ubbf8\uc5c4': 'Premium',
  '\ud310\ud0c0\uc9c0': 'Fantasy',
  '\ud504\ub9b0\uc138\uc2a4': 'Princess',
  '\ud004': 'Queen',
  '\ud0b9': 'King',
  '\ub9c8\ubc95\uc0ac': 'Wizard',
  '\uc694\uc815': 'Fairy',
  '\uac70\uc778': 'Giant',
  '\uad34\ubb3c': 'Monster',
  '\uc720\ub2c8\ucf58': 'Unicorn',
  '\ud53c\ub2c9\uc2a4': 'Phoenix',
  '\uc2a4\ucf08\ub808\ud1a4': 'Skeleton',
  '\ud2b8\ub864': 'Troll',
  '\uace0\ube14\ub9b0': 'Goblin',
  '\uc0ac\ud30c\ub9ac': 'Safari',
  '\ud0d0\ud5d8': 'Explorer',
  '\ud30c\ud2f0': 'Party',
  '\ucf58\uc11c\ud2b8': 'Concert',
  '\uc1fc': 'Show',
  '\ube0c\ub9ac\uc9c0': 'Bridge',
  '\ud56d\uad6c': 'Harbor',
  '\uc13c\ud130': 'Center',
  '\uc2a4\ud2b8\ub9ac\ud2b8': 'Street',
  '\ucf54\ub108': 'Corner',
  '\ub9c8\uc778': 'Mine',
  '\ucea0\ud504': 'Camp',
  '\ubca0\uc774\uc2a4': 'Base',
  '\uc784\ud398\ub9ac\uc5bc': 'Imperial',
  '\ud558\uc6b0\uc2a4': 'House',
  '\ub9e8\uc158': 'Mansion',
  '\ucf54\ud2f0\uc9c0': 'Cottage',
  '\ube75': 'Bakery',
  '\ud53c\uc790': 'Pizza',
  '\ub3c4\uc7a5': 'Dojo',
  '\uc544\uce74\ub370\ubbf8': 'Academy',
  '\ud2b8\ub808\uc774\ub2dd': 'Training',
  '\uc6d4\ub4dc': 'World',
  '\ub9c8\ucf13': 'Market',
  '\uba54\uce74': 'Mech',
  '\uc880\ube44': 'Zombie',
  '\uc720\ub839': 'Ghost',
  '\ubc40\ud30c\uc774\uc5b4': 'Vampire',
  '\ud55c\uc815\ud310': 'Exclusive',
  '\ub514\uc2a4\ud50c\ub808\uc774': 'Display',
  '\ucf5c\ub809\uc158': 'Collection',
  '\uc5d0\ub514\uc158': 'Edition',
  '\uc2dc\ub9ac\uc988': 'Series',
  '\uc544\uc774\ub514\uc5b4': 'Idea',
  '\uc544\uc774\ub514\uc5b4\uc2a4': 'Ideas',
  '\ub808\uc804\ub4dc': 'Legend',
  '\ud788\uc2a4\ud1a0\ub9ac': 'History',
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
