import React from "react";

class Stateful<T> {
  private _value: T
  private _setValue: React.Dispatch<React.SetStateAction<T>>

  constructor(value: T) {
    const state = React.useState(value);
    this._value = state[0];
    this._setValue = state[1];
  }

  public get value() {
    return this._value;
  }

  public get set() {
    return this._setValue;
  }
}

export default Stateful;