function handleMessage(event) {
  //TODO call back to global page
  window.open("http://www.google.com", "Black", "titlebar=0");
}

safari.self.addEventListener("message",  handleMessage, false);
 