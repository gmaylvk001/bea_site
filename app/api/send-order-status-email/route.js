import { POST as sendOrderEmail } from "../send-order-email/route";

export async function POST(req) {
  const body = await req.json();
  const request = new Request(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({ ...body, action: "status_update" }),
  });

  return sendOrderEmail(request);
}
