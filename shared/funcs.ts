export function removeFirst<T>(arr: T[], value: T) {
  let index = this.indexOf(value);
  if (index > -1) {
    this.splice(index, 1);
  }
}