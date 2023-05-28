const botoncliente = document.getElementById("buscarclienteapi");
// document.getElementById("dni").addEventListener("input", obtenerDatosCliente);

async function obtenerDatosCliente() {
  const rucProveedor = document.getElementById("ruc").value;
  const nombreInput = document.getElementById("razonsocial");

  if (rucProveedor.length === 11) {
    const apiUrl = `https://dniruc.apisperu.com/api/v1/ruc/${rucProveedor}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1hcmNvLmNhbGRlcm9uMTcwMUBob3RtYWlsLmNvbSJ9._G_OPWUN5ysie2m5euE6tzabcWVKOe2TpxJeyn2xWrs`;
    
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const nombreProveedor = data.razonSocial;

      nombreInput.value = nombreProveedor;
      console.log(data);
    } catch (error) {
      console.log("Error:", error);
    }
  } else {
    nombreInput.value = "";
  }
}

botoncliente.addEventListener('click', obtenerDatosCliente)
