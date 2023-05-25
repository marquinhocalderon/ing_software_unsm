document.getElementById("dni").addEventListener("input", obtenerDatosCliente);

async function obtenerDatosCliente() {
  const dniCliente = document.getElementById("dni").value;
  if (dniCliente !== "") {
    const response = await fetch(`/api/cliente?dni=${dniCliente}`);
    const data = await response.json();
    const idCliente = data.idcliente; // Asumiendo que el campo se llama "idcliente" en la tabla de clientes
    const nombreCliente = data.nombre_cliente; // Asumiendo que el campo se llama "nombre_cliente" en la tabla de clientes

    document.getElementById("idCliente").value = idCliente;
    document.getElementById(
      "nombreCliente"
    ).textContent = `Nombre: ${nombreCliente}`;
  } else {
    document.getElementById("idCliente").textContent = "";
    document.getElementById("nombreCliente").textContent = "";
  }
}

document
  .getElementById("idusuario")
  .addEventListener("input", obtenerDatosUsuario);

async function obtenerDatosUsuario() {
  const idUsuario = document.getElementById("idusuario").value;
  if (idUsuario !== "") {
    // Aquí puedes realizar una consulta adicional a la base de datos para obtener los datos del usuario según su ID
    // Por ejemplo:
    const response = await fetch(`/api/usuario?id=${idUsuario}`);
    const data = await response.json();
    const nombreUsuario = data.nombre; // Asumiendo que el campo se llama "nombre_usuario" en la tabla de usuarios

    document.getElementById(
      "nombreUsuario"
    ).textContent = `Usuario: ${nombreUsuario}`;
  } else {
    document.getElementById("nombreUsuario").textContent = "";
  }
}
document
  .getElementById("codigo_producto")
  .addEventListener("input", obtenerDatosProducto);
document
  .getElementById("cantidad_vendida1")
  .addEventListener("input", calcularTotal);

async function obtenerDatosProducto() {
  const codigoProducto = document.getElementById("codigo_producto").value;
  if (codigoProducto !== "") {
    // Realizar una consulta al servidor para obtener los datos del producto según su código
    const response = await fetch(
      `/api/producto?codigo_producto=${codigoProducto}`
    );
    const data = await response.json();

    // Obtener los valores necesarios del objeto de datos
    const nombreProducto = data.nombre_producto;
    const precioVenta = parseFloat(data.precioventa);
    const cantidad = parseInt(data.cantidad);
    const idproducto = data.idproducto;

    // Asignar los valores a los campos correspondientes
    document.getElementById("idproducto").value = idproducto;
    document.getElementById("nombre_producto").value = nombreProducto;
    document.getElementById("stock").value = cantidad;
    document.getElementById("precioventa").value = precioVenta;
  } else {
    limpiarCampos();
  }
}

function calcularTotal() {
  const precioVenta = parseFloat(document.getElementById("precioventa").value);
  const cantidadVendida = parseInt(
    document.getElementById("cantidad_vendida1").value
  );

  if (!isNaN(precioVenta) && !isNaN(cantidadVendida)) {
    const total = precioVenta * cantidadVendida;
    document.getElementById("total1").value = total;
  } else {
    document.getElementById("total1").value = "";
  }
}

function limpiarCampos() {
  ocument.getElementById("codigo_producto").value = "";
  document.getElementById("nombre_producto").value = "";
  document.getElementById("precioventa").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("total1").value = "";
  document.getElementById("cantidad_vendida1").value = "";
}
