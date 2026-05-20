// ─── Envío de mensajes a la API de WhatsApp ───────────────────────────────────

const PHONE_ID = process.env.WA_PHONE_ID; // ID del número de teléfono
const WA_TOKEN = process.env.WA_TOKEN; // Token de acceso permanente
const ADVISOR_WA = process.env.ADVISOR_PHONE; // Número del asesor (ej: "5491112345678")

/**
 * Envía un mensaje de texto a un número de WhatsApp.
 */
async function sendMessage(to, text) {
	const res = await fetch(
		`https://graph.facebook.com/v25.0/${PHONE_ID}/messages`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${WA_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messaging_product: "whatsapp",
				to,
				type: "text",
				text: { body: text },
			}),
		},
	);

	if (!res.ok) {
		const err = await res.json();
		console.error("Error al enviar mensaje:", err);
	}
}
async function notifyAdvisor(from, message) {
	if (!ADVISOR_WA) {
		console.log(`📋 Resumen (ADVISOR_PHONE no configurado):\n${message}`);
		return;
	}

	await sendMessage(ADVISOR_WA, message);
}

module.exports = { sendMessage, notifyAdvisor };
