export async function onRequestPost() {
  return Response.json({
    success: true,
    message: "Casa Rei Azul enquiry endpoint is working."
  });
}

export async function onRequest() {
  return Response.json(
    {
      success: false,
      message: "This endpoint only accepts booking form submissions."
    },
    {
      status: 405,
      headers: {
        Allow: "POST"
      }
    }
  );
}
