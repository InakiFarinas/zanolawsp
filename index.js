const express = require("express");
const { getResponse } = require("./keywords");
const { sendMessage, notifyAdvisor } = require("./sender");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mi_token";
const PORT = process.env.PORT || 3000;

// ─── Keep-alive para Render ───────────────────────────────────────────────────
// Render duerme los servicios gratuitos después de 15 min de inactividad.
// Este intervalo hace un ping interno cada 14 minutos para mantenerlo despierto.
const APP_URL = process.env.APP_URL; // ej: "https://mi-bot.onrender.com"

if (APP_URL) {
	setInterval(
		async () => {
			try {
				await fetch(`${APP_URL}/ping`);
				console.log("🏓 Keep-alive ping enviado");
			} catch (e) {
				console.error("Keep-alive falló:", e.message);
			}
		},
		14 * 60 * 1000,
	);
}

app.get("/ping", (_req, res) => res.send("pong"));

// ─── Verificación del webhook (Meta lo llama una sola vez al configurar) ──────
app.get("/webhook", (req, res) => {
	const mode = req.query["hub.mode"];
	const token = req.query["hub.verify_token"];
	const challenge = req.query["hub.challenge"];

	if (mode === "subscribe" && token === VERIFY_TOKEN) {
		console.log("✅ Webhook verificado");
		return res.status(200).send(challenge);
	}

	res.sendStatus(403);
});

// ─── Recepción de mensajes ────────────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
	// Responder 200 inmediatamente (Meta requiere respuesta en < 5 seg)
	res.sendStatus(200);

	try {
		const entry = req.body?.entry?.[0];
		const changes = entry?.changes?.[0];
		const value = changes?.value;

		// Ignorar notificaciones de estado (leído, entregado, etc.)
		if (!value?.messages) return;

		const message = value.messages[0];

		// Por ahora solo manejamos texto
		if (message.type !== "text") return;

		const from = message.from; // Número del usuario
		const text = message.text.body; // Texto que envió

		console.log(`📩 Mensaje de ${from}: "${text}"`);

		const { reply, needsAdvisor } = getResponse(text);

		// Enviar respuesta al usuario
		await sendMessage(from, reply);

		// Si pidió asesor, notificar al equipo
		if (needsAdvisor) {
			console.log(`🔔 Derivando ${from} a asesor`);
			await notifyAdvisor(from, text);
		}
	} catch (err) {
		console.error("Error procesando mensaje:", err);
	}
});

// ─── Inicio ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
	console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
	if (!APP_URL) {
		console.log("⚠️  APP_URL no configurada — keep-alive desactivado");
	}
});
