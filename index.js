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

		let from = message.from;
		const text = message.text.body;

		// 🇦🇷 Fix número argentino
		if (from.startsWith("549")) {
			from = "54" + from.slice(3);
		}

		console.log(`📩 Mensaje de ${from}: "${text}"`);

		const { reply, needsAdvisor, advisorMessage } = processMessage(from, text);

		await sendMessage(from, reply);

		if (needsAdvisor) {
			console.log(`🔔 Derivando ${from} al asesor`);
			if (advisorMessage) {
				await notifyAdvisor(from, advisorMessage);
			} else {
				await notifyAdvisor(from, text);
			}
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
