export class SingleDeleteURLSearchParams extends URLSearchParams {
  constructor(init) {
    super(init);
  }

  deleteMatching(name, value) {
    const values = this.getAll(name);
    this.delete(name);
    const filteredValues = values.filter(item => item !== value);
    filteredValues.forEach(nonMatchingValue => this.append(name, nonMatchingValue));
  }
}
