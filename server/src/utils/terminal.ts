export namespace Terminal {
  export function log(text: string) {
    console.log(`\x1b[94m[*] ${text}`);
  }
  export function warning(text: string) {
    console.log(`\x1b[93m[?] ${text}`);
  }
  export function error(text: string) {
    console.log(`\x1b[91m[!] ${text}`);
  }
}