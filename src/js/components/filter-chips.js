class FilterChip {
  template = $(".styles .current-filter").first();

  constructor(fieldLabel, queryField, value) {
    this.removeFilterHandlers = [];
    this.element = this.template.clone();
    this.queryField = queryField;
    this.value = value;
    const label = `${fieldLabel}: ${this.value}`;
    this.element.find(".current-filter__label").text(label);
    this.element.find(".current-filter__close").click(this.handleRemove.bind(this));
  }

  addRemoveFilterHandler(handler) {
    this.removeFilterHandlers.push(handler);
  }

  handleRemove() {
    this.removeFilterHandlers.forEach((f => f(this.queryField, this.value)).bind(this));
  }

}

export class FilterChips {
  constructor(element) {
    this.element = element;
    this.reset();
  }

  reset() {
    this.element.empty();
  }

  add(fieldLabel, queryField, value, removeFilterHandler) {
    const chip = new FilterChip(fieldLabel, queryField, value);
    chip.addRemoveFilterHandler(removeFilterHandler);
    this.element.append(chip.element);
  }
}
