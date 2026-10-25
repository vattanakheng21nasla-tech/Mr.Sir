import * as XLSX from 'xlsx';
import { DocumentItem } from '../types/document';

const STATUS_KHMER_MAP: Record<string, string> = {
  received: 'បានទទួល / ចុះបញ្ជី',
  reviewing: 'កំពុងត្រួតពិនិត្យ',
  forwarded_leader: 'ឆ្លងថ្នាក់ដឹកនាំ',
  approved: 'បានឯកភាព / ចុះហត្ថលេខា',
  dispatched: 'បានបញ្ជូនបន្តអនុវត្ត',
  completed: 'បានបញ្ចប់នីតិវិធី',
  archived: 'បានតម្កល់ទុកបណ្ណសារ',
};

const PRIORITY_KHMER_MAP: Record<string, string> = {
  normal: 'ធម្មតា',
  urgent: 'បន្ទាន់',
  top_urgent: 'បន្ទាន់បំផុត',
};

const CONFIDENTIALITY_KHMER_MAP: Record<string, string> = {
  public: 'ធម្មតា/សាធារណៈ',
  internal: 'ផ្ទៃក្នុង',
  confidential: 'សម្ងាត់',
  top_secret: 'សម្ងាត់បំផុត',
};

const DIRECTION_KHMER_MAP: Record<string, string> = {
  in: 'លិខិតចូល',
  out: 'លិខិតចេញ',
};

export interface ExportReportRow {
  'លេខរៀង': number;
  'លេខកូដតាមដាន': string;
  'ទិសដៅ': string;
  'លេខលិខិត': string;
  'លេខសៀវភៅបញ្ជី': string;
  'ប្រភេទលិខិត': string;
  'កម្មវត្ថុ': string;
  'ខ្លឹមសារសង្ខេប': string;
  'អង្គភាពផ្ញើ': string;
  'អង្គភាពទទួល': string;
  'កាលបរិច្ឆេទ': string;
  'កាលកំណត់': string;
  'កម្រិតបន្ទាន់': string;
  'កម្រិតសម្ងាត់': string;
  'ស្ថានភាពបច្ចុប្បន្ន': string;
  'នាយកដ្ឋានទទួលបន្ទុក': string;
  'មន្ត្រីកាន់ការ': string;
  'ចំនួនឯកសារភ្ជាប់': number;
  'ឈ្មោះឯកសារភ្ជាប់': string;
  'កាលបរិច្ឆេទចុះបញ្ជី': string;
}

export function formatDocumentsForExport(documents: DocumentItem[]): ExportReportRow[] {
  return documents.map((doc, idx) => {
    const attachmentNames = (doc.attachments || []).map((att) => att.name).join('; ');
    return {
      'លេខរៀង': idx + 1,
      'លេខកូដតាមដាន': doc.trackingCode || '',
      'ទិសដៅ': DIRECTION_KHMER_MAP[doc.direction] || doc.direction,
      'លេខលិខិត': doc.letterNumber || '',
      'លេខសៀវភៅបញ្ជី': doc.inOutBookNumber || '',
      'ប្រភេទលិខិត': doc.docType || '',
      'កម្មវត្ថុ': doc.subject || '',
      'ខ្លឹមសារសង្ខេប': doc.summary || '',
      'អង្គភាពផ្ញើ': doc.sender || '',
      'អង្គភាពទទួល': doc.receiver || '',
      'កាលបរិច្ឆេទ': doc.dateReceivedOrIssued || '',
      'កាលកំណត់': doc.deadline || 'គ្មាន',
      'កម្រិតបន្ទាន់': PRIORITY_KHMER_MAP[doc.priority] || doc.priority,
      'កម្រិតសម្ងាត់': CONFIDENTIALITY_KHMER_MAP[doc.confidentiality] || doc.confidentiality,
      'ស្ថានភាពបច្ចុប្បន្ន': STATUS_KHMER_MAP[doc.status] || doc.status,
      'នាយកដ្ឋានទទួលបន្ទុក': doc.assignedDepartment || '',
      'មន្ត្រីកាន់ការ': doc.assignedOfficer || '',
      'ចំនួនឯកសារភ្ជាប់': (doc.attachments || []).length,
      'ឈ្មោះឯកសារភ្ជាប់': attachmentNames || 'គ្មាន',
      'កាលបរិច្ឆេទចុះបញ្ជី': doc.createdAt ? new Date(doc.createdAt).toLocaleString('km-KH') : '',
    };
  });
}

function getTimestampString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}`;
}

const COLUMN_WIDTHS = [
  { wch: 8 },  // លេខរៀង
  { wch: 22 }, // លេខកូដតាមដាន
  { wch: 12 }, // ទិសដៅ
  { wch: 18 }, // លេខលិខិត
  { wch: 16 }, // លេខសៀវភៅបញ្ជី
  { wch: 22 }, // ប្រភេទលិខិត
  { wch: 38 }, // កម្មវត្ថុ
  { wch: 32 }, // ខ្លឹមសារសង្ខេប
  { wch: 26 }, // អង្គភាពផ្ញើ
  { wch: 26 }, // អង្គភាពទទួល
  { wch: 14 }, // កាលបរិច្ឆេទ
  { wch: 14 }, // កាលកំណត់
  { wch: 14 }, // កម្រិតបន្ទាន់
  { wch: 16 }, // កម្រិតសម្ងាត់
  { wch: 24 }, // ស្ថានភាពបច្ចុប្បន្ន
  { wch: 24 }, // នាយកដ្ឋានទទួលបន្ទុក
  { wch: 20 }, // មន្ត្រីកាន់ការ
  { wch: 14 }, // ចំនួនឯកសារភ្ជាប់
  { wch: 30 }, // ឈ្មោះឯកសារភ្ជាប់
  { wch: 22 }, // កាលបរិច្ឆេទចុះបញ្ជី
];

function sanitizeSheetName(name: string): string {
  // Excel allows max 31 chars and disallows: \ / ? * [ ] :
  const cleaned = name.replace(/[\\/?*[\]:]/g, '_').trim();
  return cleaned.substring(0, 31) || 'សន្លឹក';
}

export const ExportService = {
  /**
   * Export documents to an authentic Microsoft Excel (.xlsx) file
   * Requirement 8: Organizes into categorized sheets:
   * 1. លិខិតសរុបទាំងអស់ (Summary)
   * 2. លិខិតចូល (Inward)
   * 3. លិខិតចេញ (Outward)
   * 4. Individual sheets separated by administrative document type (លិខិតអញ្ជើញ, សារាចរ, ប្រកាស, etc.)
   */
  exportToExcel(documents: DocumentItem[], customFileName?: string): string {
    const workbook = XLSX.utils.book_new();

    // 1. Sheet: All Documents (លិខិតសរុបទាំងអស់)
    const allFormatted = formatDocumentsForExport(documents);
    const allSheet = XLSX.utils.json_to_sheet(allFormatted);
    allSheet['!cols'] = COLUMN_WIDTHS;
    XLSX.utils.book_append_sheet(workbook, allSheet, sanitizeSheetName('លិខិតសរុបទាំងអស់'));

    // 2. Sheet: Inward Documents (លិខិតចូល)
    const inwardDocs = documents.filter((d) => d.direction === 'in');
    if (inwardDocs.length > 0) {
      const inwardFormatted = formatDocumentsForExport(inwardDocs);
      const inwardSheet = XLSX.utils.json_to_sheet(inwardFormatted);
      inwardSheet['!cols'] = COLUMN_WIDTHS;
      XLSX.utils.book_append_sheet(workbook, inwardSheet, sanitizeSheetName('លិខិតចូល'));
    }

    // 3. Sheet: Outward Documents (លិខិតចេញ)
    const outwardDocs = documents.filter((d) => d.direction === 'out');
    if (outwardDocs.length > 0) {
      const outwardFormatted = formatDocumentsForExport(outwardDocs);
      const outwardSheet = XLSX.utils.json_to_sheet(outwardFormatted);
      outwardSheet['!cols'] = COLUMN_WIDTHS;
      XLSX.utils.book_append_sheet(workbook, outwardSheet, sanitizeSheetName('លិខិតចេញ'));
    }

    // 4. Group documents by document type (ប្រភេទលិខិតរដ្ឋបាល)
    const docTypesGrouped = new Map<string, DocumentItem[]>();
    documents.forEach((doc) => {
      const typeKey = doc.docType || 'ផ្សេងៗ';
      if (!docTypesGrouped.has(typeKey)) {
        docTypesGrouped.set(typeKey, []);
      }
      docTypesGrouped.get(typeKey)!.push(doc);
    });

    // Add a separate sheet for each administrative document type
    const usedSheetNames = new Set<string>([
      'លិខិតសរុបទាំងអស់',
      'លិខិតចូល',
      'លិខិតចេញ',
    ]);

    docTypesGrouped.forEach((typeDocs, typeName) => {
      let sheetTitle = sanitizeSheetName(typeName);
      if (usedSheetNames.has(sheetTitle)) {
        sheetTitle = sanitizeSheetName(`${typeName} (ប្រភេទ)`);
      }
      usedSheetNames.add(sheetTitle);

      const typeFormatted = formatDocumentsForExport(typeDocs);
      const typeSheet = XLSX.utils.json_to_sheet(typeFormatted);
      typeSheet['!cols'] = COLUMN_WIDTHS;
      XLSX.utils.book_append_sheet(workbook, typeSheet, sheetTitle);
    });

    const fileName = customFileName || `បញ្ជីលិខិតរដ្ឋបាល_ពហុសន្លឹក_${getTimestampString()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    return fileName;
  },

  /**
   * Export documents to a CSV file with UTF-8 BOM (\uFEFF)
   * This ensures Khmer Unicode characters display flawlessly in Windows Excel without gibberish
   */
  exportToCSV(documents: DocumentItem[], customFileName?: string): string {
    const formattedData = formatDocumentsForExport(documents);
    if (formattedData.length === 0) {
      const emptyHeaders = [
        'លេខរៀង', 'លេខកូដតាមដាន', 'ទិសដៅ', 'លេខលិខិត', 'លេខសៀវភៅបញ្ជី',
        'ប្រភេទលិខិត', 'កម្មវត្ថុ', 'ខ្លឹមសារសង្ខេប', 'អង្គភាពផ្ញើ', 'អង្គភាពទទួល',
        'កាលបរិច្ឆេទ', 'កាលកំណត់', 'កម្រិតបន្ទាន់', 'កម្រិតសម្ងាត់', 'ស្ថានភាពបច្ចុប្បន្ន',
        'នាយកដ្ឋានទទួលបន្ទុក', 'មន្ត្រីកាន់ការ', 'ចំនួនឯកសារភ្ជាប់', 'ឈ្មោះឯកសារភ្ជាប់', 'កាលបរិច្ឆេទចុះបញ្ជី'
      ].join(',');
      const blob = new Blob(['\uFEFF' + emptyHeaders], { type: 'text/csv;charset=utf-8;' });
      const fileName = customFileName || `បញ្ជីលិខិតរដ្ឋបាល_${getTimestampString()}.csv`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return fileName;
    }

    const headers = Object.keys(formattedData[0]);
    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows: string[] = [];
    csvRows.push(headers.map((h) => escapeCsv(h)).join(','));

    for (const row of formattedData) {
      const values = headers.map((header) => {
        const val = row[header as keyof ExportReportRow];
        return escapeCsv(val);
      });
      csvRows.push(values.join(','));
    }

    // Prepend UTF-8 BOM so Microsoft Excel renders Khmer script properly
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = customFileName || `បញ្ជីលិខិតរដ្ឋបាល_${getTimestampString()}.csv`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return fileName;
  },
};
