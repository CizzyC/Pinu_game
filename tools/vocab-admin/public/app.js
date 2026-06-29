let currentPreviewId = "";
let uploadedRows = [];
let uploadedSheets = [];
let activeUploadedPair = "";
let currentRows = [];
let activeCurrentPair = "es-en";

const uploadedSummary = document.getElementById("uploadedSummary");
const uploadedTabs = document.getElementById("uploadedTabs");
const uploadedPreview = document.getElementById("uploadedPreview");
const currentTabs = document.getElementById("currentTabs");
const currentPreview = document.getElementById("currentPreview");
const confirmImportButton = document.getElementById("confirmImport");

document.getElementById("uploadForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const response = await fetch("/api/preview", { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) return renderError(uploadedPreview, data.error);

  currentPreviewId = data.previewId;
  uploadedRows = data.rows || [];
  uploadedSheets = data.sheets || [];
  activeUploadedPair = getPairs(uploadedRows)[0] || "";
  confirmImportButton.disabled = uploadedRows.length === 0;

  uploadedSummary.innerHTML = renderUploadSummary(data);
  renderPairTabs(uploadedTabs, getPairs(uploadedRows), activeUploadedPair, (pair) => {
    activeUploadedPair = pair;
    renderUploadedPreview();
  });
  renderUploadedPreview();
});

confirmImportButton.addEventListener("click", confirmImport);
document.getElementById("refreshCurrent").addEventListener("click", loadCurrentLibrary);

async function confirmImport() {
  if (!currentPreviewId) return;
  confirmImportButton.disabled = true;
  confirmImportButton.textContent = "上传中...";

  const response = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ previewId: currentPreviewId })
  });
  const data = await response.json();
  if (!response.ok) {
    confirmImportButton.disabled = false;
    confirmImportButton.textContent = "确认上传";
    return renderError(uploadedPreview, data.error);
  }

  await exportUploadedPairs();
  uploadedSummary.insertAdjacentHTML("beforeend", `<div class="success">已上传 ${data.importedRows} 条，并刷新游戏词库 JSON。</div>`);
  confirmImportButton.textContent = "已上传";
  await loadCurrentLibrary();
}

async function exportUploadedPairs() {
  const pairs = getPairs(uploadedRows);
  await Promise.all(
    pairs.map((languagePair) =>
      fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languagePair, unitCodes: ["s1u1", "s1u2", "s1u3", "s1u4"] })
      })
    )
  );
}

async function loadCurrentLibrary() {
  currentPreview.innerHTML = `<div class="empty-state">加载中...</div>`;
  const response = await fetch("/api/search");
  const data = await response.json();
  if (!response.ok) return renderError(currentPreview, data.error);

  currentRows = data.rows || [];
  const pairs = getPairs(currentRows);
  if (!pairs.includes(activeCurrentPair)) activeCurrentPair = pairs[0] || "";
  renderPairTabs(currentTabs, pairs, activeCurrentPair, (pair) => {
    activeCurrentPair = pair;
    renderCurrentPreview();
  });
  renderCurrentPreview();
}

function renderUploadedPreview() {
  const rows = filterByPair(uploadedRows, activeUploadedPair);
  uploadedPreview.innerHTML = renderRows(rows, { showSheet: true });
}

function renderCurrentPreview() {
  const rows = filterByPair(currentRows, activeCurrentPair);
  currentPreview.innerHTML = renderRows(rows, { showSheet: false });
}

function renderUploadSummary(data) {
  const sheetText = uploadedSheets.length
    ? uploadedSheets.map((sheet) => `${escapeHtml(sheet.sheetName)}：${formatLanguagePair(sheet.languagePair)}，${sheet.rowCount} 条`).join("；")
    : "未识别到 sheet";
  const warnings = data.warnings?.length
    ? `<div class="warning">${data.warnings.map((warning) => `第 ${warning.rowNumber} 行：${escapeHtml(warning.message)}`).join("<br />")}</div>`
    : "";

  return `
    <strong>${escapeHtml(data.fileName)}</strong>
    <span>共识别 ${data.rowCount} 条；${sheetText}</span>
    ${warnings}
  `;
}

function renderPairTabs(target, pairs, activePair, onSelect) {
  if (!pairs.length) {
    target.innerHTML = "";
    return;
  }

  target.innerHTML = pairs
    .map((pair) => `<button class="${pair === activePair ? "is-active" : ""}" type="button" data-pair="${escapeHtml(pair)}">${formatLanguagePair(pair)}</button>`)
    .join("");
  target.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => onSelect(button.dataset.pair));
  });
}

function renderRows(rows = [], options = {}) {
  if (!rows.length) return `<div class="empty-state">暂无数据</div>`;
  const sheetHeader = options.showSheet ? "<th>Sheet</th>" : "";
  const sheetCell = (row) => (options.showSheet ? `<td>${escapeHtml(row.sheetName || "")}</td>` : "");

  return `
    <table>
      <thead>
        <tr>${sheetHeader}<th>单元</th><th>题目</th><th>释义</th><th>音频</th></tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            ${sheetCell(row)}
            <td>${escapeHtml(row.unit || row.unitCode || "")}</td>
            <td>${escapeHtml(row.sourceText || row.prompt || "")}</td>
            <td>${escapeHtml(row.targetText || row.answer || "")}</td>
            <td>${escapeHtml(row.audio || "")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function filterByPair(rows, languagePair) {
  return rows.filter((row) => getRowPair(row) === languagePair);
}

function getPairs(rows) {
  return [...new Set(rows.map(getRowPair).filter(Boolean))].sort();
}

function getRowPair(row) {
  return row.languagePair || `${row.sourceLanguage || "en"}-${row.targetLanguage || "es"}`;
}

function renderError(target, message) {
  target.innerHTML = `<div class="warning">${escapeHtml(message || "操作失败")}</div>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function formatLanguagePair(languagePair) {
  return String(languagePair || "")
    .split("-")
    .map((part) => part.toUpperCase())
    .join(" -> ");
}

loadCurrentLibrary();
