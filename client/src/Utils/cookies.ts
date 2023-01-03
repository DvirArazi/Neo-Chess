import { getCookie, setCookie } from "typescript-cookie";

export default class Cookies {
  get tid() {
    return getCookie(Cookie.Tid);
  }
  set tid(value: string | undefined) {
    setCookie(Cookie.Tid, value);
  }
}

enum Cookie {
  Tid = "tid"
}