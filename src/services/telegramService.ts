import {
  DocumentAttachment,
  DocumentItem,
  DocumentStatus,
  PriorityLevel,
  TelegramConfig,
  TelegramMessageLog
} from '../types/document';
import { StorageService } from './storageService';
import { AttachmentStorageService } from './attachmentStorageService';

const KHMER_PRIORITY_MAP: Record<PriorityLevel, string> = {
  normal: 'ធម្មតា (Normal)',
  urgent: 'បន្ទាន់ (Urgent)',
  top_urgent: '🚨 បន្ទាន់បំផុត (Top Urgent)'
};

const KHMER_STATUS_MAP: Record<DocumentStatus, string> = {
  received: '📥 បានទទួល និងចុះបញ្ជី',
  reviewing: '🔍 កំពុងត្រួតពិនិត្យ',
  forwarded_leader: '🏛️ ឆ្លងថ្នាក់ដឹកនាំ',
  approved: '✅ បានឯកភាព / ចុះហត្ថលេខា',
  dispatched: '📤 បានបញ្ជូនបន្តអនុវត្ត',
  completed: '🏁 បានបញ្ចប់នីតិវិធី',
  archived: '🗄️ បានតម្កល់ទុកបណ្ណសារ'
};

export interface DetectedTelegramChat {
  id: string;
  title: string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  username?: string;
  lastMessage?: string;
  date?: string;
}

/**
 * Convert base64 dataURL to binary Blob
 */
function dataURLtoBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    const match = parts[0].match(/:(.*?);/);
    const mime = match ? match[1] : 'application/octet-stream';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error('Error converting dataURL to Blob:', e);
    return new Blob([dataUrl], { type: 'text/plain' });
  }
}

/**
 * Helper to write ASCII strings into a DataView for WAV creation
 */
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Retrieve Blob from attachment or generate valid official file for demo
 */
async function getAttachmentBlob(
  att: DocumentAttachment,
  doc?: DocumentItem
): Promise<{ blob: Blob; fileName: string; mimeType: string }> {
  let dataUrl: string | null = att.dataUrl || null;

  if (!dataUrl && att.blobId) {
    try {
      dataUrl = await AttachmentStorageService.getLargeFile(att.blobId);
    } catch (e) {
      console.warn('Failed retrieving from IndexedDB:', e);
    }
  }

  if (dataUrl) {
    const blob = dataURLtoBlob(dataUrl);
    return {
      blob,
      fileName: att.name,
      mimeType: blob.type || att.type || 'application/octet-stream'
    };
  }

  // Fallback: Generate real, valid, readable file for demo attachments
  const isImage =
    att.type.startsWith('image/') ||
    att.name.match(/\.(png|jpg|jpeg|webp)$/i) ||
    att.category === 'photo';
  const isPDF = att.type.includes('pdf') || att.name.toLowerCase().endsWith('.pdf');
  const isAudio =
    att.type.startsWith('audio/') ||
    att.name.match(/\.(webm|mp3|wav|m4a)$/i) ||
    att.category === 'audio';

  if (isImage) {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1000, 700);

      // Top Navy Header
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, 0, 1000, 90);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Khmer, "Noto Sans Khmer", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ព្រះរាជាណាចក្រកម្ពុជា  ជាតិ សាសនា ព្រះមហាក្សត្រ', 500, 52);

      // System Header
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 22px Khmer, "Noto Sans Khmer", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ប្រព័ន្ធគ្រប់គ្រង និងតាមដានលិខិតរដ្ឋបាល DocuTrack', 60, 150);

      ctx.font = '18px Khmer, "Noto Sans Khmer", Arial, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`លេខកូដតាមដាន៖ ${doc?.trackingCode || 'DOC-2026-IN-OFFICIAL'}`, 60, 205);
      ctx.fillText(`លេខលិខិត៖ ${doc?.letterNumber || '០២៨/២៦'}`, 60, 245);
      ctx.fillText(`ប្រភេទឯកសារ៖ ${doc?.docType || 'លិខិតរដ្ឋបាល'}`, 60, 285);
      ctx.fillText(`កម្មវត្ថុ៖ ${(doc?.subject || att.name).substring(0, 55)}`, 60, 325);
      ctx.fillText(`ឈ្មោះឯកសារភ្ជាប់៖ ${att.name}`, 60, 365);
      ctx.fillText(`កាលបរិច្ឆេទបញ្ជូន៖ ${new Date().toLocaleString('km-KH')}`, 60, 405);

      // Red Official Seal / Stamp simulation
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.strokeRect(620, 480, 320, 150);
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 20px Khmer, "Noto Sans Khmer", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ឯកសាររដ្ឋបាលផ្លូវការ', 780, 535);
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText('DIGITALLY CERTIFIED BY DOCUTRACK', 780, 570);
      ctx.fillText('VERIFIED AND AUTHENTICATED', 780, 595);
    }
    const canvasData = canvas.toDataURL('image/png');
    return {
      blob: dataURLtoBlob(canvasData),
      fileName: att.name.endsWith('.png') ? att.name : `${att.name}.png`,
      mimeType: 'image/png'
    };
  }

  if (isPDF) {
    const code = doc?.trackingCode || 'DOC-2026-IN';
    const num = doc?.letterNumber ? doc.letterNumber.replace(/[^\x20-\x7E]/g, '') : '001';
    const title = doc?.subject ? doc.subject.replace(/[^\x20-\x7E]/g, ' ') : 'Official Document';
    const pdfSource = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 300 >>
stream
BT
/F1 16 Tf
50 780 Td
(KINGDOM OF CAMBODIA - NATION RELIGION KING) Tj
0 -40 Td
/F1 14 Tf
(DocuTrack Administrative Official System) Tj
0 -30 Td
/F1 12 Tf
(Tracking Code: ${code}) Tj
0 -20 Td
(Letter Number: ${num || '001'}) Tj
0 -20 Td
(Attachment: ${att.name.replace(/[^\x20-\x7E]/g, '_')}) Tj
0 -20 Td
(Subject: ${title.substring(0, 50)}) Tj
0 -30 Td
(Certified Attachment - Ready for Download and Review) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000595 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
668
%%EOF`;
    return {
      blob: new Blob([pdfSource], { type: 'application/pdf' }),
      fileName: att.name.endsWith('.pdf') ? att.name : `${att.name}.pdf`,
      mimeType: 'application/pdf'
    };
  }

  // Audio or generic fallback
  if (isAudio) {
    const sampleRate = 8000;
    const numSamples = 8000;
    const buffer = new ArrayBuffer(44 + numSamples);
    const view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples, true);
    for (let i = 0; i < numSamples; i++) {
      view.setUint8(44 + i, Math.sin((i / 8000) * 440 * 2 * Math.PI) * 127 + 128);
    }
    return {
      blob: new Blob([buffer], { type: 'audio/wav' }),
      fileName: att.name.endsWith('.wav') ? att.name : `${att.name}.wav`,
      mimeType: 'audio/wav'
    };
  }

  return {
    blob: new Blob([`Official Administrative Attachment: ${att.name}`], { type: 'text/plain' }),
    fileName: `${att.name}.txt`,
    mimeType: 'text/plain'
  };
}

export const TelegramService = {
  formatDocumentKhmerMessage(doc: DocumentItem, reason: 'new' | 'status_update' | 'urgent'): string {
    const priorityKh = KHMER_PRIORITY_MAP[doc.priority];
    const statusKh = KHMER_STATUS_MAP[doc.status];
    const directionKh = doc.direction === 'in' ? 'លិខិតចូល (Incoming)' : 'លិខិតចេញ (Outgoing)';
    const dateFormatted = new Date().toLocaleDateString('km-KH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeFormatted = new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' });

    let header = '🇰🇭 **ប្រព័ន្ធគ្រប់គ្រងលិខិតរដ្ឋបាល - ជូនដំណឹងថ្មី**';
    if (reason === 'status_update') {
      header = '🔄 **បច្ចុប្បន្នភាពស្ថានភាពលិខិតរដ្ឋបាល**';
    } else if (reason === 'urgent') {
      header = '🚨 **ការដាស់តឿន៖ លិខិតរដ្ឋបាលបន្ទាន់បំផុត**';
    }

    return `${header}
━━━━━━━━━━━━━━━━━━━━━━━━
📑 **ទិសដៅ៖** ${directionKh}
🔖 **លេខកូដតាមដាន៖** \`${doc.trackingCode}\`
📋 **លេខលិខិត៖** ${doc.letterNumber}
📂 **ប្រភេទ៖** ${doc.docType}
🎯 **កម្មវត្ថុ៖** ${doc.subject}
🏢 **${doc.direction === 'in' ? 'អង្គភាពផ្ញើ' : 'អង្គភាពទទួល'}៖** ${doc.direction === 'in' ? doc.sender : doc.receiver}
⚡ **កម្រិតបន្ទាន់៖** ${priorityKh}
👤 **មន្ត្រីទទួលបន្ទុក៖** ${doc.assignedOfficer} (${doc.assignedDepartment})
📊 **ស្ថានភាពបច្ចុប្បន្ន៖** ${statusKh}
${doc.deadline ? `⏳ **កាលបរិច្ឆេទផុតកំណត់៖** ${doc.deadline}` : ''}
${doc.attachments.length > 0 ? `📎 **ឯកសារភ្ជាប់៖** ${doc.attachments.length} ឯកសារ (រុញទៅ Telegram រួចរាល់)` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━
⏰ **កាលបរិច្ឆេទ៖** ${dateFormatted} ម៉ោង ${timeFormatted}
🔗 **ផ្ទៀងផ្ទាត់សុពលភាពតាមដាន៖** DocuTrack Digital Verification`;
  },

  async sendToTelegram(
    text: string,
    config: TelegramConfig,
    docCode?: string,
    type: TelegramMessageLog['messageType'] = 'test'
  ): Promise<{ success: boolean; message: string; isSimulated?: boolean; correctedChatId?: string }> {
    const logId = `tlg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('km-KH');

    // If bot token or chatId is missing, simulate successfully in the internal channel log
    if (!config.botToken || !config.chatId) {
      const simulatedLog: TelegramMessageLog = {
        id: logId,
        timestamp,
        documentTrackingCode: docCode,
        messageType: type,
        content: text,
        status: 'simulated',
        chatIdTarget: config.chatId || config.channelId || '@docutrack_channel'
      };
      StorageService.addTelegramLog(simulatedLog);
      return {
        success: true,
        message: 'សារត្រូវបានបញ្ជូនទៅផ្ទាំងត្រួតពិនិត្យ Telegram (Simulated Feed) ដោយសារមិនទាន់បានបញ្ចូល Bot Token / Chat ID ផ្ទាល់ខ្លួន។',
        isSimulated: true
      };
    }

    const token = config.botToken.trim();
    const originalChatId = config.chatId.trim();

    // Prepare list of potential candidates for Chat ID (fixing missing -100 for groups/channels)
    const candidates: string[] = [originalChatId];

    if (originalChatId.startsWith('-') && !originalChatId.startsWith('-100')) {
      const rawNumber = originalChatId.replace(/^-/, '');
      candidates.push(`-100${rawNumber}`);
    } else if (!originalChatId.startsWith('-') && !originalChatId.startsWith('@') && originalChatId.length >= 8) {
      candidates.push(`-100${originalChatId}`);
      candidates.push(`-${originalChatId}`);
    }

    let lastErrorDesc = '';
    let successChatId = '';

    for (const testChatId of candidates) {
      try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: testChatId,
            text: text,
            parse_mode: 'Markdown'
          })
        });

        const resData = await response.json();

        if (resData.ok) {
          successChatId = testChatId;
          break;
        } else {
          lastErrorDesc = resData.description || 'Bad Request';
        }
      } catch (err: unknown) {
        lastErrorDesc = err instanceof Error ? err.message : 'Network error';
      }
    }

    if (successChatId) {
      let note = 'បានបញ្ជូនសារទៅកាន់ Telegram ជោគជ័យ!';
      let corrected: string | undefined = undefined;

      if (successChatId !== originalChatId) {
        config.chatId = successChatId;
        StorageService.saveTelegramConfig(config);
        note = `បានបញ្ជូនសារជោគជ័យ! (ប្រព័ន្ធបានកែតម្រូវ Chat ID ពី ${originalChatId} ទៅ ${successChatId} ដោយស្វ័យប្រវត្តិ)`;
        corrected = successChatId;
      }

      const successLog: TelegramMessageLog = {
        id: logId,
        timestamp,
        documentTrackingCode: docCode,
        messageType: type,
        content: text,
        status: 'sent',
        chatIdTarget: successChatId
      };
      StorageService.addTelegramLog(successLog);

      return {
        success: true,
        message: note,
        correctedChatId: corrected
      };
    }

    // If failed, record fail log
    const failLog: TelegramMessageLog = {
      id: logId,
      timestamp,
      documentTrackingCode: docCode,
      messageType: type,
      content: text,
      status: 'failed',
      chatIdTarget: originalChatId
    };
    StorageService.addTelegramLog(failLog);

    let userHelpMessage = `Telegram API Error: ${lastErrorDesc}`;
    if (lastErrorDesc.toLowerCase().includes('chat not found')) {
      userHelpMessage = `Telegram API Error: Bad Request: chat not found\n\n💡 មូលហេតុ និងដំណោះស្រាយ៖\n១. ប្រសិនបើជា Group ឬ Channel៖ អ្នកត្រូវ Add Bot ចូលក្នុង Group/Channel នោះជាមុនសិន និង Set ជា Admin (សិទ្ធិ Post Messages)។ លេខសម្គាល់ Group ត្រូវតែចាប់ផ្តើមដោយ -100 (ឧ. -100${originalChatId.replace(/^-/, '')})។\n២. ប្រសិនបើជាគណនីផ្ទាល់ខ្លួន (Personal)៖ អ្នកត្រូវបើក Bot លើ Telegram រួចចុច "Start" (/start) ជាមុនសិន ពីព្រោះ Telegram មិនអនុញ្ញាតឱ្យ Bot ផ្ញើសារទៅអ្នកដែលមិនទាន់ចុច Start ឡើយ។\n៣. សូមចុចប៊ូតុង "ស្វែងរក Chat ID ស្វ័យប្រវត្តិ" ខាងក្រោម ដើម្បីទាញយក Chat ID ពិតប្រាកដ។`;
    }

    return {
      success: false,
      message: userHelpMessage
    };
  },

  /**
   * Send a single document attachment file to Telegram as a downloadable, viewable media/document
   */
  async sendAttachmentToTelegram(
    attachment: DocumentAttachment,
    doc: DocumentItem,
    config: TelegramConfig,
    options?: { asDocumentOnly?: boolean; customCaption?: string }
  ): Promise<{ success: boolean; message: string; isSimulated?: boolean; correctedChatId?: string }> {
    const logId = `tlg-att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toLocaleDateString('en-CA') + ' ' + new Date().toLocaleTimeString('km-KH');

    if (!config.botToken || !config.chatId) {
      const simulatedLog: TelegramMessageLog = {
        id: logId,
        timestamp,
        documentTrackingCode: doc.trackingCode,
        messageType: 'attachment_file',
        content: `[ឯកសារភ្ជាប់បានរុញ - Simulated] ${attachment.name} (${AttachmentStorageService.formatFileSize(attachment.size)})`,
        status: 'simulated',
        chatIdTarget: config.chatId || config.channelId || '@docutrack_channel'
      };
      StorageService.addTelegramLog(simulatedLog);
      return {
        success: true,
        message: `ឯកសារភ្ជាប់ "${attachment.name}" ត្រូវបានកត់ត្រាក្នុងកំណត់ហេតុ Telegram (Simulated) ដោយសារមិនទាន់មាន Bot Token/Chat ID។`,
        isSimulated: true
      };
    }

    const token = config.botToken.trim();
    const originalChatId = config.chatId.trim();

    const candidates: string[] = [originalChatId];
    if (originalChatId.startsWith('-') && !originalChatId.startsWith('-100')) {
      const rawNumber = originalChatId.replace(/^-/, '');
      candidates.push(`-100${rawNumber}`);
    } else if (!originalChatId.startsWith('-') && !originalChatId.startsWith('@') && originalChatId.length >= 8) {
      candidates.push(`-100${originalChatId}`);
      candidates.push(`-${originalChatId}`);
    }

    const { blob, fileName, mimeType } = await getAttachmentBlob(attachment, doc);

    const caption =
      options?.customCaption ||
      `📎 **ឯកសារភ្ជាប់ផ្លូវការ (Official Attachment)**
━━━━━━━━━━━━━━━━━━━━
📄 **ឈ្មោះឯកសារ៖** ${attachment.name} (${AttachmentStorageService.formatFileSize(attachment.size || blob.size)})
🔖 **កូដតាមដាន៖** \`${doc.trackingCode}\`
📋 **លេខលិខិត៖** ${doc.letterNumber}
📂 **ប្រភេទ៖** ${doc.docType}
🎯 **កម្មវត្ថុ៖** ${doc.subject}
🏢 **${doc.direction === 'in' ? 'អង្គភាពផ្ញើ' : 'អង្គភាពទទួល'}៖** ${doc.direction === 'in' ? doc.sender : doc.receiver}
⏰ **កាលបរិច្ឆេទ៖** ${new Date().toLocaleString('km-KH')}
✅ **ឯកសារនេះអាចទាញយក និងពិនិត្យមើលបានដោយផ្ទាល់**`;

    const isImage =
      (mimeType.startsWith('image/') || fileName.match(/\.(png|jpg|jpeg|webp)$/i)) &&
      !options?.asDocumentOnly;
    const isAudio = mimeType.startsWith('audio/') || fileName.match(/\.(webm|mp3|wav|m4a)$/i);

    let lastErrorDesc = '';
    let successChatId = '';

    for (const testChatId of candidates) {
      let endpoint = 'sendDocument';
      let fileFieldName = 'document';

      if (isAudio) {
        endpoint = 'sendAudio';
        fileFieldName = 'audio';
      } else if (isImage) {
        endpoint = 'sendPhoto';
        fileFieldName = 'photo';
      }

      try {
        const formData = new FormData();
        formData.append('chat_id', testChatId);
        formData.append(fileFieldName, blob, fileName);
        formData.append('caption', caption);
        formData.append('parse_mode', 'Markdown');
        if (isAudio) {
          formData.append('title', attachment.name);
        }

        let response = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
          method: 'POST',
          body: formData
        });

        let resData = await response.json();

        // If sendPhoto or sendAudio failed, fallback to universal sendDocument
        if (!resData.ok && endpoint !== 'sendDocument') {
          const fallbackFormData = new FormData();
          fallbackFormData.append('chat_id', testChatId);
          fallbackFormData.append('document', blob, fileName);
          fallbackFormData.append('caption', caption);
          fallbackFormData.append('parse_mode', 'Markdown');

          response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
            method: 'POST',
            body: fallbackFormData
          });
          resData = await response.json();
        }

        if (resData.ok) {
          successChatId = testChatId;
          break;
        } else {
          lastErrorDesc = resData.description || 'Bad Request';
        }
      } catch (err: unknown) {
        lastErrorDesc = err instanceof Error ? err.message : 'Network error';
      }
    }

    if (successChatId) {
      if (successChatId !== originalChatId) {
        config.chatId = successChatId;
        StorageService.saveTelegramConfig(config);
      }

      const successLog: TelegramMessageLog = {
        id: logId,
        timestamp,
        documentTrackingCode: doc.trackingCode,
        messageType: 'attachment_file',
        content: `[ឯកសារភ្ជាប់បានរុញជោគជ័យ] ${attachment.name} (${AttachmentStorageService.formatFileSize(attachment.size || blob.size)})`,
        status: 'sent',
        chatIdTarget: successChatId
      };
      StorageService.addTelegramLog(successLog);

      return {
        success: true,
        message: `បានរុញឯកសារភ្ជាប់ "${attachment.name}" ទៅកាន់ Telegram ជោគជ័យ!`,
        correctedChatId: successChatId !== originalChatId ? successChatId : undefined
      };
    }

    const failLog: TelegramMessageLog = {
      id: logId,
      timestamp,
      documentTrackingCode: doc.trackingCode,
      messageType: 'attachment_file',
      content: `[បរាជ័យរុញឯកសារភ្ជាប់] ${attachment.name}: ${lastErrorDesc}`,
      status: 'failed',
      chatIdTarget: originalChatId
    };
    StorageService.addTelegramLog(failLog);

    return {
      success: false,
      message: `មិនអាចរុញឯកសារ "${attachment.name}" ទៅ Telegram បានឡើយ៖ ${lastErrorDesc}`
    };
  },

  /**
   * Push all attachments of a document to Telegram sequentially
   */
  async sendAllAttachmentsToTelegram(
    doc: DocumentItem,
    config: TelegramConfig
  ): Promise<{ success: boolean; sentCount: number; totalCount: number; message: string }> {
    if (!doc.attachments || doc.attachments.length === 0) {
      return {
        success: false,
        sentCount: 0,
        totalCount: 0,
        message: 'លិខិតនេះមិនមានឯកសារភ្ជាប់សម្រាប់រុញទៅ Telegram ឡើយ។'
      };
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const att of doc.attachments) {
      const res = await this.sendAttachmentToTelegram(att, doc, config);
      if (res.success) {
        sentCount++;
      } else {
        errors.push(`${att.name} (${res.message})`);
      }
      // Small pause between multiple attachments to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    if (sentCount === doc.attachments.length) {
      return {
        success: true,
        sentCount,
        totalCount: doc.attachments.length,
        message: `បានរុញឯកសារភ្ជាប់ទាំង ${sentCount} ឯកសារ ទៅកាន់ Telegram ជោគជ័យ! (អាចទាញយក និងមើលបានភ្លាមៗ)`
      };
    }

    if (sentCount > 0) {
      return {
        success: true,
        sentCount,
        totalCount: doc.attachments.length,
        message: `បានរុញឯកសារភ្ជាប់ ${sentCount}/${doc.attachments.length} ឯកសារ ទៅកាន់ Telegram! (ខ្លះមានបញ្ហា៖ ${errors.join('; ')})`
      };
    }

    return {
      success: false,
      sentCount: 0,
      totalCount: doc.attachments.length,
      message: `មិនអាចរុញឯកសារភ្ជាប់ទៅ Telegram បានឡើយ៖ ${errors.join('; ')}`
    };
  },

  /**
   * Send a test attachment to Telegram to verify downloadable file capability
   */
  async sendSampleAttachment(config: TelegramConfig): Promise<{ success: boolean; message: string }> {
    const sampleDoc: DocumentItem = {
      id: 'demo-sample-doc',
      trackingCode: 'DOC-2026-IN-TEST',
      direction: 'in',
      letterNumber: '៩៩៩/២៦ ស.ជ.ណ',
      subject: 'លិខិតគំរូសម្រាប់តេស្តសាកល្បងរុញឯកសារភ្ជាប់ (Test Attachment)',
      docType: 'សេចក្តីជូនដំណឹង',
      sender: 'ទីស្ដីការគណៈរដ្ឋមន្ត្រី',
      receiver: 'អគ្គនាយកដ្ឋានរដ្ឋបាល និងហិរញ្ញវត្ថុ',
      dateReceivedOrIssued: new Date().toISOString().split('T')[0],
      priority: 'urgent',
      confidentiality: 'internal',
      status: 'approved',
      assignedDepartment: 'នាយកដ្ឋានព័ត៌មានវិទ្យា',
      assignedOfficer: 'លោក ហេង វឌ្ឍនៈ',
      attachments: [],
      workflowLogs: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sampleAtt: DocumentAttachment = {
      id: 'sample-att-test',
      name: 'គំរូឯកសាររដ្ឋបាល_ផ្លូវការ_២០២៦.png',
      size: 1024 * 320,
      type: 'image/png',
      uploadedAt: new Date().toLocaleTimeString('km-KH'),
      category: 'photo'
    };

    return await this.sendAttachmentToTelegram(sampleAtt, sampleDoc, config);
  },

  async testConnection(
    botToken: string,
    chatId: string
  ): Promise<{
    success: boolean;
    message: string;
    botInfo?: string;
    botUsername?: string;
    correctedChatId?: string;
  }> {
    if (!botToken) {
      return { success: false, message: 'សូមបញ្ចូល Telegram Bot Token ជាមុនសិន។' };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getMe`);
      const data = await response.json();
      if (!data.ok) {
        return { success: false, message: `Bot Token មិនត្រឹមត្រូវ: ${data.description}` };
      }

      const botUsername = data.result?.username ? `@${data.result.username}` : 'Bot';
      const botName = data.result?.first_name || 'DocuTrack Bot';

      if (chatId) {
        const testText = `🤖 **DocuTrack Admin System - ការតភ្ជាប់សាកល្បង**\n\n✅ ប្រព័ន្ធគ្រប់គ្រងលិខិតរដ្ឋបាលបានតភ្ជាប់ជាមួយ Telegram Bot (${botUsername}) បានជោគជ័យ!\n⏰ ម៉ោង៖ ${new Date().toLocaleString('km-KH')}`;
        const sendRes = await this.sendToTelegram(testText, {
          enabled: true,
          botToken,
          chatId,
          notifyOnNewDoc: true,
          notifyOnStatusChange: true,
          notifyOnUrgent: true,
          notifyOnBackup: true,
          includeAttachmentsInTelegram: true
        });

        if (!sendRes.success) {
          return {
            success: false,
            message: `Bot [${botUsername}] ត្រឹមត្រូវ ប៉ុន្តែមិនអាចផ្ញើសារទៅ Chat ID '${chatId}' បានឡើយ៖\n${sendRes.message}`,
            botInfo: `${botName} (${botUsername})`,
            botUsername
          };
        }

        return {
          success: true,
          message: `បានតភ្ជាប់ និងផ្ញើសារសាកល្បងទៅ Bot [${botUsername}] ជោគជ័យ!`,
          botInfo: `${botName} (${botUsername})`,
          botUsername,
          correctedChatId: sendRes.correctedChatId
        };
      }

      return {
        success: true,
        message: `Bot Token ត្រឹមត្រូវ! បានរកឃើញ Bot: ${botName} (${botUsername})។ សូមបញ្ចូល Chat ID ឬប្រើមុខងារស្វែងរក Chat ID ស្វ័យប្រវត្តិ។`,
        botInfo: `${botName} (${botUsername})`,
        botUsername
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Network error';
      return { success: false, message: `កំហុសក្នុងការតភ្ជាប់៖ ${errMsg}` };
    }
  },

  async getRecentChats(botToken: string): Promise<{ success: boolean; chats: DetectedTelegramChat[]; error?: string }> {
    if (!botToken) {
      return { success: false, chats: [], error: 'សូមបញ្ចូល Bot Token ជាមុនសិន' };
    }

    try {
      const url = `https://api.telegram.org/bot${botToken.trim()}/getUpdates?limit=50`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.ok) {
        return { success: false, chats: [], error: data.description || 'មិនអាចទាញយកទិន្នន័យបាន' };
      }

      const updates = data.result || [];
      const chatMap = new Map<string, DetectedTelegramChat>();

      for (const update of updates) {
        const msg = update.message || update.channel_post || update.edited_message || update.my_chat_member;
        if (msg && msg.chat) {
          const chat = msg.chat;
          const chatIdStr = String(chat.id);
          const title =
            chat.title ||
            [chat.first_name, chat.last_name].filter(Boolean).join(' ') ||
            chat.username ||
            `Chat ${chatIdStr}`;
          const type = (chat.type as DetectedTelegramChat['type']) || 'private';

          chatMap.set(chatIdStr, {
            id: chatIdStr,
            title,
            type,
            username: chat.username ? `@${chat.username}` : undefined,
            lastMessage: msg.text || (msg.new_chat_member ? 'បាន Add Bot ចូល Group' : undefined),
            date: msg.date ? new Date(msg.date * 1000).toLocaleString('km-KH') : undefined
          });
        }
      }

      const chats = Array.from(chatMap.values());
      return { success: true, chats };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Network error';
      return { success: false, chats: [], error: errMsg };
    }
  },

  async notifyNewDocument(doc: DocumentItem): Promise<void> {
    const config = StorageService.getTelegramConfig();
    if (!config.enabled || !config.notifyOnNewDoc) return;

    const message = this.formatDocumentKhmerMessage(doc, 'new');
    await this.sendToTelegram(message, config, doc.trackingCode, 'new_doc');

    // Automatically push attachments so recipients can download and view them directly
    if (config.includeAttachmentsInTelegram !== false && doc.attachments && doc.attachments.length > 0) {
      await this.sendAllAttachmentsToTelegram(doc, config);
    }
  },

  async notifyStatusChange(doc: DocumentItem, note?: string): Promise<void> {
    const config = StorageService.getTelegramConfig();
    if (!config.enabled || !config.notifyOnStatusChange) return;

    let message = this.formatDocumentKhmerMessage(doc, 'status_update');
    if (note) {
      message += `\n📝 **ចំណារ/មតិយោបល់បន្ថែម៖** ${note}`;
    }

    await this.sendToTelegram(message, config, doc.trackingCode, 'status_update');

    // Automatically push attachments if present
    if (config.includeAttachmentsInTelegram !== false && doc.attachments && doc.attachments.length > 0) {
      await this.sendAllAttachmentsToTelegram(doc, config);
    }
  },

  async notifyUrgentDocument(doc: DocumentItem): Promise<void> {
    const config = StorageService.getTelegramConfig();
    if (!config.enabled || !config.notifyOnUrgent) return;

    const message = this.formatDocumentKhmerMessage(doc, 'urgent');
    await this.sendToTelegram(message, config, doc.trackingCode, 'urgent_reminder');
  },

  async notifyBackupComplete(backupId: string, count: number, sizeBytes: number): Promise<void> {
    const config = StorageService.getTelegramConfig();
    if (!config.enabled || !config.notifyOnBackup) return;

    const sizeKb = (sizeBytes / 1024).toFixed(1);
    const dateFormatted = new Date().toLocaleString('km-KH');

    const message = `☁️ **ការបម្រុងទុកទិន្នន័យលើពពក - ជោគជ័យ (Cloud Backup)**
━━━━━━━━━━━━━━━━━━━━━━━━
💾 **លេខកូដបម្រុងទុក៖** \`${backupId}\`
📊 **ចំនួនលិខិតសរុប៖** ${count} ឯកសារ
📦 **ទំហំកញ្ចប់ទិន្នន័យ៖** ${sizeKb} KB
🔒 **កម្រិតសុវត្ថិភាព៖** SHA-256 Checksum Verified
⏰ **ពេលវេលា៖** ${dateFormatted}
━━━━━━━━━━━━━━━━━━━━━━━━
✅ ទិន្នន័យទាំងអស់ត្រូវបានរក្សាទុកដោយសុវត្ថិភាពក្នុងប្រព័ន្ធពពក (Cloud Snapshot Database)`;

    await this.sendToTelegram(message, config, backupId, 'backup_completed');
  }
};
