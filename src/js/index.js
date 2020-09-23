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


const pageState = {
  filters: null,
  // sortField: null,
  listRequest: null,
  resultRowTemplate: null,
  dropdownItemTemplate: null,
};

const baseLocation = "https://data.keepthereceipt.org.za/api/purchase_records";

const facetPlurals = {
  government_label: "governments",
  sector: "sectors",
  department: "departments",
  status: "project statuses",
  primary_funding_source: "funding sources",
};

function onPopstate(event) {
  loadSearchStateFromCurrentURL();
  triggerSearch(false);
}

function pushState() {
  window.history.pushState(null, "", urlFromSearchState());
}

function loadSearchStateFromCurrentURL() {
  const queryString = window.location.search.substring(1);
  const params = new URLSearchParams(queryString);

  const textQuery = params.get("q");
  if (textQuery)
    $("#Infrastructure-Search-Input").val(textQuery);

  const filterParams = params.getAll("filter");
  pageState.filters = {};
  filterParams.forEach(param => {
    const pieces = param.split(/:/);
    const key = pieces.shift();
    const val = pieces.join(':');
    pageState.filters[key] = val;
  });

  // const sortField = params.get("order_by");
  // pageState.sortField = sortField || "status_order";
}

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

function clearFilters() {
  pageState.filters = {};
  $("#Infrastructure-Search-Input").val("");
  triggerSearch();
}


function buildListSearchURL() {
  var params = new URLSearchParams();
  params.set("q", $("#Infrastructure-Search-Input").val());
  for (let fieldName in pageState.filters) {
    params.set(fieldName, pageState.filters[fieldName]);
  }
  params.set("fields", "url_path,name,status,estimated_completion_date");
  // params.set("ordering", pageState.sortField);
  params.set("limit", "20");
  return baseLocation + "?" + params.toString();
}

function updateResultList(url) {
  if (pageState.listRequest !== null)
    pageState.listRequest.abort();
  pageState.listRequest = $.get(url)
    .done(function(response) {
      populateDownloadCSVButton(response);
      addListResults(response);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      if (textStatus !== "abort") {
        alert("Something went wrong when searching. Please try again.");
        console.error( jqXHR, textStatus, errorThrown );
      }
    });
}

// const getNoResultsMessage = () => $("#result-list-container * .w-dyn-empty");
const getLoadMoreResultsButton = () => $(".load-more");
const getAllResultListItems = () => $("#result-list-container .narrow-card_wrapper");
const getNumResultsContainer = () => $("#results-value");

function resetFacets() {
  getNumResultsContainer().text("...");
  resetDropdown("#government-dropdown");
  resetDropdown("#department-dropdown");
  resetDropdown("#sector-dropdown");
  resetDropdown("#status-dropdown");
  resetDropdown("#primary-funding-source-dropdown");
}

function resetResultList() {
  getAllResultListItems().remove();
  // getNoResultsMessage().hide();
  getLoadMoreResultsButton()
    .hide()
    .off("click");
}

function triggerSearch(pushHistory = true) {
  if (pushHistory)
    pushState();

  resetResultList();
  response = updateResultList(buildListSearchURL());
  resetFacets();
  showFacetResults(response);
};

function populateDownloadCSVButton(response) {
  $("#search-results-download-button").attr("href", response.csv_download_url);
}

function addListResults(response) {
  if (response.results.length) {
    // getNoResultsMessage().hide();
    response.results.forEach(function(project) {
      var resultItem = pageState.resultRowTemplate.clone();
      resultItem.attr("href", project.url_path);
      resultItem.find(".narrow-card_title").text(project.name);
      resultItem.find(".narrow-card_middle-column:first").text(project.status);
      resultItem.find(".narrow-card_middle-column:last").text(project.estimated_completion_date);
      resultItem.find(".narrow-card_last-column").remove();
      $("#result-list-container").append(resultItem);
    });

    if (response.next) {
      const nextButton = getLoadMoreResultsButton();
      nextButton.off("click");
      nextButton.on("click", (e) => {
        e.preventDefault();
        updateResultList(response.next);
      });
      nextButton.show();
    }
  } else {
    // getNoResultsMessage().show();
  }
}

function showFacetResults(response) {
  getNumResultsContainer.text(response.objects.count);
  updateDropdown("#government-dropdown", response.fields["government_label"], "government_label");
  updateDropdown("#department-dropdown", response.fields["department"], "department");
  updateDropdown("#sector-dropdown", response.fields["sector"], "sector");
  updateDropdown("#primary-funding-source-dropdown", response.fields["primary_funding_source"], "primary_funding_source");

  // const statusOptions = sortByOrderArray(statusOrder, "text", response.fields["status"]);
  updateDropdown("#status-dropdown", statusOptions, "status");
}

function resetDropdown(selector) {
  $(selector).find(".text-block").text("");
  $(selector).find(".dropdown-link").remove();
}

function getSelectedOption(fieldName) {
  return pageState.filters[fieldName];
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

  // Add "clear filter" option
  const optionElement = pageState.dropdownItemTemplate.clone();
  optionElement.find(".search-dropdown_label").text("All " + facetPlurals[fieldName]);
  optionElement.click(function(e) {
    e.preventDefault();
    delete pageState.filters[fieldName];
    optionContainer.removeClass("w--open");
    triggerSearch();
  });
  optionContainer.append(optionElement);

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


function searchPage(pageData) {

  /** Get templates of dynamically inserted elements **/

  const rows = $(".row-dropdown");
  pageState.resultRowTemplate = $(".row-dropdown").clone();
  rows.remove();

  pageState.dropdownItemTemplate = $(".dropdown-list__active").clone();
  $(".dropdown-list__active").remove();
  $(".dropdown-list__links").remove();
  pageState.dropdownItemTemplate.find(".dropdown-link__text").text("");
  pageState.dropdownItemTemplate.find(".dropdown-link__text + div").addClass("facet-count").text("");
  pageState.activeFiltersWrapper = $(".current-filters__wrap");
  pageState.noFilterChip = $(".no-filter");
  pageState.activeFilterChipTemplate = $(".current-filter").clone();
  pageState.activeFiltersWrapper.empty();

  /** initialise stuff **/


  /** Set up search triggering events **/

  $(".search__bar").keypress(function (e) {
    var key = e.which;
    if (key == 13) {  // the enter key code
      triggerSearch();
    }
  });
  $(".search__add-filter").on("click", (e) => {
    e.preventDefault();
    triggerSearch();
  });
  window.addEventListener("popstate", onPopstate);

  /**
   * Search on page load
   *
   * Ordering may be important based on setting up and depending on pageState.
   */


  resetFacets();
  resetResultList();
  loadSearchStateFromCurrentURL();
  //initSortDropdown();
  triggerSearch(false);

} // end search page

searchPage();
console.log("heere2")
