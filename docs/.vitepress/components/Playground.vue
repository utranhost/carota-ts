<template>
  <div class="playground">
    <!-- Toolbar -->
    <div class="playground-toolbar">
      <div class="toolbar-group">
        <select ref="fontSelect" @change="onFontChange" class="toolbar-select">
          <option value="serif">Times</option>
          <option value="sans-serif">Helvetica</option>
          <option value="monospace">Courier</option>
          <option value="cursive">Cursive</option>
          <option value="fantasy">Fantasy</option>
        </select>
        <select ref="sizeSelect" @change="onSizeChange" class="toolbar-select toolbar-select-sm">
          <option>8</option><option>9</option><option>10</option>
          <option>11</option><option>12</option><option>14</option>
          <option>16</option><option>18</option><option>20</option>
          <option>24</option><option>30</option><option>36</option><option>72</option>
        </select>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button ref="boldCheck" @click="onToggleFormat('bold')" class="toolbar-btn" title="粗体 (Ctrl+B)"><strong>B</strong></button>
        <button ref="italicCheck" @click="onToggleFormat('italic')" class="toolbar-btn" title="斜体 (Ctrl+I)"><em>I</em></button>
        <button ref="underlineCheck" @click="onToggleFormat('underline')" class="toolbar-btn" title="下划线 (Ctrl+U)"><u>U</u></button>
        <button ref="strikeoutCheck" @click="onToggleFormat('strikeout')" class="toolbar-btn" title="删除线 (Ctrl+S)"><s>S</s></button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button @click="onAlign('left')" class="toolbar-btn toolbar-btn-align" data-align="left" title="左对齐">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </button>
        <button @click="onAlign('center')" class="toolbar-btn toolbar-btn-align" data-align="center" title="居中对齐">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </button>
        <button @click="onAlign('right')" class="toolbar-btn toolbar-btn-align" data-align="right" title="右对齐">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
        </button>
        <button @click="onAlign('justify')" class="toolbar-btn toolbar-btn-align" data-align="justify" title="两端对齐">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <select ref="scriptSelect" @change="onScriptChange" class="toolbar-select">
          <option value="normal">Normal</option>
          <option value="super">Superscript</option>
          <option value="sub">Subscript</option>
        </select>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <label class="toolbar-color" title="文字颜色">
          <span class="color-indicator" :style="{ background: currentColor }"></span>
          <input type="color" ref="colorInput" @input="onColorChange" :value="currentColor" class="color-picker">
        </label>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button @click="onUndo" class="toolbar-btn" title="撤销 (Ctrl+Z)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
        <button @click="onRedo" class="toolbar-btn" title="重做 (Ctrl+Y)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
        </button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <select ref="valignSelect" @change="onValignChange" class="toolbar-select">
          <option value="top">顶部对齐</option>
          <option value="middle">垂直居中</option>
          <option value="bottom">底部对齐</option>
        </select>
      </div>
    </div>

    <!-- Main content: Editor + JSON -->
    <div class="playground-body">
      <div class="playground-editor">
        <div class="panel-header">
          <span class="panel-dot" style="background:#ff5f57"></span>
          <span class="panel-dot" style="background:#febc2e"></span>
          <span class="panel-dot" style="background:#28c840"></span>
          <span class="panel-title">Canvas 编辑器</span>
        </div>
        <div ref="editorContainer" class="editor-area"></div>
      </div>
      <div class="playground-resizer" @mousedown="startResize"></div>
      <div class="playground-json" :style="{ width: jsonWidth + 'px' }">
        <div class="panel-header">
          <span class="panel-dot" style="background:#ff5f57"></span>
          <span class="panel-dot" style="background:#febc2e"></span>
          <span class="panel-dot" style="background:#28c840"></span>
          <span class="panel-title">Run[] JSON（可编辑）</span>
        </div>
        <textarea
          ref="jsonTextarea"
          class="json-textarea"
          v-model="jsonOutput"
          @input="onJsonInput"
          spellcheck="false"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import carota from '../../../src/lib/carota'
import type { Doc } from '../../../src/lib/doc'
import type { Formatting } from '../../../src/lib/runs'

const editorContainer = ref<HTMLElement | null>(null)
const fontSelect = ref<HTMLSelectElement | null>(null)
const sizeSelect = ref<HTMLSelectElement | null>(null)
const boldCheck = ref<HTMLButtonElement | null>(null)
const italicCheck = ref<HTMLButtonElement | null>(null)
const underlineCheck = ref<HTMLButtonElement | null>(null)
const strikeoutCheck = ref<HTMLButtonElement | null>(null)
const scriptSelect = ref<HTMLSelectElement | null>(null)
const colorInput = ref<HTMLInputElement | null>(null)
const valignSelect = ref<HTMLSelectElement | null>(null)
const jsonTextarea = ref<HTMLTextAreaElement | null>(null)
const jsonOutput = ref('')
const currentColor = ref('#000000')
const jsonWidth = ref(420)

let doc: Doc | null = null
let manuallyChangingJson = 0

const welcomeHtml = `<h1>欢迎使用 Carota!</h1>
<br>
<p>这是 <span class="carota">Carota</span> 的完整演示页面，一个基于 HTML5 Canvas 的富文本编辑器。与大多数浏览器内编辑器使用 <code>contentEditable</code> 不同，Carota 从零开始实现了文本渲染和编辑。</p>
<br>
<p>你可以直接在这里编辑文本！试试 <code>Ctrl+A</code> 全选，<code>Backspace</code> 清空，然后输入自己的内容。右侧 JSON 面板会实时更新。</p>
<br>
<p>使用上方工具栏修改格式：<b>粗体</b>、<i>斜体</i>、<u>下划线</u>、<s>删除线</s>、颜色、对齐方式等。按 <code>Ctrl+Z</code> 撤销，<code>Ctrl+Y</code> 重做。</p>
<br>
<p>Carota 运行时<em>无外部依赖</em>，使用 MIT 许可证发布。</p>`

onMounted(() => {
  if (!editorContainer.value) return

  doc = carota.editor.create(editorContainer.value)

  const htmlRuns = carota.html.parse(welcomeHtml, {
    carota: { color: 'orange', bold: true, size: 14 }
  })
  doc.load(htmlRuns)

  doc.selectionChanged((getFormatting: () => Partial<Formatting>) => {
    const fmt = getFormatting()
    updateBtn(boldCheck.value, fmt.bold === true)
    updateBtn(italicCheck.value, fmt.italic === true)
    updateBtn(underlineCheck.value, fmt.underline === true)
    updateBtn(strikeoutCheck.value, fmt.strikeout === true)
    if (fontSelect.value && fmt.font) fontSelect.value.value = fmt.font
    if (sizeSelect.value && fmt.size) sizeSelect.value.value = String(fmt.size)
    if (scriptSelect.value && fmt.script) scriptSelect.value.value = fmt.script
    const alignBtns = editorContainer.value?.closest('.playground')?.querySelectorAll('.toolbar-btn-align')
    alignBtns?.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-align') === fmt.align)
    })
    if (fmt.color && fmt.color !== carota.runs.multipleValues) {
      currentColor.value = fmt.color.startsWith('#') ? fmt.color : nameToHex(fmt.color)
      if (colorInput.value) colorInput.value.value = currentColor.value
    }
  })

  doc.contentChanged(() => {
    if (!manuallyChangingJson) {
      jsonOutput.value = JSON.stringify(doc!.save(), null, 2)
    }
  })
  jsonOutput.value = JSON.stringify(doc.save(), null, 2)
})

function updateBtn(btn: HTMLButtonElement | null, active: boolean) {
  if (!btn) return
  btn.classList.toggle('active', active)
}

function nameToHex(name: string): string {
  const map: Record<string, string> = {
    black: '#000000', red: '#ff0000', green: '#008000', blue: '#0000ff',
    white: '#ffffff', gray: '#808080', orange: '#ffa500', purple: '#800080'
  }
  return map[name] || '#000000'
}

function onFontChange() {
  if (!doc || !fontSelect.value) return
  doc.selectedRange().setFormatting('font', fontSelect.value.value)
}

function onSizeChange() {
  if (!doc || !sizeSelect.value) return
  doc.selectedRange().setFormatting('size', parseInt(sizeSelect.value.value))
}

function onToggleFormat(key: keyof Formatting) {
  if (!doc) return
  const range = doc.selectedRange()
  const fmt = range.getFormatting()
  const current = fmt[key]
  range.setFormatting(key, current !== true)
  const btns: Record<string, HTMLButtonElement | null> = {
    bold: boldCheck.value, italic: italicCheck.value,
    underline: underlineCheck.value, strikeout: strikeoutCheck.value
  }
  updateBtn(btns[key], current !== true)
}

function onAlign(value: string) {
  if (!doc) return
  doc.selectedRange().setFormatting('align', value)
  const alignBtns = editorContainer.value?.closest('.playground')?.querySelectorAll('.toolbar-btn-align')
  alignBtns?.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-align') === value)
  })
}

function onScriptChange() {
  if (!doc || !scriptSelect.value) return
  doc.selectedRange().setFormatting('script', scriptSelect.value.value)
}

function onColorChange() {
  if (!doc || !colorInput.value) return
  currentColor.value = colorInput.value.value
  doc.selectedRange().setFormatting('color', currentColor.value)
}

function onUndo() { doc?.performUndo(false) }
function onRedo() { doc?.performUndo(true) }

function onJsonInput() {
  if (!doc) return
  try {
    manuallyChangingJson++
    doc.load(JSON.parse(jsonOutput.value), false)
  } catch {
    // ignore JSON syntax errors
  } finally {
    manuallyChangingJson--
  }
}

function onValignChange() {
  if (!doc || !valignSelect.value) return
  doc.setVerticalAlignment(valignSelect.value.value)
}

// Resizer drag
function startResize(e: MouseEvent) {
  e.preventDefault()
  const startX = e.clientX
  const startWidth = jsonWidth.value
  const onMove = (ev: MouseEvent) => {
    const delta = startX - ev.clientX
    jsonWidth.value = Math.max(250, Math.min(800, startWidth + delta))
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.playground {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* ---- Toolbar ---- */
.playground-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  align-items: center;
  flex-shrink: 0;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 22px;
  margin: 0 6px;
  background: var(--vp-c-divider);
  flex-shrink: 0;
}

.toolbar-select {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}

.toolbar-select:focus { border-color: var(--vp-c-brand-1); }
.toolbar-select-sm { width: 52px; }

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 13px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.toolbar-btn:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}

.toolbar-btn.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.toolbar-btn:active { transform: scale(0.92); }

.toolbar-color {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s;
  overflow: hidden;
}

.toolbar-color:hover { border-color: var(--vp-c-brand-1); }

.color-indicator {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  pointer-events: none;
}

.color-picker {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

/* ---- Body ---- */
.playground-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* ---- Editor Panel ---- */
.playground-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: none;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  flex-shrink: 0;
}

.panel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.panel-title {
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin-left: 6px;
  font-weight: 500;
}

.editor-area {
  flex: 1;
  position: relative;
  background: #fff;
  min-height: 0;
}

.editor-area :deep(canvas) {
  position: absolute !important;
}

/* ---- Resizer ---- */
.playground-resizer {
  width: 5px;
  cursor: col-resize;
  background: var(--vp-c-divider);
  transition: background 0.15s;
  flex-shrink: 0;
}

.playground-resizer:hover {
  background: var(--vp-c-brand-1);
}

/* ---- JSON Panel ---- */
.playground-json {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-shrink: 0;
}

.json-textarea {
  flex: 1;
  margin: 0;
  padding: 14px;
  font-size: 12px;
  line-height: 1.6;
  border: none;
  outline: none;
  resize: none;
  overflow: auto;
  background: #1e1e2e;
  color: #cdd6f4;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  tab-size: 2;
}
</style>
