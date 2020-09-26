class PurchaseRecord {
  constructor(template, resultsItem) {
    this.element = template.clone();
    const contentRowDemo = this.element.find(".row-content__item");
    this.contentRowTemplate = contentRowDemo.first().clone();
    contentRowDemo.remove();
    this.contentRowContainer = this.element.find(".row-content__inner");
    this.element.find(".row-title").text(resultsItem.supplier_name);
    this.element.find(".row-body:first").text(resultsItem.buyer_name);
    this.element.find(".row-body:last").text(resultsItem.amount_value_zar);

    // expand/collapse
    const rowContentEl = this.element.find(".row-content");
    const accordionToggle = this.element.find(".row-dropdown__toggle");
    const expandIcon = this.element.find(".row-icon-open");
    const collapseIcon = this.element.find(".row-icon-close");
    rowContentEl.removeAttr("style");
    rowContentEl.hide();
    expandIcon.show();
    collapseIcon.hide();
    accordionToggle.click(() => {
      expandIcon.toggle();
      collapseIcon.toggle();
      rowContentEl.slideToggle();
    });

    for (let field in resultsItem) {
      if (resultsItem[field] !== null && resultsItem[field] !== "") {
        const rowEl = this.contentRowTemplate.clone();
        rowEl.find(".label").text(field);
        rowEl.find(".description-block").text(resultsItem[field]);
        this.contentRowContainer.append(rowEl);
      }
    }
  }
}

export class ResultsList {
  constructor() {
    this.loadMoreButton = null;
    this.loadMoreButtonTemplate = null;
    this.resultRowTemplate = null;
    const rows = $(".row-dropdown");
    this.resultRowTemplate = rows.first().clone();
    rows.remove();
    const loadMoreButtonDemo = $(".load-more");
    this.loadMoreButtonTemplate = loadMoreButtonDemo.clone();
    loadMoreButtonDemo.remove();

  }

  addResults(results, nextCallback) {
    if (results.length) {
      // getNoResultsMessage().hide();
      results.forEach(item => {
        let purchaseRecord = new PurchaseRecord(this.resultRowTemplate, item);
        $(".filtered-list").append(purchaseRecord.element);
      });

      if (nextCallback !== null) {
        this.loadMoreButton = this.loadMoreButtonTemplate.clone();
        this.loadMoreButton.on("click", (e) => {
          e.preventDefault();
          this.loadMoreButton.remove();
          nextCallback();
        });
        $(".filtered-list").append(this.loadMoreButton);
      }
    } else {
      // getNoResultsMessage().show();
    }
  }

  reset() {
    if (this.loadMoreButton)
      this.loadMoreButton.remove();
    $(".row-dropdown").remove();
  }
}
