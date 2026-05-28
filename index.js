const express = require('express');
const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const TEMPLATE_NAME = process.env.TEMPLATE_NAME;

app.post('/webhook', async (req, res) => {
  console.log('Webhook received!', JSON.stringify(req.body));
  const order = req.body;

  const customerPhone = order.billing_address?.phone || order.phone;
  const customerName = order.billing_address?.first_name || 'Customer';
  const orderNumber = order.order_number;

  if (!customerPhone) {
    console.log('No phone number found on order');
    return res.sendStatus(200);
  }

  // Clean phone number - remove spaces, dashes, etc
  let cleanPhone = customerPhone.replace(/\D/g, '');
// Add country code if not present (for India)
if (!cleanPhone.startsWith('91')) {
  cleanPhone = '91' + cleanPhone;
}

  const response = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: TEMPLATE_NAME,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName },
              { type: 'text', text: String(orderNumber) }
            ]
          }
        ]
      }
    })
  });

  const data = await response.json();
  console.log('WhatsApp response:', JSON.stringify(data));
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Jeelo WhatsApp Bot is running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
