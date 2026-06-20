# carota

Simple, flexible rich text rendering/editing on HTML Canvas.

## Quick Start

### Install

```bash
npm install carota-ts
```

### Basic Usage

```html
<div id="editor" style="position: relative; width: 600px; height: 400px;"></div>

<script type="module">
  import carota from 'carota-ts';

  // Create editor instance
  const doc = carota.editor.create(document.getElementById('editor'));

  // Load content with formatting
  doc.load([
    { text: 'Hello ', bold: true, size: 16 },
    { text: 'World!', color: 'red', italic: true }
  ]);

  // Save content as JSON
  const data = doc.save();
  console.log(data);
</script>
```

### Vite Dev Server

```bash
npm run dev      # Start dev server on http://localhost:3003
npm run build    # Build library (UMD + ESM)
npm run preview  # Preview production build
```

## Run Data Format

The core data structure is `Run` — a text segment with optional formatting:

```typescript
interface Run {
  text: string | CharacterObject | (string | CharacterObject)[];
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
  color?: string;       // e.g. 'red', '#ff0000'
  font?: string;        // e.g. 'Arial', 'sans-serif'
  size?: number;        // font size in pt
  align?: string;       // 'left' | 'center' | 'right'
  script?: string;      // 'normal' | 'super' | 'sub'
}
```

Example:

```javascript
const runs = [
  { text: 'Normal text' },
  { text: 'Bold and red', bold: true, color: 'red' },
  { text: '\n' },  // line break
  { text: { smiley: true } }  // custom inline object
];
```

## Modules

### editor

Editor creation and UI interaction.

```typescript
import carota from 'carota-ts';
```

#### `carota.editor.create(element: HTMLElement): Doc`

Create a rich text editor in the given container element. The element should have `position: relative` or `absolute`.

Returns a `Doc` instance with full editing capabilities.

```javascript
const doc = carota.editor.create(document.getElementById('editor'));
```

### document (Doc)

The core document model. Created by `editor.create()`, provides all editing operations.

#### Content

| Method | Description |
|--------|-------------|
| `doc.load(runs: Run[], takeFocus?: boolean)` | Load content, replacing all existing content |
| `doc.save(): Run[]` | Save content as Run array |
| `doc.insert(text: string \| Run \| Run[], takeFocus?: boolean)` | Insert text at current selection |
| `doc.width(): number` | Get document width |
| `doc.width(w: number)` | Set document width |

#### Selection

| Method | Description |
|--------|-------------|
| `doc.select(start: number, end?: number, takeFocus?: boolean)` | Set selection range |
| `doc.selectedRange(): RangeInstance` | Get current selection as Range |
| `doc.range(start: number, end: number): RangeInstance` | Get arbitrary range |
| `doc.documentRange(): RangeInstance` | Get range covering entire document |
| `doc.paragraphRange(start: number, end: number): RangeInstance` | Get range of paragraph containing the given range |

#### Formatting

| Method | Description |
|--------|-------------|
| `doc.modifyInsertFormatting(attr, value)` | Set formatting for next insertion |
| `doc.applyInsertFormatting(runs)` | Apply insert formatting to runs |

#### Undo/Redo

| Method | Description |
|--------|-------------|
| `doc.performUndo(redo?: boolean)` | Undo (or redo if `redo=true`) |
| `doc.canUndo(redo?: boolean): boolean` | Check if undo/redo is available |

#### Events

| Event | Signature | Description |
|-------|-----------|-------------|
| `doc.selectionChanged(handler)` | `(getFormatting: () => Partial<Formatting>, takeFocus?: boolean) => void` | Fired when selection changes. `getFormatting()` returns formatting at selection. |
| `doc.contentChanged(handler)` | `() => void` | Fired when document content changes. |

#### Custom Codes

```javascript
doc.customCodes = function(obj) {
  if (obj.smiley) {
    return {
      measure() {
        return { width: 24, ascent: 24, descent: 0 };
      },
      draw(ctx, x, y, width, ascent, descent, formatting) {
        ctx.drawImage(smileyImg, x, y - ascent, width, ascent);
      }
    };
  }
};
```

### Range

Represents a range within the document. Created via `doc.range()`, `doc.selectedRange()`, etc.

| Method | Description |
|--------|-------------|
| `range.save(): Run[]` | Save range content as Run array |
| `range.plainText(): string` | Get plain text content |
| `range.clear(): number` | Delete range content, returns new cursor position |
| `range.setText(text): number` | Replace range content |
| `range.getFormatting(): Partial<Formatting>` | Get merged formatting of range |
| `range.setFormatting(attr, value)` | Apply formatting to range |
| `range.parts(emit)` | Iterate over nodes in range |
| `range.runs(emit)` | Iterate over runs in range |

Properties: `range.doc`, `range.start`, `range.end`

### runs

Text run utilities and formatting definitions.

| Export | Type | Description |
|--------|------|-------------|
| `defaultFormatting` | `Required<Formatting>` | Default formatting values |
| `multipleValues` | `unique symbol` | Sentinel indicating multiple values in merged formatting |
| `formattingKeys` | `(keyof Formatting)[]` | All formatting property names |
| `sameFormatting(a, b)` | `(Formatting, Formatting) => boolean` | Check if two formattings are equal |
| `clone(run)` | `(Run) => Run` | Deep clone a run |
| `merge(run1, run2?)` | `(Run \| Run[], Run?) => MergedFormatting` | Merge formatting from multiple runs |
| `format(runs, template)` | `(Run \| Run[], MergedFormatting) => void` | Apply formatting template to runs |
| `consolidate()` | `() => Consumer` | Consolidate adjacent runs with same formatting |
| `getPlainText(run)` | `(Run) => string` | Extract plain text from a run |

Default formatting values:

```javascript
{
  size: 10,
  font: 'sans-serif',
  color: 'black',
  bold: false,
  italic: false,
  underline: false,
  strikeout: false,
  align: 'left',
  script: 'normal'
}
```

### html

Parse HTML into Run arrays.

#### `carota.html.parse(element: HTMLElement, classes?: Record<string, Partial<Formatting>>): Run[]`

Parse an HTML element tree into a Run array. The `classes` parameter maps CSS class names to formatting overrides.

```javascript
const runs = carota.html.parse(htmlElement, {
  highlight: { bold: true, color: 'orange' }
});
```

### dom

DOM utility helpers.

| Function | Description |
|----------|-------------|
| `handleEvent(element, name, handler)` | Add event listener. Return `false` to `preventDefault`. |
| `handleMouseEvent(element, name, handler)` | Add mouse event listener with relative coordinates. |
| `isAttached(element)` | Check if element is attached to the document. |
| `clear(element)` | Remove all child nodes. |
| `setText(element, text)` | Set element text content. |
| `effectiveStyle(element, name)` | Get computed style property value. |

### node

Document node tree infrastructure. All visual elements (Doc, Frame, Line, Word, etc.) extend `NodeBase`.

#### `NodeBase` interface

| Property/Method | Description |
|-----------------|-------------|
| `ordinal` | Position in document |
| `length` | Character length |
| `block` | Whether this is a block element |
| `children()` | Child nodes |
| `parent()` | Parent node |
| `first()` / `last()` | First/last child |
| `next()` / `previous()` | Sibling navigation |
| `byOrdinal(index)` | Find descendant by position |
| `byCoordinate(x, y)` | Find descendant by coordinates |
| `bounds()` | Get bounding rectangle |
| `draw(ctx, viewPort?)` | Render to canvas |
| `parentOfType(type)` | Find ancestor of given type |

### rect

Immutable rectangle objects.

```typescript
interface Rect {
  l: number;  // left
  t: number;  // top
  w: number;  // width
  h: number;  // height
  r: number;  // right  (l + w)
  b: number;  // bottom (t + h)
  contains(x, y): boolean;
  offset(x, y): Rect;
  equals(other): boolean;
  center(): { x: number; y: number };
  stroke(ctx): void;
  fill(ctx): void;
}
```

```javascript
const r = carota.rect(10, 20, 100, 50);  // left, top, width, height
r.contains(50, 30);  // true
r.center();           // { x: 60, y: 45 }
```

### text

Text measurement and rendering utilities.

| Export | Description |
|--------|-------------|
| `measure(str, formatting)` | Measure text dimensions with given formatting |
| `draw(ctx, str, formatting, left, baseline, width, ascent, descent)` | Draw text on canvas |
| `getFontString(formatting?)` | Build CSS font string from formatting |
| `applyRunStyle(ctx, formatting?)` | Apply formatting to canvas context |
| `prepareContext(ctx)` | Set default text alignment/baseline |
| `measureText(text, style)` | Low-level text measurement using DOM |
| `cachedMeasureText` | Cached version of `measureText` |

### frame

Layout frame — the root container for laid-out content. Created internally during `doc.layout()`.

### CharacterObject

Custom inline objects (e.g. images, emojis) are represented as `CharacterObject`:

```typescript
interface CharacterObject {
  $?: string;  // type identifier (e.g. 'listStart', 'listEnd')
  [key: string]: string | boolean | number | undefined;
}
```

To insert a custom inline object:

```javascript
doc.insert({ text: { smiley: true } });
```

To render it, define `customCodes` on the doc:

```javascript
doc.customCodes = function(obj) {
  if (obj.smiley) {
    return {
      measure() { return { width: 24, ascent: 24, descent: 0 }; },
      draw(ctx, x, y, w, ascent, descent, formatting) {
        // custom drawing logic
      }
    };
  }
};
```

## License

MIT
