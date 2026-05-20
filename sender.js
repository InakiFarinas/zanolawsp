// ─── Envío de mensajes a la API de WhatsApp ───────────────────────────────────

const PHONE_ID = process.env.WA_PHONE_ID; // ID del número de teléfono
const WA_TOKEN = process.env.WA_TOKEN; // Token de acceso permanente
const ADVISOR_WA = process.env.ADVISOR_PHONE; // Número del asesor (ej: "5491112345678")

/**
 * Envía un mensaje de texto a un número de WhatsApp.
 */
async function sendMessage(to, text) {
	let cleanTo = to.replace(/\D/g, "");
	if (cleanTo.startsWith("549") && cleanTo.length === 13) {
		cleanTo = "549" + "15" + cleanTo.slice(3);
	}
	const res = await fetch(
		`https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
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

module.exports = { sendMessage };
