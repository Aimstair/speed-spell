const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/utils/words.json', 'utf8'));

data["SAT Prep"] = [
  { word: "aberration", definition: "A departure from what is normal", origin: "Latin", sentence: "They described the outbreak as an aberration." },
  { word: "capricious", definition: "Given to sudden changes of mood", origin: "Italian", sentence: "The capricious weather ruined the picnic." },
  { word: "ephemeral", definition: "Lasting for a very short time", origin: "Greek", sentence: "Fashions are ephemeral." },
  { word: "gregarious", definition: "Fond of company; sociable", origin: "Latin", sentence: "He was a fun-loving and gregarious fellow." },
  { word: "loquacious", definition: "Tending to talk a great deal", origin: "Latin", sentence: "Never a loquacious person, she remained silent." }
];

data["Medical"] = [
  { word: "anatomy", definition: "Study of the structure of organisms", origin: "Greek", sentence: "He studied anatomy in medical school." },
  { word: "benign", definition: "Not harmful in effect", origin: "Latin", sentence: "The tumor was completely benign." },
  { word: "cardiology", definition: "Branch of medicine dealing with the heart", origin: "Greek", sentence: "She specializes in pediatric cardiology." },
  { word: "diagnosis", definition: "Identification of an illness", origin: "Greek", sentence: "Early diagnosis improves the prognosis." },
  { word: "epidemic", definition: "Widespread occurrence of infectious disease", origin: "Greek", sentence: "A flu epidemic swept through the school." }
];

data["Science"] = [
  { word: "biology", definition: "Study of living organisms", origin: "Greek", sentence: "Biology is a fascinating subject." },
  { word: "chemistry", definition: "Science of matter and its interactions", origin: "Greek", sentence: "The chemistry experiment went wrong." },
  { word: "physics", definition: "Science of matter, energy, and motion", origin: "Greek", sentence: "Quantum physics is hard to understand." },
  { word: "astronomy", definition: "Study of celestial objects", origin: "Greek", sentence: "Astronomy requires a good telescope." },
  { word: "geology", definition: "Study of the earth's physical structure", origin: "Greek", sentence: "The geology of the area is complex." }
];

fs.writeFileSync('src/utils/words.json', JSON.stringify(data, null, 2), 'utf8');
console.log("Added themes to words.json");
