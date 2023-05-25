document.getElementById("ruc").addEventListener("input", obtenerDatosProveedor);


async function obtenerDatosProveedor() {
  const rucProveedor = document.getElementById("ruc").value;
  if (rucProveedor !== "") {
    const response = await fetch(`/api/proveedor?ruc=${rucProveedor}`);
    const data = await response.json();
    const idProveedor = data.idproveedor;
    const nombreEmpresa = data.nombre_empresa;
    const direccionProveedor = data.direccion;

    document.getElementById("idproveedor").value = idProveedor;
    document.getElementById("nombre_empresa").value = nombreEmpresa;
    document.getElementById("direccion").value = direccionProveedor;
  } else {
    document.getElementById("idproveedor").value = "";
    document.getElementById("nombre_empresa").value = "";
  }
  limpiarCampos();
}

function limpiarCampos() {
  document.getElementById("codigo_producto").value = "";
  document.getElementById("nombre_producto").value = "";
  document.getElementById("precioventa").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("total1").value = "";
  document.getElementById("cantidad_vendida1").value = "";
}
