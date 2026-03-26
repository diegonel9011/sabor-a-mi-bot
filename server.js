const express = require('express');
const app = express();
app.use(express.json());

const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
const META_TOKEN = process.env.META_TOKEN;
const META_PHONE_ID = process.env.META_PHONE_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'sabor123';
const DUENO_TEL = '529511976397';

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

DESAYUNOS (todos incluyen café de olla):
- Chilaquiles: salsa roja, verde o frijol + carne a elegir
  * Con Cecina Blanca/Enchilada/Chorizo/Huevos estrellados: $85
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
- Agua de sabor del día (sabor varía cada día, no inventes sabores): litro $35 | medio $20
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
   ✅ SÍ preguntar: carnes para preparar, cortes, especialidades, huevos al gusto, omelette
   ❌ NUNCA preguntar para: chilaquiles, enchiladas verdes, enfrijoladas, enmoladas, entomatadas, memelas, tacos, molletes
   Opciones cuando aplica: Frijoles / Ensalada / Arroz

4. CAFÉ EN DESAYUNOS:
   Todos los desayunos incluyen café de olla sin costo extra.
   Siempre pregunta: "Tu desayuno incluye café ☕, ¿lo prefieres caliente o tibio?"
   NO cobres el café si es parte del desayuno.

5. BEBIDAS TEMPERATURA:
   - Frías: Frío / Al tiempo
   - Calientes (café/atole/té/nescafé): Caliente / Tibio
   - Agua del día: Fría / Al tiempo

6. MEMELAS:
   a) ¿Cuántas memelas quieres? (se venden por pieza)
   b) Por cada una: ¿de qué la quieres?
   c) ¿Con o sin asiento (manteca)?

7. TACOS: ¿Con quesillo o sin quesillo?

8. MOLLETES: Sin frijoles / Sin chorizo / Sin queso manchego / Sin pico de gallo

9. COCCIÓN HUEVO: Tierno / Término medio / Cocido/Dorado

=== FLUJO ===
1. Saluda con emoji y pregunta qué desea ordenar (NO pidas nombre)
2. Si da su nombre úsalo, si no trátalo de "amigo"
3. Toma el pedido con modificadores de forma natural y agrupada
4. Al terminar pregunta modalidad:
   "¿Cómo prefieres recibir tu pedido? 😊
   🏠 Domicilio (gratis dentro de la ciudad)
   🥡 Para llevar
   🪑 Comer aquí en el local"
5. Si elige DOMICILIO: pide dirección completa
6. Muestra resumen con viñetas, modalidad y total
7. Pide confirmación
8. Al confirmar responde EXACTAMENTE:
PEDIDO_CONFIRMADO:[nombre o "Cliente"]|[resumen con \n entre items]|[total con $]|[DOMICILIO/LLEVAR/LOCAL]|[dirección o "local"]

=== REGLAS ===
- Máximo 4-5 líneas por mensaje
- Agrupa preguntas en UN solo mensaje
- NUNCA inventes productos, sabores o info que no esté en el menú
- NUNCA repitas info ya dicha
- Solo vendes lo del menú
- Horario: Lunes a sábado 8am-5pm
- Cuando pidan menú completo responde SOLO: MENU_COMPLETO`;

async function llamarClaude(historial) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: historial
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

const MENU_MENSAJES = [
  `🍳 *DESAYUNOS* _(todos incluyen café)_\n\n• Chilaquiles roja/verde/frijol — $85 (Tasajo $95, sencillos $75)\n• Enchiladas Verdes — $85 (Tasajo $95)\n• Enfrijoladas — $85 (Tasajo $95)\n• Enmoladas — $85 (Tasajo $95)\n• Entomatadas — $85 (Tasajo $95)\n• Huevos al gusto _(con guarnición)_ — $85 (Tocino $95)\n• Omelette _(con guarnición)_ — $95\n\n_🥩 Carnes: Cecina Blanca, Cecina Enchilada, Chorizo, Huevos estrellados o Tasajo_`,
  `🥩 *CARNES Y ESPECIALIDADES*\n_(incluyen guarnición y tortillas)_\n\n• Tasajo — $95\n• Cecina Blanca / Enchilada — $85\n• Chorizo — $85 | Pechuga — $95\n• Mole negro o rojo con cerdo — $85\n• Chuleta marinada parrilla — $85\n• Chuleta de res marinada — $95\n• Picadillo de res — $95\n• Club Sandwich — $130`,
  `🌽 *MEMELAS Y TACOS* _(por pieza)_\n\n• Memela con queso — $20\n• Memela con quesillo — $25\n• Memela con cecina/chorizo/tasajo — $30\n• Taco (quesillo/cecina/chorizo/tasajo) — $35\n\n📅 *PROMOS DEL DÍA*\n• Lunes: Enmoladas 3 pzas — $75\n• Martes: Molletes — $85\n• Miércoles: Desayuno americano — $105\n• Jueves: Memelas especiales — $85\n  _1 queso/quesillo + 2 de carne_`,
  `🥤 *BEBIDAS*\n\n• Agua de sabor del día — litro $35 | medio $20\n• Agua embotellada — medio $15 | litro $20 | 1.2L $25\n• Agua mineral — $27\n• Refresco 600ml (Coca/Sprite/Squirt/Peñafiel) — $27\n• Refresco de vidrio — $25\n• Café / Atole / Té — $15-20\n• Nescafé (agua o leche) — $25\n\n🍞 *EXTRAS*\n\n• Guarnición (arroz/frijoles/sopa/ensalada) — $25-30\n• Carne extra — $35 | Huevos extra 2pzas — $30\n• Queso extra — $20 | Pan dulce — $25 | Tortilla — $3`
];

async function enviarMensajeMeta(telefono, texto) {
  const res = await fetch(`https://graph.facebook.com/v22.0/${META_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${META_TOKEN}` },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: telefono, type: 'text', text: { body: texto } })
  });
  const data = await res.json();
  console.log(`[Meta response]:`, JSON.stringify(data));
}

async function enviarMenu(telefono) {
  for (const seccion of MENU_MENSAJES) {
    await enviarMensajeMeta(telefono, seccion);
    await new Promise(r => setTimeout(r, 700));
  }
}

async function notificarDueno(pedido, telefono) {
  const modalidadEmoji = pedido.modalidad === 'DOMICILIO' ? '🏠 Domicilio' : pedido.modalidad === 'LLEVAR' ? '🥡 Para llevar' : '🪑 Comer aquí';
  const direccionInfo = pedido.modalidad === 'DOMICILIO' ? `\n📍 Dirección: ${pedido.direccion}` : '';
  const msg = `🔔 *Nuevo pedido — Sabor a Mi* 🌮\n\n👤 Cliente: *${pedido.nombre}*\n📱 Tel: ${telefono}\n${modalidadEmoji}${direccionInfo}\n\n🛒 *Pedido:*\n${pedido.resumen.replace(/\\n/g, '\n')}\n\n💰 *Total: ${pedido.total}*\n\n_Para avisar que está listo escribe:_\n*/listo ${telefono}*`;
  await enviarMensajeMeta(DUENO_TEL, msg);
}

function parsearPedido(texto) {
  const match = texto.match(/^PEDIDO_CONFIRMADO:(.+?)\|(.+)\|(\$[\d,]+)\|(\w+)\|(.+)$/s);
  if (!match) return null;
  return { nombre: match[1].trim(), resumen: match[2].trim(), total: match[3].trim(), modalidad: match[4].trim(), direccion: match[5].trim() };
}

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verificado ✅');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    if (!messages || !messages.length) return;

    for (const msg of messages) {
      if (msg.type !== 'text') continue;
      const telefono = msg.from;
      const texto = msg.text?.body?.trim();
      if (!texto) continue;

      console.log(`[${telefono}]: ${texto}`);

      if (telefono === DUENO_TEL && texto.startsWith('/listo')) {
        const num = texto.split(' ')[1];
        if (num) {
          await enviarMensajeMeta(num, `✅ *¡Tu pedido está listo!* 🎉\n\nYa puedes pasar a recogerlo 🙌\n¡Gracias por preferirnos! 🌮\n\n_Sabor a Mi — Lun a Sáb 8am-5pm_`);
          await enviarMensajeMeta(DUENO_TEL, `✅ Cliente ${num} notificado 👍`);
        }
        continue;
      }

      if (!conversaciones[telefono]) conversaciones[telefono] = [];
      conversaciones[telefono].push({ role: 'user', content: texto });
      if (conversaciones[telefono].length > 40) conversaciones[telefono] = conversaciones[telefono].slice(-40);

      const respuesta = await llamarClaude(conversaciones[telefono]);
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
          await enviarMensajeMeta(telefono, `✅ *¡Pedido confirmado, ${pedido.nombre}!* 🎉\n\n🛒 *Tu pedido:*\n${resumenFormato}\n\n💰 *Total: ${pedido.total}*\n\n${modalidadTexto}\nTe avisamos cuando esté listo 😊🌮`);
          await notificarDueno(pedido, telefono);
        }
      } else {
        await enviarMensajeMeta(telefono, textoLimpio);
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
