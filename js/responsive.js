// responsive.js
// Makes every D3 chart on the dashboard scale to fit its card, so the layout
// adapts to laptops, desktops and phones without each chart being rewritten.
//
// How it works: the charts draw fixed-size SVGs (e.g. width="460" height="310").
// A fixed-size SVG cannot shrink with its container. This script converts each
// SVG into a fluid one by giving it a `viewBox` (which preserves the internal
// coordinate system) and setting width:100% / height:auto. A MutationObserver
// watches the page so charts that are drawn asynchronously OR re-rendered on
// filter changes are converted automatically too.

(function () {
    "use strict";

    function makeFluid(svg) {
        if (!svg || svg.__fluid) return;
        var w = svg.getAttribute("width");
        var h = svg.getAttribute("height");
        // Only convert charts that were sized with explicit width/height.
        if (!w || !h) return;

        if (!svg.getAttribute("viewBox")) {
            svg.setAttribute("viewBox", "0 0 " + parseFloat(w) + " " + parseFloat(h));
        }
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.width = "100%";
        svg.style.height = "auto";
        svg.style.display = "block";
        svg.__fluid = true;
    }

    function sweep(root) {
        (root || document).querySelectorAll("svg").forEach(makeFluid);
    }

    // Convert anything already on the page.
    if (document.readyState !== "loading") sweep(document);
    else document.addEventListener("DOMContentLoaded", function () { sweep(document); });

    // Convert SVGs added later (async first render + re-renders on filter change).
    var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var nodes = mutations[i].addedNodes;
            for (var j = 0; j < nodes.length; j++) {
                var n = nodes[j];
                if (n.nodeType !== 1) continue;
                if (n.tagName && n.tagName.toLowerCase() === "svg") {
                    makeFluid(n);
                } else if (n.querySelectorAll) {
                    n.querySelectorAll("svg").forEach(makeFluid);
                }
            }
        }
    });

    function startObserving() {
        if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    }
    if (document.body) startObserving();
    else document.addEventListener("DOMContentLoaded", startObserving);

    // Exposed so the inline script can force a sweep after all charts render.
    window.makeResponsive = function () { sweep(document); };
})();
