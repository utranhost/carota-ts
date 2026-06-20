import carota from './carota';
import { CharacterObject, Formatting, Run } from './runs';

declare global {
  interface Window {
    carota: typeof carota;
  }
}

window.carota = carota;

window.onload = function () {
  const elem = document.querySelector('#exampleEditor') as HTMLElement;
  const exampleEditor = carota.editor.create(elem);

  // Set up our custom inline - a smiley emoji
  const smiley = document.querySelector('#smiley img') as HTMLImageElement;

  exampleEditor.customCodes = function (obj: CharacterObject) {
    if (obj.smiley) {
      return {
        measure: function () {
          return {
            width: 24,
            ascent: 24,
            descent: 0
          };
        },
        draw: function (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, ascent: number, descent: number, formatting: Run) {
          ctx.drawImage(smiley, x, y - ascent, width, ascent);
        }
      };
    }
  };

  // Setting up the button so user can insert a smiley
  carota.dom.handleEvent(document.querySelector('#smiley') as HTMLElement, 'click', function () {
    exampleEditor.insert({ text: { smiley: true } });
  });

  // Wire up undo/redo commands
  const undo = document.querySelector('#undo') as HTMLButtonElement;
  const redo = document.querySelector('#redo') as HTMLButtonElement;

  carota.dom.handleEvent(undo, 'click', function () {
    exampleEditor.performUndo(false);
  });

  carota.dom.handleEvent(redo, 'click', function () {
    exampleEditor.performUndo(true);
  });

  const updateUndo = function () {
    undo.disabled = !exampleEditor.canUndo(false);
    redo.disabled = !exampleEditor.canUndo(true);
  };

  // Wire up the toolbar controls
  ['font', 'size', 'bold', 'italic', 'underline',
    'strikeout', 'align', 'script', 'color'].forEach(function (id) {
      const formattingKey = id as keyof Formatting;
      const elem = document.querySelector('#' + id) as HTMLElement;

      carota.dom.handleEvent(elem, 'change', function () {
        const range = exampleEditor.selectedRange();
        const val = (elem as HTMLInputElement).nodeName === 'INPUT' ? (elem as HTMLInputElement).checked : (elem as HTMLSelectElement).value;
        range.setFormatting(formattingKey, val);
      });

      exampleEditor.selectionChanged(function (getFormatting: () => Partial<Formatting>) {
        const formatting = getFormatting();
        const val: unknown = formattingKey in formatting ? formatting[formattingKey] : carota.runs.defaultFormatting[formattingKey];
        if ((elem as HTMLInputElement).nodeName === 'INPUT') {
          if (val === carota.runs.multipleValues) {
            (elem as HTMLInputElement).indeterminate = true;
          } else {
            (elem as HTMLInputElement).indeterminate = false;
            (elem as HTMLInputElement).checked = !!val;
          }
        } else {
          if (val !== carota.runs.multipleValues) {
            (elem as HTMLSelectElement).value = val as string;
          }
        }
      });
    });

  const valign = document.querySelector('#valign') as HTMLSelectElement;
  carota.dom.handleEvent(valign, 'change', function () {
    exampleEditor.setVerticalAlignment!(valign.value);
  });

  // We don't update the JSON view until half a second after the last change
  const persistenceTextArea = document.querySelector('#examplePersistence textarea') as HTMLTextAreaElement;
  let updateTimer: number | null = null;
  const updatePersistenceView = function () {
    if (updateTimer !== null) {
      clearTimeout(updateTimer);
    }
    updateTimer = window.setTimeout(function () {
      updateTimer = null;
      persistenceTextArea.value = JSON.stringify(exampleEditor.save(), null, 4);
    }, 500);
  };

  let manuallyChangingJson = 0;
  carota.dom.handleEvent(persistenceTextArea, 'input', function () {
    try {
      manuallyChangingJson++;
      exampleEditor.load(JSON.parse(persistenceTextArea.value), false);
    } catch (x) {
      // ignore if syntax errors
    } finally {
      manuallyChangingJson--;
    }
  });

  // Whenever the document changes, re-display the JSON format and update undo buttons
  exampleEditor.contentChanged(function () {
    updateUndo();
    if (!manuallyChangingJson) {
      updatePersistenceView();
    }
  });

  // Load one of the hidden chunks of HTML
  const load = function (selector: string) {
    const html = document.querySelector(selector) as HTMLElement | null;
    if (html) {
      const runs = carota.html.parse(html, {
        carota: { color: 'orange', bold: true, size: 14 }
      });
      exampleEditor.load(runs);
    }
  };

  // Set up the page links so they call load
  const pageLinks = document.querySelectorAll('#pageLinks a');
  for (let n = 0; n < pageLinks.length; n++) {
    (function () {
      const pageLink = pageLinks[n] as HTMLAnchorElement;
      const ref = pageLink.getAttribute('href')!;
      if (ref[0] === '#') {
        carota.dom.handleEvent(pageLink, 'click', function () {
          load(ref);
          return false;
        });
      }
    })();
  }

  load('#welcome');
};
