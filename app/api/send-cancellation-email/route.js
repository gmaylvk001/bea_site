import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderDetails, customerEmail, adminEmail } = req.body;

  // Validate required fields
  if (!orderDetails || !customerEmail || !adminEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create transporter with more robust configuration
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.OAUTH_CLIENT_ID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN,
        accessToken: process.env.OAUTH_ACCESS_TOKEN,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Alternatively, if you want to keep using basic auth:
    /*
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    */

    // Validate order items structure
    const itemsHtml = Array.isArray(orderDetails.order_item) 
      ? orderDetails.order_item.map(item => `
          <li>${item.product_name || 'Product'} - ₹${item.price || '0'} x ${item.quantity || '1'}</li>
        `).join('')
      : '<li>Product details not available</li>';

    // Customer email
    const customerMailOptions = {
      from: `"Your Store Name" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Order #${orderDetails.order_number} Cancellation Confirmation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">Order Cancellation Confirmation</h2>
          <p>Your order #${orderDetails.order_number} has been successfully cancelled.</p>
          
          <h3 style="margin-top: 20px;">Order Summary</h3>
          <p><strong>Order Number:</strong> ${orderDetails.order_number}</p>
          <p><strong>Order Amount:</strong> ₹${orderDetails.order_amount}</p>
          <p><strong>Cancellation Date:</strong> ${orderDetails.cancellation_date}</p>
          
          <p style="margin-top: 30px;">If you have any questions, please contact our support team.</p>
          <p>Thank you for shopping with us.</p>
        </div>
      `
    };

    // Admin email
    const adminMailOptions = {
      from: `"Your Store Name" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `Order #${orderDetails.order_number} Cancelled`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">Order Cancellation Notification</h2>
          <p>Order #${orderDetails.order_number} has been cancelled by the customer.</p>
          
          <h3 style="margin-top: 20px;">Order Details</h3>
          <p><strong>Order Number:</strong> ${orderDetails.order_number}</p>
          <p><strong>Order Amount:</strong> ₹${orderDetails.order_amount}</p>
          <p><strong>Cancellation Date:</strong> ${orderDetails.cancellation_date}</p>
          
          <h3 style="margin-top: 20px;">Items</h3>
          <ul>
            ${itemsHtml}
          </ul>
        </div>
      `
    };

    // Test the transporter connection first
    await transporter.verify();

    // Send both emails
    const customerResult = await transporter.sendMail(customerMailOptions);
    const adminResult = await transporter.sendMail(adminMailOptions);

    res.status(200).json({ 
      message: 'Cancellation emails sent successfully',
      customerMessageId: customerResult.messageId,
      adminMessageId: adminResult.messageId
    });
  } catch (error) {
    console.error('Error sending cancellation emails:', error);
    res.status(500).json({ 
      error: 'Failed to send cancellation emails',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}