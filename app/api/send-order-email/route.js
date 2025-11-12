import nodemailer from 'nodemailer';
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(req) {

  // console.log(siteUrl);

  const { orderDetails, customerEmail, adminEmail } = await req.json();

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Path to your logo image (e.g., in the /public folder)
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoContent = fs.readFileSync(logoPath);

    // Common HTML (you can reuse)
    const orderItemsHtml = orderDetails.order_item.map(
      item => `<li>${item.name} - ₹${item.price.toFixed(2)} x ${item.quantity}</li>`
    ).join('');

    // Customer Email
    const customerMailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
       cc: "ecom@bharathelectronics.in",
      subject: 'Your Order Confirmation',
      html: `
       <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 6px; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden;box-shadow: -1px 45px 17px -12px;">
    <!-- Top Bar -->
    <div style="background-color:#e5e2c9; padding: 20px; text-align: center;">
      <img src="cid:logo_cid" alt="Logo" style="width: 90px; height:90px" />
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <h1 style="font-size: 22px; color: #333333; margin-top: 0;">Thank you for your order!</h1>
      <p style="font-size: 16px; color: #555555;">
        Hi ${orderDetails.order_username || 'Customer'},
      </p>
      <p style="font-size: 16px; color: #555555;">
        We have received your order <strong>#${orderDetails.order_number}</strong>. Here are the details:
      </p>

      <table style="width:100%; margin-top: 20px; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Total Amount:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>₹${orderDetails.order_amount.toFixed(2)}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Payment Method:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${orderDetails.payment_method}</td>
        </tr>
      </table>

      <h2 style="font-size: 18px; color: #333333; margin-top: 30px;">Order Items:</h2>
      <ul style="padding-left: 20px; color: #555555;">
        ${orderDetails.order_item.map(item => `
          <li>${item.name} - ₹${item.price.toFixed(2)} x ${item.quantity}</li>
        `).join('')}
      </ul>

      <p style="font-size: 16px; color: #555555; margin-top: 20px;">
        We'll process your order shortly. Thank you for shopping with us!
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://yourwebsite.com/orders/${orderDetails.order_number}" 
          style="background-color:#e5e2c9; color:#f71c1c; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
          View Your Order
        </a>
      </div>
    </div>
  </div>
</div>

      `,
      attachments: [
        {
          filename: 'logo.png',
          content: logoContent,
          cid: 'logo_cid' // same as the src in the <img>
        }
      ]
    };

    // Admin Email
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
       cc: "ecom@bharathelectronics.in",
      subject: 'New Order Received',
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 6px; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden;">
    <div style="background-color: #e5e2c9; padding: 20px; text-align: center;">
      <img src="cid:logo_cid" alt="Logo" style="width: 90px; height: 90px;" />
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <h1 style="font-size: 22px; color: #333333; margin-top: 0;">Thank you for your order!</h1>
      <p style="font-size: 16px; color: #555555;">
        Hi ${orderDetails.order_username || 'Customer'},
      </p>
      <p style="font-size: 16px; color: #555555;">
        We have received your order <strong>#${orderDetails.order_number}</strong>. Here are the details:
      </p>

      <table style="width:100%; margin-top: 20px; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Total Amount:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>₹${orderDetails.order_amount.toFixed(2)}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Payment Method:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${orderDetails.payment_method}</td>
        </tr>
      </table>

      <h2 style="font-size: 18px; color: #333333; margin-top: 30px;">Order Items:</h2>
      <ul style="padding-left: 20px; color: #555555;">
        ${orderDetails.order_item.map(item => `
          <li>${item.name} - ₹${item.price.toFixed(2)} x ${item.quantity}</li>
        `).join('')}
      </ul>

      <p style="font-size: 16px; color: #555555; margin-top: 20px;">
        We'll process your order shortly. Thank you for shopping with us!
      </p>

      
    </div>
  </div>
</div>

      `,
      attachments: [
        {
          filename: 'logo.png',
          content: logoContent,
          cid: 'logo_cid'
        }
      ]
    };

    // Send Emails
    const res = await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(adminMailOptions);

    return NextResponse.json({ success: true, message: res }, { status: 200 });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
