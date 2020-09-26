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
  "#Filter-by-supplier": "supplier_full_text",
  "#Filter-by-director-name": "directors_full_text",
  "#Filter-by-item-description": "description_full_text",
  "#Filter-by-procurement-method": "procurement_method_full_text",
};

const facetFieldMapping = {
  "#filter-buyer-name": "buyer_name",
  "#filter-facility": "implementation_location_facility",
  "#filter-district-muni": "implementation_location_district_municipality",
  "#filter-local-muni": "implementation_location_local_municipality",
  "#filter-province": "implementation_location_province",
  "#filter-data-repository": "dataset_version__dataset__repository__name",
  "#filter-source-dataset": "dataset_version__dataset__name",
};

class PageState {
  constructor() {
    this.listRequest = null;

    this.numResultsContainer = $("#results-value strong");
    $(".filter__download").hide(); // for now
    this.resultsList = new ResultsList();
    window.addEventListener("popstate", this.handleHistoryPopstate);

    this.filterChips = new FilterChips(
      $(".current-filters__wrap"),
      $(".no-filter").clone(),
      $(".current-filter").clone()
    );

    this.fullTextFields = {};
    for (let selector in fullTextFieldMapping) {
      const queryField = fullTextFieldMapping[selector];
      const field = new FullTextSearchField(
        $(selector).parents(".search__input"),
        queryField
      );
      this.fullTextFields[queryField] = field;
      field.addAddFilterHandler(this.addFilter.bind(this));
    };

    this.facetFields = {};
    for (let selector in facetFieldMapping) {
      const queryField = facetFieldMapping[selector];
      const field = new DropdownField($(selector), queryField);
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
    // getNoResultsMessage().hide();
  }

  fetchAndDisplay(url) {
    if (this.listRequest !== null)
      this.listRequest.abort();

    this.listRequest = $.get(url)
      .done((response) => {
        this.populateDownloadCSVButton(response);
        this.numResultsContainer.text(`${response.results.length} of ${response.count}`);
        const nextCallback = response.next ? () => this.fetchAndDisplay(response.next) : null;
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
    return baseLocation + "?" + this.urlSearchParams.toString();
  }

  triggerSearch(pushHistory = true) {
    if (pushHistory)
      this.pushState();

    this.resetResults();
    this.fetchAndDisplay(this.buildListSearchURL());
  };

  populateDownloadCSVButton(response) {
    $("#search-results-download-button").attr("href", response.csv_download_url);
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
