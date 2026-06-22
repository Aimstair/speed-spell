// A lightweight heuristic to generate pseudo-phonetic hints
export const generatePhoneticHint = (word: string): string => {
  const vowels = 'aeiouy';
  let hint = '';
  let i = 0;
  
  while (i < word.length) {
    const char = word[i].toLowerCase();
    hint += char;
    
    // If current char is a vowel, and next char is a consonant, and the char after that is a vowel,
    // we usually split before the consonant.
    if (vowels.includes(char) && i + 2 < word.length) {
      const next1 = word[i+1].toLowerCase();
      const next2 = word[i+2].toLowerCase();
      
      if (!vowels.includes(next1) && vowels.includes(next2)) {
        // e.g., 'a' in 'anatomy' -> 'a-na-to-my'
        // Let's just add a hyphen after the vowel
        hint += '-';
      } else if (!vowels.includes(next1) && !vowels.includes(next2) && i + 3 < word.length && vowels.includes(word[i+3].toLowerCase())) {
        // Two consonants between vowels, split between consonants
        hint += next1 + '-';
        i++;
      }
    }
    i++;
  }

  // Clean up trailing hyphens
  hint = hint.replace(/-+$/, '');
  return hint;
};
