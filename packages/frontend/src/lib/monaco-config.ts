// packages/frontend/src/lib/monaco-config.ts

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// ✅ Bundle workers locally with Vite instead of pointing at a CDN URL
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

let isMonacoConfigured = false;

/**
 * Setup Monaco Editor with local package
 * This should only be called when actually using the editor
 */
export const setupMonaco = () => {
  if (isMonacoConfigured) return;
  
  // ✅ Use local monaco-editor package instead of CDN
  loader.config({ monaco });

  // ✅ Use getWorker instead of getWorkerUrl - returns actual Worker instances
  // @ts-ignore
  self.MonacoEnvironment = {
    getWorker(_moduleId: string, label: string) {
      if (label === 'json') {
        return new jsonWorker();
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new cssWorker();
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new htmlWorker();
      }
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker();
      }
      return new editorWorker();
    },
  };
  
  isMonacoConfigured = true;
};

export default setupMonaco;