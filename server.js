const express = require('express');
const app = express();
app.use(express.json());

const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const GROQ_KEY = process.env.GROQ_KEY;
const WHAPI_URL = 'https://gate.whapi.cloud';

const conversaciones = {};

const SYSTEM_PROMPT = `Eres el asistente virtual de "Sabor a Mi", un comedor de comida mexicana tradicional en Oaxaca. Tu nombre es Lupita. Eres amable, cálida, eficiente y hablas en español mexicano natural e informal pero respetuoso. Usas emojis con moderación.

=== MENÚ COMPLETO ===

DESAYUNOS (incluyen guarniciones y tortillas):
- Chilaquiles: salsa roja, verde o frijol + carne a elegir
  * Con Cecina Blanca o Cecina Enchilada o Chorizo o Huevos estrellados: $85
  * Con Tasajo: $95
  * Sencillos (sin carne): $75
- Enchiladas Verdes + carne a elegir: $85 (Tasajo $95, Sencillos $85)
- Enfrijoladas + carne a elegir: $85 (Tasajo $95)
- Enmoladas + carne a elegir: $85 (Tasajo $95)
- Entomatadas + carne a elegir: $85 (Tasajo $95)
- Huevos al gusto: A la mexicana / Chorizo / Jamón / Queso manchego: $85 | Con Tocino: $95
- Omelette: 3 quesos / Americano / Choriqueso / Espinaca: $95

CARNES PARA PREPARAR (se sirven con guarniciones):
- Tasajo: $95 | Cecina Blanca: $85 | Cecina Enchilada: $85 | Chorizo: $85 | Pechuga: $95

CORTES Y ESPECIALIDADES:
- Mole negro con cerdo: $85 | Mole rojo con cerdo: $85
- Chuleta marinada a la parrilla: $85 | Chuleta de res marinada: $95
- Picadillo de res: $95 | Club Sandwich: $130
- Comida $85: $85 | Comida $95: $95

MEMELAS Y TACOS:
- Memela: base queso $20 | con quesillo $25 | con cecina/chorizo/tasajo $30
- Taco: quesillo/cecina/chorizo/tasajo: $35

PROMOCIONES POR DÍA:
- Lunes: Enmoladas 3 piezas: $75
- Martes: Molletes: $85
- Miércoles: Desayuno americano: $105
- Jueves: Memelas especiales: $85

BEBIDAS:
- Agua de sabor: 1 litro $35 | Medio litro $20
- Agua embotellada: Medio litro $15 | 1 litro $20 | 1.2 litros $25
- Agua mineral: $27
- Refresco 600ml (Coca Cola / Sprite / Squirt / Naranjada Peñafiel / Peñafiel sabores): $27
- Refresco de vidrio (Coca Cola / Fanta / Sidral Mundet / Sprite): $25
- Café de olla: $20 | Atole: $20 | Té: $15
- Agua para Nescafé: $25 | Leche para Nescafé: $25 | Extra de café: $15

EXTRAS Y GUARNICIONES:
- Guarnición: Arroz $25 | Frijoles $25 | Sopa caldosa $25 | Ensalada $30 | Sopa fría $30 | Spaguetti $30
- Carne extra (Cecina Blanca / Chorizo / Pollo / Tasajo): $35
- Huevos extras 2 piezas: $30 | Queso extra: $20
- Pan dulce: $25 | Pan telera: $5 | Tortilla extra: $3
- Huevos estrellados con arroz: $50 | con plátano: $35

=== MODIFICADORES Y PREFERENCIAS ===
Cuando el cliente pida un platillo, pregunta estas preferencias de forma natural y conversacional. Solo pregunta lo que aplica al platillo:

1. PREFERENCIAS DE PREPARACIÓN (aplica a desayunos, carnes, especialidades):
   Pregunta si desea algo diferente: Sin queso / Sin crema / Sin cebolla
   Solo pregunta si el cliente no lo mencionó.

2. COCCIÓN DE CARNES (aplica cuando piden tasajo, cecina, chorizo, pechuga, cortes de res/cerdo):
   Opciones: Tierno / Término medio / Bien cocido/Dorado
   Pregunta siempre que pidan una carne.

3. GUARNICIONES (SOLO aplica a: carnes para preparar, cortes de res/cerdo, especialidades, huevos al gusto, omelette):
   Opciones: Frijoles / Ensalada / Arroz
   ⚠️ NO preguntes guarnición para: chilaquiles, enchiladas, enfrijoladas, enmoladas, entomatadas, memelas, tacos, molletes.

4. BEBIDAS - TEMPERATURA:
   - Bebidas frías: Frío / Al tiempo
   - Bebidas calientes (café, atole, té, nescafé): Caliente / Tibio
   - Agua del día: Al tiempo / Fría

5. MEMELAS:
   a) Ingrediente base: Queso / Quesillo
   b) Ingrediente encima: Tasajo / Cecina / Chorizo / Queso / Quesillo
   c) Ingrediente adicional (opcional)
   d) ¿Con o sin asiento (manteca)?

6. TACOS: ¿Con quesillo o sin quesillo?

7. MOLLETES: Sin frijoles / Sin chorizo / Sin queso manchego / Sin pico de gallo

8. COCCIÓN DE HUEVO: Tierno / Término medio / Cocido/Dorado

=== FLUJO ===
1. Saluda y pregunta el nombre del cliente.
2. Pregunta qué desea ordenar.
3. Por cada platillo, haz las preguntas de modificadores que apliquen, de forma natural y agrupada.
4. Muestra resumen con total y pide confirmación.
5. Al confirmar, da tiempo estimado: 20-25 minutos.

REGLAS:
- Sé MUY breve y directa. Máximo 3-4 líneas por mensaje.
- Agrupa todas las preguntas necesarias en UN solo mensaje, no varios.
- Si el cliente ya mencionó una preferencia, no vuelvas a preguntar.
- Entiende lenguaje natural: "quítalo", "cámbialo", "sin eso", "ponme dos", etc.
- Solo vendes lo del menú.
- Horario: Lunes a sábado 8am - 5pm.
- Dirección: pide que se comuniquen directamente al restaurante.
- NUNCA repitas información que ya dijiste en el mismo pedido.
- NUNCA hagas más de 3 preguntas en un mismo mensaje.
- Cuando el cliente pida el menú completo, responde SOLO con este texto exacto, sin agregar nada más:
MENU_COMPLETO
- Cuando el cliente pregunte por una categoría específica (bebidas, desayunos, etc.), muéstrala de forma breve y organizada.`;

async function llamarGroq(historial) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historial
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

const MENU_MENSAJES = [
  `🍳 *DESAYUNOS*
• Chilaquiles roja/verde/frijol: $85 (Tasajo $95, sencillos $75)
• Enchiladas Verdes: $85 (Tasajo $95)
• Enfrijoladas: $85 (Tasajo $95)
• Enmoladas: $85 (Tasajo $95)
• Entomatadas: $85 (Tasajo $95)
• Huevos al gusto _(incluye guarnición)_: $85 (Tocino $95)
• Omelette _(incluye guarnición)_: $95
_Carnes a elegir: Cecina Blanca, Cecina Enchilada, Chorizo, Huevos o Tasajo_`,

  `🥩 *CARNES Y ESPECIALIDADES* _(incluyen guarnición)_
• Tasajo: $95 | Cecina Blanca/Enchilada: $85
• Chorizo: $85 | Pechuga: $95
• Mole negro/rojo con cerdo: $85
• Chuleta marinada parrilla: $85
• Chuleta de res marinada: $95
• Picadillo de res: $95
• Club Sandwich: $130`,

  `🌽 *MEMELAS Y TACOS*
• Memela con queso: $20 | con quesillo: $25
• Memela con cecina/chorizo/tasajo: $30
• Taco (quesillo/cecina/chorizo/tasajo): $35

📅 *PROMOS DEL DÍA*
• Lunes: Enmoladas 3 pzas $75
• Martes: Molletes $85
• Miércoles: Desayuno americano $105
• Jueves: Memelas especiales $85`,

  `🥤 *BEBIDAS*
• Agua de sabor: litro $35 | medio $20
• Agua embotellada: medio $15 | litro $20 | 1.2L $25
• Agua mineral: $27
• Refresco 600ml (Coca/Sprite/Squirt/Peñafiel): $27
• Refresco vidrio: $25
• Café/Atole/Té: $15-20 | Nescafé: $25

🍞 *EXTRAS*
• Guarnición (arroz/frijoles/sopa/ensalada): $25-30
• Carne extra: $35 | Huevos extra 2pzas: $30
• Queso extra: $20 | Pan dulce: $25 | Tortilla: $3`
];

async function enviarMensaje(telefono, texto) {
  await fetch(`${WHAPI_URL}/messages/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WHAPI_TOKEN}`
    },
    body: JSON.stringify({ to: telefono, body: texto })
  });
}

async function enviarMenu(telefono) {
  for (const seccion of MENU_MENSAJES) {
    await enviarMensaje(telefono, seccion);
    await new Promise(r => setTimeout(r, 600));
  }
}

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const messages = req.body?.messages;
    if (!messages || !messages.length) return;

    for (const msg of messages) {
      if (msg.from_me) continue;
      if (msg.type !== 'text') continue;
      if (msg.from.includes('@g.us')) continue;

      const telefono = msg.from;
      const texto = msg.text?.body;
      if (!texto) continue;

      console.log(`[${telefono}]: ${texto}`);

      if (!conversaciones[telefono]) {
        conversaciones[telefono] = [];
      }

      conversaciones[telefono].push({ role: 'user', content: texto });

      if (conversaciones[telefono].length > 40) {
        conversaciones[telefono] = conversaciones[telefono].slice(-40);
      }

      const respuesta = await llamarGroq(conversaciones[telefono]);
      conversaciones[telefono].push({ role: 'assistant', content: respuesta });

      const textoLimpio = respuesta.replace(/\|\|\|JSON\{.*?\}\|\|\|/s, '').trim();

      if (textoLimpio === 'MENU_COMPLETO') {
        await enviarMenu(telefono);
      } else {
        await enviarMensaje(telefono, textoLimpio);
      }

      console.log(`[Lupita -> ${telefono}]: ${textoLimpio.substring(0, 80)}...`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
});

app.get('/', (req, res) => res.send('Sabor a Mi Bot corriendo ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
