const express = require("express");
const { processMessage } = require("./conversation");
const { sendMessage, notifyAdvisor } = require("./sender");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mi_token";
const PORT = process.env.PORT || 3000;

// ─── Keep-alive para Render ───────────────────────────────────────────────────
const APP_URL = process.env.APP_URL;

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

// ─── Verificación del webhook ─────────────────────────────────────────────────
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
	res.sendStatus(200);

	try {
		const entry = req.body?.entry?.[0];
		const changes = entry?.changes?.[0];
		const value = changes?.value;

		if (!value?.messages) return;

		const message = value.messages[0];
		if (message.type !== "text") return;

		// 1. Recibimos el número (viene como "5491135959887")
		let from = message.from;
		const text = message.text.body;

		// 2. 🇦🇷 SOLUCIÓN DEFINITIVA: Si empieza con 549, le quitamos el 9
		if (from.startsWith("549")) {
			from = "54" + from.slice(3); // Se transforma en "541135959887"
		}

		console.log(`📩 Mensaje procesado para responder a: ${from}: "${text}"`);

		const { reply, needsAdvisor } = getResponse(text);

		// 3. Enviamos la respuesta con el número ya limpio
		await sendMessage(from, reply);

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
	if (!APP_URL)
		console.log("⚠️  APP_URL no configurada — keep-alive desactivado");
});
