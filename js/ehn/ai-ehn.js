/* Front end LLMParser + api.elhacker.net
 * Script made for foro.elhacker.net by https://github.com/StringManolo
 * DO NOT USE THIS CODE ON OTHER CONTEXTS FOR SECURITY. THE PARSER IS FOR <body>INJECTION_POINT</body>.
*/
window.addEventListener('load', function() {                                            (function() {
  const html = document.documentElement.outerHTML;
  const regex = /<a href="https:\/\/foro\.elhacker\.net\/logout\.html;sesc=([a-z0-9]{32})/;
  const match = html.match(regex);
  if (!match) {
    // Do not run the script if not logged in.
    // To avoid visitors (including bots with js) from triggering the script.
    // A.K.A rate-limit queries to the LLM
    return;
  }


  if (! /^https:\/\/foro\.elhacker\.net\/test(\/.*)?$/.test(window.location.href)) {
    // Only run the script at https://foro.elhacker.net/test/* for debug / security
    return;
  }


  const detectTextPlusMarkdownCode = (text) => {
    const regex = /(```+)([\s\S]*?)\1/g;
    const element = [];
    let lastIndex = 0;
    let match;
    let count = { text: 0, codigo: 0 };

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        count.text++;
        element.push({
          type: 'text',
          name: `text_${count.text}`,
          content: text.slice(lastIndex, match.index),
          raw: text.slice(lastIndex, match.index)
        });
      }

      count.codigo++;
      element.push({
        type: 'codigo',
        name: `block_${count.codigo}`,
        content: match[2],
        raw: match[0],
        separator: match[1],
        numBackticks: match[1].length
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      count.text++;
      element.push({
        type: 'text',
        name: `text_${count.text}`,
        content: text.slice(lastIndex),
        raw: text.slice(lastIndex)
      });
    }

    const result = {};
    element.forEach(item => {
      result[item.name] = item.content;
    });

    return {
      element,
      result,
      sumary: {
        totalBlocks: count.codigo,
        totalTexts: count.text,
        totalElements: element.length
      }
    };
  };

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const replaceDangerousMarkupByEntities = dangMarkup => {
    const replacements = {
      '<': '&lt;',
      '>': '&gt;'
    };
    return dangMarkup.replace(/[<>]/g, char => replacements[char]);
  };

  const replaceDangerousURLByHttpsEncoded = dangURL => {
    const BLOCKED_URL = 'about:blocked';

    if (!dangURL || typeof dangURL !== 'string') {
      return BLOCKED_URL;
    }

    let cleanUrl = dangURL.trim();
    if (cleanUrl === '') {
      return BLOCKED_URL;
    }

    if (/^(javascript:|data:|vbscript:|file:|blob:|ftp:)/i.test(cleanUrl)) {
      return BLOCKED_URL;
    }

    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      const urlObj = new URL(cleanUrl);

      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return BLOCKED_URL;
      }

      if (!urlObj.hostname || urlObj.hostname.includes('..')) {
        return BLOCKED_URL;
      }

      if (isLocalHost(urlObj.hostname)) {
        return BLOCKED_URL;
      }

      const hostname = encodeURIComponent(urlObj.hostname);
      const port = urlObj.port ? `:${urlObj.port}` : '';
      const path = encodeURI(urlObj.pathname + urlObj.search + urlObj.hash)
        .replace(/%20/g, '+')
        .replace(/'/g, '%27')
        .replace(/"/g, '%22');

      return `${urlObj.protocol}//${hostname}${port}${path}`;
    } catch (error) {
      return BLOCKED_URL;
    }
  };

  const isLocalHost = (hostname) => {
    if (!hostname) return true;

    const host = hostname.toLowerCase();

    if (host === 'localhost' ||
      host === 'local.host' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0') {
      return true;
    }

    if (isPrivateIP(host)) {
      return true;
    }

    return false;
  };

  const isPrivateIP = (ip) => {
    if (ip === '::1' || ip === '0.0.0.0') return true;

    const privateIPPatterns = [
      /^10\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i,
      /^172\.(1[6-9]|2\d|3[0-1])\.(\d{1,3})\.(\d{1,3})$/i,
      /^192\.168\.(\d{1,3})\.(\d{1,3})$/i,
      /^169\.254\.(\d{1,3})\.(\d{1,3})$/i,
      /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i,
      /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.(\d{1,3})\.(\d{1,3})$/i,
      /^fc00:/i,
      /^fd00:/i,
      /^fe80:/i,
      /^::1$/i,
      /^::ffff:(0:)?10\./i,
      /^::ffff:(0:)?172\.(1[6-9]|2\d|3[0-1])\./i,
      /^::ffff:(0:)?192\.168\./i,
      /^::ffff:(0:)?169\.254\./i,
      /^::ffff:(0:)?127\./i
    ];

    return privateIPPatterns.some(pattern => pattern.test(ip));
  };

  const replaceMarkdownByHTML = markdown => {
    let safeText = escapeHtml(markdown);

    let processed = safeText
      .replace(/^\s*(?:---|\*\*\*)\s*$/gm, '<hr>')
      .replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>')
      .replace(/(\*|_)(.*?)\1/g, '<em>$2</em>')
      .replace(/\+\+(.*?)\+\+/g, '<span style="text-decoration: underline">$1</span>')
      .replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');

    processed = processed
      .split('\n')
      .map(line => {
        if (line.match(/^\s*[-*]\s+/)) {
          const content = line.replace(/^\s*[-*]\s+/, '');
          return `<li>${content}</li>`;
        }
        return line;
      })
      .join('\n')
      .replace(/(<li>.*?<\/li>)(\s*<li>)/gs, '$1$2')
      .replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)+/gs, match => {
        return `<ul>${match}</ul>`;
      })
      .replace(/<\/ul>\s*<ul>/g, '');

    processed = processed
      .replace(/!\[([^\]]*?)\]\(\s*([^)]+?)\s*\)/g, (match, alt, url) => {
        const safeUrl = replaceDangerousURLByHttpsEncoded(url);
        return `<img src="${safeUrl}" alt="${alt}" style="max-width: 100%; height: auto;">`;
      })
      .replace(/\[([^\]]+?)\]\(\s*([^)]+?)\s*\)/g, (match, text, url) => {
        const safeUrl = replaceDangerousURLByHttpsEncoded(url);
        return `<a href="${safeUrl}" rel="nofollow noopener noreferrer" target="_blank">${text}</a>`;
      });

    return processed;
  };

  const processCodeBlock = (content) => {
    const escapedContent = escapeHtml(content);
    return `<div class="code"><pre><code>${escapedContent}</code></pre></div>`;
  };

  const LLMParser = (untrustedText) => {
    const { element } = detectTextPlusMarkdownCode(untrustedText);

    const parsedElements = element.map(item => {
      if (item.type === 'codigo') {
        return processCodeBlock(item.content);
      } else {
        return replaceMarkdownByHTML(item.raw);
      }
    });

    return parsedElements.join('');
  };

  console.log('[AIehn-debug]Iniciando AIehnBOT - Experto en hacking e informática...');

  function extractTopicContent() {
    console.log('[AIehn-debug]Extrayendo contenido del tema...');
    const topicTitle = document.querySelector('tr.titlebg td:nth-child(2)')?.textContent || 'Tema del foro';
    console.log('[AIehn-debug]Título del tema:', topicTitle);

    const messages = [];
    const messageContainers = document.querySelectorAll('td.windowbg, td.windowbg2');

    messageContainers.forEach((container, index) => {
      const authorElement = container.querySelector('b a');
      const contentElement = container.querySelector('.post');

      if (authorElement && contentElement) {
        const author = authorElement.textContent.trim();
        const content = contentElement.textContent.trim();

        if (content && !content.includes('Mensaje generado por IA')) {
          console.log(`[AIehn-debug]Mensaje ${index + 1} de ${author}:`, content.substring(0, 100) + '...');
          messages.push({
            author: author,
            content: content
          });
        }
      }
    });

    console.log(`[AIehn-debug]Total de mensajes extraídos: ${messages.length}`);

    const context = `Eres AIehnBOT, un experto en seguridad informática, hacking ético y tecnología con amplios conocimientos técnicos. Eres miembro activo del foro elhacker.net.

Tema actual: "${topicTitle}"

Conversación hasta ahora:
${messages.map(msg => `${msg.author}: ${msg.content}`).join('\n\n')}

Responde como un experto en informática y hacking:
- Proporciona información técnica precisa y útil
- Si es relevante, aporta perspectiva de seguridad informática
- Mantén un tono de compañero del foro, natural y accesible
- Responde en español
- Sé conciso pero informativo
- No menciones que eres una IA`;

    return {
      context: context,
      messageCount: messages.length
    };
  }

  function createPlaceholderMessage() {
    console.log('[AIehn-debug]Creando mensaje placeholder...');
    const now = new Date();
    const dateString = now.toLocaleDateString('es-ES');
    const timeString = now.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
    const topicTitle = document.querySelector('tr.titlebg td:nth-child(2)')?.textContent || 'Tema del foro';

    const placeholderMessage = document.createElement('tr');
    placeholderMessage.innerHTML = `
      <td style="padding: 1px 1px 0 1px;">
        <a name="msg${Date.now()}"></a>
        <table width="100%" cellpadding="3" cellspacing="0" border="0">
          <tbody>
            <tr>
              <td style="background-color: #f8f8f8;">
                <table width="100%" cellpadding="5" cellspacing="0" style="table-layout: fixed;">
                  <tbody>
                    <tr>
                      <td valign="top" width="16%" rowspan="2" style="overflow: hidden;">
                        <b><a href="javascript:void(0)" title="Ver perfil de AIehnBOT">AIehnBOT</a></b>
                        <div class="smalltext">
                          <br>
                          <img src="https://foro.elhacker.net/Themes/converted/images/useroff.gif" alt="Desconectado" border="0" align="middle"><span class="smalltext"> Desconectado</span><br><br>
                          Mensajes: 1<br>
                          <br>
                          <div style="overflow: auto; width: 100%;"><img src="https://foro.elhacker.net/Themes/converted/selogo.jpg" alt="" class="avatar" border="0" style="max-width: 100px;"></div><br>
                          Experto en Seguridad<br>
                          <br>
                          <a href="javascript:void(0)"><img src="https://foro.elhacker.net/Themes/converted/images/icons/profile_sm.gif" alt="Ver Perfil" title="Ver Perfil" border="0"></a>
                        </div>
                      </td>
                      <td valign="top" width="85%" height="100%">
                        <table width="100%" border="0">
                          <tbody>
                            <tr>
                              <td align="left" valign="middle"><a href="javascript:void(0)"><img src="https://foro.elhacker.net/Themes/converted/images/post/xx.gif" alt="" border="0"></a></td>
                              <td align="left" valign="middle">
                                <b><a href="javascript:void(0)">Re: ${LLMParser(topicTitle)}</a></b>
                                <div class="smalltext">« <b>Respuesta en:</b> ${dateString}, ${timeString} »</div>
                              </td>
                              <td align="right" valign="bottom" height="20" nowrap="nowrap" style="font-size: smaller;">
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <hr width="100%" size="1" class="hrcolor">
                        <div class="post" style="overflow: auto; width: 100%;">
                          <em>Generando respuesta ...</em>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td valign="bottom" class="smalltext" width="85%">
                        <table width="100%" border="0" style="table-layout: fixed;">
                          <tbody>
                            <tr>
                              <td align="left" colspan="2" class="smalltext" width="100%">
                              </td>
                            </tr>
                            <tr>
                              <td align="left" valign="bottom" class="smalltext">
                              </td>
                              <td align="right" valign="bottom" class="smalltext">
                                <img src="https://foro.elhacker.net/Themes/converted/images/ip.gif" alt="" border="0">
                                En línea
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <hr width="100%" size="1" class="hrcolor">
                        <div style="overflow: auto; width: 100%; padding-bottom: 3px;" class="signature">
                          <em>Especialista en seguridad informatica y hacking etico</em>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    `;

    return placeholderMessage;
  }

  function updateMessageWithContent(messageElement, content) {
    const postElement = messageElement.querySelector('.post');
    if (postElement) {
      postElement.innerHTML = content.replace(/\n/g, '<br>');
    }
    return messageElement;
  }

  async function consultarIA(prompt) {
    try {
      console.log('[AIehn-debug]Consultando a la IA como experto en hacking...');
      console.log('[AIehn-debug]URL de la API: https://api.elhacker.net/api/chat');

      const response = await fetch('https://api.elhacker.net/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gemma3:27b-it-fp16",
          messages: [{ role: "user", content: prompt }],
          stream: false
        })
      });

      console.log(`[AIehn-debug]Estado de la respuesta: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AIehn-debug]Respuesta de la API recibida correctamente');

      if (!data.message || !data.message.content) {
        throw new Error('Respuesta de la API en formato incorrecto');
      }

      console.log('[AIehn-debug]Respuesta generada:', data.message.content.substring(0, 200) + '...');
      return data.message.content;
    } catch (error) {
      console.error('[AIehn-debug]Error al consultar la API:', error);
      throw error;
    }
  }

  function insertMessageToForum(messageElement, numMensajesReales) {
    console.log('[AIehn-debug]Buscando donde insertar el mensaje...');
    let insertionPoint = null;
    let estrategiaUsada = null;
    const messageAnchors = document.querySelectorAll('a[name^="msg"]');
    console.log(`[AIehn-debug]Mensajes encontrados por anchor: ${messageAnchors.length}`);
    console.log(`[AIehn-debug]Número de mensajes reales extraídos: ${numMensajesReales}`);

    // ESTRATEGIA 1: Para múltiples mensajes - usar anchors
    if (numMensajesReales > 1 && messageAnchors.length > 0) {
      console.log('[AIehn-debug]Usando ESTRATEGIA 1 (múltiples mensajes): por anchors de mensajes...');
      const lastAnchor = messageAnchors[messageAnchors.length - 1];
      console.log('[AIehn-debug]Último anchor encontrado:', lastAnchor.name);
      insertionPoint = lastAnchor.closest('tr');
      if (insertionPoint) {
        estrategiaUsada = 1;
        console.log('[AIehn-debug]ESTRATEGIA 1 exitosa - Usando anchors de mensajes para múltiples mensajes');
      }
    }

    // ESTRATEGIA 2: Para 0 o 1 mensaje - buscar tabla principal
    if (!insertionPoint) {
      console.log('[AIehn-debug]Usando ESTRATEGIA 4 (0-1 mensajes): buscar tabla principal de mensajes...');
      const allMessageTables = document.querySelectorAll('table.bordercolor');

      for (let table of allMessageTables) {
        const hasPost = table.querySelector('.post');
        const hasWindowbg = table.querySelector('.windowbg, .windowbg2');
        const isSimilarMessages = table.closest('.tborder') &&
                                 table.previousElementSibling &&
                                 table.previousElementSibling.querySelector('.titlebg');

        if (hasPost && hasWindowbg && !isSimilarMessages) {
          console.log('[AIehn-debug]Tabla de mensajes principal encontrada');

          const lastMessageRow = table.querySelector('tr:last-child');
          if (lastMessageRow) {
            insertionPoint = lastMessageRow;
            estrategiaUsada = 4;
            console.log('[AIehn-debug]ESTRATEGIA 4 exitosa - Usando tabla principal para pocos mensajes');
            break;
          }
        }
      }
    }

    if (!insertionPoint) {
      console.error('[AIehn-debug]No se pudo encontrar dónde insertar el mensaje');
      console.log('[AIehn-debug]Estructura HTML disponible:');
      console.log('- Tablas .bordercolor:', document.querySelectorAll('table.bordercolor').length);
      console.log('- Mensajes .post:', document.querySelectorAll('.post').length);
      console.log('- Anchors de msg:', document.querySelectorAll('a[name^="msg"]').length);
      return false;
    }

    console.log(`[AIehn-debug]Punto de inserción encontrado usando ESTRATEGIA ${estrategiaUsada}`);

    insertionPoint.parentNode.insertBefore(messageElement, insertionPoint.nextSibling);
    console.log(`[AIehn-debug]Mensaje insertado correctamente usando ESTRATEGIA ${estrategiaUsada}`);

    setTimeout(() => {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      console.log('[AIehn-debug]Scroll al nuevo mensaje');
    }, 500);

    return true;
  }

  async function generateResponse() {
    let placeholderMessage = null;

    try {
      console.log('[AIehn-debug]Iniciando generación de respuesta...');

      // Primero extraemos el contenido para saber cuántos mensajes reales hay
      console.log('[AIehn-debug]Analizando el tema del foro...');
      const { context, messageCount } = extractTopicContent();

      placeholderMessage = createPlaceholderMessage();
      if (!insertMessageToForum(placeholderMessage, messageCount)) {
        console.error('[AIehn-debug]No se pudo insertar el mensaje placeholder en el foro');
        return false;
      }

      console.log('[AIehn-debug]Placeholder insertado, consultando API...');
      const response = await consultarIA(context);

      console.log('[AIehn-debug]Parseando Respuesta con LLMParser...');
      const safeResponse = LLMParser(response);

      console.log('[AIehn-debug]Actualizando placeholder con respuesta real...');
      updateMessageWithContent(placeholderMessage, safeResponse);

      console.log('[AIehn-debug]AIehnBOT ha respondido al tema exitosamente!');
      console.log('[AIehn-debug]Respuesta generada desde perspectiva de seguridad informática');

      return true;
    } catch (error) {
      if (placeholderMessage && placeholderMessage.parentNode) {
        console.log('[AIehn-debug]Eliminando placeholder debido a error...');
        placeholderMessage.parentNode.removeChild(placeholderMessage);
      }

      console.error('[AIehn-debug]No se pudo generar la respuesta de la IA. El mensaje NO se ha insertado en el foro.');
      console.error('[AIehn-debug]Detalles del error:', error.message);
      return false;
    }
  }

  console.log('[AIehn-debug]Ejecutando script principal...');
  generateResponse().then((success) => {
    if (success) {
      console.log('[AIehn-debug]Script ejecutado exitosamente');
    } else {
      console.log('[AIehn-debug]Script completado con advertencias');
    }
  });
})();
});
