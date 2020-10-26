exports.transform = function(window, $) {
  // Adding a script tag to body via jQuery seems to add it to head as well


  addScriptToBody(window, {src: "https://pym.nprapps.org/pym.v1.min.js"});
  addScriptToBody(window, {src: "js/index.js"});
};

function addScriptToBody(window, attrs, text) {
  // Adding a script tag to body via jQuery seems to add it to head as well
  const tag = window.document.createElement("script");
  for (let name in attrs)
    tag.setAttribute(name, attrs[name]);
  if (text)
    tag.appendChild(window.document.createTextNode(text));

  window.document.body.appendChild(tag);
  window.document.body.appendChild(window.document.createTextNode("\n"));
}
