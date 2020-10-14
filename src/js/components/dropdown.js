class DropdownOption {
  activeTemplate = $(".styles .dropdown-list__active").first();
  inactiveTemplate = $(".styles .dropdown-list__links").first();

  constructor(selectHandler, deselectHandler, optionItem) {
    if (optionItem.selected) {
      this.element = this.activeTemplate.clone();
      this.element.click((e => {
        deselectHandler(optionItem.label);
        e.preventDefault();
      }).bind(this));
    } else {
      this.element = this.inactiveTemplate.clone();
      this.element.click((e => {
        selectHandler(optionItem.label);
        e.preventDefault();
      }).bind(this));
    }
    console.assert(this.element.length === 1);
    this.element.find(".receipt-mode").remove();
    this.element.find(".dropdown-link__text + div").addClass("facet-count").text("");

    const optionLabelEl = this.element.find(".dropdown-link__text");
    if (optionItem.label) {
      optionLabelEl.text(optionItem.label);
    } else {
      optionLabelEl.text("Blank");
      optionLabelEl.css('font-style', 'italic');
    }
    optionLabelEl.attr("title", optionItem.label);
    this.element.find(".facet-count").text(optionItem.count);
  }
}

export class DropdownField {
  constructor(element, label, queryField) {
    this.element = element;
    console.assert(this.element.length === 1);

    this.itemContainer = this.element.find(".dropdown-list__inner");
    console.assert(this.itemContainer.length === 1);

    this.label = label;
    this.queryField = queryField;
    this.addFilterHandlers = [];
    this.removeFilterHandlers = [];

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
        this.handleOptionSelect.bind(this),
        this.handleOptionDeselect.bind(this),
        optionItem
      );
      this.itemContainer.append(option.element);
    });
  }

  reset() {
    this.element.find(".dropdown-list__active").remove();
    this.element.find(".dropdown-list__links").remove();
  }
}
