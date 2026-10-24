import { DocumentItem, CurrentUser } from '../types/document';

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-001',
    trackingCode: 'DOC-2026-IN-0012',
    direction: 'in',
    letterNumber: '១៤៨/២៦ ស.ជ.ណ',
    inOutBookNumber: '០២៨',
    subject: 'ការណែនាំស្តីពីការពង្រឹងវិធានការសន្តិសុខបច្ចេកវិទ្យា និងការគ្រប់គ្រងទិន្នន័យរដ្ឋបាលសាធារណៈ',
    summary: 'ណែនាំដល់គ្រប់អង្គភាពចំណុះ ឱ្យអនុវត្តការបម្រុងទុកទិន្នន័យជាប្រចាំ និងប្រើប្រាស់ប្រព័ន្ធសុវត្ថិភាពក្នុងការបញ្ជូនលិខិតផ្លូវការ។',
    docType: 'សារាចរ',
    sender: 'ទីស្ដីការគណៈរដ្ឋមន្ត្រី',
    receiver: 'អគ្គនាយកដ្ឋានរដ្ឋបាល និងហិរញ្ញវត្ថុ',
    dateReceivedOrIssued: '2026-10-22',
    deadline: '2026-11-05',
    priority: 'urgent',
    confidentiality: 'internal',
    status: 'reviewing',
    assignedDepartment: 'នាយកដ្ឋានបច្ចេកវិទ្យាព័ត៌មាន',
    assignedOfficer: 'លោក វ៉ាន់ សុវណ្ណារ៉ា',
    securityPin: '1234',
    attachments: [
      {
        id: 'att-1',
        name: 'សារាចរ_១៤៨_សជណ_២០២៦.pdf',
        size: 1024 * 450,
        type: 'application/pdf',
        uploadedAt: '2026-10-22 09:30'
      }
    ],
    workflowLogs: [
      {
        id: 'wf-1',
        timestamp: '2026-10-22 09:15',
        status: 'received',
        actorName: 'កញ្ញា ម៉ៅ ស្រីលក្ខណ៍',
        actorRole: 'មន្ត្រីចុះបញ្ជីរដ្ឋបាល',
        actionTitle: 'បានទទួល និងចុះបញ្ជីចូលលេខ ០២៨',
        notes: 'លិខិតចូលតាមរដ្ឋបាលកណ្តាល មានឯកសារភ្ជាប់ច្បាប់ដើម ១ច្បាប់'
      },
      {
        id: 'wf-2',
        timestamp: '2026-10-22 14:00',
        status: 'reviewing',
        actorName: 'លោក វ៉ាន់ សុវណ្ណារ៉ា',
        actorRole: 'ប្រធានការិយាល័យ IT',
        actionTitle: 'កំពុងពិនិត្យ និងរៀបចំសេចក្តីព្រាងអនុវត្ត',
        notes: 'កំពុងពិនិត្យលើទិដ្ឋភាពបច្ចេកទេស និងផែនការបម្រុងទុកទិន្នន័យ'
      }
    ],
    tags: ['សន្តិសុខឌីជីថល', 'បម្រុងទុកទិន្នន័យ', 'ទីស្តីការគណៈរដ្ឋមន្ត្រី'],
    createdAt: '2026-10-22T09:15:00Z',
    updatedAt: '2026-10-22T14:00:00Z'
  },
  {
    id: 'doc-002',
    trackingCode: 'DOC-2026-OUT-0008',
    direction: 'out',
    letterNumber: '៥៨៩/២៦ អ.រ.ហ',
    inOutBookNumber: '០១៩',
    subject: 'របាយការណ៍បូកសរុបលទ្ធផលការងាររដ្ឋបាលប្រចាំត្រីមាសទី៣ និងទិសដៅអនុវត្តបន្ត',
    summary: 'របាយការណ៍លម្អិតអំពីការចរាចរលិខិតរដ្ឋបាល និងការអនុវត្តប្រព័ន្ធស្វ័យប្រវត្តិកិច្ចការការិយាល័យ។',
    docType: 'របាយការណ៍',
    sender: 'នាយកដ្ឋានរដ្ឋបាល និងបុគ្គលិក',
    receiver: 'ក្រសួងសេដ្ឋកិច្ច និងហិរញ្ញវត្ថុ',
    dateReceivedOrIssued: '2026-10-23',
    priority: 'normal',
    confidentiality: 'public',
    status: 'approved',
    assignedDepartment: 'នាយកដ្ឋានរដ្ឋបាល',
    assignedOfficer: 'អ្នកស្រី គង់ សុជាតា',
    attachments: [
      {
        id: 'att-2',
        name: 'របាយការណ៍ត្រីមាស៣_២០២៦_ផ្លូវការ.pdf',
        size: 1024 * 1280,
        type: 'application/pdf',
        uploadedAt: '2026-10-23 10:15'
      }
    ],
    workflowLogs: [
      {
        id: 'wf-3',
        timestamp: '2026-10-23 08:30',
        status: 'reviewing',
        actorName: 'អ្នកស្រី គង់ សុជាតា',
        actorRole: 'អនុប្រធាននាយកដ្ឋាន',
        actionTitle: 'រៀបចំសេចក្តីព្រាងរបាយការណ៍',
        notes: 'បានផ្ទៀងផ្ទាត់ទិន្នន័យលិខិតចូល-ចេញសរុប'
      },
      {
        id: 'wf-4',
        timestamp: '2026-10-23 11:45',
        status: 'forwarded_leader',
        actorName: 'ឯកឧត្តម ហេង វឌ្ឍនៈ',
        actorRole: 'អគ្គនាយក',
        actionTitle: 'ឆ្លងពិនិត្យ និងកែសម្រួល',
        notes: 'បានឯកភាពលើខ្លឹមសារសង្ខេប'
      },
      {
        id: 'wf-5',
        timestamp: '2026-10-23 16:20',
        status: 'approved',
        actorName: 'ឯកឧត្តម ហេង វឌ្ឍនៈ',
        actorRole: 'អគ្គនាយក',
        actionTitle: 'បានចុះហត្ថលេខា និងវាយត្រាអនុម័ត',
        notes: 'រៀបចំបញ្ជូនចេញទៅក្រសួងសេដ្ឋកិច្ច'
      }
    ],
    tags: ['របាយការណ៍ត្រីមាស', 'លិខិតចេញ'],
    createdAt: '2026-10-23T08:30:00Z',
    updatedAt: '2026-10-23T16:20:00Z'
  },
  {
    id: 'doc-003',
    trackingCode: 'DOC-2026-IN-0015',
    direction: 'in',
    letterNumber: '០៩២/២៦ ម.អ.យ.ក',
    inOutBookNumber: '០៣១',
    subject: 'លិខិតអញ្ជើញចូលរួមកិច្ចប្រជុំពិភាក្សាការងារស្តីពីការធ្វើទំនើបកម្មរដ្ឋបាលឌីជីថលថ្នាក់ជាតិ',
    summary: 'កិច្ចប្រជុំនឹងប្រព្រឹត្តទៅនៅថ្ងៃទី២៨ ខែតុលា ឆ្នាំ២០២៦ វេលាម៉ោង ០៨:៣០ ព្រឹក នៅសាលប្រជុំធំ។',
    docType: 'លិខិតអញ្ជើញ',
    sender: 'ក្រសួងប្រៃសណីយ៍ និងទូរគមនាគមន៍',
    receiver: 'ថ្នាក់ដឹកនាំ និងតំណាងនាយកដ្ឋានជំនាញ',
    dateReceivedOrIssued: '2026-10-24',
    deadline: '2026-10-28',
    priority: 'top_urgent',
    confidentiality: 'public',
    status: 'forwarded_leader',
    assignedDepartment: 'ខុទ្ទកាល័យថ្នាក់ដឹកនាំ',
    assignedOfficer: 'លោក ចាន់ ពិទូ',
    attachments: [
      {
        id: 'att-3',
        name: 'លិខិតអញ្ជើញ_០៩២_កិច្ចប្រជុំឌីជីថល.pdf',
        size: 1024 * 320,
        type: 'application/pdf',
        uploadedAt: '2026-10-24 08:10'
      }
    ],
    workflowLogs: [
      {
        id: 'wf-6',
        timestamp: '2026-10-24 08:05',
        status: 'received',
        actorName: 'កញ្ញា ម៉ៅ ស្រីលក្ខណ៍',
        actorRole: 'មន្ត្រីចុះបញ្ជីរដ្ឋបាល',
        actionTitle: 'បានទទួល និងចុះបញ្ជីចូល',
        notes: 'លិខិតបន្ទាន់បំផុត កិច្ចប្រជុំថ្ងៃទី២៨ ខែតុលា'
      },
      {
        id: 'wf-7',
        timestamp: '2026-10-24 08:30',
        status: 'forwarded_leader',
        actorName: 'លោក ចាន់ ពិទូ',
        actorRole: 'នាយកខុទ្ទកាល័យ',
        actionTitle: 'បានបញ្ជូនឆ្លងគោរពជូនឯកឧត្តមអគ្គនាយកជ្រាប',
        notes: 'រៀបចំឯកសារយោង និងចាត់តាំងសមាសភាពចូលរួម'
      }
    ],
    tags: ['បន្ទាន់បំផុត', 'កិច្ចប្រជុំ', 'ក្រសួងប្រៃសណីយ៍'],
    createdAt: '2026-10-24T08:05:00Z',
    updatedAt: '2026-10-24T08:30:00Z'
  },
  {
    id: 'doc-004',
    trackingCode: 'DOC-2026-OUT-0009',
    direction: 'out',
    letterNumber: '៦១២/២៦ អ.រ.ហ',
    inOutBookNumber: '០២១',
    subject: 'លិខិតបង្គាប់ការចាត់តាំងមន្ត្រីចូលរួមវគ្គបណ្តុះបណ្តាលសន្តិសុខពត៌មានវិទ្យា និង Cloud Backup',
    summary: 'ចាត់តាំងមន្ត្រីចំនួន ០៣រូប ចូលរួមវគ្គបណ្តុះបណ្តាលបច្ចេកវិទ្យាសុវត្ថិភាពឯកសារ។',
    docType: 'លិខិតបង្គាប់ការ',
    sender: 'អគ្គនាយកដ្ឋានរដ្ឋបាល និងហិរញ្ញវត្ថុ',
    receiver: 'សាមីខ្លួន និងនាយកដ្ឋានពាក់ព័ន្ធ',
    dateReceivedOrIssued: '2026-10-24',
    priority: 'normal',
    confidentiality: 'internal',
    status: 'dispatched',
    assignedDepartment: 'នាយកដ្ឋានបុគ្គលិក',
    assignedOfficer: 'លោក ស៊ុន ដារ៉ា',
    attachments: [
      {
        id: 'att-4',
        name: 'លិខិតបង្គាប់ការ_៦១២_បណ្តុះបណ្តាល.pdf',
        size: 1024 * 280,
        type: 'application/pdf',
        uploadedAt: '2026-10-24 09:00'
      }
    ],
    workflowLogs: [
      {
        id: 'wf-8',
        timestamp: '2026-10-24 09:00',
        status: 'approved',
        actorName: 'ឯកឧត្តម ហេង វឌ្ឍនៈ',
        actorRole: 'អគ្គនាយក',
        actionTitle: 'ចុះហត្ថលេខាឯកភាពលើបញ្ជីវត្តមានមន្ត្រី',
        notes: 'អនុញ្ញាតឱ្យចូលរួមបណ្តុះបណ្តាល'
      },
      {
        id: 'wf-9',
        timestamp: '2026-10-24 10:15',
        status: 'dispatched',
        actorName: 'លោក ស៊ុន ដារ៉ា',
        actorRole: 'ប្រធានការិយាល័យបុគ្គលិក',
        actionTitle: 'បានចែកផ្សាយ និងបញ្ជូនទៅសាមីខ្លួន',
        notes: 'បានជូនដំណឹងតាមតេឡេក្រាមដល់សាមីមន្ត្រីរួចរាល់'
      }
    ],
    tags: ['លិខិតបង្គាប់ការ', 'បណ្តុះបណ្តាល'],
    createdAt: '2026-10-24T09:00:00Z',
    updatedAt: '2026-10-24T10:15:00Z'
  },
  {
    id: 'doc-005',
    trackingCode: 'DOC-2026-IN-0009',
    direction: 'in',
    letterNumber: '០៧៧/២៦ ស.រ.ភ',
    inOutBookNumber: '០២៥',
    subject: 'សេចក្តីសម្រេចស្តីពីការបង្កើតក្រុមការងារសម្របសម្រួលប្រព័ន្ធរដ្ឋបាលឆ្លាតវៃ',
    summary: 'បង្កើតក្រុមការងារទទួលបន្ទុកតាមដានលិខិតស្នាម និងរៀបចំសុវត្ថិភាពទិន្នន័យ។',
    docType: 'ប្រកាស',
    sender: 'សាលារាជធានីភ្នំពេញ',
    receiver: 'អគ្គនាយកដ្ឋានរដ្ឋបាល',
    dateReceivedOrIssued: '2026-10-18',
    priority: 'normal',
    confidentiality: 'public',
    status: 'completed',
    assignedDepartment: 'នាយកដ្ឋានរដ្ឋបាល',
    assignedOfficer: 'អ្នកស្រី គង់ សុជាតា',
    attachments: [
      {
        id: 'att-5',
        name: 'សេចក្តីសម្រេច_០៧៧_ក្រុមការងារ.pdf',
        size: 1024 * 750,
        type: 'application/pdf',
        uploadedAt: '2026-10-18 11:20'
      }
    ],
    workflowLogs: [
      {
        id: 'wf-10',
        timestamp: '2026-10-18 11:00',
        status: 'received',
        actorName: 'កញ្ញា ម៉ៅ ស្រីលក្ខណ៍',
        actorRole: 'មន្ត្រីចុះបញ្ជីរដ្ឋបាល',
        actionTitle: 'បានទទួល និងចុះបញ្ជីចូល',
        notes: ''
      },
      {
        id: 'wf-11',
        timestamp: '2026-10-19 14:30',
        status: 'completed',
        actorName: 'អ្នកស្រី គង់ សុជាតា',
        actorRole: 'អនុប្រធាននាយកដ្ឋាន',
        actionTitle: 'បានអនុវត្ត និងចម្លងជូនគ្រប់អង្គភាពពាក់ព័ន្ធរួចរាល់',
        notes: 'បញ្ចប់កិច្ចការ'
      }
    ],
    tags: ['សេចក្តីសម្រេច', 'ក្រុមការងារ'],
    createdAt: '2026-10-18T11:00:00Z',
    updatedAt: '2026-10-19T14:30:00Z'
  }
];

export const INITIAL_TELEGRAM_CONFIG = {
  enabled: true,
  botToken: '',
  chatId: '',
  channelId: '@docutrack_admin_kh',
  notifyOnNewDoc: true,
  notifyOnStatusChange: true,
  notifyOnUrgent: true,
  notifyOnBackup: true,
  includeAttachmentsInTelegram: true,
  lastTestStatus: 'untested' as const,
  lastTestMessage: 'មិនទាន់បានធ្វើតេស្តសាកល្បង',
  lastTestTimestamp: undefined
};

export const CURRENT_OFFICER_USER: CurrentUser = {
  id: 'usr-001',
  name: 'ឯកឧត្តម ហេង វឌ្ឍនៈ',
  username: 'vattanak.admin',
  email: 'vattanak.heng.21nasla@gmail.com',
  role: 'admin',
  department: 'អគ្គនាយកដ្ឋានរដ្ឋបាល និងហិរញ្ញវត្ថុ',
  lastLogin: '2026-10-24 14:30'
};

export const DEMO_USERS: (CurrentUser & { password: string; title: string })[] = [
  {
    id: 'usr-001',
    name: 'ឯកឧត្តម ហេង វឌ្ឍនៈ',
    username: 'admin',
    email: 'vattanak.heng.21nasla@gmail.com',
    role: 'admin',
    department: 'អគ្គនាយកដ្ឋានរដ្ឋបាល និងហិរញ្ញវត្ថុ',
    password: 'admin',
    title: 'អភិបាលប្រព័ន្ធ (System Administrator)'
  },
  {
    id: 'usr-002',
    name: 'ឯកឧត្តម ហេង វឌ្ឍនៈ',
    username: 'director',
    email: 'director@docutrack.gov.kh',
    role: 'director',
    department: 'ថ្នាក់ដឹកនាំ / អគ្គនាយកដ្ឋាន',
    password: '123',
    title: 'ថ្នាក់ដឹកនាំ / អគ្គនាយក (Director General)'
  },
  {
    id: 'usr-003',
    name: 'លោក វ៉ាន់ សុវណ្ណារ៉ា',
    username: 'officer',
    email: 'sovannara@docutrack.gov.kh',
    role: 'officer',
    department: 'នាយកដ្ឋានរដ្ឋបាល និងបុគ្គលិក',
    password: '123',
    title: 'មន្ត្រីរដ្ឋបាល / ចុះបញ្ជី (Administrative Clerk)'
  }
];
