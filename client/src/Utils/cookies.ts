import Cookies from 'js-cookie'
import { AutoAuthData } from 'shared/types';

export const AAD_COOKIE = cookie<AutoAuthData>("aad");

function cookie<T>(name: string) {
  return {
    set: (value: T | undefined) => {
      Cookies.set(name, JSON.stringify(value));
    },
    get: () => {
      const cookie = Cookies.get(name);
      if (cookie === undefined) { return undefined; }

      return JSON.parse(cookie) as T;
    }
  };
}