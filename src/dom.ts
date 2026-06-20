export function isAttached(element: HTMLElement): boolean {
  let ancestor: Node | null = element;
  while (ancestor.parentNode) {
    ancestor = ancestor.parentNode;
  }
  return ancestor instanceof Document && !!ancestor.body;
}

export function clear(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function setText(element: HTMLElement, text: string): void {
  clear(element);
  element.appendChild(document.createTextNode(text));
}

export function handleEvent(element: HTMLElement, name: string, handler: (ev: Event) => boolean | void): void {
  element.addEventListener(name, function (ev) {
    if (handler(ev) === false) {
      ev.preventDefault();
    }
  });
}

export function handleMouseEvent(
  element: HTMLElement,
  name: string,
  handler: (ev: MouseEvent, x: number, y: number) => boolean | void
): void {
  handleEvent(element, name, function (ev) {
    const rect = element.getBoundingClientRect();
    return handler(ev as MouseEvent, (ev as MouseEvent).clientX - rect.left, (ev as MouseEvent).clientY - rect.top);
  });
}

export function effectiveStyle(element: HTMLElement, name: string): string {
  return document.defaultView!.getComputedStyle(element).getPropertyValue(name);
}
