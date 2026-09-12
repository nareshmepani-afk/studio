declare module 'fontkit' {
  const fontkit: any;
  export default fontkit;
  export function create(buffer: any): any;
  export function openSync(path: string): any;
  export function open(path: string, callback?: any): any;
  export const logErrors: any;
  export const registerFormat: any;
  export const defaultLanguage: any;
  export const setDefaultLanguage: any;
}
