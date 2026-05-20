// ─── Palabras clave y sus respuestas ─────────────────────────────────────────
// Editá este archivo para personalizar el bot sin tocar la lógica principal.

const MENU_MESSAGE = `¡Hola! 👋 Soy el asistente virtual.

Escribí alguna de estas opciones:
  • *precios* – Ver nuestros planes
  • *horarios* – Horarios de atención
  • *ubicacion* – Dónde encontrarnos
  • *asesor* – Hablar con una persona

¿En qué te puedo ayudar?`;

const KEYWORDS = {
	precios: `💰 *Nuestros planes:*

  • Básico: $X/mes
  • Pro: $Y/mes
  • Enterprise: consultanos

Para más info escribí *asesor* y te contactamos.`,

	horarios: `🕐 *Horarios de atención:*

  Lunes a viernes: 9:00 – 18:00
  Sábados: 10:00 – 13:00

Fuera de ese horario podés dejar tu consulta y te respondemos en cuanto volvamos.`,

	ubicacion: `📍 *Nos encontrás en:*

  Av. Ejemplo 1234, Buenos Aires
  
  https://maps.google.com/?q=tu+direccion`,
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
