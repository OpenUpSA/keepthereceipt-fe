/**************************************************************
  ajax requests should always cancel the relevant previous request
  if it's still in flight before being sent, and should always have
  an error handler giving some user feedback as well as technical
  information in the console to notice and understand errors.
/***************************************************************/

import {SingleDeleteURLSearchParams as URLSearchParams} from './url-search-params.js';
import {DropdownField} from './components/dropdown.js';
import {FullTextSearchField} from './components/text-field.js';
import {ResultsList} from './components/results-list.js';
import {FilterChips} from './components/filter-chips.js';

const baseLocation = "https://data.keepthereceipt.org.za/api/purchase_records/";

// const getNoResultsMessage = () => $("#result-list-container * .w-dyn-empty");

const fullTextFieldMapping = {
  "#Filter-by-supplier": {queryField: "supplier_full_text", label: "Supplier"},
  "#Filter-by-director-name": {
    queryField: "directors_full_text",
    label: "Director names"
  },
  "#Filter-by-item-description": {
    queryField: "description_full_text",
    label: "Description"
  },
  "#Filter-by-procurement-method": {
    queryField: "procurement_method_full_text",
    label: "Procurement method"
  },
};

const facetFieldMapping = {
  "#filter-buyer-name": {queryField: "buyer_name", label: "Buyer name"},
  "#filter-facility": {
    queryField: "implementation_location_facility",
    label: "Facility"
  },
  "#filter-district-muni": {
    queryField: "implementation_location_district_municipality",
    label: "District Municipality"
  },
  "#filter-local-muni": {
    queryField: "implementation_location_local_municipality",
    label: "Local Municipality"
  },
  "#filter-province": {
    queryField: "implementation_location_province",
    label: "Province"
  },
  "#filter-data-repository": {
    queryField: "dataset_version__dataset__repository__name",
    label: "Repository"
  },
  "#filter-source-dataset": {
    queryField: "dataset_version__dataset__name",
    label: "Dataset"
  },
};

class PageState {
  constructor() {
    $(".site-description").text("Explore the goods and services \
ordered by national and provincial departments and public entities \
in response to COVID-19.\n\nThe IMF recommended that governments do whatever \
it takes to respond to COVID-19, but to keep the receipts.");
    this.listRequest = null;

    this.numResultsContainer = $("#results-value strong");
    this.downloadButton = $(".filter__download");
    $(".filter__sorting").hide(); // for now
    $(".header-icon").hide(); // for now
    this.resultsList = new ResultsList();
    window.addEventListener("popstate", this.handleHistoryPopstate.bind(this));

    this.filterChips = new FilterChips(
      $(".current-filters__wrap"),
      $(".no-filter").clone(),
      $(".current-filter").clone()
    );

    this.fullTextFields = {};
    for (let selector in fullTextFieldMapping) {
      const mapping = fullTextFieldMapping[selector];
      const queryField = mapping.queryField;
      const label = mapping.label;
      const field = new FullTextSearchField(
        $(selector).parents(".search__input"),
        label,
        queryField
      );
      this.fullTextFields[queryField] = field;
      field.addAddFilterHandler(this.addFilter.bind(this));
    };

    this.facetFields = {};
    for (let selector in facetFieldMapping) {
      const mapping = facetFieldMapping[selector];
      const queryField = mapping.queryField;
      const label = mapping.label;
      const field = new DropdownField($(selector), label, queryField);
      this.facetFields[queryField] = field;
      this.facetFields[queryField].addAddFilterHandler(this.addFilter.bind(this));
      this.facetFields[queryField].addRemoveFilterHandler(this.removeFilter.bind(this));
    }

    this.resetFacets();
    this.resultsList.reset();
    this.loadSearchStateFromCurrentURL();
    //this.initSortDropdown();
    this.triggerSearch(false);
  }

  addFilter(querystringField, value) {
    this.urlSearchParams.append(querystringField, value);
    this.triggerSearch(true);
  }
  removeFilter(querystringField, value) {
    this.urlSearchParams.deleteMatching(querystringField, value);
    this.triggerSearch(true);
  }

  updateFilterChips() {
    this.filterChips.reset();
    for (let queryField in this.fullTextFields) {
      const field = this.fullTextFields[queryField];
      const filters = this.urlSearchParams.getAll(queryField);
      filters.forEach(value => {
        this.filterChips.add(field.label, queryField, value, this.removeFilter.bind(this));
      });
    }

    for (let queryField in this.facetFields) {
      const field = this.facetFields[queryField];
      const filters = this.urlSearchParams.getAll(queryField);
      filters.forEach(value => {
        this.filterChips.add(field.label, queryField, value, this.removeFilter.bind(this));
      });
    }
  }

  updateFacetOptions(facets) {
    for (let queryField in this.facetFields) {
      this.facetFields[queryField].updateOptions(facets[queryField]);
    }
  }

  resetFacets() {
    for (let queryField in this.facetFields) {
      this.facetFields[queryField].reset();
    }
  }

  resetResults() {
    this.numResultsContainer.text("...");
    this.resultsList.reset();
    this.downloadButton.hide();
    // getNoResultsMessage().hide();
  }

  fetchAndDisplay(url) {
    if (this.listRequest !== null)
      this.listRequest.abort();

    this.resultsList.startLoading();

    this.listRequest = $.get(url)
      .done((response) => {
        this.populateDownloadButton(response.meta.xlsx_url);
        this.numResultsContainer.text(`${response.count} records`);
        const nextCallback = response.next ? () => this.fetchAndDisplay(response.next) : null;
        this.resultsList.stopLoading();
        this.resultsList.addResults(response.results, nextCallback);
        this.resetFacets();
        this.updateFacetOptions(response.meta.facets);
        this.updateFilterChips();
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
    window.history.pushState(null, "", this.pageUrl());
  }

  loadSearchStateFromCurrentURL() {
    const queryString = window.location.search.substring(1);
    this.urlSearchParams = new URLSearchParams(queryString);

    // const sortField = params.get("order_by");
    // pageState.sortField = sortField || "status_order";
  }

  pageUrl() {
    const queryString = this.urlSearchParams.toString();
    return `${window.location.protocol}//${window.location.host}${window.location.pathname}?${queryString}`;
  }

  buildListSearchURL() {
    const baseURL = this.urlSearchParams.get("apiURL") || baseLocation;
    return baseURL + "?" + this.urlSearchParams.toString();
  }

  triggerSearch(pushHistory = true) {
    if (pushHistory)
      this.pushState();

    this.resetResults();
    this.fetchAndDisplay(this.buildListSearchURL());
  };

  populateDownloadButton(xlsx_url) {
    this.downloadButton.attr("href", xlsx_url);
    this.downloadButton.show();
  }

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
