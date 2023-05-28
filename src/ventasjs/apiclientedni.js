const botoncliente1 = document.getElementById("buscar1");
// document.getElementById("dni").addEventListener("input", obtenerDatosCliente);

async function obtenerDatosCliente() {
  const dniCliente = document.getElementById("dni").value;
  const nombreInput = document.getElementById("nombre");

  if (dniCliente.length === 8 ) {
    const apiUrl = `https://dniruc.apisperu.com/api/v1/dni/${dniCliente}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1hcmNvLmNhbGRlcm9uMTcwMUBob3RtYWlsLmNvbSJ9._G_OPWUN5ysie2m5euE6tzabcWVKOe2TpxJeyn2xWrs`;
    
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const nombre = data.nombres;
      const apellidoPaterno = data.apellidoPaterno;
      const apellidoMaterno = data.apellidoMaterno;

      nombreInput.value = nombre + " " + apellidoPaterno + " " + apellidoMaterno;
      console.log(data);
    } catch (error) {
      console.log("Error:", error);
    }
  } else if(dniCliente.length !==8) {
    nombreInput.value = "";
  }
}

botoncliente1.addEventListener('click', obtenerDatosCliente)
