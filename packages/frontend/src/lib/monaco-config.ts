import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Bundle workers locally with Vite
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

let isMonacoConfigured = false;
let configPromise: Promise<void> | null = null;

/**
 * Setup Monaco Editor with local package
 * Returns a promise that resolves when configuration is complete
 */
export const setupMonaco = (): Promise<void> => {
  // Return existing promise if already configuring
  if (configPromise) return configPromise;
  
  // Return immediately if already configured
  if (isMonacoConfigured) return Promise.resolve();

  configPromise = new Promise((resolve, reject) => {
    try {
      // Use local monaco-editor package
      loader.config({ monaco });

      // Use getWorker instead of getWorkerUrl
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
      console.log('✅ Monaco Editor configured successfully');
      resolve();
    } catch (error) {
      console.error('❌ Failed to configure Monaco Editor:', error);
      configPromise = null;
      reject(error);
    }
  });

  return configPromise;
};

export default setupMonaco;