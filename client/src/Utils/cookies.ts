import Cookies from 'js-cookie'
import { AutoAuthData } from 'shared/types';

export const AAD_COOKIE = cookie<AutoAuthData>("aad");

function cookie<T>(name: string) {
  return {
    set: (value: T | undefined) => {
      if (value === undefined) {
        Cookies.remove(name);
      }

      Cookies.set(name, JSON.stringify(value));
    },
    get: () => {
      try {
        return JSON.parse(Cookies.get(name)!) as T;
      } catch {
        return undefined;
      }
    }
  };
}