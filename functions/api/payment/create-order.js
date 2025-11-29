
import { verifyJwt } from '../lib/security';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
       return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const userPayload = await verifyJwt(token, env.JWT_SECRET);
    
    if (!userPayload) {
        return new Response(JSON.stringify({ success: false, message: "Invalid Token" }), { status: 401 });
    }

    const { amount } = await request.json();
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`;

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: orderId,
      message: "支付接口即将上线",
      paymentUrl: "#"
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
  }
}
