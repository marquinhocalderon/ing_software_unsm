const botoncliente1 = document.getElementById("botonapi");
// document.getElementById("dni").addEventListener("input", obtenerDatosCliente);

async function obtenerDatosCliente() {
  const dniCliente = document.getElementById("dni").value;
  const rucProveedor = document.getElementById("ruc").value;
  const razonSocial = document.getElementById("razonsocial");
  const nombreInput = document.getElementById("nombre_cliente");

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

  if (rucProveedor.length === 11) {
    const apiUrl = `https://dniruc.apisperu.com/api/v1/ruc/${rucProveedor}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1hcmNvLmNhbGRlcm9uMTcwMUBob3RtYWlsLmNvbSJ9._G_OPWUN5ysie2m5euE6tzabcWVKOe2TpxJeyn2xWrs`;
    
    try {
      const response1 = await fetch(apiUrl);
      const data1 = await response1.json();
      const nombreProveedor = data1.razonSocial;

      razonSocial.value = nombreProveedor;
      console.log(data);
    } catch (error) {
      console.log("Error:", error);
    }
  } else if (rucProveedor.length !==11){
    razonSocial.value = "";
  }
}

botoncliente1.addEventListener('click', obtenerDatosCliente)
