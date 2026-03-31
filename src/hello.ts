/// <reference path="./ae.d.ts" />

const comp = app.project.activeItem;

if (!(comp instanceof CompItem)) {
  alert("Please select an active composition.");
} else {
  alert("Active comp: " + comp.name + " (" + comp.width + "x" + comp.height + ")");
}
