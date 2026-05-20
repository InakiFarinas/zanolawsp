// ─── Manejo de conversaciones con estado ─────────────────────────────────────
// Guarda en memoria el paso actual de cada usuario.
// Si el servidor se reinicia, las conversaciones se resetean (es aceptable).

const sessions = new Map();

const STEPS = {
	WELCOME: "welcome",
	OPERATION: "operation", // comprar o alquilar
	PROPERTY_TYPE: "property_type",
	ZONE: "zone",
	BUDGET: "budget",
	NAME: "name",
	DONE: "done",
};

const ZONAS_GBA = [
	"san isidro",
	"tigre",
	"vicente lopez",
	"san martin",
	"tres de febrero",
	"moron",
	"merlo",
	"moreno",
	"la matanza",
	"lomas de zamora",
	"quilmes",
	"berazategui",
	"florencio varela",
	"avellaneda",
	"lanus",
	"san justo",
	"ramos mejia",
	"haedo",
	"ituzaingo",
	"hurlingham",
	"palermo",
	"belgrano",
];

const TIPOS_PROPIEDAD = [
	"departamento",
	"depto",
	"casa",
	"local",
	"oficina",
	"ph",
	"terreno",
	"cochera",
];

function getSession(phone) {
	if (!sessions.has(phone)) {
		sessions.set(phone, { step: STEPS.WELCOME, data: {} });
	}
	return sessions.get(phone);
}

function resetSession(phone) {
	sessions.delete(phone);
}

/**
 * Procesa el mensaje del usuario según el paso actual de su conversación.
 * @returns {{ reply: string, needsAdvisor: boolean }}
 */
function processMessage(phone, text) {
	const session = getSession(phone);
	const normalized = text.toLowerCase().trim();

	// Escape hatch: el usuario puede pedir asesor en cualquier momento
	const advisorTriggers = [
		"asesor",
		"humano",
		"persona",
		"hablar con alguien",
		"agente",
	];
	if (advisorTriggers.some((kw) => normalized.includes(kw))) {
		resetSession(phone);
		return {
			reply:
				"¡Claro! Ya aviso a uno de nuestros asesores para que te contacte. En breve te escriben 😊",
			needsAdvisor: true,
		};
	}

	switch (session.step) {
		case STEPS.WELCOME: {
			session.step = STEPS.OPERATION;
			return {
				reply: `¡Hola! 👋 Gracias por contactarte con Zanola Inmobiliaria.\n\nContanos, ¿estás buscando *comprar* o *alquilar* una propiedad?`,
				needsAdvisor: false,
			};
		}

		case STEPS.OPERATION: {
			if (normalized.includes("comprar") || normalized.includes("compra")) {
				session.data.operation = "compra";
				session.step = STEPS.PROPERTY_TYPE;
				return {
					reply: `¡Qué bueno! ¿Qué tipo de propiedad estás buscando?\n\nPor ejemplo: departamento, casa, local, oficina, PH, terreno...`,
					needsAdvisor: false,
				};
			}
			if (normalized.includes("alquilar") || normalized.includes("alquiler")) {
				session.data.operation = "alquiler";
				session.step = STEPS.PROPERTY_TYPE;
				return {
					reply: `¡Perfecto! ¿Qué tipo de propiedad estás buscando?\n\nPor ejemplo: departamento, casa, local, oficina, PH...`,
					needsAdvisor: false,
				};
			}
			return {
				reply: `No entendí bien 😅 ¿Estás buscando *comprar* o *alquilar*?`,
				needsAdvisor: false,
			};
		}

		case STEPS.PROPERTY_TYPE: {
			const tipo = TIPOS_PROPIEDAD.find((t) => normalized.includes(t));
			session.data.propertyType = tipo || text.trim();
			session.step = STEPS.ZONE;
			return {
				reply: `Anotado 📝 ¿En qué zona del GBA estás buscando?`,
				needsAdvisor: false,
			};
		}

		case STEPS.ZONE: {
			session.data.zone = text.trim();
			session.step = STEPS.BUDGET;

			const budgetQuestion =
				session.data.operation === "compra"
					? `¿Tenés un presupuesto en mente? Podés indicarlo en pesos o dólares 💰`
					: `¿Cuánto querés destinar por mes al alquiler? 💰`;

			return { reply: budgetQuestion, needsAdvisor: false };
		}

		case STEPS.BUDGET: {
			session.data.budget = text.trim();
			session.step = STEPS.NAME;
			return {
				reply: `Casi listo! ¿Cuál es tu nombre para que el asesor pueda contactarte? 😊`,
				needsAdvisor: false,
			};
		}

		case STEPS.NAME: {
			const rawName = text.trim().split(/\s+/)[0];
			session.data.name =
				rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
			session.step = STEPS.DONE;

			const summary =
				`*Nuevo contacto:*\n\n` +
				`👤 Nombre: ${session.data.name}\n` +
				`📱 Teléfono: wa.me/${phone}\n` +
				`🏷️ Operación: ${session.data.operation}\n` +
				`🏠 Propiedad: ${session.data.propertyType}\n` +
				`📍 Zona: ${session.data.zone}\n` +
				`💰 Presupuesto: ${session.data.budget}`;

			resetSession(phone);

			return {
				reply: `¡Gracias, ${session.data.name}! Un asesor de Zanola se va a comunicar con vos a la brevedad 🙌`,
				needsAdvisor: true,
				advisorMessage: summary,
			};
		}

		case STEPS.DONE: {
			resetSession(phone);
			return processMessage(phone, text);
		}

		default: {
			resetSession(phone);
			return processMessage(phone, text);
		}
	}
}

module.exports = { processMessage };
