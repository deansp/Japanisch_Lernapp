const CARDS_KEY = "japanese-cards";
const LANGUAGE_KEY = "japanese-front-language";
const MAX_STAGE = 3;

const LEVELS = [
  { id: 1, name: "Basics", description: "Begrüßen, bedanken und höflich bleiben" },
  { id: 2, name: "Verständigung", description: "Nachfragen und besser verstanden werden" },
  { id: 3, name: "Orientierung", description: "Bahnhof, Toilette und den Weg finden" },
  { id: 4, name: "Essen & Einkaufen", description: "Bestellen, bezahlen und zählen" },
  { id: 5, name: "Günnis Niveau", description: "Mo-Bärchen, doppelte Portionen und extra Käse" }
];

const DEFAULT_CARDS = [
  ["こんにちは", "konnichiwa", "Hallo", 1],
  ["ありがとうございます", "arigatou gozaimasu", "Vielen Dank", 1],
  ["すみません", "sumimasen", "Entschuldigung", 1],
  ["お願いします", "onegaishimasu", "Bitte", 1],
  ["はい", "hai", "Ja", 1],
  ["いいえ", "iie", "Nein", 1],
  ["分かりません", "wakarimasen", "Ich verstehe nicht", 2],
  ["日本語が話せません", "nihongo ga hanasemasen", "Ich spreche kein Japanisch", 2],
  ["英語を話せますか？", "eigo o hanasemasu ka?", "Sprechen Sie Englisch?", 2],
  ["もう一度お願いします", "mou ichido onegaishimasu", "Bitte noch einmal", 2],
  ["ゆっくりお願いします", "yukkuri onegaishimasu", "Bitte langsam", 2],
  ["大丈夫です", "daijoubu desu", "Es ist in Ordnung", 2],
  ["これは何ですか？", "kore wa nan desu ka?", "Was ist das?", 2],
  ["どこですか？", "doko desu ka?", "Wo ist es?", 3],
  ["トイレはどこですか？", "toire wa doko desu ka?", "Wo ist die Toilette?", 3],
  ["駅", "eki", "Bahnhof", 3],
  ["入口", "iriguchi", "Eingang", 3],
  ["出口", "deguchi", "Ausgang", 3],
  ["右", "migi", "rechts", 3],
  ["左", "hidari", "links", 3],
  ["まっすぐ", "massugu", "geradeaus", 3],
  ["これをお願いします", "kore o onegaishimasu", "Dieses bitte", 4],
  ["水", "mizu", "Wasser", 4],
  ["おいしいです", "oishii desu", "Es ist lecker", 4],
  ["お会計お願いします", "okaikei onegaishimasu", "Die Rechnung bitte", 4],
  ["いくらですか？", "ikura desu ka?", "Wie viel kostet es?", 4],
  ["カードは使えますか？", "kaado wa tsukaemasu ka?", "Kann ich mit Karte bezahlen?", 4],
  ["一つ", "hitotsu", "ein Stück", 4],
  ["二つ", "futatsu", "zwei Stück", 4],
  ["これはヴィーガンですか？", "kore wa viigan desu ka?", "Ist das vegan?", 5],
  ["モーくまちゃん、愛してるよ。", "moo-kuma-chan, aishiteru yo.", "Ich liebe dich mein Mo-Bärchen", 5],
  ["ディーンとカトリンは本当にかっこいいね。", "diin to katorin wa hontou ni kakkoii ne.", "Dean und Katrin sind schon echt cool", 5],
  ["四人分で、量は二倍にしてください。", "yoninbun de, ryou wa nibai ni shite kudasai.", "Bitte für 4 Personen und die doppelte Menge", 5],
  ["チーズをのせて焼いてください。", "chiizu o nosete yaite kudasai.", "Gerne mit Käse überbacken", 5],
  ["この辺で一番おしゃれな温泉はどこですか？", "kono hen de ichiban oshare na onsen wa doko desu ka?", "Wo gibt’s hier die schicksten Onsen?", 5],
  ["もう一か月長く滞在したいのですが、可能ですか？", "mou ikkagetsu nagaku taizai shitai no desu ga, kanou desu ka?", "Wir würden gern einen Monat länger bleiben – lässt sich das machen?", 5],
  ["こちらの素敵な図書館で、ハンサムで魅力的な部門長のための求人はありますか？", "kochira no suteki na toshokan de, hansamu de miryokuteki na bumonchou no tame no kyuujin wa arimasu ka?", "Gibt es in eurer schönen Bibliothek eine freie Stelle für einen gutaussehenden, charmanten Referatsleiter?", 5]
].map(([japanese, reading, german, level], index) => ({
  id: `travel-${index + 1}`,
  japanese,
  reading,
  german,
  level,
  stage: 1
}));

function loadCards() {
  try {
    const saved = JSON.parse(localStorage.getItem(CARDS_KEY));
    if (Array.isArray(saved) && saved.length) {
      const savedById = new Map(saved.map(card => [card.id, card]));
      const cards = DEFAULT_CARDS.map(defaultCard => ({
        ...defaultCard,
        stage: Number(savedById.get(defaultCard.id)?.stage) || 1
      }));
      saveCards(cards);
      return cards;
    }
  } catch (error) {
    console.warn("Gespeicherte Karten konnten nicht geladen werden.", error);
  }

  saveCards(DEFAULT_CARDS);
  return DEFAULT_CARDS.map(card => ({ ...card }));
}

function saveCards(cards) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

function getLevelCards(level) {
  return loadCards().filter(card => card.level === Number(level));
}

function updateCardStage(cardId, wasCorrect) {
  const cards = loadCards();
  const card = cards.find(item => item.id === cardId);
  if (!card) return;

  card.stage = wasCorrect ? Math.min(MAX_STAGE + 1, card.stage + 1) : 1;
  saveCards(cards);
}

function getStats() {
  const cards = loadCards();
  return {
    open: cards.filter(card => card.stage <= MAX_STAGE).length,
    known: cards.filter(card => card.stage > MAX_STAGE).length
  };
}

function resetJapaneseProgress() {
  saveCards(DEFAULT_CARDS.map(card => ({ ...card })));
}
