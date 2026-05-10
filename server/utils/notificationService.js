const twilio = require("twilio");
const nodemailer = require("nodemailer");

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const emailTransporter =
  process.env.EMAIL_HOST &&
  process.env.EMAIL_PORT &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS
    ? nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })
    : null;

function formatPhone(phone) {
  if (!phone) return "";
  if (phone.startsWith("+")) return phone;
  return `+91${phone}`;
}

async function sendSMS(to, body) {
  try {
    if (!twilioClient || !to || !body) return null;

    return await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formatPhone(to),
    });
  } catch (err) {
    console.error("SMS send error:", err.message);
    return null;
  }
}

async function sendEmail(to, subject, text, html) {
  try {
    if (!emailTransporter || !to || !subject) return null;

    return await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("Email send error:", err.message);
    return null;
  }
}

async function sendMilestoneNotifications(shipment, milestone) {
  if (!shipment) return;

  let smsTo = "";
  let emailTo = "";
  let subject = "";
  let text = "";
  let html = "";

  if (milestone === "Picked Up") {
    smsTo = shipment.senderPhone;
    emailTo = shipment.senderEmail;
    subject = `Shipment ${shipment.trackingId} collected`;
    text = `Hello ${shipment.senderName}, your package ${shipment.trackingId} has been collected successfully.`;
    html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Package Collected</h2>
        <p>Hello ${shipment.senderName},</p>
        <p>Your package <strong>${shipment.trackingId}</strong> has been collected successfully.</p>
      </div>
    `;
  }

  if (milestone === "Out for Delivery") {
    smsTo = shipment.receiverPhone;
    emailTo = shipment.receiverEmail;
    subject = `Shipment ${shipment.trackingId} is out for delivery`;
    text = `Hello ${shipment.receiverName}, your package ${shipment.trackingId} is out for delivery.`;
    html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Out for Delivery</h2>
        <p>Hello ${shipment.receiverName},</p>
        <p>Your package <strong>${shipment.trackingId}</strong> is now out for delivery.</p>
      </div>
    `;
  }

  if (milestone === "Delivered") {
    smsTo = shipment.senderPhone;
    emailTo = shipment.senderEmail;
    subject = `Shipment ${shipment.trackingId} delivered successfully`;
    text = `Hello ${shipment.senderName}, your package ${shipment.trackingId} has been delivered successfully.`;
    html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Package Delivered</h2>
        <p>Hello ${shipment.senderName},</p>
        <p>Your package <strong>${shipment.trackingId}</strong> has been delivered successfully.</p>
      </div>
    `;
  }

  if (!smsTo && !emailTo) return;

  await Promise.all([
    sendSMS(smsTo, text),
    sendEmail(emailTo, subject, text, html),
  ]);
}

module.exports = {
  sendSMS,
  sendEmail,
  sendMilestoneNotifications,
};