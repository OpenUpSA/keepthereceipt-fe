class DropdownOption {
  constructor(activeTemplate, inactiveTemplate, selectHandler, deselectHandler, optionItem) {
    if (optionItem.selected) {
      this.element = activeTemplate.clone();
      this.element.click((e => {
        deselectHandler(optionItem.label);
        e.preventDefault();
      }).bind(this));
    } else {
      this.element = inactiveTemplate.clone();
      this.element.click((e => {
        selectHandler(optionItem.label);
        e.preventDefault();
      }).bind(this));
    }
    const optionLabelEl = this.element.find(".dropdown-link__text");
    optionLabelEl.text(optionItem.label);
    optionLabelEl.attr("title", optionItem.label);
    this.element.find(".facet-count").text(optionItem.count);
  }
}

export class DropdownField {
  constructor(element, label, queryField) {
    this.element = element;
    this.label = label;
    this.queryField = queryField;
    this.addFilterHandlers = [];
    this.removeFilterHandlers = [];
    this.activeOptionTemplate = element.find(".dropdown-list__active").clone();
    this.inactiveOptionTemplate = element.find(".dropdown-list__links").clone();
    this.activeOptionTemplate.find(".dropdown-link__text").text("");
    this.activeOptionTemplate.find(".dropdown-link__text + div").addClass("facet-count").text("");
    this.inactiveOptionTemplate.find(".dropdown-link__text").text("");
    this.inactiveOptionTemplate.find(".dropdown-link__text + div").addClass("facet-count").text("");

    this.reset();
  }

  addAddFilterHandler(handler) {
    this.addFilterHandlers.push(handler);
  }
  addRemoveFilterHandler(handler) {
    this.removeFilterHandlers.push(handler);
  }
  handleOptionSelect(value) {
    this.addFilterHandlers.forEach((f => f(this.queryField, value)).bind(this));
  }
  handleOptionDeselect(value) {
    this.removeFilterHandlers.forEach((f => f(this.queryField, value)).bind(this));
  }

  updateOptions(options) {
    options.forEach(optionItem => {
      const option = new DropdownOption(
        this.activeOptionTemplate,
        this.inactiveOptionTemplate,
        this.handleOptionSelect.bind(this),
        this.handleOptionDeselect.bind(this),
        optionItem
      );
      this.element.find(".dropdown-list__inner").append(option.element);
    });
  }

  reset() {
    this.element.find(".dropdown-list__active").remove();
    this.element.find(".dropdown-list__links").remove();
  }
}
