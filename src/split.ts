import { Character } from './characters';
import { CharacterObject } from './runs';

export interface WordCoords {
  text: Character;
  spaces: Character;
  end: Character;
}

export default function (codes: (char: CharacterObject) => { block?: boolean; eof?: boolean }): (emit: (coords: WordCoords | null) => boolean | void, inputChar: Character) => boolean | void {
  let word: Character | null = null, trailingSpaces: Character | null = null, newLine = true;

  return function (emit: (coords: WordCoords | null) => boolean | void, inputChar: Character): boolean | void {
    let endOfWord: boolean | undefined;
    if (inputChar.char === null) {
      endOfWord = true;
    } else {
      if (newLine) {
        endOfWord = true;
        newLine = false;
      }
      if (typeof inputChar.char === 'string') {
        switch (inputChar.char) {
          case ' ':
            if (!trailingSpaces) {
              trailingSpaces = inputChar;
            }
            break;
          case '\n':
            endOfWord = true;
            newLine = true;
            break;
          default:
            if (trailingSpaces) {
              endOfWord = true;
            }
        }
      } else {
        const code = codes(inputChar.char);
        if (code.block || code.eof) {
          endOfWord = true;
          newLine = true;
        }
      }
    }
    if (endOfWord) {
      if (word && !word.equals(inputChar)) {
        if (emit({
          text: word,
          spaces: trailingSpaces || inputChar,
          end: inputChar
        }) === false) {
          return false;
        }
        trailingSpaces = null;
      }
      if (inputChar.char === null) {
        emit(null);
      }
      word = inputChar;
    }
    return false;
  };
}
