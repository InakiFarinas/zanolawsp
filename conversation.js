// ─── Palabras clave y sus respuestas ─────────────────────────────────────────
// Editá este archivo para personalizar el bot sin tocar la lógica principal.

const MENU_MESSAGE = `¡Hola! 👋 Gracias por contactarte con Zanola Inmobiliaria.

Contanos, ¿estás buscando comprar o alquilar?`;

const KEYWORDS = {
	comprar: `¡Qué bueno! Tenemos varias opciones disponibles para compra.

¿Tenés alguna zona o tipo de propiedad en mente? Así te puedo orientar mejor 😊`,

	alquilar: `¡Perfecto! Contamos con propiedades en alquiler en distintas zonas.

¿Qué estás buscando? ¿Un departamento, una casa? ¿Tenés alguna zona preferida? 😊`,
};

// Palabras que activan la derivación a asesor
const ADVISOR_TRIGGERS = [
	"asesor",
	"humano",
	"persona",
	"hablar con alguien",
	"agente",
];

/**
 * Recibe el texto del usuario y retorna la respuesta correspondiente.
 * @returns {{ reply: string, needsAdvisor: boolean }}
 */
function getResponse(text) {
	const normalized = text.toLowerCase().trim();

	// ¿Pide asesor?
	if (ADVISOR_TRIGGERS.some((kw) => normalized.includes(kw))) {
		return {
			reply:
				"Perfecto, voy a avisar a uno de nuestros asesores. En breve te contactan. ⏳",
			needsAdvisor: true,
		};
	}

	// ¿Coincide con alguna keyword?
	for (const [keyword, response] of Object.entries(KEYWORDS)) {
		if (normalized.includes(keyword)) {
			return { reply: response, needsAdvisor: false };
		}
	}

	// Saludo o primer mensaje
	const greetings = [
		"hola",
		"buenas",
		"buen dia",
		"buenos dias",
		"hey",
		"holis",
	];
	if (greetings.some((g) => normalized.includes(g)) || normalized.length < 4) {
		return { reply: MENU_MESSAGE, needsAdvisor: false };
	}

	// No se entendió el mensaje
	return {
		reply: `No entendí tu consulta 😅\n\n${MENU_MESSAGE}`,
		needsAdvisor: false,
	};
}

module.exports = { getResponse, MENU_MESSAGE };
