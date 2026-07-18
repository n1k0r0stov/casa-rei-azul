const OWNER_EMAIL = "stay@casareiazul.com";
const FROM_EMAIL = "Casa Rei Azul <bookings@mail.casareiazul.com>";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstValue(data, names) {
  for (const name of names) {
    const value = data[name];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

async function readSubmission(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await request.json();
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

async function sendEmail(apiKey, email) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(email)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Resend could not send the email.");
  }

  return result;
}

export async function onRequestPost(context) {
  try {
    if (!context.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const data = await readSubmission(context.request);

    /*
      These alternatives allow the function to recognise several common
      form-field names. We can match them precisely to the booking page later.
    */
    const name = firstValue(data, [
      "name",
      "fullName",
      "full_name",
      "guestName"
    ]);

    const email = firstValue(data, [
      "email",
      "guestEmail",
      "guest_email"
    ]).toLowerCase();

    const phone = firstValue(data, [
      "phone",
      "telephone",
      "mobile",
      "whatsapp"
    ]);

    const checkIn = firstValue(data, [
      "checkIn",
      "check-in",
      "checkin",
      "arrival",
      "arrivalDate",
      "arrival_date"
    ]);

    const checkOut = firstValue(data, [
      "checkOut",
      "check-out",
      "checkout",
      "departure",
      "departureDate",
      "departure_date"
    ]);

    const adults = firstValue(data, [
      "adults",
      "adultGuests",
      "adult_guests"
    ]);

    const children = firstValue(data, [
      "children",
      "childGuests",
      "child_guests"
    ]);

    const guests = firstValue(data, [
      "guests",
      "guestCount",
      "guest_count"
    ]);

    const offerCode = firstValue(data, [
      "offerCode",
      "offer-code",
      "offer_code",
      "promoCode",
      "promo_code"
    ]);

    const message = firstValue(data, [
      "message",
      "notes",
      "comments",
      "enquiry"
    ]);

    // A hidden field named "website" can be used as a spam trap.
    const website = firstValue(data, ["website"]);

    if (website) {
      return Response.json({
        success: true,
        message: "Thank you. Your enquiry has been received."
      });
    }

    if (!name || !email || !checkIn || !checkOut) {
      return Response.json(
        {
          success: false,
          message:
            "Please provide your name, email address, check-in date and check-out date."
        },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return Response.json(
        {
          success: false,
          message: "Please enter a valid email address."
        },
        { status: 400 }
      );
    }

    const guestSummary =
      guests ||
      [
        adults ? `${adults} adult${adults === "1" ? "" : "s"}` : "",
        children
          ? `${children} child${children === "1" ? "" : "ren"}`
          : ""
      ]
        .filter(Boolean)
        .join(", ") ||
      "Not specified";

    const safe = {
      name: escapeHtml(name),
      email: escapeHtml(email),
      phone: escapeHtml(phone || "Not provided"),
      checkIn: escapeHtml(checkIn),
      checkOut: escapeHtml(checkOut),
      guests: escapeHtml(guestSummary),
      offerCode: escapeHtml(offerCode || "None"),
      message: escapeHtml(message || "No additional message").replaceAll(
        "\n",
        "<br>"
      )
    };

    const ownerEmailHtml = `
      <!doctype html>
      <html lang="en">
        <body style="margin:0;background:#f4f1eb;font-family:Arial,sans-serif;color:#263238;">
          <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
            <div style="background:#1e71a5;padding:28px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-family:Georgia,serif;font-size:28px;">
                New Casa Rei Azul enquiry
              </h1>
            </div>

            <div style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
              <p style="margin-top:0;font-size:17px;">
                A new direct-booking enquiry has arrived.
              </p>

              <table style="width:100%;border-collapse:collapse;font-size:15px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-weight:bold;width:35%;">Guest</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;">${safe.name}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-weight:bold;">Email</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;">${safe.email}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-weight:bold;">Phone / WhatsApp</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;">${safe.phone}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-weight:bold;">Check-in</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;">${safe.checkIn}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-weight:bold;">Check-out</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;">${safe.checkOut}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-weight:bold;">Guests</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;">${safe.guests}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-weight:bold;">Offer code</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;">${safe.offerCode}</td>
                </tr>
              </table>

              <div style="margin-top:24px;padding:20px;background:#f7f9fa;border-left:4px solid #1e71a5;">
                <strong>Guest message</strong>
                <p style="margin:10px 0 0;line-height:1.6;">${safe.message}</p>
              </div>

              <p style="margin:26px 0 0;">
                Reply directly to this email to respond to ${safe.name}.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const guestEmailHtml = `
      <!doctype html>
      <html lang="en">
        <body style="margin:0;background:#f4f1eb;font-family:Arial,sans-serif;color:#263238;">
          <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
            <div style="background:#1e71a5;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-family:Georgia,serif;font-size:30px;">
                Casa Rei Azul
              </h1>
              <p style="margin:8px 0 0;color:#eaf5fb;">Olhão, Algarve</p>
            </div>

            <div style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
              <h2 style="margin-top:0;font-family:Georgia,serif;color:#1e71a5;">
                Thank you, ${safe.name}
              </h2>

              <p style="line-height:1.7;">
                We've received your enquiry for Casa Rei Azul and will check
                availability for your requested dates.
              </p>

              <div style="margin:24px 0;padding:20px;background:#f7f9fa;border-left:4px solid #1e71a5;">
                <p style="margin:0 0 8px;"><strong>Check-in:</strong> ${safe.checkIn}</p>
                <p style="margin:0 0 8px;"><strong>Check-out:</strong> ${safe.checkOut}</p>
                <p style="margin:0;"><strong>Guests:</strong> ${safe.guests}</p>
              </div>

              <p style="line-height:1.7;">
                This is an enquiry rather than a confirmed reservation. We'll
                contact you personally with availability and the next steps.
              </p>

              <p style="line-height:1.7;">
                Warm wishes,<br>
                <strong>Casa Rei Azul</strong><br>
                <a href="mailto:stay@casareiazul.com" style="color:#1e71a5;">
                  stay@casareiazul.com
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the owner notification first.
    await sendEmail(context.env.RESEND_API_KEY, {
      from: FROM_EMAIL,
      to: [OWNER_EMAIL],
      reply_to: email,
      subject: `New enquiry: ${name} — ${checkIn} to ${checkOut}`,
      html: ownerEmailHtml
    });

    // Then send the acknowledgement to the guest.
    await sendEmail(context.env.RESEND_API_KEY, {
      from: FROM_EMAIL,
      to: [email],
      reply_to: OWNER_EMAIL,
      subject: "We’ve received your Casa Rei Azul enquiry",
      html: guestEmailHtml
    });

    return Response.json({
      success: true,
      message:
        "Thank you. Your enquiry has been received and we'll be in touch shortly."
    });
  } catch (error) {
    console.error("Enquiry error:", error);

    return Response.json(
      {
        success: false,
        message:
          "We couldn't send your enquiry just now. Please email stay@casareiazul.com or contact us on WhatsApp."
      },
      { status: 500 }
    );
  }
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
