import Cookies from 'js-cookie'

export function getCookie(name: CookieName) {
  return Cookies.get(CookieMap[name]);
}

export function setCookie(name: CookieName, value: string | undefined) {
  if (value !== undefined) {
    Cookies.set(CookieMap[name], value);
  } else {
    Cookies.remove(CookieMap[name])
  }
}

export enum CookieName {
  IdToken
}

const CookieMap = new Map<CookieName, string>([
  [CookieName.IdToken, "idToken"],
]);