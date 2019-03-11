window.console = window.console || { log: function() {} };
if (typeof console === "undefined") {
  console = {};
  console.log = function() {};
}

/* Find the json file names in the /json directory. */
$(document).ready(function() {
  $("#metadata").hide();
  // If user is on IE then display error message
  if (detectIE()) {
    var errorMessage = document.getElementById("landing-desc");
    errorMessage.innerHTML =
      "<br /><br /><br /><h3>Please Note</h3><p>The StoreOnce REST API is best displayed on Microsoft Edge, Google Chrome or Mozilla Firefox.</p>";
  } else {
    $(function() {
      $("#landing-desc").load("static/landing-info.html");
    });
  }

  $.getJSON("versions.json", function(item) {
    $.each(item, function(key, val) {
      var isLastIteration = key == item.length - 1;
      var apiVersion = val.name;
      // Add button for each API version
      var buttons = $(
        "<a id=" + apiVersion + ">" + apiVersion + "</a>"
      ).addClass("apiVersion");
      buttons.appendTo("#myDropdown");

      document.body.addEventListener("click", function(event) {
        var target = event.target || event.srcElement;
        if (target.id == apiVersion) {
          getAPI(apiVersion);
        }
      });
      // Update latest version on landing page
      if (isLastIteration) {
        $("#apiVersion").text(apiVersion);
        getAPI(apiVersion);
      }
    });
  });
});

/* Takes the API version and displays contents of that repo */
function getAPI(apiVersion) {
  // Update title
  $("#selectedAPI").text(apiVersion);
  // Remove current items
  $(".ui-menu-item").remove();
  // Update for current API
  $.getJSON("./versions/" + apiVersion + "/specifications.json", function(
    item
  ) {
    $.each(item, function(key, val) {
      $.getJSON(val.path, function(json) {
        var jsonTitle = json.info.title;
        // Using local storage to allow for file changing (x-isPrivate)
        localStorage.setItem(jsonTitle, JSON.stringify(json));
        var stringJSON = localStorage.getItem(jsonTitle);
        var parsedJSON = removeIsPrivate(JSON.parse(stringJSON));

        // Create list elements
        var navList = $("ul.navList");
        var li = $("<li/>")
          .addClass("ui-menu-item")
          .attr("role", "menuitem")
          .appendTo(navList);
        // Creating <a> links to each json file
        jQuery("<a/>", {
          href: jsonTitle,
          class: "ui-all",
          id: val.name,
          text: jsonTitle
        }).appendTo(li);
        // Adding an event listener to add link to new page.
        document.body.addEventListener("click", function(event) {
          var target = event.target || event.srcElement;
          if (target.id == val.name) {
            event.preventDefault();
            loadPage(parsedJSON);
          }
        });
      });
    });
  });
}

/* Sort list as each file is loaded */
$(document).ajaxComplete(function() {
  sortList();
});

/* Sorts HTML list elements */
function sortList() {
  var list, i, switching, b, shouldSwitch;
  list = document.getElementById("list");
  switching = true;
  while (switching) {
    switching = false;
    b = list.getElementsByTagName("LI");
    for (i = 0; i < b.length - 1; i++) {
      shouldSwitch = false;
      if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      b[i].parentNode.insertBefore(b[i + 1], b[i]);
      switching = true;
    }
  }
}

/* Uses SwaggerUIBundle to render the JSON into HTML */
function loadPage(url) {
  $("#landing-desc").hide();
  window.scrollTo(0, 0);
  try {
    const ui = SwaggerUIBundle({
      spec: url,
      dom_id: "#swagger-ui",
      presets: [
        SwaggerUIBundle.presets.apis,
        // yay ES6 modules ↘
        Array.isArray(SwaggerUIHpeViewitPreset)
          ? SwaggerUIHpeViewitPreset
          : SwaggerUIHpeViewitPreset.default
      ],
      plugins: [SwaggerUIBundle.plugins.DownloadUrl],
      layout: "HpeViewitLayout"
    });

    window.ui = ui;
  } catch (err) {}
  clearSearch();
}

/* API version dropdown */
function dropdown() {
  document.getElementById("myDropdown").classList.toggle("show");
}

/* Searches <a> tags inside of nav bar */
function filterFunction() {
  var input, filter, ul, li, a, i;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  div = document.getElementById("sidebar-content");
  a = div.getElementsByTagName("a");
  for (i = 0; i < a.length; i++) {
    if (a[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
}

/* Clears the search bar */
function clearSearch() {
  document.getElementById("myInput").value = "";
  filterFunction();
}

/* Refresh the landing page */
function goHome() {
  location.reload();
}

/* Hiding any endpoints with "x-isPrivate" flag */
function removeIsPrivate(specification) {
  for (path in specification.paths) {
    for (method in specification.paths[path]) {
      if (specification.paths[path][method]["x-isPrivate"] == "true") {
        delete specification.paths[path][method];
        break;
      }
    }
    delete specification.info.version;
    return specification;
  }
}

/* Detect if browser is Internet Explorer for skips */
function detectIE() {
  var ua = window.navigator.userAgent;

  var msie = ua.indexOf("MSIE ");
  if (msie > 0) {
    // IE 10 or older => return version number
    console.error("Internet Explorer is not supported by this site.");
    return true;
  }

  var trident = ua.indexOf("Trident/");
  if (trident > 0) {
    // IE 11 => return version number
    console.error("Internet Explorer is not supported by this site.");
    var rv = ua.indexOf("rv:");
    return true;
  }

  var edge = ua.indexOf("Edge/");
  if (edge > 0) {
    // Edge (IE 12+) => return version number
    return false;
  }

  // other browser
  return false;
}
