function newContent(){
  alert("load new content");
  document.write("<h1>Out with the old - in with the new!</h1>");
}
document.onload = (function(){
  setTimeout(newContent, 1000);
}());