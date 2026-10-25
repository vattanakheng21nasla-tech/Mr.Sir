import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INITIAL_DOCUMENTS, INITIAL_TELEGRAM_CONFIG, INITIAL_USERS } from './src/data/initialDocuments';
import { UserAccount } from './src/types/document';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const MAX_ACTIVE_USERS = 10;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Persistent server data directory and file
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  documents: any[];
  telegramConfig: any;
  telegramLogs: any[];
  backupRecords: any[];
  auditLogs: any[];
  users: UserAccount[];
}

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DatabaseSchema = {
        documents: INITIAL_DOCUMENTS,
        telegramConfig: INITIAL_TELEGRAM_CONFIG,
        telegramLogs: [],
        backupRecords: [],
        auditLogs: [
          {
            id: `audit-init-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            userName: 'លោក ហេង វឌ្ឍនៈ',
            userRole: 'owner',
            action: 'ចាប់ផ្តើមប្រព័ន្ធដំបូង (Initial Setup)',
            details: 'បានរៀបចំទិន្នន័យឯកសាររដ្ឋបាលកណ្តាលរួចរាល់'
          }
        ],
        users: INITIAL_USERS
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const db: DatabaseSchema = JSON.parse(raw);

    // Ensure users array exists and remove old demo accounts (Director & Officer) as requested by user
    let needsSave = false;
    if (!db.users || !Array.isArray(db.users) || db.users.length === 0) {
      db.users = INITIAL_USERS;
      needsSave = true;
    } else {
      // Filter out old default demo director/officer accounts to leave Owner to create them himself
      const cleanedUsers = db.users.filter((u) => {
        if (u.username === 'director' || u.username === 'officer' || u.id === 'usr-002' || u.id === 'usr-003') {
          return false;
        }
        return true;
      });
      // Guarantee owner exists
      if (!cleanedUsers.some((u) => u.username === 'vattanak' || u.role === 'owner')) {
        cleanedUsers.unshift(INITIAL_USERS[0]);
      }
      if (cleanedUsers.length !== db.users.length) {
        db.users = cleanedUsers;
        needsSave = true;
      }
    }

    if (needsSave) {
      saveDatabase(db);
    }

    return db;
  } catch (err) {
    console.error('Error loading database:', err);
    return {
      documents: INITIAL_DOCUMENTS,
      telegramConfig: INITIAL_TELEGRAM_CONFIG,
      telegramLogs: [],
      backupRecords: [],
      auditLogs: [],
      users: INITIAL_USERS
    };
  }
}

function saveDatabase(db: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// ----------------- API Endpoints for Cross-Device Shared State -----------------

// 1. Documents
app.get('/api/documents', (_req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.documents });
});

app.post('/api/documents/save', (req, res) => {
  const { documents } = req.body;
  if (!Array.isArray(documents)) {
    return res.status(400).json({ success: false, error: 'documents must be an array' });
  }
  const db = loadDatabase();
  db.documents = documents;
  saveDatabase(db);
  res.json({ success: true, count: documents.length });
});

app.post('/api/documents', (req, res) => {
  const newDoc = req.body;
  if (!newDoc || !newDoc.id) {
    return res.status(400).json({ success: false, error: 'Invalid document' });
  }
  const db = loadDatabase();
  const existingIdx = db.documents.findIndex((d) => d.id === newDoc.id);
  if (existingIdx >= 0) {
    db.documents[existingIdx] = newDoc;
  } else {
    db.documents.unshift(newDoc);
  }
  saveDatabase(db);
  res.json({ success: true, data: newDoc });
});

app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.documents = db.documents.filter((d) => d.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// 2. Telegram Logs & Config
app.get('/api/telegram-logs', (_req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.telegramLogs || [] });
});

app.post('/api/telegram-logs', (req, res) => {
  const log = req.body;
  const db = loadDatabase();
  db.telegramLogs = [log, ...(db.telegramLogs || [])].slice(0, 100);
  saveDatabase(db);
  res.json({ success: true });
});

app.get('/api/telegram-config', (_req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.telegramConfig || INITIAL_TELEGRAM_CONFIG });
});

app.post('/api/telegram-config', (req, res) => {
  const config = req.body;
  const db = loadDatabase();
  db.telegramConfig = config;
  saveDatabase(db);
  res.json({ success: true });
});

// 3. Backup Records
app.get('/api/backup-records', (_req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.backupRecords || [] });
});

app.post('/api/backup-records', (req, res) => {
  const record = req.body;
  const db = loadDatabase();
  db.backupRecords = [record, ...(db.backupRecords || [])].slice(0, 50);
  saveDatabase(db);
  res.json({ success: true });
});

// 4. Audit Logs
app.get('/api/audit-logs', (_req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.auditLogs || [] });
});

app.post('/api/audit-logs', (req, res) => {
  const log = req.body;
  const db = loadDatabase();
  db.auditLogs = [log, ...(db.auditLogs || [])].slice(0, 200);
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------- 5. User Management & Registration Endpoints -----------------

// Get all users and quota status
app.get('/api/users', (_req, res) => {
  const db = loadDatabase();
  const activeCount = (db.users || []).filter((u) => u.status === 'active').length;
  const pendingCount = (db.users || []).filter((u) => u.status === 'pending').length;
  res.json({
    success: true,
    data: db.users || [],
    maxUsers: MAX_ACTIVE_USERS,
    activeCount,
    pendingCount
  });
});

// Register request endpoint (Public)
app.post('/api/users/register', (req, res) => {
  const { name, username, email, password, role, department, notes } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលត្រឹមត្រូវ!' });
  }
  if (!username || username.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'ឈ្មោះគណនី (Username) ត្រូវមានយ៉ាងហោចណាស់ ៣ តួអក្សរ!' });
  }
  if (!password || password.trim().length < 4) {
    return res.status(400).json({ success: false, error: 'លេខកូដសម្ងាត់ផ្ទាល់ខ្លួនត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ!' });
  }
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក!' });
  }

  const db = loadDatabase();
  const normalizedUser = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  // Check if username or email is already taken
  const exists = (db.users || []).some(
    (u) => u.username.toLowerCase() === normalizedUser || u.email.toLowerCase() === normalizedEmail
  );

  if (exists) {
    return res.status(400).json({
      success: false,
      error: 'ឈ្មោះអ្នកប្រើ (Username) ឬ អាសយដ្ឋានអ៊ីមែលនេះមានក្នុងប្រព័ន្ធរួចហើយ!'
    });
  }

  const requestedRole = role === 'director' ? 'director' : 'officer';
  const newUser: UserAccount = {
    id: `usr-reg-${Date.now()}`,
    name: name.trim(),
    username: normalizedUser,
    email: normalizedEmail,
    password: password.trim(),
    role: requestedRole,
    title: requestedRole === 'director' ? 'ថ្នាក់ដឹកនាំ / អគ្គនាយក (ស្នើសុំ)' : 'មន្ត្រីរដ្ឋបាល (ស្នើសុំ)',
    department: department?.trim() || 'ការិយាល័យរដ្ឋបាល និងផែនការ',
    status: 'pending',
    requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    notes: notes?.trim() || 'ស្នើសុំចុះឈ្មោះប្រើប្រាស់ប្រព័ន្ធ'
  };

  db.users = [newUser, ...(db.users || [])];

  // Log in Audit Logs
  const auditEntry = {
    id: `audit-reg-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    userName: newUser.name,
    userRole: 'pending',
    action: 'ស្នើសុំចុះឈ្មោះប្រើប្រាស់ (Registration Request)',
    details: `បានដាក់សំណើសុំចុះឈ្មោះគណនី '${newUser.username}' ភ្ជាប់ជាមួយអ៊ីមែល ${newUser.email} (រង់ចាំ Owner អនុម័ត)`
  };
  db.auditLogs = [auditEntry, ...(db.auditLogs || [])].slice(0, 200);

  saveDatabase(db);

  res.json({
    success: true,
    message: 'ការស្នើសុំចុះឈ្មោះត្រូវបានបញ្ជូនដោយជោគជ័យ! សូមរង់ចាំការពិនិត្យ និងអនុម័តពីលោក ហេង វឌ្ឍនៈ (Owner)។',
    user: {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      status: newUser.status,
      requestedAt: newUser.requestedAt
    }
  });
});

// Login endpoint with credentials and status validation
app.post('/api/users/login', (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ success: false, error: 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងលេខកូដសម្ងាត់!' });
  }

  const db = loadDatabase();
  const input = usernameOrEmail.trim().toLowerCase();
  const pass = password.trim();

  // Find user
  const matched = (db.users || []).find(
    (u) =>
      (u.username.toLowerCase() === input || u.email.toLowerCase() === input) ||
      (u.role === 'owner' && (input === 'admin' || input === 'owner'))
  );

  if (!matched || matched.password !== pass) {
    return res.status(401).json({
      success: false,
      errorCode: 'INVALID_CREDENTIALS',
      message: 'ឈ្មោះអ្នកប្រើប្រាស់ ឬលេខកូដសម្ងាត់មិនត្រឹមត្រូវ!'
    });
  }

  // Check account status
  if (matched.status === 'pending') {
    return res.status(403).json({
      success: false,
      errorCode: 'PENDING_APPROVAL',
      message: 'គណនីរបស់អ្នកកំពុងស្ថិតក្នុងការត្រួតពិនិត្យ និងរង់ចាំការអនុម័តពីលោក ហេង វឌ្ឍនៈ (Owner)។'
    });
  }

  if (matched.status === 'rejected') {
    return res.status(403).json({
      success: false,
      errorCode: 'REJECTED',
      message: 'សំណើសុំចូលប្រើប្រាស់របស់អ្នកមិនត្រូវបានអនុម័តឡើយ។ សូមទាក់ទងលោក ហេង វឌ្ឍនៈ (Owner)!'
    });
  }

  // Active user successful login
  matched.approvedAt = matched.approvedAt || new Date().toISOString().replace('T', ' ').substring(0, 19);
  saveDatabase(db);

  res.json({
    success: true,
    user: {
      id: matched.id,
      name: matched.name,
      username: matched.username,
      email: matched.email,
      role: matched.role,
      department: matched.department,
      status: matched.status,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19)
    }
  });
});

// Approve user registration (Owner only, max 10 users quota)
app.post('/api/users/approve', (req, res) => {
  const { userId, approvedBy } = req.body;
  const db = loadDatabase();

  const user = (db.users || []).find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'រកមិនឃើញគណនីអ្នកប្រើប្រាស់នេះទេ!' });
  }

  // Enforce quota: Maximum 10 active users
  const activeCount = (db.users || []).filter((u) => u.status === 'active').length;
  if (user.status !== 'active' && activeCount >= MAX_ACTIVE_USERS) {
    return res.status(400).json({
      success: false,
      error: `មិនអាចអនុម័តបានទេ! ប្រព័ន្ធបានកំណត់ចំនួនអ្នកប្រើប្រាស់អតិបរមាត្រឹម ${MAX_ACTIVE_USERS} នាក់ ហើយបច្ចុប្បន្នបានពេញកូតាហើយ (${activeCount}/${MAX_ACTIVE_USERS} នាក់)។ សូមលុបគណនីចាស់មួយជាមុនសិន។`
    });
  }

  user.status = 'active';
  user.approvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
  user.approvedBy = approvedBy || 'លោក ហេង វឌ្ឍនៈ (Owner)';

  const auditEntry = {
    id: `audit-appr-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    userName: user.approvedBy,
    userRole: 'owner',
    action: 'អនុម័តគណនីអ្នកប្រើប្រាស់ (Approve User)',
    details: `បានអនុម័តឱ្យអ្នកប្រើ '${user.name}' (${user.username}) ចូលប្រើប្រាស់ប្រព័ន្ធក្នុងតួនាទី '${user.role}'`
  };
  db.auditLogs = [auditEntry, ...(db.auditLogs || [])].slice(0, 200);

  saveDatabase(db);

  res.json({
    success: true,
    message: `បានអនុម័តគណនី '${user.name}' ឱ្យចូលប្រើប្រាស់ជោគជ័យ!`,
    user,
    activeCount: (db.users || []).filter((u) => u.status === 'active').length,
    maxUsers: MAX_ACTIVE_USERS
  });
});

// Reject user registration (Owner only)
app.post('/api/users/reject', (req, res) => {
  const { userId, reason } = req.body;
  const db = loadDatabase();

  const user = (db.users || []).find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'រកមិនឃើញគណនីអ្នកប្រើប្រាស់នេះទេ!' });
  }

  if (user.role === 'owner') {
    return res.status(400).json({ success: false, error: 'មិនអាចបដិសេធគណនី Owner បានទេ!' });
  }

  user.status = 'rejected';
  user.rejectionReason = reason || 'មិនបំពេញតាមលក្ខខណ្ឌប្រើប្រាស់';

  const auditEntry = {
    id: `audit-rej-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    userName: 'លោក ហេង វឌ្ឍនៈ',
    userRole: 'owner',
    action: 'បដិសេធសំណើសុំប្រើប្រាស់ (Reject User)',
    details: `បានបដិសេធសំណើសុំគណនី '${user.name}' (${user.username})`
  };
  db.auditLogs = [auditEntry, ...(db.auditLogs || [])].slice(0, 200);

  saveDatabase(db);

  res.json({ success: true, message: `បានបដិសេធសំណើសុំរបស់ '${user.name}' រួចរាល់!` });
});

// Create user directly by Owner (enforces 10-user limit)
app.post('/api/users/create', (req, res) => {
  const { name, username, email, password, role, department, title } = req.body;
  const db = loadDatabase();

  const activeCount = (db.users || []).filter((u) => u.status === 'active').length;
  if (activeCount >= MAX_ACTIVE_USERS) {
    return res.status(400).json({
      success: false,
      error: `មិនអាចបង្កើតបានទេ! ចំនួនអ្នកប្រើប្រាស់សកម្មបានពេញកម្រិតកំណត់ ${MAX_ACTIVE_USERS} នាក់រួចហើយ!`
    });
  }

  if (!email || !username || !password || !name) {
    return res.status(400).json({ success: false, error: 'សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់!' });
  }

  const normalizedUser = username.trim().toLowerCase();
  const exists = (db.users || []).some((u) => u.username.toLowerCase() === normalizedUser);
  if (exists) {
    return res.status(400).json({ success: false, error: 'ឈ្មោះគណនី (Username) នេះមានរួចហើយ!' });
  }

  const newUser: UserAccount = {
    id: `usr-direct-${Date.now()}`,
    name: name.trim(),
    username: normalizedUser,
    email: email.trim().toLowerCase(),
    password: password.trim(),
    role: role || 'officer',
    title: title || (role === 'director' ? 'ថ្នាក់ដឹកនាំ / អគ្គនាយក' : 'មន្ត្រីរដ្ឋបាល'),
    department: department?.trim() || 'ការិយាល័យរដ្ឋបាល និងផែនការ',
    status: 'active',
    requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    approvedBy: 'លោក ហេង វឌ្ឍនៈ (Owner)'
  };

  db.users.push(newUser);

  const auditEntry = {
    id: `audit-create-usr-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    userName: 'លោក ហេង វឌ្ឍនៈ',
    userRole: 'owner',
    action: 'បង្កើតគណនីអ្នកប្រើប្រាស់ដោយផ្ទាល់',
    details: `បានបង្កើតគណនី '${newUser.name}' (${newUser.username}) តួនាទី '${newUser.role}'`
  };
  db.auditLogs = [auditEntry, ...(db.auditLogs || [])].slice(0, 200);

  saveDatabase(db);

  res.json({
    success: true,
    user: newUser,
    activeCount: (db.users || []).filter((u) => u.status === 'active').length,
    maxUsers: MAX_ACTIVE_USERS
  });
});

// Delete user account (Owner only, frees up quota slot)
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();

  const user = (db.users || []).find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'រកមិនឃើញគណនីនេះទេ!' });
  }

  if (user.role === 'owner' || user.username === 'vattanak') {
    return res.status(400).json({ success: false, error: 'មិនអាចលុបគណនី Owner លោក ហេង វឌ្ឍនៈ បានទេ!' });
  }

  db.users = (db.users || []).filter((u) => u.id !== id);

  const auditEntry = {
    id: `audit-del-usr-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    userName: 'លោក ហេង វឌ្ឍនៈ',
    userRole: 'owner',
    action: 'លុបគណនីអ្នកប្រើប្រាស់',
    details: `បានលុបគណនី '${user.name}' (${user.username}) ចេញពីប្រព័ន្ធ`
  };
  db.auditLogs = [auditEntry, ...(db.auditLogs || [])].slice(0, 200);

  saveDatabase(db);

  res.json({
    success: true,
    activeCount: (db.users || []).filter((u) => u.status === 'active').length,
    maxUsers: MAX_ACTIVE_USERS
  });
});

// ----------------- Vite Integration & Static Serving -----------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: mount Vite dev server as middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DocuTrack Khmer Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
