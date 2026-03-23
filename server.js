const express = require('express');
const app = express();
app.use(express.json());

const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const GROQ_KEY = process.env.GROQ_KEY;
const WHAPI_URL = 'https://gate.whapi.cloud';
const DUENO_TEL = '529511976397@s.whatsapp.net';

const conversaciones = {};
const pedidosConfirmados = {};

const SYSTEM_PROMPT = `Eres Lupita, la asistente virtual de *Sabor a Mi* 🌮, un comedor de comida mexicana tradicional en Oaxaca. Eres amable, cálida y eficiente. Hablas en español mexicano natural e informal pero respetuoso. Usas emojis de forma estratégica para hacer los mensajes más bonitos y legibles.

=== FORMATO DE MENSAJES ===
- Usa saltos de línea para separar ideas
- Usa emojis al inicio de cada punto importante
- Las preguntas van en línea separada
- El resumen del pedido siempre con viñetas y total al final
- Máximo 4-5 líneas por mensaje, limpio y fácil de leer

=== MENÚ COMPLETO ===

DESAYUNOS:
- Chilaquiles: salsa roja, verde o frijol + carne a elegir
  * Con Cecina Blanca/Enchilada/Chorizo/Huevos: $85
  * Con Tasajo: $95 | Sencillos: $75
- Enchiladas Verdes: $85 (Tasajo $95, Sencillos $85)
- Enfrijoladas: $85 (Tasajo $95)
- Enmoladas: $85 (Tasajo $95)
- Entomatadas: $85 (Tasajo $95)
- Huevos al gusto (incluye guarnición y tortillas): A la mexicana/Chorizo/Jamón/Queso manchego $85 | Tocino $95
- Omelette (incluye guarnición y tortillas): 3 quesos/Americano/Choriqueso/Espinaca $95

CARNES PARA PREPARAR (incluyen guarnición y tortillas):
- Tasajo: $95 | Cecina Blanca: $85 | Cecina Enchilada: $85 | Chorizo: $85 | Pechuga: $95

CORTES Y ESPECIALIDADES (incluyen guarnición):
- Mole negro con cerdo: $85 | Mole rojo con cerdo: $85
- Chuleta marinada a la parrilla: $85 | Chuleta de res marinada: $95
- Picadillo de res: $95 | Club Sandwich: $130
- Comida $85: $85 | Comida $95: $95

MEMELAS Y TACOS (por pieza):
- Memela con queso: $20 | con quesillo: $25 | con cecina/chorizo/tasajo: $30
- Taco: quesillo/cecina/chorizo/tasajo: $35

PROMOCIONES POR DÍA:
- Lunes: Enmoladas 3 piezas $75
- Martes: Molletes $85
- Miércoles: Desayuno americano $105
- Jueves: Memelas especiales $85 (3 memelas: 1ra de queso/quesillo + 2 de carne)

BEBIDAS:
- Agua de sabor del día (sabor varía, preguntar si quiere saber): litro $35 | medio $20
- Agua embotellada: medio $15 | litro $20 | 1.2L $25
- Agua mineral: $27
- Refresco 600ml (Coca/Sprite/Squirt/Peñafiel): $27
- Refresco vidrio (Coca/Fanta/Sidral/Sprite): $25
- Café de olla: $20 | Atole: $20 | Té: $15
- Agua para Nescafé: $25 | Leche para Nescafé: $25 | Extra café: $15

EXTRAS Y GUARNICIONES:
- Guarnición: Arroz $25 | Frijoles $25 | Sopa caldosa $25 | Ensalada $30 | Sopa fría $30 | Spaguetti $30
- Carne extra: $35 | Huevos extra 2pzas: $30 | Queso extra: $20
- Pan dulce: $25 | Pan telera: $5 | Tortilla extra: $3
- Huevos estrellados: con arroz $50 | con plátano $35

=== MODIFICADORES ===

1. PREFERENCIAS (desayunos, carnes, especialidades):
   Sin queso / Sin crema / Sin cebolla — solo preguntar si el cliente no lo mencionó

2. COCCIÓN DE CARNES (tasajo, cecina, chorizo, pechuga, cortes):
   Tierno / Término medio / Bien cocido — preguntar siempre

3. GUARNICIONES — REGLA CRÍTICA:
   ✅ SÍ preguntar guarnición: carnes para preparar, cortes, especialidades, huevos al gusto, omelette
   ❌ NUNCA preguntar guarnición para: chilaquiles, enchiladas, enfrijoladas, enmoladas, entomatadas, memelas, tacos, molletes
   ❌ Las enfrijoladas NO llevan guarnición. NUNCA.
   ❌ Los chilaquiles NO llevan guarnición. NUNCA.
   ❌ Las enchiladas NO llevan guarnición. NUNCA.
   Opciones cuando aplica: Frijoles / Ensalada / Arroz

4. BEBIDAS TEMPERATURA:
   - Frías: Frío / Al tiempo
   - Calientes (café/atole/té/nescafé): Caliente / Tibio
   - Agua del día: Fría / Al tiempo

5. MEMELAS — preguntar en este orden:
   a) ¿Cuántas memelas quieres? (se venden por pieza)
   b) Por cada una: ¿de qué la quieres? (queso $20 / quesillo $25 / cecina/chorizo/tasajo $30)
   c) ¿Con o sin asiento (manteca)?

6. TACOS: ¿Con quesillo o sin quesillo?

7. MOLLETES: Sin frijoles / Sin chorizo / Sin queso manchego / Sin pico de gallo

8. COCCIÓN HUEVO: Tierno / Término medio / Cocido/Dorado

=== FLUJO ===
1. Saluda con emoji y pregunta el nombre
2. Pregunta qué desea ordenar
3. Haz las preguntas de modificadores de forma natural y agrupada
4. Al terminar el pedido, pregunta la modalidad:
   "¿Cómo prefieres recibir tu pedido? 😊
   🏠 Domicilio (gratis dentro de la ciudad)
   🥡 Para llevar (pasa a recoger)
   🪑 Comer aquí en el local"
5. Si elige DOMICILIO: pide la dirección completa
6. Si elige PARA LLEVAR o COMER AQUÍ: continúa normal
7. Muestra resumen bonito con viñetas, modalidad y total
8. Pide confirmación
9. Al confirmar responde EXACTAMENTE en este formato:
PEDIDO_CONFIRMADO:[nombre]|[resumen con \n entre items]|[total con $]|[modalidad: DOMICILIO/LLEVAR/LOCAL]|[dirección o "local"]

Ejemplo domicilio:
PEDIDO_CONFIRMADO:Diego|• 3 memelas con asiento ($80)\n• Agua de sabor medio litro ($20)|$100|DOMICILIO|Calle Reforma 123, Col. Centro

Ejemplo para llevar:
PEDIDO_CONFIRMADO:Diego|• Chilaquiles rojos con cecina ($85)|$85|LLEVAR|local

=== REGLAS ===
- Máximo 4-5 líneas por mensaje con saltos de línea y emojis
- Agrupa preguntas en UN solo mensaje
- NUNCA inventes productos, sabores o info que no esté en el menú
- NUNCA repitas info ya dicha en la conversación
- Solo vendes lo del menú
- Horario: Lunes a sábado 8am-5pm
- Dirección: pide que pregunten directamente al restaurante
- Cuando pidan menú completo responde SOLO: MENU_COMPLETO
- Cuando pregunten por categoría específica, muéstrala breve y organizada`;

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

• Chilaquiles roja/verde/frijol — $85 (Tasajo $95, sencillos $75)
• Enchiladas Verdes — $85 (Tasajo $95)
• Enfrijoladas — $85 (Tasajo $95)
• Enmoladas — $85 (Tasajo $95)
• Entomatadas — $85 (Tasajo $95)
• Huevos al gusto _(con guarnición)_ — $85 (Tocino $95)
• Omelette _(con guarnición)_ — $95

_🥩 Carnes a elegir: Cecina Blanca, Cecina Enchilada, Chorizo, Huevos estrellados o Tasajo_`,

  `🥩 *CARNES Y ESPECIALIDADES*
_(todas incluyen guarnición y tortillas)_

• Tasajo — $95
• Cecina Blanca / Enchilada — $85
• Chorizo — $85 | Pechuga — $95
• Mole negro o rojo con cerdo — $85
• Chuleta marinada a la parrilla — $85
• Chuleta de res marinada — $95
• Picadillo de res — $95
• Club Sandwich — $130`,

  `🌽 *MEMELAS Y TACOS*
_(memelas por pieza)_

• Memela con queso — $20
• Memela con quesillo — $25
• Memela con cecina/chorizo/tasajo — $30
• Taco (quesillo/cecina/chorizo/tasajo) — $35

📅 *PROMOS DEL DÍA*

• Lunes: Enmoladas 3 pzas — $75
• Martes: Molletes — $85
• Miércoles: Desayuno americano — $105
• Jueves: Memelas especiales — $85
  _1 queso/quesillo + 2 de carne_`,

  `🥤 *BEBIDAS*

• Agua de sabor del día — litro $35 | medio $20
• Agua embotellada — medio $15 | litro $20 | 1.2L $25
• Agua mineral — $27
• Refresco 600ml (Coca/Sprite/Squirt/Peñafiel) — $27
• Refresco de vidrio — $25
• Café de olla / Atole / Té — $15-20
• Nescafé (agua o leche) — $25

🍞 *EXTRAS*

• Guarnición (arroz/frijoles/sopa/ensalada) — $25-30
• Carne extra — $35 | Huevos extra 2pzas — $30
• Queso extra — $20 | Pan dulce — $25 | Tortilla — $3`
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
    await new Promise(r => setTimeout(r, 700));
  }
}

async function notificarDueno(pedido, telefono) {
  const telLimpio = telefono.replace('@s.whatsapp.net', '').replace('52', '');
  const modalidadEmoji = pedido.modalidad === 'DOMICILIO' ? '🏠 Domicilio' : pedido.modalidad === 'LLEVAR' ? '🥡 Para llevar' : '🪑 Comer aquí';
  const direccionInfo = pedido.modalidad === 'DOMICILIO' ? `\n📍 Dirección: ${pedido.direccion}` : '';

  const msg =
`🔔 *Nuevo pedido — Sabor a Mi* 🌮

👤 Cliente: *${pedido.nombre}*
📱 Tel: ${telLimpio}
${modalidadEmoji}${direccionInfo}

🛒 *Pedido:*
${pedido.resumen.replace(/\\n/g, '\n')}

💰 *Total: ${pedido.total}*

_Para avisar que está listo escribe:_
*/listo ${telefono.replace('@s.whatsapp.net', '')}*`;

  await enviarMensaje(DUENO_TEL, msg);
}

function parsearPedido(texto) {
  const match = texto.match(/^PEDIDO_CONFIRMADO:(.+?)\|(.+)\|(\$[\d,]+)\|(\w+)\|(.+)$/s);
  if (!match) return null;
  return {
    nombre: match[1].trim(),
    resumen: match[2].trim(),
    total: match[3].trim(),
    modalidad: match[4].trim(),
    direccion: match[5].trim()
  };
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
      const texto = msg.text?.body?.trim();
      if (!texto) continue;

      console.log(`[${telefono}]: ${texto}`);

      // Comando del dueño: /listo NUMERO
      if (telefono === DUENO_TEL && texto.startsWith('/listo')) {
        const num = texto.split(' ')[1];
        if (num) {
          const telCliente = num.includes('@') ? num : `${num}@s.whatsapp.net`;
          await enviarMensaje(telCliente,
`✅ *¡Tu pedido está listo!* 🎉

Ya puedes pasar a recogerlo 🙌
¡Gracias por preferirnos! 🌮

_Sabor a Mi — Lun a Sáb 8am-5pm_`);
          await enviarMensaje(DUENO_TEL, `✅ Listo, se notificó al cliente ${num} 👍`);
        }
        continue;
      }

      if (!conversaciones[telefono]) conversaciones[telefono] = [];
      conversaciones[telefono].push({ role: 'user', content: texto });
      if (conversaciones[telefono].length > 40) {
        conversaciones[telefono] = conversaciones[telefono].slice(-40);
      }

      const respuesta = await llamarGroq(conversaciones[telefono]);
      conversaciones[telefono].push({ role: 'assistant', content: respuesta });

      const textoLimpio = respuesta.replace(/\|\|\|JSON\{.*?\}\|\|\|/s, '').trim();

      if (textoLimpio === 'MENU_COMPLETO') {
        await enviarMenu(telefono);

      } else if (textoLimpio.startsWith('PEDIDO_CONFIRMADO:')) {
        const pedido = parsearPedido(textoLimpio);
        if (pedido) {
          pedidosConfirmados[telefono] = pedido;
          const resumenFormato = pedido.resumen.replace(/\\n/g, '\n');
          const modalidadTexto = pedido.modalidad === 'DOMICILIO'
            ? `🏠 *Envío a domicilio*\n📍 ${pedido.direccion}\n⏱ Tiempo estimado: *30-40 minutos*`
            : pedido.modalidad === 'LLEVAR'
            ? `🥡 *Para llevar*\n⏱ Tiempo estimado: *20-25 minutos*`
            : `🪑 *Comer en el local*\n⏱ Tiempo estimado: *20-25 minutos*`;

          await enviarMensaje(telefono,
`✅ *¡Pedido confirmado, ${pedido.nombre}!* 🎉

🛒 *Tu pedido:*
${resumenFormato}

💰 *Total: ${pedido.total}*

${modalidadTexto}
Te avisamos cuando esté listo 😊🌮`);
          await notificarDueno(pedido, telefono);
        }

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
