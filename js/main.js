/* Utils to program faster and reduce code length */
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);
const ael = (element, callback, evnt="click") => {
  element.addEventListener(evnt, e => {
    callback(e);
  });
}
const mode = alert;
const _ = text => {
  mode(`[DEBUG] ${text}`);
}
/* End utils */

const app = $("#app");

/* Await code */
/*
(async () => {

})();
*/
/* End Await */
