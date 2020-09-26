export class FullTextSearchField {
  constructor(element, label, queryField) {
    this.element = element;
    this.queryField = queryField;
    this.addFilterHandlers = [];
    this.inputElement = this.element.find(".search__bar");
    this.label = label;

    this.inputElement.keypress(e => {
      const key = e.which;
      if (key == 13) {  // the enter key code
        e.preventDefault();
        this.handleSubmit(this.inputElement.val());
        this.inputElement.val("");
      }
    });

    this.element.find(".search__add-filter").on("click", (e) => {
      e.preventDefault();
      this.handleSubmit(this.inputElement.val());
      this.inputElement.val("");
    });
  }

  addAddFilterHandler(handler) {
    this.addFilterHandlers.push(handler);
  }

  handleSubmit(value) {
    this.addFilterHandlers.forEach((f => f(this.queryField, value)).bind(this));
  }
}
