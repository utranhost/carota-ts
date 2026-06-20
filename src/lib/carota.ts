import node from './node';
import * as editor from './editor';
import doc from './doc';
import * as dom from './dom';
import * as runs from './runs';
import * as html from './html';
import frame from './frame';
import * as text from './text';
import rect from './rect';

const bundle = {
  node,
  editor,
  document: doc,
  dom,
  runs,
  html,
  frame,
  text,
  rect
};

export default bundle;

if (typeof window !== 'undefined' && window.document) {
  if (window.carota) {
    throw new Error('Something else is called carota!');
  }
  window.carota = bundle;
}
