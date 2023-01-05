export function removeFirst<T>(arr: T[], value: T) {
  let index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
}