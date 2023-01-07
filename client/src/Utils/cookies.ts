import Cookies from 'js-cookie'
import { AutoAuthData } from 'shared/types';

class Cookie<T> {
  _name: string;

  constructor(name: string) {
    this._name = name;
  }

  get() {
    try {
      return JSON.parse(Cookies.get(this._name)!) as T;
    } catch {
      return undefined;
    }
  }

  set(value: T | undefined) {
    if (value === undefined) {
      Cookies.remove(this._name);
    }

    Cookies.set(this._name, JSON.stringify(value));
  }
}

export const AAD_COOKIE = new Cookie<AutoAuthData>("aad");

// function cookie<T>(name: string) {
//   return {
//     set: (value: T | undefined) => {
//       if (value === undefined) {
//         Cookies.remove(name);
//       }

//       Cookies.set(name, JSON.stringify(value));
//     },
//     get: () => {
//       try {
//         return JSON.parse(Cookies.get(name)!) as T;
//       } catch {
//         return undefined;
//       }
//     }
//   };
// }