/**************************************************************
  Style vision:
    It would be nice if there weren't a million things updating
    and reading pageState but it seems necessary for event handlers
    to figure out the right thing to do.

  pageState is module-global and initialises fields that will be
  used later.

  searchPage is called only on the search page, and initialises
  things dependent on the page markup.

  Each interaction that should trigger a search updates pageState
  if needed (e.g. if it was a dropdown selection, it updates the
  relevant pageState.filters field) and then calls triggerSearch.

  triggerSearch always looks at the current pageState and starts
  the search requests based on that.

  The success handler of each of the search request updates anything
  it needs to in pageState, and updates the UI to reflect the response
  from the server.

  ajax requests should always cancel the relevant previous request
  if it's still in flight before being sent, and should always have
  an error handler giving some user feedback as well as technical
  information in the console to notice and understand errors.
/***************************************************************/

const baseLocation = "https://data.keepthereceipt.org.za/api/purchase_records/";

const facetPlurals = {
  government_label: "governments",
  sector: "sectors",
  department: "departments",
  status: "project statuses",
  primary_funding_source: "funding sources",
};


function urlFromSearchState() {
  var params = new URLSearchParams();
  params.set("q", $("#Infrastructure-Search-Input").val());

  for (let fieldName in pageState.filters) {
    params.append("filter", `${fieldName}:${pageState.filters[fieldName]}`);
  }

  // params.set("order_by", pageState.sortField);
  const queryString = params.toString();
  return `${window.location.protocol}//${window.location.host}${window.location.pathname}?${queryString}`;
}


function buildListSearchURL() {
  var params = new URLSearchParams();
  // params.set("ordering", pageState.sortField);
  params.set("limit", "20");
  return baseLocation + "?" + params.toString();
}

// const getNoResultsMessage = () => $("#result-list-container * .w-dyn-empty");



const fullTextNameToQueryField = {
  "Filter-by-supplier": "supplier_full_text",
  "Filter-by-director-name": "directors_full_text",
  "Filter-by-item-description": "description_full_text",
  "Filter-by-procurement-method": "procurement_method_full_text",
};

class DropdownOption {
  constructor(template, optionItem) {
    this.element = template.clone();
    this.element.find(".dropdown-link__text").text(optionItem.label);
    this.element.find(".facet-count").text(optionItem.count);
    if (optionItem.selected !== true) {
      this.element.find(".dropdown-link__check div").removeClass("fa fa-check");
    }
  }
}

class DropdownField {
  constructor(element, queryField) {
    this.element = element;
    this.queryField = queryField;
    this.submitCallbacks = [];
    this.optionTemplate = element.find(".dropdown-list__active").clone();
    this.optionTemplate.find(".dropdown-link__text").text("");
    this.optionTemplate.find(".dropdown-link__text + div").addClass("facet-count").text("");

    this.reset();
  }

  addSubmitCallback(callback) {
    this.submitCallbacks.push(callback);
  }

  updateOptions(options) {
    options.foreach(optionItem => {
      const option = new DropdownOption(optionItem);
      optionEl.find(".dropdown-list__inner").append(option.element);
    });
  }

  reset() {
    this.element.find(".dropdown-list__active").remove();
    this.element.find(".dropdown-list__links").remove();
  }
}

class FullTextSearchField {
  constructor(element, submitCallback) {
    this.element = element;
    this.submitCallbacks = [submitCallback];

    this.element.find(".search__bar").keypress(e => {
      const key = e.which;
      if (key == 13) {  // the enter key code
        e.preventDefault();
        this.submit();
      }
    });

    this.element.find(".search__add-filter").on("click", (e) => {
      e.preventDefault();
      this.submit();
    });
  }

  submit() {
    this.submitCallbacks.map(callback => callback(this));
  }
}

class PurchaseRecord {
  constructor(template, resultsItem) {
    this.element = template.clone();
    this.element.find(".row-title").text(resultsItem.supplier_name);
    this.element.find(".row-body").text(resultsItem.buyer_name);
    this.element.find(".row-body").text(resultsItem.amount_value_zar);

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
  }
}

class ResultsList {
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
          nextCallback();
        });
        $(".filtered-list").append(this.loadMoreButton);
      }
    } else {
      // getNoResultsMessage().show();
    }
  }

  reset() {
  }
}

class PageState {
  constructor() {
    this.listRequest = null;
    this.activeFiltersWrapper = $(".current-filters__wrap");
    this.noFilterChip = $(".no-filter");
    this.activeFilterChipTemplate = $(".current-filter").clone();
    this.activeFiltersWrapper.empty();
    this.numResultsContainer = $("#results-value strong");
    $(".filter__download").hide(); // for now
    this.resultsList = new ResultsList();
    window.addEventListener("popstate", this.handleHistoryPopstate);

    $(".search__input").each((i, el) => {
      const instance = new FullTextSearchField($(el), instance => this.triggerSearch());
    });

    this.facets = {
      buyerName: new DropdownField($("#filter-buyer-name"), "buyer_name"),
      facility: new DropdownField($("#filter-facility"), "implementation_location_facility"),
      districtMuni: new DropdownField($("#filter-district-muni"), "implementation_location_district_municipality"),
      localMuni: new DropdownField($("#filter-local-muni"), "implementation_location_local_municipality"),
      // other: new DropdownField($("#filter-facility"), "implementation_location_other"),
      province: new DropdownField($("#filter-province"), "implementation_location_province"),
      repository: new DropdownField($("#filter-data-repository"), "dataset_version__dataset__repository__name"),
      dataset: new DropdownField($("#filter-source-dataset"), "dataset_version__dataset__name"),
    };

    this.resetFacets();
    this.resultsList.reset();
    this.loadSearchStateFromCurrentURL();
    //this.initSortDropdown();
    this.triggerSearch(false);

  }

  updateFacetOptions(facets) {
    this.facets.buyerName.updateOptions(facets[this.facets.buyerName.queryField]);
    this.facets.facility.updateOptions(facets[this.facets.facility.queryField]);
    this.facets.districtMuni.updateOptions(facets[this.facets.districtMuni.queryField]);
    this.facets.localMuni.updateOptions(facets[this.facets.localMuni.queryField]);
    this.facets.province.updateOptions(facets[this.facets.province.queryField]);
    this.facets.repository.updateOptions(facets[this.facets.repository.queryField]);
    this.facets.dataset.updateOptions(facets[this.facets.dataset.queryField]);
  }
  resetFacets() {
    this.facets.buyerName.reset();
    this.facets.facility.reset();
    this.facets.districtMuni.reset();
    this.facets.localMuni.reset();
    this.facets.province.reset();
    this.facets.repository.reset();
    this.facets.dataset.reset();
  }

  resetResults() {
    this.numResultsContainer.text("...");

    // getNoResultsMessage().hide();
    if (this.loadMoreButton)
      this.loadMoreButton.remove();
  }

  updateSearch(url) {
    this.resetResults();

    if (this.listRequest !== null)
      this.listRequest.abort();

    this.listRequest = $.get(url)
      .done((response) => {
        this.populateDownloadCSVButton(response);
        this.numResultsContainer.text(`${response.results.length} of ${response.count}`);
        const nextCallback = response.next ? () => this.updateSearch(response.next) : null;
        this.resultsList.addResults(response.results, nextCallback);
        this.resetFacets();
        this.updateFacetOptions(response.meta.facets);
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        if (textStatus !== "abort") {
          alert("Something went wrong when searching. Please try again.");
          console.error( jqXHR, textStatus, errorThrown );
        }
      });
  }

  handleHistoryPopstate(event) {
    this.loadSearchStateFromCurrentURL();
    this.triggerSearch(false);
  }

  pushState() {
    window.history.pushState(null, "", urlFromSearchState());
  }

  loadSearchStateFromCurrentURL() {
    const queryString = window.location.search.substring(1);
    const params = new URLSearchParams(queryString);


    // const sortField = params.get("order_by");
    // pageState.sortField = sortField || "status_order";
  }

  triggerSearch(pushHistory = true) {
    if (pushHistory)
      this.pushState();

    this.updateSearch(buildListSearchURL());
  };

  populateDownloadCSVButton(response) {
    $("#search-results-download-button").attr("href", response.csv_download_url);
  }

}

function updateDropdown(selector, options, fieldName) {
  const container = $(selector);
  const trigger = container.find(".chart-dropdown_trigger");
  const optionContainer = container.find(".chart-dropdown_list");
  // Replace webflow tap handlers with our own for opening dropdown
  trigger.off("tap")
    .on("click", () => optionContainer.addClass("w--open"));

  const selectedOption = getSelectedOption(fieldName);
  const currentSelectionLabel = container.find(".text-block");

  if (typeof(selectedOption) == "undefined") {
    currentSelectionLabel.text("All " + facetPlurals[fieldName]);
  } else {
    currentSelectionLabel.text(selectedOption);
  }

  options.forEach(function (option) {
    const optionElement = pageState.dropdownItemTemplate.clone();
    optionElement.find(".search-dropdown_label").text(option.text);
    if (option.count) {
      optionElement.find(".search-dropdown_value").text("(" + option.count + ")");
    }
    optionElement.click(function(e) {
      e.preventDefault();
      pageState.filters[fieldName] = option.text;
      optionContainer.removeClass("w--open");
      triggerSearch();
    });
    optionContainer.append(optionElement);
  });
}

// function initSortDropdown() {
//   const selector = "#sort-order-dropdown";
//   const dropdownItemTemplate = $("#sort-order-dropdown * .dropdown-link--small:first");
//   dropdownItemTemplate.find(".sorting-status").remove();
//   dropdownItemTemplate.find(".dropdown-label").text("");
//   $(selector).find(".text-block").text("");
//   $(selector).find(".dropdown-link--small").remove();
//
//   var container = $(selector);
//   var optionContainer = container.find(".sorting-dropdown_list");
//
//   container.find(".text-block").text(sortOptions.get(pageState.sortField));
//
//   sortOptions.forEach((label, key) => {
//     const optionElement = dropdownItemTemplate.clone();
//     optionElement.find(".dropdown-label").text(label);
//     optionElement.click(function(e) {
//       e.preventDefault();
//       container.find(".text-block").text(label);
//       pageState.sortField = key;
//       optionContainer.removeClass("w--open");
//       triggerSearch();
//     });
//     optionContainer.append(optionElement);
//   });
// }


const pageState = new PageState();
