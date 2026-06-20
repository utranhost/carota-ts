import per from 'per';
import { Run, CharacterObject, consolidate, getPiecePlainText } from './runs';
import { Formatting } from './runs';

const tag = function (name: string, formattingProperty: keyof Formatting): (node: Element, formatting: Formatting) => void {
  return function (node, formatting) {
    if (node.nodeName === name) {
      (formatting as Record<string, unknown>)[formattingProperty] = true;
    }
  };
};

const value = function (
  type: 'style' | 'attributes',
  styleProperty: string,
  formattingProperty: keyof Formatting,
  transformValue?: (val: string) => string | number | boolean | undefined
): (node: Element, formatting: Formatting) => void {
  return function (node, formatting) {
    const htmlElem = node as HTMLElement;
    const attr = type === 'style' ? htmlElem.style as unknown as Record<string, string> : htmlElem.attributes as unknown as Record<string, string>;
    const val = attr && attr[styleProperty];
    if (val) {
      (formatting as Record<string, unknown>)[formattingProperty] = transformValue ? transformValue(val) : val;
    }
  };
};

const attrValue = function (styleProperty: string, formattingProperty: keyof Formatting, transformValue?: (val: string) => string | number | boolean | undefined): (node: Element, formatting: Formatting) => void {
  return value('attributes', styleProperty, formattingProperty, transformValue);
};

const styleValue = function (styleProperty: string, formattingProperty: keyof Formatting, transformValue?: (val: string) => string | number | boolean | undefined): (node: Element, formatting: Formatting) => void {
  return value('style', styleProperty, formattingProperty, transformValue);
};

const styleFlag = function (styleProp: string, styleVal: string, formattingProperty: keyof Formatting): (node: Element, formatting: Formatting) => void {
  return function (node, formatting) {
    const htmlElem = node as HTMLElement;
    if (htmlElem.style && htmlElem.style.getPropertyValue(styleProp) === styleVal) {
      (formatting as Record<string, unknown>)[formattingProperty] = true;
    }
  };
};

const obsoleteFontSizes: Record<string, number> = { '1': 6, '2': 7, '3': 9, '4': 10, '5': 12, '6': 16, '7': 20 };

const aligns: Record<string, boolean> = { left: true, center: true, right: true, justify: true };

const checkAlign = function (value: string): string {
  return aligns[value] ? value : 'left';
};

const fontName = function (name: string): string {
  const s = name.split(/\s*,\s*/g);
  if (s.length == 0) {
    return name;
  }
  name = s[0];
  let raw = name.match(/^"(.*)"$/);
  if (raw) {
    return raw[1].trim();
  }
  raw = name.match(/^'(.*)'$/);
  if (raw) {
    return raw[1].trim();
  }
  return name;
};

const headings: Record<string, number> = {
  H1: 30,
  H2: 20,
  H3: 16,
  H4: 14,
  H5: 12
};

const handlers: ((node: Element, formatting: Formatting) => void)[] = [
  tag('B', 'bold'),
  tag('STRONG', 'bold'),
  tag('I', 'italic'),
  tag('EM', 'italic'),
  tag('U', 'underline'),
  tag('S', 'strikeout'),
  tag('STRIKE', 'strikeout'),
  tag('DEL', 'strikeout'),
  styleFlag('fontWeight', 'bold', 'bold'),
  styleFlag('fontStyle', 'italic', 'italic'),
  styleFlag('textDecoration', 'underline', 'underline'),
  styleFlag('textDecoration', 'line-through', 'strikeout'),
  styleValue('color', 'color'),
  styleValue('fontFamily', 'font', fontName),
  styleValue('fontSize', 'size', function (size: string) {
    const m = size.match(/^([\d\.]+)pt$/);
    return m ? parseFloat(m[1]) : 10;
  }),
  styleValue('textAlign', 'align', checkAlign),
  function (node, formatting) {
    if (node.nodeName === 'SUB') {
      formatting.script = 'sub';
    }
  },
  function (node, formatting) {
    if (node.nodeName === 'SUPER') {
      formatting.script = 'super';
    }
  },
  function (node, formatting) {
    if (node.nodeName === 'CODE') {
      formatting.font = 'monospace';
    }
  },
  function (node, formatting) {
    const size = headings[node.nodeName as keyof typeof headings];
    if (size) {
      formatting.size = size;
    }
  },
  attrValue('color', 'color'),
  attrValue('face', 'font', fontName),
  attrValue('align', 'align', checkAlign),
  attrValue('size', 'size', function (size: string) {
    return obsoleteFontSizes[size as keyof typeof obsoleteFontSizes] || 10;
  })
];

const newLineNames = ['BR', 'P', 'H1', 'H2', 'H3', 'H4', 'H5'];
const isNewLine: Record<string, boolean> = {};
newLineNames.forEach(function (name) {
  isNewLine[name] = true;
});

export function parse(html: HTMLElement | string, classes: Record<string, Partial<Formatting>>): Run[] {
  let root: HTMLElement;
  if (typeof html === 'string') {
    root = document.createElement('div');
    root.innerHTML = html;
  } else {
    root = html;
  }

  const result: Run[] = [];
  let inSpace = true;
  const cons = per(consolidate()).into(result);
  const emit = function (text: string, formatting: Formatting): void {
    cons.submit(Object.create(formatting, {
      text: { value: text }
    }) as Run);
  };
  const dealWithSpaces = function (text: string, formatting: Formatting): void {
    text = text.replace(/\n+\s*/g, ' ');
    let fullLength = text.length;
    text = text.replace(/^\s+/, '');
    if (inSpace) {
      inSpace = false;
    } else if (fullLength !== text.length) {
      text = ' ' + text;
    }
    fullLength = text.length;
    text = text.replace(/\s+$/, '');
    if (fullLength !== text.length) {
      inSpace = true;
      text += ' ';
    }
    emit(text, formatting);
  };

  function recurse(node: Node, formatting: Formatting): void {
    if (node.nodeType == 3) {
      dealWithSpaces(node.nodeValue || '', formatting);
    } else {
      formatting = Object.create(formatting);

      const classNames = (node as Element).attributes?.getNamedItem('class');
      if (classNames) {
        classNames.value.split(' ').forEach(function (cls: string) {
          const clsDef = classes[cls];
          if (clsDef) {
            Object.keys(clsDef).forEach(function (key) {
              (formatting as Record<string, unknown>)[key] = clsDef[key as keyof Formatting];
            });
          }
        });
      }

      handlers.forEach(function (handler) {
        handler(node as Element, formatting);
      });
      if (node.childNodes) {
        for (let n = 0; n < node.childNodes.length; n++) {
          recurse(node.childNodes[n], formatting);
        }
      }
      if ((node as Element).nodeName in isNewLine) {
        emit('\n', formatting);
        inSpace = true;
      }
    }
  }
  recurse(root, {});
  return result;
}
