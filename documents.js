const SUPABASE_URL = 'https://eachoezeqyxbmeciivsw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_q3xK8NDSsBs7tJeDhdMApQ_hwsN3CkA';
const STORAGE_BUCKET = 'private-documents';
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const allowedExtensions = new Set(['pdf', 'md', 'markdown', 'txt']);
const client = SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const logoutButton = document.getElementById('logoutButton');
const signedInActions = document.getElementById('signedInActions');
const documentsList = document.getElementById('documentsList');
const documentsStatus = document.getElementById('documentsStatus');
const documentPreview = document.getElementById('documentPreview');
let currentUser = null;
let previewUrl = null;

function text(key) {
  const messages = {
    configured: ['Cần điền Project URL và anon/public key trong documents.js trước khi sử dụng.', 'Add the Project URL and anon/public key in documents.js before using this page.'],
    library: ['Không tải được thư viện Supabase. Hãy tải lại trang hoặc kiểm tra kết nối mạng.', 'Could not load the Supabase library. Reload the page or check your network connection.'],
    login: ['Đăng nhập thành công.', 'Signed in successfully.'],
    logout: ['Đã đăng xuất.', 'Signed out.'],
    empty: ['Chưa có tài liệu. Hãy tải tài liệu đầu tiên lên.', 'No documents yet. Upload your first document.'],
    choose: ['Hãy chọn một tài liệu trước.', 'Choose a file first.'],
    tooLarge: ['Tài liệu vượt quá giới hạn 20 MB.', 'The file exceeds the 20 MB limit.'],
    unsupported: ['Chỉ hỗ trợ PDF, Markdown và TXT.', 'Only PDF, Markdown, and TXT files are supported.'],
    uploaded: ['Tải tài liệu lên thành công.', 'Document uploaded successfully.'],
    deleted: ['Đã xóa tài liệu.', 'Document deleted.'],
    confirmDelete: ['Bạn có chắc muốn xóa tài liệu này?', 'Are you sure you want to delete this document?'],
    previewError: ['Không thể mở tài liệu này.', 'Could not open this document.'],
    signedOut: ['Vui lòng đăng nhập để truy cập tài liệu.', 'Sign in to access your documents.'],
    noConfig: ['Chưa cấu hình kết nối Supabase.', 'Supabase is not configured.'],
    noDocs: ['Không tìm thấy tài liệu.', 'No documents found.']
  };
  return messages[key][document.documentElement.lang === 'vi' ? 0 : 1];
}

function setStatus(message, isError = false) {
  documentsStatus.textContent = message;
  documentsStatus.classList.toggle('error', isError);
}

function showEmptyPreview(message) {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  const wrapper = document.createElement('div');
  wrapper.className = 'document-empty';
  const content = document.createElement('div');
  const icon = document.createElement('i');
  icon.className = 'fa-regular fa-file-lines';
  icon.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = message;
  content.append(icon, label);
  wrapper.append(content);
  documentPreview.replaceChildren(wrapper);
}

function updateSession(user) {
  currentUser = user;
  loginForm.hidden = Boolean(user);
  signedInActions.hidden = !user;
  documentsList.replaceChildren();
  showEmptyPreview(user ? text('noDocs') : text('signedOut'));
  if (user) {
    setStatus(user.email || '');
    loadDocuments();
  } else {
    setStatus('');
  }
}

function displayName(fileName, metadata) {
  return metadata?.originalName || fileName.replace(/^[0-9a-f-]{36}--/i, '');
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString(
    document.documentElement.lang === 'vi' ? 'vi-VN' : 'en-US'
  );
}

async function loadDocuments() {
  if (!client || !currentUser) return;
  setStatus(document.documentElement.lang === 'vi' ? 'Đang tải danh sách...' : 'Loading documents...');
  const { data, error } = await client.storage.from(STORAGE_BUCKET).list(currentUser.id, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' }
  });
  if (error) {
    setStatus(error.message, true);
    return;
  }
  documentsList.replaceChildren();
  const files = (data || []).filter(file => file.id);
  if (!files.length) {
    setStatus(text('empty'));
    return;
  }
  setStatus('');
  for (const file of files) {
    const path = `${currentUser.id}/${file.name}`;
    const row = document.createElement('div');
    row.className = 'document-row';
    const openButton = document.createElement('button');
    openButton.className = 'document-item';
    openButton.type = 'button';
    const name = displayName(file.name, file.metadata);
    openButton.setAttribute('aria-label', name);
    const icon = document.createElement('i');
    icon.className = file.name.toLowerCase().endsWith('.pdf')
      ? 'fa-regular fa-file-pdf'
      : 'fa-regular fa-file-lines';
    icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = `${name}${file.created_at ? ` · ${formatDate(file.created_at)}` : ''}`;
    openButton.append(icon, label);
    openButton.addEventListener('click', () => previewDocument(path, file.name, name, openButton));
    const removeButton = document.createElement('button');
    removeButton.className = 'documents-button secondary';
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', `${document.documentElement.lang === 'vi' ? 'Xóa' : 'Delete'} ${name}`);
    removeButton.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i>';
    removeButton.addEventListener('click', () => deleteDocument(path));
    row.append(openButton, removeButton);
    documentsList.append(row);
  }
}

async function previewDocument(path, fileName, name, selectedButton) {
  if (!client) return;
  setStatus(document.documentElement.lang === 'vi' ? 'Đang mở tài liệu...' : 'Opening document...');
  const { data, error } = await client.storage.from(STORAGE_BUCKET).download(path);
  if (error) {
    setStatus(error.message, true);
    return;
  }
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  const extension = fileName.split('.').pop().toLowerCase();
  if (extension === 'pdf') {
    previewUrl = URL.createObjectURL(data);
    const frame = document.createElement('iframe');
    frame.title = name;
    frame.src = previewUrl;
    documentPreview.replaceChildren(frame);
  } else if (['md', 'markdown'].includes(extension)) {
    const content = document.createElement('article');
    content.className = 'document-markdown';
    content.innerHTML = DOMPurify.sanitize(marked.parse(await data.text()), {
      FORBID_TAGS: ['img', 'iframe', 'video', 'audio']
    });
    documentPreview.replaceChildren(content);
  } else if (extension === 'txt') {
    const content = document.createElement('pre');
    content.className = 'document-markdown';
    content.textContent = await data.text();
    documentPreview.replaceChildren(content);
  } else {
    setStatus(text('previewError'), true);
    return;
  }
  documentsList.querySelectorAll('.document-item').forEach(button => button.removeAttribute('aria-current'));
  selectedButton.setAttribute('aria-current', 'true');
  setStatus('');
}

async function deleteDocument(path) {
  if (!client || !currentUser || !window.confirm(text('confirmDelete'))) return;
  const { error } = await client.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) {
    setStatus(error.message, true);
    return;
  }
  showEmptyPreview(text('noDocs'));
  await loadDocuments();
  setStatus(text('deleted'));
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!client) {
    setStatus(text('configured'), true);
    return;
  }
  loginButton.disabled = true;
  const { data, error } = await client.auth.signInWithPassword({
    email: document.getElementById('emailInput').value.trim(),
    password: document.getElementById('passwordInput').value
  });
  loginButton.disabled = false;
  if (error) {
    setStatus(error.message, true);
    return;
  }
  updateSession(data.user);
  setStatus(text('login'));
});

uploadButton.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) {
    setStatus(text('choose'), true);
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    setStatus(text('tooLarge'), true);
    return;
  }
  const extension = file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.has(extension)) {
    setStatus(text('unsupported'), true);
    return;
  }
  uploadButton.disabled = true;
  const path = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;
  const contentType = extension === 'pdf'
    ? 'application/pdf'
    : extension === 'txt' ? 'text/plain' : 'text/markdown';
  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType,
    metadata: { originalName: file.name },
    upsert: false
  });
  uploadButton.disabled = false;
  if (error) {
    setStatus(error.message, true);
    return;
  }
  fileInput.value = '';
  await loadDocuments();
  setStatus(text('uploaded'));
});

logoutButton.addEventListener('click', async () => {
  const { error } = await client.auth.signOut();
  if (error) {
    setStatus(error.message, true);
    return;
  }
  updateSession(null);
  setStatus(text('logout'));
});

if (!client) {
  loginButton.disabled = true;
  setStatus(
    SUPABASE_URL && SUPABASE_ANON_KEY ? text('library') : text('configured'),
    true
  );
} else {
  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      setStatus(error.message, true);
      return;
    }
    updateSession(data.session?.user || null);
  });
  client.auth.onAuthStateChange((_event, session) => {
    if (!session && currentUser) {
      setTimeout(() => updateSession(null), 0);
    }
  });
}
