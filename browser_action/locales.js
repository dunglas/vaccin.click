var doc=window.top.document

if(doc != null) {
  console.log("starting setting text based on language");

  document.getElementById("stop").textContent = browser.i18n.getMessage("button_stop") ;
  document.getElementById("start").textContent = browser.i18n.getMessage("button_start") ;
  document.getElementById("disableAutoBook_label").textContent = browser.i18n.getMessage("radio_disableAutoBook_label") ;

}
