class FilterChip {
  constructor(template, fieldLabel, queryField, value) {
    this.removeFilterHandlers = [];
    this.element = template.clone();
    this.queryField = queryField;
    this.value = value;
    const label = `${fieldLabel} ${this.value}`;
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
  constructor(element, noFilterChipTemplate, activeFilterChipTemplate) {
    this.element = element;
    this.noFilterChipTemplate = noFilterChipTemplate;
    this.activeFilterChipTemplate = activeFilterChipTemplate;
    this.reset();
  }

  reset() {
    this.element.empty();
  }

  add(fieldLabel, queryField, value, removeFilterHandler) {
    const chip = new FilterChip(
      this.activeFilterChipTemplate, fieldLabel, queryField, value);
    chip.addRemoveFilterHandler(removeFilterHandler);
    this.element.append(chip.element);
  }
}
