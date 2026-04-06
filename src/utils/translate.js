var CACHE_KEY = 'lego_name_translations';
var API_URL = 'https://api.mymemory.translated.net/get';
var pendingRequests = {};

// Hardcoded theme name translations to avoid API encoding issues
var THEME_NAME_MAP = {
  'The Lord of the Rings': '반지의 제왕',
  'The Hobbit': '호빗',
  'Harry Potter': '해리 포터',
  'Star Wars': '스타워즈',
  'Super Heroes': '슈퍼 히어로',
  'Marvel Super Heroes': '마블 슈퍼 히어로',
  'DC Super Heroes': 'DC 슈퍼 히어로',
  'Disney': '디즈니',
  'Disney Princess': '디즈니 프린세스',
  'Speed Champions': '스피드 챔피언스',
  'Technic': '테크닉',
  'Creator': '크리에이터',
  'Creator Expert': '크리에이터 엑스퍼트',
  'Creator 3-in-1': '크리에이터 3in1',
  'City': '시티',
  'Friends': '프렌즈',
  'Ninjago': '닌자고',
  'Duplo': '듀플로',
  'Architecture': '아키텍처',
  'Ideas': '아이디어',
  'Icons': '아이콘즈',
  'Minecraft': '마인크래프트',
  'Jurassic World': '쥐라기 월드',
  'Jurassic Park': '쥐라기 공원',
  'Botanical Collection': '보타니컬 컬렉션',
  'Classic': '클래식',
  'Monkie Kid': '먽키키드',
  'Super Mario': '슈퍼 마리오',
  'Indiana Jones': '인디아나 존스',
  'Castle': '캐슬',
  'Pirates': '해적',
  'Space': '우주',
  'Town': '타운',
  'Trains': '기차',
  'BrickHeadz': '브릭헤즈',
  'Powered Up': '파워드 업',
  'Mindstorms': '마인드스톰',
  'Education': '에듀케이션',
  'Hidden Side': '히든 사이드',
  'Nexo Knights': '넥소 나이츠',
  'Legends of Chima': '키마의 전설',
  'Bionicle': '바이오니클',
  'Hero Factory': '히어로 팩토리',
  'Ghostbusters': '고스트버스터즈',
  'Back to the Future': '백 투 더 퓨처',
  'Overwatch': '오버워치',
  'Stranger Things': '기묘한 이야기',
  'Pirates of the Caribbean': '캐리비안의 해적',
  'Transformers': '트랜스포머',
  'Avatar': '아바타',
  'Sonic the Hedgehog': '소닉 더 헤지혹',
  'DreamZzz': '드림즈',
  'Wicked': '위키드',
  'Animal Crossing': '동물의 숲',
  'Fortnite': '포트나이트',
  'The Simpsons': '심슨',
  'Scooby-Doo': '스쿠비두',
  'Sesame Street': '세서미 스트리트',
  'Adventurers': '어드벤처러',
  'Vikings': '바이킹',
  'Kingdoms': '킹덤',
  'Fantasy Era': '판타지 시대',
  'BrickLink Designer Program': 'BDP 펀딩',
  'Modular Buildings': '모듈러 빌딩',
  'Seasonal': '시즌',
  'Winter Village': '겨울 마을',
  'Elves': '엘프',
  'The LEGO Movie': '레고 무비',
  'The LEGO Movie 2': '레고 무비 2',
  'The LEGO Batman Movie': '레고 배트맨 무비',
  'The LEGO Ninjago Movie': '레고 닌자고 무비',
  'Gabby\'s Dollhouse': '개비의 매직하우스',
  'Art': '아트',
  'Vidiyo': '비디요',
  'Dots': '도츠',
  'Trolls World Tour': '트롤즈 월드 투어',
  'Unikitty!': '유니키티',
  'Powered Up': '파워드 업',
  'Spidey': '스파이더',
  'Marvel': '마블',
  'DC': 'DC',
  'Toy Story': '토이스토리',
  'Frozen': '겨울왕국',
  'The Little Mermaid': '인어공주',
  'Encanto': '엔칸토',
  'Wish': '소원',
  'Moana': '모아나',
  'Aladdin': '알라딸',
  'Mulan': '뮬란',
  'Raya and the Last Dragon': '라야와 마지막 드래곤',
};

function getCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch(e) { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch(e) {}
}

export function getCachedTranslation(name) {
  if (!name) return null;
  // Check hardcoded map first
  if (THEME_NAME_MAP[name]) return THEME_NAME_MAP[name];
  var cache = getCache();
  return cache[name] || null;
}

export async function translateName(name) {
  if (!name) return name;
  // Check hardcoded map first
  if (THEME_NAME_MAP[name]) return THEME_NAME_MAP[name];
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