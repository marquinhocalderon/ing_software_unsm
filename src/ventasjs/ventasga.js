function agregarProducto() {
  let tabla = document
    .getElementById("tablaProductos")
    .getElementsByTagName("tbody")[0];

  let fila = document.createElement("tr");

  let celdaCodigoProducto = document.createElement("td");
  let inputCodigoProducto = document.createElement("input");
  inputCodigoProducto.type = "text";
  inputCodigoProducto.classList.add("codigo_producto");
  inputCodigoProducto.name = "codigo_producto[]";
  inputCodigoProducto.required = true;
  celdaCodigoProducto.appendChild(inputCodigoProducto);

  let celdaProducto = document.createElement("td");
  let inputProducto = document.createElement("input");
  inputProducto.type = "text";
  inputProducto.classList.add("producto");
  inputProducto.name = "producto[]";
  inputProducto.required = true;
  celdaProducto.appendChild(inputProducto);

  let celdaCantidad = document.createElement("td");
  let inputCantidad = document.createElement("input");
  inputCantidad.type = "number";
  inputCantidad.classList.add("cantidad");
  inputCantidad.name = "cantidad[]";
  inputCantidad.required = true;
  celdaCantidad.appendChild(inputCantidad);

  let celdaTotal = document.createElement("td");
  let inputTotal = document.createElement("input");
  inputTotal.type = "number";
  inputTotal.classList.add("total");
  inputTotal.name = "total[]";
  inputTotal.required = true;
  inputTotal.addEventListener("input", calcularTotalGeneral); // Agregar evento de escucha para calcular el total al cambiar el valor
  celdaTotal.appendChild(inputTotal);
  let celdaEliminar = document.createElement("td");
  let botonEliminar = document.createElement("button");
  botonEliminar.type = "button";
  botonEliminar.textContent = "Eliminar";
  botonEliminar.addEventListener("click", function () {
    eliminarFila(this);
  });
  celdaEliminar.appendChild(botonEliminar);

  fila.appendChild(celdaProducto);
  fila.appendChild(celdaCodigoProducto); // Agregar la nueva celda "celdaCodigoProducto"
  fila.appendChild(celdaCantidad);
  fila.appendChild(celdaTotal);
  fila.appendChild(celdaEliminar);

  tabla.appendChild(fila);
  calcularTotalGeneral();
}

function eliminarFila(elemento) {
  let fila = elemento.parentNode.parentNode;
  let totalFila = parseInt(fila.querySelector('input[name="total[]"]').value);
  totalGeneral -= totalFila;
  fila.parentNode.removeChild(fila);
  calcularTotalGeneral();
}

function calcularTotalGeneral() {
  let filas = document.querySelectorAll("#tablaProductos tbody tr");
  totalGeneral = 0;

  for (let i = 0; i < filas.length; i++) {
    let totalFila = parseFloat(
      filas[i].querySelector('input[name="total[]"]').value
    );
    totalGeneral += isNaN(totalFila) ? 0 : totalFila;
  }

  let inputTotalVenta = document.getElementById("total_venta");
  inputTotalVenta.value = isNaN(totalGeneral) ? "" : totalGeneral.toFixed(2);
}
