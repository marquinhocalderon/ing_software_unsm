

let productos = [];


function agregarProducto() {
  const codigoProducto = document.getElementById("codigo_producto").value;
  const nombreProducto = document.getElementById("nombre_producto").value;
  const stock = document.getElementById("stock").value;
  const precioVenta = document.getElementById("precioventa").value;
  const cantidadVendida = document.getElementById("cantidad_vendida1").value;
  const total = document.getElementById("total1").value;
  const idProducto = document.getElementById("idproducto").value;

  const producto = {
    idproducto: idProducto,
    codigo: codigoProducto,
    nombre: nombreProducto,
    stock: stock,
    precioVenta: precioVenta,
    cantidadVendida: cantidadVendida,
    total: total
  };

  console.log(productos)
  
  productos.push(producto);



  actualizarTablaProductos();

  calcularTotalVenta();

  limpiarCampos();
  const inputElement = document.getElementById('productoInput');

  // Asignar el valor del objeto producto al input
  inputElement.value = JSON.stringify(productos);
}

function actualizarTablaProductos() {
  const tablaProductos = document.getElementById("productos-body");

  tablaProductos.innerHTML = "";

  for (let i = 0; i < productos.length; i++) {
    const producto = productos[i];

    const nuevaFila = document.createElement("tr");

    const codigoProductoCelda = document.createElement("td");
    codigoProductoCelda.textContent = producto.codigo;

    const nombreProductoCelda = document.createElement("td");
    nombreProductoCelda.textContent = producto.nombre;

    const stockCelda = document.createElement("td");
    stockCelda.textContent = producto.stock;

    const precioVentaCelda = document.createElement("td");
    precioVentaCelda.textContent = producto.precioVenta;

    const cantidadVendidaCelda = document.createElement("td");
    cantidadVendidaCelda.textContent = producto.cantidadVendida;

    const totalCelda = document.createElement("td");
    totalCelda.textContent = producto.total;

    const eliminarCelda = document.createElement("td");
    const eliminarBoton = document.createElement("button");
    eliminarBoton.textContent = "Eliminar";
    eliminarBoton.onclick = function() {
      eliminarProducto(i);
    };
    eliminarCelda.appendChild(eliminarBoton);

    nuevaFila.appendChild(codigoProductoCelda);
    nuevaFila.appendChild(nombreProductoCelda);
    nuevaFila.appendChild(stockCelda);
    nuevaFila.appendChild(precioVentaCelda);
    nuevaFila.appendChild(cantidadVendidaCelda);
    nuevaFila.appendChild(totalCelda);
    nuevaFila.appendChild(eliminarCelda);

    tablaProductos.appendChild(nuevaFila);
  }
}

function calcularTotalVenta() {
  let totalVenta = 0;

  for (let i = 0; i < productos.length; i++) {
    const producto = productos[i];
    totalVenta += parseFloat(producto.total);
  }

  document.getElementById("total_venta").value = totalVenta.toFixed(2);
}

function limpiarCampos() {
  document.getElementById("codigo_producto").value = "";
  document.getElementById("nombre_producto").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("precioventa").value = "";
  document.getElementById("cantidad_vendida1").value = "";
  document.getElementById("total1").value = "";
  document.getElementById("idproducto").value = "";
}

function eliminarProducto(index) {
  productos.splice(index, 1);
  actualizarTablaProductos();
  calcularTotalVenta();
}






