// DOM Selector Function.
function DOM(el) {
    return document.querySelector(el);
};

//VARIABLES.
let dark_mode = localStorage.getItem("darkmode"),
    theme_toggler = DOM(".toggle-theme");



