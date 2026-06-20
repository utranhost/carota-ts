<template>
  <div class="carota-demo">
    <div class="carota-demo-toolbar" v-if="showToolbar">
      <div class="toolbar-group">
        <select ref="fontSelect" @change="onFontChange" class="toolbar-select">
          <option value="serif">Times</option>
          <option value="sans-serif">Helvetica</option>
          <option value="monospace">Courier</option>
        </select>
        <select ref="sizeSelect" @change="onSizeChange" class="toolbar-select toolbar-select-sm">
          <option>8</option><option>9</option><option>10</option>
          <option>11</option><option>12</option><option>14</option>
          <option>16</option><option>18</option><option>20</option>
          <option>24</option><option>30</option><option>36</option>
        </select>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button
          ref="boldCheck"
          @click="onToggleFormat('bold')"
          class="toolbar-btn"
          title="粗体 (Ctrl+B)"
        ><strong>B</strong></button>
        <button
          ref="italicCheck"
          @click="onToggleFormat('italic')"
          class="toolbar-btn"
          title="斜体 (Ctrl+I)"
        ><em>I</em></button>
        <button
          ref="underlineCheck"
          @click="onToggleFormat('underline')"
          class="toolbar-btn"
          title="下划线 (Ctrl+U)"
        ><u>U</u></button>
        <button
          ref="strikeoutCheck"
          @click="onToggleFormat('strikeout')"
          class="toolbar-btn"
          title="删除线 (Ctrl+S)"
        ><s>S</s></button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button
          @click="onAlign('left')"
          class="toolbar-btn toolbar-btn-align"
          data-align="left"
          title="左对齐"
        ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg></button>
        <button
          @click="onAlign('center')"
          class="toolbar-btn toolbar-btn-align"
          data-align="center"
          title="居中对齐"
        ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>
        <button
          @click="onAlign('right')"
          class="toolbar-btn toolbar-btn-align"
          data-align="right"
          title="右对齐"
        ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg></button>
        <button
          @click="onAlign('justify')"
          class="toolbar-btn toolbar-btn-align"
          data-align="justify"
          title="两端对齐"
        ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
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
    </div>
    <div ref="editorContainer" class="carota-demo-editor" :style="{ height: height }"></div>
    <div class="carota-demo-json" v-if="showJson">
      <div class="json-header">
        <span class="json-dot json-dot-red"></span>
        <span class="json-dot json-dot-yellow"></span>
        <span class="json-dot json-dot-green"></span>
        <span class="json-title">Run[] JSON</span>
      </div>
      <pre><code>{{ jsonOutput }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import carota from '../../../src/lib/carota'
import type { Doc } from '../../../src/lib/doc'
import type { Formatting } from '../../../src/lib/runs'

const props = withDefaults(defineProps<{
  height?: string
  showToolbar?: boolean
  showJson?: boolean
  content?: string
  runs?: string
}>(), {
  height: '200px',
  showToolbar: true,
  showJson: false,
  content: '',
  runs: ''
})

const editorContainer = ref<HTMLElement | null>(null)
const fontSelect = ref<HTMLSelectElement | null>(null)
const sizeSelect = ref<HTMLSelectElement | null>(null)
const boldCheck = ref<HTMLButtonElement | null>(null)
const italicCheck = ref<HTMLButtonElement | null>(null)
const underlineCheck = ref<HTMLButtonElement | null>(null)
const strikeoutCheck = ref<HTMLButtonElement | null>(null)
const colorInput = ref<HTMLInputElement | null>(null)
const jsonOutput = ref('')
const currentColor = ref('#000000')

let doc: Doc | null = null

onMounted(() => {
  if (!editorContainer.value) return

  doc = carota.editor.create(editorContainer.value)

  if (props.runs) {
    try {
      doc.load(JSON.parse(props.runs))
    } catch {
      doc.load([{ text: props.runs }])
    }
  } else if (props.content) {
    const htmlRuns = carota.html.parse(props.content, {
      carota: { color: 'orange', bold: true, size: 14 }
    })
    doc.load(htmlRuns)
  } else {
    doc.load([{ text: '在这里编辑文本...' }])
  }

  if (props.showToolbar && doc) {
    doc.selectionChanged((getFormatting: () => Partial<Formatting>) => {
      const fmt = getFormatting()
      updateBtn(boldCheck.value, fmt.bold === true)
      updateBtn(italicCheck.value, fmt.italic === true)
      updateBtn(underlineCheck.value, fmt.underline === true)
      updateBtn(strikeoutCheck.value, fmt.strikeout === true)
      if (fontSelect.value && fmt.font) {
        fontSelect.value.value = fmt.font
      }
      if (sizeSelect.value && fmt.size) {
        sizeSelect.value.value = String(fmt.size)
      }
      // Update align buttons
      const alignBtns = editorContainer.value?.closest('.carota-demo')?.querySelectorAll('.toolbar-btn-align')
      alignBtns?.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-align') === fmt.align)
      })
      if (fmt.color && fmt.color !== carota.runs.multipleValues) {
        currentColor.value = fmt.color.startsWith('#') ? fmt.color : nameToHex(fmt.color)
        if (colorInput.value) colorInput.value.value = currentColor.value
      }
    })
  }

  if (props.showJson && doc) {
    doc.contentChanged(() => {
      jsonOutput.value = JSON.stringify(doc!.save(), null, 2)
    })
    jsonOutput.value = JSON.stringify(doc.save(), null, 2)
  }
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
    bold: boldCheck.value,
    italic: italicCheck.value,
    underline: underlineCheck.value,
    strikeout: strikeoutCheck.value
  }
  updateBtn(btns[key], current !== true)
}

function onAlign(value: string) {
  if (!doc) return
  doc.selectedRange().setFormatting('align', value)
  // Update align button states
  const alignBtns = editorContainer.value?.closest('.carota-demo')?.querySelectorAll('.toolbar-btn-align')
  alignBtns?.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-align') === value)
  })
}

function onColorChange() {
  if (!doc || !colorInput.value) return
  currentColor.value = colorInput.value.value
  doc.selectedRange().setFormatting('color', currentColor.value)
}

function onUndo() {
  doc?.performUndo(false)
}

function onRedo() {
  doc?.performUndo(true)
}
</script>

<style scoped>
.carota-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  margin: 20px 0;
  background: var(--vp-c-bg);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
}

.carota-demo:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* ---- Toolbar ---- */
.carota-demo-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  align-items: center;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  margin: 0 4px;
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
  appearance: auto;
}

.toolbar-select:focus {
  border-color: var(--vp-c-brand-1);
}

.toolbar-select-sm {
  width: 52px;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
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

.toolbar-btn:active {
  transform: scale(0.92);
}

/* ---- Color Picker ---- */
.toolbar-color {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s;
  overflow: hidden;
}

.toolbar-color:hover {
  border-color: var(--vp-c-brand-1);
}

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

/* ---- Editor ---- */
.carota-demo-editor {
  position: relative;
  min-height: 100px;
  background: #fff;
}

.carota-demo-editor :deep(canvas) {
  position: absolute !important;
}

/* ---- JSON Panel ---- */
.carota-demo-json {
  border-top: 1px solid var(--vp-c-divider);
  background: #1e1e2e;
  padding: 0;
  max-height: 300px;
  overflow: auto;
}

.json-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  z-index: 1;
}

.json-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.json-dot-red { background: #ff5f57; }
.json-dot-yellow { background: #febc2e; }
.json-dot-green { background: #28c840; }

.json-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-left: 4px;
  font-family: monospace;
}

.carota-demo-json pre {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
}

.carota-demo-json code {
  color: #cdd6f4;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
</style>
