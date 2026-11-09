import {services} from './content.js';

export function prepareWhatsAppBrief(data,{content,esc,label,arrow}) {
 const service=services.find(s=>s.id===data.service)?.title||'Help finding a direction';
 const message=`Hi FEED7, I'd like to discuss a project.\n\nName: ${data.name}\nEmail: ${data.email}\n${data.company?`Company: ${data.company}\n`:''}${data.phone?`Phone: ${data.phone}\n`:''}Service: ${service}\n\n${data.message}`;
 const href='https://wa.me/96181112046?text='+encodeURIComponent(message);
 content.innerHTML=label('READY WHEN YOU ARE','Your next chapter.<br><em>One conversation away.</em>','Your brief is ready. Open WhatsApp, review the message, and send it to FEED7 to start the conversation.')+`<div class="success-card"><span class="eyebrow">YOUR PROJECT BRIEF</span><h3>${esc(service)}</h3><p class="preserve">${esc(data.message)}</p><a class="button primary" href="${esc(href)}" target="_blank" rel="noopener">Open WhatsApp & send ${arrow}</a><p>Your brief has not been submitted or saved by this website. It is sent only when you press Send in WhatsApp.</p></div>`;
}
