import { getSupabaseClient, getSupabaseProjectHost } from "./supabase-client.js";

const STORAGE_KEY = "financas-dashboard-v5";

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: "payroll", name: "Folha de pagamento", color: "#c9a978" },
  { id: "water", name: "Água", color: "#8aa3ff" },
  { id: "electric", name: "Luz", color: "#d4b48a" },
  { id: "maintenance", name: "Despesas com manutenção", color: "#b8956a" },
  { id: "tools", name: "Ferramentas", color: "#a68954" },
  { id: "fuel", name: "Combustível", color: "#d4a574" },
  { id: "rental", name: "Locação", color: "#b08a5c" },
  { id: "rent", name: "Aluguel", color: "#9a7a52" },
  { id: "internet", name: "Internet", color: "#7d9bc4" },
  { id: "auto_insurance", name: "Seguro Automotivo", color: "#8f7048" },
  { id: "home_insurance", name: "Seguro Residencial", color: "#a68954" },
  { id: "ipva_iptu", name: "IPVA/IPTU - Licença", color: "#c97878" },
  { id: "tax", name: "Imposto", color: "#c9a978" },
  { id: "other_expense", name: "Outros", color: "#7d8ba0" }
];

const DEFAULT_INCOME_CATEGORIES = [
  { id: "monthly_fees", name: "Honorários Mensais", color: "#c9a978" },
  { id: "diverse_services", name: "Serviços Diversos", color: "#b8956a" }
];

const DEFAULT_FUNCIONARIO_CARGOS = [
  "Pedreiro",
  "Ajudante",
  "Azulejista",
  "Pedreiro meia colher",
  "Eletricista",
  "Encanador",
  "Marceneiro",
  "Amarrador"
];

const CATEGORY_COLOR_PALETTE = [
  "#c9a978", "#8aa3ff", "#d4b48a", "#b8956a", "#a68954",
  "#d4a574", "#b08a5c", "#7d9bc4", "#c97878", "#7d8ba0", "#9a7a52"
];

const ACCOUNTS = [
  { id: "sicoob", name: "Sicoob", type: "Banco" },
  { id: "inter", name: "Banco Inter", type: "Banco" },
  { id: "cash", name: "Dinheiro", type: "Espécie" }
];

const GOALS = [
  { id: "reserve", name: "Reserva de emergência", target: 20000, current: 0 }
];

const BUDGETS = [
  { category: "payroll", limit: 15000 },
  { category: "water", limit: 800 },
  { category: "electric", limit: 1200 },
  { category: "maintenance", limit: 3000 },
  { category: "tools", limit: 1500 },
  { category: "fuel", limit: 2000 },
  { category: "rental", limit: 5000 },
  { category: "rent", limit: 4000 },
  { category: "internet", limit: 300 },
  { category: "auto_insurance", limit: 1500 },
  { category: "home_insurance", limit: 1000 },
  { category: "ipva_iptu", limit: 3000 },
  { category: "tax", limit: 2000 },
  { category: "other_expense", limit: 1000 }
];

const RECURRING = [];

const OBRA_ETAPAS = [
  { id: "mobilizacao_locacao", name: "Mobilização e Locação" },
  { id: "fundacao", name: "Fundação" },
  { id: "alvenaria", name: "Alvenaria" },
  { id: "estrutural", name: "Estrutural" },
  { id: "cobertura_telhado", name: "Cobertura/Telhado" },
  { id: "reboco_regularizacao", name: "Reboco/Regularização" },
  { id: "hidraulica", name: "Hidráulica" },
  { id: "eletrica", name: "Elétrica" },
  { id: "piso_revestimento", name: "Piso e Revestimento" },
  { id: "portas_janelas", name: "Portas e Janelas" },
  { id: "pintura", name: "Pintura" }
];

const DEFAULT_LOGIN_USER = "Tiago";
const DEFAULT_LOGIN_PASS = "Carlos27";

const state = {
  settings: {
    name: "Tiago",
    currency: "BRL",
    loginUser: DEFAULT_LOGIN_USER,
    loginPass: DEFAULT_LOGIN_PASS
  },
  expenseCategories: structuredClone(DEFAULT_EXPENSE_CATEGORIES),
  incomeCategories: structuredClone(DEFAULT_INCOME_CATEGORIES),
  funcionarioCargos: [...DEFAULT_FUNCIONARIO_CARGOS],
  transactions: [],
  obras: [],
  funcionarios: [],
  activeObraId: null,
  obraEtapaFilter: "all",
  funcionarioRoleFilter: "all",
  pontoCalendarMonth: null,
  pontoCalendarFuncionarioId: null,
  trendDays: 30,
  authenticated: false
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getStatePayload() {
  return {
    settings: state.settings,
    expenseCategories: state.expenseCategories,
    incomeCategories: state.incomeCategories,
    funcionarioCargos: state.funcionarioCargos,
    transactions: state.transactions,
    obras: state.obras,
    funcionarios: state.funcionarios,
    activeObraId: state.activeObraId
  };
}

function normalizeCategoryList(list, fallback) {
  if (!Array.isArray(list) || !list.length) return structuredClone(fallback);
  return list
    .filter((item) => item && item.id && item.name)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      color: item.color || "#c9a978"
    }));
}

function normalizeCargoList(list) {
  if (!Array.isArray(list) || !list.length) return [...DEFAULT_FUNCIONARIO_CARGOS];
  const unique = [];
  list.forEach((item) => {
    const name = String(item || "").trim();
    if (name && !unique.includes(name)) unique.push(name);
  });
  return unique.length ? unique : [...DEFAULT_FUNCIONARIO_CARGOS];
}

function applyStatePayload(parsed) {
  if (!parsed || typeof parsed !== "object") return;
  const incoming = parsed.settings && typeof parsed.settings === "object" ? parsed.settings : {};
  state.settings = {
    name: incoming.name || "Tiago",
    currency: incoming.currency || "BRL",
    loginUser: DEFAULT_LOGIN_USER,
    loginPass: DEFAULT_LOGIN_PASS
  };
  state.expenseCategories = normalizeCategoryList(parsed.expenseCategories, DEFAULT_EXPENSE_CATEGORIES);
  state.incomeCategories = normalizeCategoryList(parsed.incomeCategories, DEFAULT_INCOME_CATEGORIES);
  state.funcionarioCargos = normalizeCargoList(parsed.funcionarioCargos);
  state.transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
  state.obras = Array.isArray(parsed.obras) ? parsed.obras : [];
  state.funcionarios = Array.isArray(parsed.funcionarios) ? parsed.funcionarios : [];
  state.activeObraId = parsed.activeObraId || state.obras[0]?.id || null;
}

function getExpenseCategories() {
  if (!Array.isArray(state.expenseCategories) || !state.expenseCategories.length) {
    state.expenseCategories = structuredClone(DEFAULT_EXPENSE_CATEGORIES);
  }
  return state.expenseCategories;
}

function getIncomeCategories() {
  if (!Array.isArray(state.incomeCategories) || !state.incomeCategories.length) {
    state.incomeCategories = structuredClone(DEFAULT_INCOME_CATEGORIES);
  }
  return state.incomeCategories;
}

function getAllCategories() {
  return [...getExpenseCategories(), ...getIncomeCategories()];
}

function getFuncionarioCargos() {
  if (!Array.isArray(state.funcionarioCargos) || !state.funcionarioCargos.length) {
    state.funcionarioCargos = [...DEFAULT_FUNCIONARIO_CARGOS];
  }
  return state.funcionarioCargos;
}

function slugifyId(name) {
  const base = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return base || `item_${Date.now()}`;
}

function nextCategoryColor(list) {
  return CATEGORY_COLOR_PALETTE[list.length % CATEGORY_COLOR_PALETTE.length];
}

function uniqueCategoryId(name, existing) {
  let id = slugifyId(name);
  let n = 2;
  const ids = new Set(existing.map((c) => c.id));
  while (ids.has(id)) {
    id = `${slugifyId(name)}_${n}`;
    n += 1;
  }
  return id;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.transactions = [];
      state.obras = [];
      state.funcionarios = [];
      state.activeObraId = null;
      saveLocal();
      return;
    }
    applyStatePayload(JSON.parse(raw));
  } catch {
    state.transactions = [];
    state.obras = [];
    state.funcionarios = [];
    state.activeObraId = null;
  }
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getStatePayload()));
}

function setCloudStatus(message) {
  const el = document.getElementById("cloud-status");
  if (!el) return;
  const host = getSupabaseProjectHost();
  el.textContent = host ? `${message} · ${host}` : message;
}

const CLOUD_STATE_ID = "main";

function getCloudSetupSql() {
  return `-- Rode no SQL Editor do Supabase (só o SQL, não o caminho do arquivo)

create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "anon_read_write_app_state" on public.app_state;

create policy "anon_read_write_app_state"
on public.app_state
for all
to anon, authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.app_state to anon, authenticated;

notify pgrst, 'reload schema';`;
}

function showCloudSqlHelp(show) {
  const box = document.getElementById("cloud-sql-help");
  const area = document.getElementById("cloud-sql-text");
  const title = box?.querySelector("p strong");
  if (!box) return;
  box.classList.toggle("hidden", !show);
  if (!show) return;
  if (title) {
    title.textContent = "Falta criar a tabela app_state no Supabase.";
  }
  if (area) area.value = getCloudSetupSql();
}

async function saveCloud() {
  const client = getSupabaseClient();
  if (!client) {
    setCloudStatus("Nuvem: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env");
    showCloudSqlHelp(false);
    return false;
  }
  if (location.protocol === "file:") {
    setCloudStatus("Nuvem: abra o site com npm run dev (não file://)");
    showCloudSqlHelp(false);
    return false;
  }
  setCloudStatus("Nuvem: salvando...");
  try {
    const { error } = await client.from("app_state").upsert(
      {
        id: CLOUD_STATE_ID,
        payload: getStatePayload(),
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );
    if (error) {
      console.warn("Supabase save:", error);
      setCloudStatus(`Nuvem: erro (${error.message}). Rode o SQL em sql/schema.sql`);
      showCloudSqlHelp(true);
      return false;
    }
    showCloudSqlHelp(false);
    setCloudStatus(`Nuvem: salvo às ${new Date().toLocaleTimeString("pt-BR")}`);
    return true;
  } catch (err) {
    console.warn(err);
    setCloudStatus(`Nuvem: erro — ${err.message || err}`);
    showCloudSqlHelp(true);
    return false;
  }
}

async function loadCloud() {
  const client = getSupabaseClient();
  if (!client) return false;
  setCloudStatus("Nuvem: carregando...");
  try {
    const { data, error } = await client
      .from("app_state")
      .select("payload, updated_at")
      .eq("id", CLOUD_STATE_ID)
      .maybeSingle();

    if (error) {
      console.warn("Supabase load:", error);
      setCloudStatus(`Nuvem: erro (${error.message}). Rode o SQL em sql/schema.sql`);
      showCloudSqlHelp(true);
      return false;
    }

    if (!data) {
      setCloudStatus("Nuvem: vazia — enviando dados locais...");
      await saveCloud();
      return false;
    }

    applyStatePayload(data.payload);
    saveLocal();
    showCloudSqlHelp(false);
    const when = data.updated_at
      ? new Date(data.updated_at).toLocaleString("pt-BR")
      : new Date().toLocaleString("pt-BR");
    setCloudStatus(`Nuvem: sincronizado (${when})`);
    return true;
  } catch (err) {
    console.warn(err);
    setCloudStatus(`Nuvem: erro — ${err.message || err}`);
    showCloudSqlHelp(true);
    return false;
  }
}

let cloudSaveTimer = null;
function save() {
  saveLocal();
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => {
    saveCloud();
  }, 600);
}

function currency(value) {
  const map = { BRL: "pt-BR", USD: "en-US", EUR: "de-DE" };
  const loc = map[state.settings.currency] || "pt-BR";
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: state.settings.currency
  }).format(value || 0);
}

function categoryById(id) {
  const all = getAllCategories();
  return all.find((c) => c.id === id) || all.at(-1);
}

function categoriesForType(type) {
  if (type === "income") return getIncomeCategories();
  if (type === "expense") return getExpenseCategories();
  return getAllCategories();
}

function defaultCategoryForType(type) {
  const list = categoriesForType(type);
  return list[0]?.id || "";
}

function fillSelect(select, items, withAllLabel, grouped = false) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = "";
  if (withAllLabel) {
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = withAllLabel;
    select.appendChild(all);
  }

  const appendItems = (list, parent) => {
    list.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.id ?? item;
      opt.textContent = item.name ?? item;
      parent.appendChild(opt);
    });
  };

  if (grouped) {
    const incomeGroup = document.createElement("optgroup");
    incomeGroup.label = "Receitas";
    appendItems(getIncomeCategories(), incomeGroup);
    select.appendChild(incomeGroup);

    const expenseGroup = document.createElement("optgroup");
    expenseGroup.label = "Despesas";
    appendItems(getExpenseCategories(), expenseGroup);
    select.appendChild(expenseGroup);
  } else {
    appendItems(items, select);
  }

  if ([...select.options].some((o) => o.value === current)) select.value = current;
  else if (withAllLabel) select.value = "all";
  else if (items?.[0]) select.value = items[0].id ?? items[0];
}

function syncCategorySelect(selectId, type, withAllLabel) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const items = categoriesForType(type);
  const grouped = type === "all" || !type;
  fillSelect(select, items, withAllLabel, grouped);
}

function accountById(id) {
  return ACCOUNTS.find((a) => a.id === id) || ACCOUNTS[0];
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatLongDate(date = new Date()) {
  const text = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function matchesFilter(tx, filter) {
  const q = (filter.search || "").trim().toLowerCase();
  if (q) {
    const hay = `${tx.desc} ${categoryById(tx.category).name} ${accountById(tx.account).name}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (filter.type && filter.type !== "all" && tx.type !== filter.type) return false;
  if (filter.category && filter.category !== "all" && tx.category !== filter.category) return false;
  if (filter.account && filter.account !== "all" && tx.account !== filter.account) return false;
  if (filter.from && tx.date < filter.from) return false;
  if (filter.to && tx.date > filter.to) return false;
  return true;
}

function getFilter(prefix) {
  if (prefix === "dash" || prefix === "main") {
    return {
      search: document.getElementById("dash-search")?.value || "",
      type: document.getElementById("main-type")?.value || "all",
      category: document.getElementById("main-category")?.value || "all",
      account: "all",
      from: document.getElementById("dash-from")?.value || "",
      to: document.getElementById("dash-to")?.value || ""
    };
  }
  if (prefix === "report") {
    return {
      search: "",
      type: document.getElementById("main-type")?.value || "all",
      category: document.getElementById("main-category")?.value || "all",
      account: "all",
      from: document.getElementById("report-from")?.value || "",
      to: document.getElementById("report-to")?.value || ""
    };
  }
  return {
    search: document.getElementById(`${prefix}-search`)?.value || "",
    type: document.getElementById(`${prefix}-type`)?.value || "all",
    category: document.getElementById(`${prefix}-category`)?.value || "all",
    account: document.getElementById(`${prefix}-account`)?.value || "all",
    from: document.getElementById(`${prefix}-from`)?.value || "",
    to: document.getElementById(`${prefix}-to`)?.value || ""
  };
}

function filteredByMain(list = state.transactions) {
  const filter = {
    search: "",
    type: document.getElementById("main-type")?.value || "all",
    category: document.getElementById("main-category")?.value || "all",
    account: "all",
    from: "",
    to: ""
  };
  return list.filter((tx) => matchesFilter(tx, filter));
}

function filtered(prefix = "dash") {
  const filter = getFilter(prefix);
  return [...state.transactions]
    .filter((tx) => matchesFilter(tx, filter))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

function monthKey(date) {
  return date.slice(0, 7);
}

function currentMonthTx(list = state.transactions) {
  const key = todayISO().slice(0, 7);
  return list.filter((tx) => monthKey(tx.date) === key);
}

function sumBy(list, type) {
  return list.filter((tx) => tx.type === type).reduce((acc, tx) => acc + Number(tx.amount), 0);
}

function deleteTransaction(id) {
  const tx = state.transactions.find((item) => item.id === id);
  if (!tx) return;
  const label = tx.type === "expense" ? "despesa" : "receita";
  if (!confirm(`Excluir esta ${label}: "${tx.desc}"?`)) return;
  state.transactions = state.transactions.filter((item) => item.id !== id);
  save();
  refresh();
  showToast(`${label.charAt(0).toUpperCase() + label.slice(1)} excluída`);
}

function renderHeader() {
  document.getElementById("greeting").textContent = `${greeting()}, ${state.settings.name}`;
  document.getElementById("today-line").textContent = `${formatLongDate()} — Martins Imóveis · Finanças`;
  document.getElementById("tx-count-badge").textContent = String(state.transactions.length);
  document.getElementById("insight-badge").textContent = String(state.transactions.length ? 3 : 0);
  document.getElementById("setting-name").value = state.settings.name;
  document.getElementById("setting-currency").value = state.settings.currency;
  const loginUser = document.getElementById("setting-login-user");
  const loginPass = document.getElementById("setting-login-pass");
  if (loginUser) loginUser.value = state.settings.loginUser || "Tiago";
  if (loginPass) loginPass.value = state.settings.loginPass || "Carlos27";
}

function renderKpis() {
  const month = filteredByMain(currentMonthTx());
  const prevKey = monthKey(addDays(new Date(), -32).toISOString());
  const prev = filteredByMain(state.transactions.filter((tx) => monthKey(tx.date) === prevKey));
  const income = sumBy(month, "income");
  const expense = sumBy(month, "expense");
  const result = income - expense;
  const allFiltered = filteredByMain();
  const balance = sumBy(allFiltered, "income") - sumBy(allFiltered, "expense");
  const prevBalance = sumBy(prev, "income") - sumBy(prev, "expense");
  const hasPrev = prev.length > 0;
  const delta = !hasPrev ? 0 : ((balance - prevBalance) / Math.abs(prevBalance || 1)) * 100;
  const todayCount = month.filter((tx) => tx.date === todayISO() && tx.type === "expense").length;

  document.getElementById("kpi-balance").textContent = currency(balance);
  document.getElementById("kpi-expense").textContent = currency(expense);
  document.getElementById("kpi-income").textContent = currency(income);
  const resultEl = document.getElementById("kpi-result");
  if (resultEl) {
    resultEl.textContent = currency(result);
    resultEl.className = `kpi-value ${result >= 0 ? "amount income" : "amount expense"}`;
  }
  document.getElementById("kpi-balance-delta").firstElementChild.textContent = hasPrev
    ? `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}% vs mês anterior`
    : "Sem histórico ainda";
  document.getElementById("kpi-expense-delta").firstElementChild.textContent =
    `${todayCount} nova${todayCount === 1 ? "" : "s"} hoje`;
  document.getElementById("kpi-income-delta").firstElementChild.textContent =
    income ? `${month.filter((t) => t.type === "income").length} receita(s) no mês` : "Nenhuma receita este mês";
  const resultDelta = document.getElementById("kpi-result-delta");
  if (resultDelta) {
    resultDelta.firstElementChild.textContent = result >= 0
      ? "Mês positivo até agora"
      : "Despesas acima das receitas";
    resultDelta.className = `kpi-foot ${result >= 0 ? "up" : "warn"}`;
  }
}

function renderDashObras() {
  const wrap = document.getElementById("dash-obras-strip");
  if (!wrap) return;
  if (!state.obras.length) {
    wrap.innerHTML = `
      <article class="dash-obras-empty">
        <div>
          <strong>Obras</strong>
          <p>Nenhuma obra cadastrada ainda. Crie uma obra para acompanhar o financeiro por projeto.</p>
        </div>
        <button type="button" class="ghost-btn" data-goto="obras">Ir para obras</button>
      </article>
    `;
    return;
  }
  const cards = state.obras.slice(0, 4).map((obra) => {
    const list = state.transactions.filter((tx) => tx.obraId === obra.id);
    const income = sumBy(list, "income");
    const expense = sumBy(list, "expense");
    const balance = income - expense;
    return `
      <button type="button" class="dash-obra-card" data-goto-obra="${obra.id}">
        <div class="dash-obra-card-top">
          <strong>${obra.name}</strong>
          <span class="obra-status-pill status-${obra.status || "planejamento"}">${obraStatusLabel(obra.status)}</span>
        </div>
        <span class="dash-obra-balance ${balance >= 0 ? "income" : "expense"}">${currency(balance)}</span>
        <small>Entradas ${currency(income)} · Saídas ${currency(expense)}</small>
      </button>
    `;
  }).join("");
  wrap.innerHTML = `
    <div class="dash-obras-head">
      <div>
        <p class="obras-section-label">Obras</p>
        <h3>Resumo financeiro por obra</h3>
      </div>
      <button type="button" class="ghost-btn" data-goto="obras">Ver todas</button>
    </div>
    <div class="dash-obras-grid">${cards}</div>
  `;
}

function renderWeeklyChart() {
  const labels = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = addDays(now, -mondayOffset);
  const series = labels.map((_, i) => {
    const day = addDays(monday, i).toISOString().slice(0, 10);
    const dayTx = state.transactions.filter((tx) => tx.date === day);
    return { label: labels[i], expense: sumBy(dayTx, "expense"), income: sumBy(dayTx, "income") };
  });
  const max = Math.max(1, ...series.flatMap((s) => [s.expense, s.income]));
  const chart = document.getElementById("weekly-chart");
  chart.innerHTML = series.map((s) => `
    <div class="day-col">
      <div class="bars">
        <div class="bar expense" style="height:${s.expense ? Math.max(12, (s.expense / max) * 100) : 0}%" title="${currency(s.expense)}"></div>
        <div class="bar income" style="height:${s.income ? Math.max(12, (s.income / max) * 100) : 0}%" title="${currency(s.income)}"></div>
      </div>
      <div class="day-label">${s.label}</div>
    </div>
  `).join("");
}

function drawDonut(list) {
  const canvas = document.getElementById("donut");
  const ctx = canvas.getContext("2d");
  const expenses = list.filter((tx) => tx.type === "expense");
  const totals = {};
  expenses.forEach((tx) => {
    totals[tx.category] = (totals[tx.category] || 0) + Number(tx.amount);
  });
  const slices = Object.entries(totals);
  const total = slices.reduce((acc, [, v]) => acc + v, 0) || 1;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 88;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let angle = -Math.PI / 2;
  if (!slices.length) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 22;
    ctx.strokeStyle = "#1a3050";
    ctx.stroke();
  } else {
    slices.forEach(([cat, value]) => {
      const slice = (value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, angle, angle + slice);
      ctx.lineWidth = 22;
      ctx.lineCap = "round";
      ctx.strokeStyle = categoryById(cat).color;
      ctx.stroke();
      angle += slice + 0.04;
    });
  }
  document.getElementById("donut-total").textContent = String(list.length);
  const legend = document.getElementById("donut-legend");
  if (legend) {
    const ranked = slices.sort((a, b) => b[1] - a[1]).slice(0, 4);
    legend.innerHTML = ranked.length
      ? ranked.map(([cat, value]) => `
          <div class="donut-legend-item">
            <i style="background:${categoryById(cat).color}"></i>
            <span>${categoryById(cat).name}</span>
            <strong>${currency(value)}</strong>
          </div>
        `).join("")
      : `<p class="muted">Sem despesas no filtro atual.</p>`;
  }
}

function drawTrend() {
  const canvas = document.getElementById("trend");
  const ctx = canvas.getContext("2d");
  const width = canvas.parentElement.clientWidth - 8;
  canvas.width = Math.max(320, width);
  canvas.height = 110;
  const days = state.trendDays;
  const points = [];
  let running = 0;
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(new Date(), -i).toISOString().slice(0, 10);
    const dayTx = state.transactions.filter((tx) => tx.date === date);
    running += sumBy(dayTx, "income") - sumBy(dayTx, "expense");
    points.push(running);
  }
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 1);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = (i / Math.max(1, points.length - 1)) * (canvas.width - 8) + 4;
    const y = canvas.height - 10 - ((p - min) / (max - min || 1)) * (canvas.height - 20);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#c9a978";
  ctx.lineWidth = 2.4;
  ctx.stroke();
}

function renderQueue() {
  const list = filtered("dash").slice(0, 8);
  const wrap = document.getElementById("dash-queue");
  if (!list.length) {
    wrap.innerHTML = `
      <li class="empty-state">
        <p>Nenhum lançamento ainda. Adicione uma receita ou despesa para começar.</p>
        <div class="empty-actions">
          <button type="button" class="income-btn" data-quick="income">Receita</button>
          <button type="button" class="expense-btn" data-quick="expense">Despesa</button>
        </div>
      </li>
    `;
    return;
  }
  wrap.innerHTML = list.map((tx) => `
    <li class="tx-row">
      <div>
        <strong>${tx.desc}</strong>
        <small>${tx.date.split("-").reverse().join("/")} · ${categoryById(tx.category).name} · ${accountById(tx.account).name}</small>
      </div>
      <strong class="amount ${tx.type}">${tx.type === "expense" ? "-" : "+"}${currency(tx.amount)}</strong>
      <div class="row-actions">
        <button class="icon-btn" data-edit="${tx.id}" title="Editar" type="button">✎</button>
        <button class="icon-btn" data-del="${tx.id}" title="Excluir" type="button">✕</button>
      </div>
    </li>
  `).join("");
}

function renderTxRows(list) {
  if (!list.length) {
    return `<tr><td colspan="6">Nenhum lançamento nesta categoria.</td></tr>`;
  }
  return list.map((tx) => `
    <tr>
      <td>${tx.date.split("-").reverse().join("/")}</td>
      <td>${tx.desc}</td>
      <td><span class="tag">${categoryById(tx.category).name}</span></td>
      <td>${accountById(tx.account).name}</td>
      <td class="num amount ${tx.type}">${tx.type === "expense" ? "-" : "+"}${currency(tx.amount)}</td>
      <td>
        <button class="icon-btn" data-edit="${tx.id}" title="Editar" type="button">✎</button>
        <button class="icon-btn" data-del="${tx.id}" title="Excluir" type="button">✕</button>
      </td>
    </tr>
  `).join("");
}

function renderTable() {
  const list = filtered("tx");
  const incomes = list.filter((tx) => tx.type === "income");
  const expenses = list.filter((tx) => tx.type === "expense");
  const typeFilter = document.getElementById("tx-type")?.value || "all";

  document.getElementById("tx-table-income").innerHTML = renderTxRows(incomes);
  document.getElementById("tx-table-expense").innerHTML = renderTxRows(expenses);

  document.querySelector(".income-group")?.classList.toggle("hidden", typeFilter === "expense");
  document.querySelector(".expense-group")?.classList.toggle("hidden", typeFilter === "income");

  const income = sumBy(list, "income");
  const expense = sumBy(list, "expense");
  document.getElementById("tx-summary").textContent =
    `${list.length} lançamento(s) · Receitas ${currency(income)} · Despesas ${currency(expense)} · Saldo ${currency(income - expense)}`;
}

function renderAccounts() {
  const wrap = document.getElementById("accounts-grid");
  const filteredTx = filteredByMain();
  wrap.innerHTML = ACCOUNTS.map((acc) => {
    const list = filteredTx.filter((tx) => tx.account === acc.id);
    const balance = sumBy(list, "income") - sumBy(list, "expense");
    return `
      <article class="panel">
        <h2>${acc.name}</h2>
        <p>${acc.type} · ${list.length} lançamentos</p>
        <strong class="kpi-value" style="font-size:28px">${currency(balance)}</strong>
      </article>
    `;
  }).join("");
}

function renderGoals() {
  document.getElementById("goals-grid").innerHTML = GOALS.map((goal) => {
    const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
    return `
      <article class="panel">
        <h2>${goal.name}</h2>
        <p>${currency(goal.current)} de ${currency(goal.target)}</p>
        <div class="progress"><span style="width:${pct}%"></span></div>
        <small class="muted">${pct}% concluído</small>
      </article>
    `;
  }).join("");
}

function renderReports() {
  const list = filtered("report");
  const income = sumBy(list, "income");
  const expense = sumBy(list, "expense");
  document.getElementById("report-kpis").innerHTML = `
    <article><span>Receitas</span><strong class="amount income">${currency(income)}</strong></article>
    <article><span>Despesas</span><strong class="amount expense">${currency(expense)}</strong></article>
    <article><span>Resultado</span><strong>${currency(income - expense)}</strong></article>
  `;
  const rows = getAllCategories().map((cat) => {
    const group = list.filter((tx) => tx.category === cat.id);
    if (!group.length) return "";
    const inc = sumBy(group, "income");
    const exp = sumBy(group, "expense");
    return `<tr>
      <td>${cat.name}</td>
      <td class="num">${currency(inc)}</td>
      <td class="num">${currency(exp)}</td>
      <td class="num">${currency(inc - exp)}</td>
    </tr>`;
  }).join("");
  document.getElementById("report-table").innerHTML = rows || `<tr><td colspan="4">Sem dados no filtro.</td></tr>`;
}

function renderCategories() {
  const month = filteredByMain(currentMonthTx());
  document.getElementById("categories-grid").innerHTML = getAllCategories().map((cat) => {
    const list = month.filter((tx) => tx.category === cat.id);
    const expense = sumBy(list, "expense");
    const income = sumBy(list, "income");
    return `
      <article class="panel">
        <h2>${cat.name}</h2>
        <p>${list.length} lançamentos no mês</p>
        <p class="amount expense">Saídas ${currency(expense)}</p>
        <p class="amount income">Entradas ${currency(income)}</p>
      </article>
    `;
  }).join("");
}

function renderInsights() {
  const month = filteredByMain(currentMonthTx());
  const expense = sumBy(month, "expense");
  const income = sumBy(month, "income");
  const top = getAllCategories()
    .map((cat) => ({ cat, total: sumBy(month.filter((tx) => tx.category === cat.id), "expense") }))
    .sort((a, b) => b.total - a.total)[0];
  const saving = income - expense;
  document.getElementById("insights-grid").innerHTML = `
    <article class="panel">
      <h2>Taxa de economia</h2>
      <p>Quanto da renda ficou guardado neste mês</p>
      <strong class="kpi-value" style="font-size:32px">${income ? Math.round((saving / income) * 100) : 0}%</strong>
    </article>
    <article class="panel">
      <h2>Maior gasto</h2>
      <p>${top?.total ? `${top.cat.name} concentra a maior parte das despesas.` : "Sem despesas cadastradas ainda."}</p>
      <strong class="kpi-value" style="font-size:32px">${currency(top?.total || 0)}</strong>
    </article>
    <article class="panel">
      <h2>Ritmo diário</h2>
      <p>Média de despesas por dia no mês corrente</p>
      <strong class="kpi-value" style="font-size:32px">${currency(expense / Math.max(1, new Date().getDate()))}</strong>
    </article>
    <article class="panel">
      <h2>Saldo projetado</h2>
      <p>Se o ritmo atual se manter até o fim do mês</p>
      <strong class="kpi-value" style="font-size:32px">${currency(saving)}</strong>
    </article>
  `;
}

function renderBudgets() {
  const month = currentMonthTx();
  document.getElementById("budgets-grid").innerHTML = BUDGETS.map((b) => {
    const spent = sumBy(month.filter((tx) => tx.category === b.category && tx.type === "expense"), "expense");
    const pct = Math.min(100, Math.round((spent / b.limit) * 100));
    return `
      <article class="panel">
        <div class="panel-head">
          <div>
            <h2>${categoryById(b.category).name}</h2>
            <p>${currency(spent)} de ${currency(b.limit)}</p>
          </div>
          <span class="tag">${pct}%</span>
        </div>
        <div class="progress"><span style="width:${pct}%"></span></div>
      </article>
    `;
  }).join("");
}

function obraStatusLabel(status) {
  const map = {
    planejamento: "Planejamento",
    em_andamento: "Em andamento",
    concluida: "Concluída",
    pausada: "Pausada"
  };
  return map[status] || status || "-";
}

function etapaById(id) {
  return OBRA_ETAPAS.find((e) => e.id === id) || null;
}

function etapaLabel(id) {
  return etapaById(id)?.name || "Sem etapa";
}

function obraById(id) {
  return state.obras.find((o) => o.id === id) || null;
}

function funcionariosDaObra(obraId) {
  return state.funcionarios
    .filter((f) => f.obraId === obraId)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function funcionariosDisponiveisParaObra(obraId) {
  return state.funcionarios
    .filter((f) => f.status !== "inativo" && (!f.obraId || f.obraId === obraId))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function assignFuncionarioToObra(funcionarioId, obraId) {
  const idx = state.funcionarios.findIndex((f) => f.id === funcionarioId);
  if (idx < 0) return;
  const atual = state.funcionarios[idx];
  state.funcionarios[idx] = {
    ...atual,
    obraId: obraId || null,
    obraHistorico: upsertObraDia(atual.obraHistorico, todayISO(), obraId || null)
  };
  save();
  refresh();
  showToast(obraId ? "Funcionário adicionado à obra" : "Funcionário removido da obra");
}

function upsertObraDia(historico, date, obraId, status = null) {
  const list = Array.isArray(historico) ? [...historico] : [];
  const idx = list.findIndex((item) => item.date === date);
  let resolvedStatus = status;
  if (!resolvedStatus) {
    if (obraId) resolvedStatus = "presente";
    else resolvedStatus = "folga";
  }
  if (resolvedStatus === "falta" || resolvedStatus === "folga") {
    obraId = null;
  }
  const entry = {
    id: idx >= 0 ? list[idx].id : uid(),
    date,
    obraId: obraId || null,
    status: resolvedStatus
  };
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

function formatShortDate(iso) {
  if (!iso) return "-";
  return iso.split("-").reverse().join("/");
}

function normalizePontoStatus(dia) {
  if (!dia) return "folga";
  if (dia.status === "presente" || dia.status === "falta" || dia.status === "folga") return dia.status;
  return dia.obraId ? "presente" : "folga";
}

function pontoStatusLabel(status) {
  if (status === "presente") return "Presente";
  if (status === "falta") return "Falta";
  return "Folga";
}

function obraDiaLabel(diaOrObraId) {
  if (diaOrObraId && typeof diaOrObraId === "object") {
    const status = normalizePontoStatus(diaOrObraId);
    if (status === "falta") return "Falta";
    if (status === "folga") return "Folga";
    const obra = diaOrObraId.obraId ? obraById(diaOrObraId.obraId) : null;
    return obra ? `Presente · ${obra.name}` : "Presente";
  }
  if (!diaOrObraId) return "Folga";
  const obra = obraById(diaOrObraId);
  return obra ? obra.name : "Obra removida";
}

function getFuncionarioHistorico(funcionario) {
  return [...(Array.isArray(funcionario?.obraHistorico) ? funcionario.obraHistorico : [])]
    .map((dia) => ({
      ...dia,
      status: normalizePontoStatus(dia)
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function fillCargoSelect(select, selected = "", withAllLabel = "") {
  if (!select) return;
  const cargos = getFuncionarioCargos();
  select.innerHTML = "";
  if (withAllLabel) {
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = withAllLabel;
    select.appendChild(all);
  } else {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecione o cargo";
    select.appendChild(placeholder);
  }
  cargos.forEach((cargo) => {
    const opt = document.createElement("option");
    opt.value = cargo;
    opt.textContent = cargo;
    select.appendChild(opt);
  });
  if (selected && selected !== "all" && ![...select.options].some((o) => o.value === selected)) {
    const opt = document.createElement("option");
    opt.value = selected;
    opt.textContent = selected;
    select.appendChild(opt);
  }
  if (withAllLabel) {
    select.value = selected || "all";
  } else {
    select.value = selected || "";
  }
}

function syncObraEtapaField() {
  const status = document.getElementById("obra-status")?.value;
  const wrap = document.getElementById("obra-etapa-wrap");
  if (!wrap) return;
  wrap.classList.toggle("hidden", status !== "em_andamento");
}

function openObraModal(obra) {
  document.getElementById("obra-modal-title").textContent = obra ? "Editar obra" : "Nova obra";
  document.getElementById("obra-id").value = obra?.id || "";
  document.getElementById("obra-name").value = obra?.name || "";
  document.getElementById("obra-location").value = obra?.location || "";
  document.getElementById("obra-status").value = obra?.status || "planejamento";
  fillSelect(document.getElementById("obra-etapa"), OBRA_ETAPAS);
  document.getElementById("obra-etapa").value = obra?.etapa || OBRA_ETAPAS[0].id;
  document.getElementById("obra-notes").value = obra?.notes || "";
  syncObraEtapaField();
  document.getElementById("obra-modal").showModal();
  document.getElementById("obra-name").focus();
}

function renderObrasNav() {
  const list = document.getElementById("obras-nav-list");
  if (!list) return;
  const ongoing = state.obras.filter((obra) => obra.status === "em_andamento");
  const obrasViewActive = !document.getElementById("view-obras")?.classList.contains("hidden");
  list.innerHTML = ongoing.map((obra) => `
    <button type="button" class="nav-item ${obrasViewActive && obra.id === state.activeObraId ? "active" : ""}" data-obra-nav="${obra.id}">
      <span class="nav-icon">
        <svg viewBox="0 0 24 24"><path d="M4 20h16M6 20V9l6-4 6 4v11M10 20v-5h4v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      ${obra.name}
    </button>
  `).join("");
}

function renderObras() {
  const tabs = document.getElementById("obras-tabs");
  const content = document.getElementById("obras-content");
  const badge = document.getElementById("obras-count-badge");
  if (badge) badge.textContent = String(state.obras.length);
  renderObrasNav();

  if (!state.obras.length) {
    tabs.innerHTML = "";
    content.innerHTML = `
      <div class="obras-empty empty-state">
        <p>Ainda não há obras cadastradas.</p>
        <p class="muted">Clique em <strong>Nova obra</strong> para criar a primeira e acompanhar receitas e despesas por projeto.</p>
        <button type="button" class="primary-btn" id="obras-empty-add">Nova obra</button>
      </div>
    `;
    return;
  }

  if (!state.activeObraId || !state.obras.some((o) => o.id === state.activeObraId)) {
    state.activeObraId = state.obras[0].id;
  }

  tabs.innerHTML = state.obras.map((obra) => {
    const txCount = state.transactions.filter((tx) => tx.obraId === obra.id).length;
    const teamCount = funcionariosDaObra(obra.id).length;
    const statusClass = `status-${obra.status || "planejamento"}`;
    return `
      <button type="button" class="obra-card ${obra.id === state.activeObraId ? "active" : ""}" data-obra-tab="${obra.id}">
        <div class="obra-card-top">
          <strong class="obra-card-name">${obra.name}</strong>
          <span class="obra-tab-close" data-obra-del="${obra.id}" title="Excluir obra">✕</span>
        </div>
        <span class="obra-status-pill ${statusClass}">${obraStatusLabel(obra.status)}</span>
        <span class="obra-card-meta">${obra.location || "Local não informado"}</span>
        <span class="obra-card-meta">${txCount} lançamento${txCount === 1 ? "" : "s"} · ${teamCount} funcionário${teamCount === 1 ? "" : "s"}</span>
      </button>
    `;
  }).join("");

  const active = state.obras.find((o) => o.id === state.activeObraId);
  const isOngoing = active.status === "em_andamento";
  if (!isOngoing) state.obraEtapaFilter = "all";

  const team = funcionariosDaObra(active.id);
  const disponiveis = funcionariosDisponiveisParaObra(active.id).filter((f) => f.obraId !== active.id);
  const teamOptions = disponiveis.length
    ? disponiveis.map((f) => `<option value="${f.id}">${f.name} · ${f.role || "Sem cargo"}</option>`).join("")
    : `<option value="">Nenhum funcionário disponível</option>`;

  const allObraTx = state.transactions
    .filter((tx) => tx.obraId === active.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const obraTx = isOngoing && state.obraEtapaFilter !== "all"
    ? allObraTx.filter((tx) => (tx.etapa || "") === state.obraEtapaFilter)
    : allObraTx;
  const income = sumBy(obraTx, "income");
  const expense = sumBy(obraTx, "expense");
  const balance = income - expense;
  const totalMov = income + expense || 1;
  const incomePct = Math.round((income / totalMov) * 100);
  const expensePct = 100 - incomePct;
  const incomeCount = obraTx.filter((tx) => tx.type === "income").length;
  const expenseCount = obraTx.filter((tx) => tx.type === "expense").length;
  const byCategory = Object.entries(
    obraTx.reduce((acc, tx) => {
      const key = tx.category;
      if (!acc[key]) acc[key] = { income: 0, expense: 0 };
      acc[key][tx.type] += Number(tx.amount);
      return acc;
    }, {})
  )
    .map(([id, vals]) => ({
      id,
      name: categoryById(id).name,
      color: categoryById(id).color,
      total: vals.income + vals.expense,
      ...vals
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const etapaOptions = [
    `<option value="all">Todas as etapas</option>`,
    ...OBRA_ETAPAS.map((e) =>
      `<option value="${e.id}" ${state.obraEtapaFilter === e.id ? "selected" : ""}>${e.name}</option>`
    )
  ].join("");
  const filterHint = isOngoing && state.obraEtapaFilter !== "all"
    ? `Mostrando só a etapa: ${etapaLabel(state.obraEtapaFilter)}`
    : "Mostrando todos os lançamentos desta obra";

  content.innerHTML = `
    <div class="obra-detail">
      <div class="obra-block">
        <div class="obra-block-head">
          <div>
            <p class="obras-section-label">Obra selecionada</p>
            <h3 class="obra-title">${active.name}</h3>
            <p class="obra-subtitle">Resumo geral desta obra</p>
          </div>
          <span class="obra-status-pill status-${active.status || "planejamento"}">${obraStatusLabel(active.status)}</span>
        </div>

        <div class="obra-detail-grid">
          <article class="obra-detail-card">
            <span>Onde fica</span>
            <strong>${active.location || "Local ainda não informado"}</strong>
            <small>Endereço ou referência da obra</small>
          </article>
          <article class="obra-detail-card">
            <span>Situação</span>
            <strong>${obraStatusLabel(active.status)}</strong>
            <small>Planejamento, andamento, pausada ou concluída</small>
          </article>
          ${isOngoing ? `
          <article class="obra-detail-card">
            <span>Etapa atual da construção</span>
            <strong>${active.etapa ? etapaLabel(active.etapa) : "Ainda não definida"}</strong>
            <small>Fase em que a obra está agora</small>
          </article>` : `
          <article class="obra-detail-card">
            <span>Lançamentos</span>
            <strong>${allObraTx.length}</strong>
            <small>Total de receitas e despesas registradas</small>
          </article>`}
        </div>

        <div class="obra-notes-box">
          <span class="obras-section-label">Observações</span>
          <p>${active.notes ? active.notes : "Nenhuma observação cadastrada para esta obra."}</p>
        </div>

        <div class="obra-actions">
          <button type="button" class="ghost-btn" data-obra-edit="${active.id}">Editar dados da obra</button>
          <button type="button" class="danger-btn" data-obra-del="${active.id}">Excluir obra</button>
        </div>
      </div>

      ${isOngoing ? `
      <div class="obra-block obra-team">
        <div class="obra-finance-head">
          <div>
            <p class="obras-section-label">Equipe</p>
            <h3>Funcionários nesta obra</h3>
            <p class="obra-subtitle">Indique quem está trabalhando neste canteiro</p>
          </div>
        </div>
        <div class="obra-team-add">
          <select id="obra-team-select" ${disponiveis.length ? "" : "disabled"}>
            <option value="">Selecione um funcionário</option>
            ${teamOptions}
          </select>
          <button type="button" class="primary-btn" id="obra-team-add-btn" data-obra-team-add="${active.id}" ${disponiveis.length ? "" : "disabled"}>
            Adicionar à obra
          </button>
        </div>
        <ul class="obra-team-list">
          ${team.length ? team.map((f) => `
            <li class="obra-team-item">
              <div>
                <strong>${f.name}</strong>
                <small>${f.role || "Sem cargo"}${f.phone ? ` · ${f.phone}` : ""}</small>
              </div>
              <button type="button" class="ghost-btn" data-obra-team-remove="${f.id}">Remover</button>
            </li>
          `).join("") : `<li class="empty-state"><p>Nenhum funcionário nesta obra ainda. Selecione acima para adicionar.</p></li>`}
        </ul>
      </div>` : team.length ? `
      <div class="obra-block obra-team">
        <div class="obra-finance-head">
          <div>
            <p class="obras-section-label">Equipe</p>
            <h3>Funcionários vinculados</h3>
            <p class="obra-subtitle">A atribuição de equipe fica disponível quando a obra está em andamento</p>
          </div>
        </div>
        <ul class="obra-team-list">
          ${team.map((f) => `
            <li class="obra-team-item">
              <div>
                <strong>${f.name}</strong>
                <small>${f.role || "Sem cargo"}</small>
              </div>
            </li>
          `).join("")}
        </ul>
      </div>` : ""}

      <div class="obra-block obra-finance">
        <div class="obra-finance-head">
          <div>
            <p class="obras-section-label">Financeiro</p>
            <h3>Entradas e saídas desta obra</h3>
            <p class="obra-subtitle">${filterHint}</p>
          </div>
          <div class="obra-finance-actions">
            <button type="button" class="income-btn" data-obra-income="${active.id}">+ Receita</button>
            <button type="button" class="expense-btn" data-obra-expense="${active.id}">+ Despesa</button>
          </div>
        </div>

        ${isOngoing ? `
        <label class="obra-etapa-filter">
          <span>Ver por etapa da obra</span>
          <select id="obra-etapa-filter">${etapaOptions}</select>
          <small class="obra-filter-help">Use este filtro para analisar o custo de cada fase da construção.</small>
        </label>` : ""}

        <div class="obra-finance-kpis">
          <article class="obra-finance-kpi highlight">
            <span>${isOngoing && state.obraEtapaFilter !== "all" ? "Resultado da etapa" : "Resultado da obra"}</span>
            <strong class="${balance >= 0 ? "amount income" : "amount expense"}">${currency(balance)}</strong>
            <small>${obraTx.length} lançamento${obraTx.length === 1 ? "" : "s"} no filtro</small>
          </article>
          <article class="obra-finance-kpi">
            <span>Total que entrou</span>
            <strong class="amount income">${currency(income)}</strong>
            <small>${incomeCount} receita${incomeCount === 1 ? "" : "s"}</small>
          </article>
          <article class="obra-finance-kpi">
            <span>Total que saiu</span>
            <strong class="amount expense">${currency(expense)}</strong>
            <small>${expenseCount} despesa${expenseCount === 1 ? "" : "s"}</small>
          </article>
        </div>

        <div class="obra-finance-bar-wrap">
          <div class="obra-finance-bar-labels">
            <span>Composição do movimento</span>
            <span>${incomePct}% entradas · ${expensePct}% saídas</span>
          </div>
          <div class="obra-finance-bar">
            <span class="income" style="width:${incomePct}%"></span>
            <span class="expense" style="width:${expensePct}%"></span>
          </div>
        </div>

        ${byCategory.length ? `
        <div class="obra-cat-breakdown">
          <div class="obra-tx-block-head">
            <h4>Principais categorias</h4>
            <span class="muted">Top ${byCategory.length}</span>
          </div>
          <ul class="obra-cat-list">
            ${byCategory.map((cat) => `
              <li>
                <div class="obra-cat-name">
                  <i style="background:${cat.color}"></i>
                  <strong>${cat.name}</strong>
                </div>
                <div class="obra-cat-values">
                  <span class="amount income">+${currency(cat.income)}</span>
                  <span class="amount expense">-${currency(cat.expense)}</span>
                </div>
              </li>
            `).join("")}
          </ul>
        </div>` : ""}

        <div class="obra-tx-block">
          <div class="obra-tx-block-head">
            <h4>Histórico de lançamentos</h4>
            <span class="muted">${obraTx.length} registro${obraTx.length === 1 ? "" : "s"}</span>
          </div>
          <ul class="obra-tx-list">
            ${obraTx.length ? obraTx.map((tx) => `
              <li class="tx-row obra-tx-row">
                <span class="tx-type-pill ${tx.type}">${tx.type === "income" ? "Receita" : "Despesa"}</span>
                <div>
                  <strong>${tx.desc}</strong>
                  <small>
                    ${tx.date.split("-").reverse().join("/")}
                    · ${categoryById(tx.category).name}
                    · ${accountById(tx.account).name}
                    ${tx.etapa ? `· ${etapaLabel(tx.etapa)}` : ""}
                  </small>
                </div>
                <strong class="amount ${tx.type}">${tx.type === "expense" ? "-" : "+"}${currency(tx.amount)}</strong>
                <div class="row-actions">
                  <button class="icon-btn" data-edit="${tx.id}" title="Editar" type="button">✎</button>
                  <button class="icon-btn" data-del="${tx.id}" title="Excluir" type="button">✕</button>
                </div>
              </li>
            `).join("") : `<li class="empty-state"><p>${isOngoing && state.obraEtapaFilter !== "all" ? "Nenhum lançamento nesta etapa ainda. Cadastre uma receita ou despesa para ela." : "Ainda não há lançamentos nesta obra. Use os botões de Receita ou Despesa acima."}</p></li>`}
          </ul>
        </div>
      </div>
    </div>
  `;
}

function deleteObra(id) {
  const obra = state.obras.find((item) => item.id === id);
  if (!obra) return;
  const linked = state.transactions.filter((tx) => tx.obraId === id).length;
  const extra = linked ? ` Também serão removidos ${linked} lançamento(s) desta obra.` : "";
  if (!confirm(`Excluir a obra "${obra.name}"?${extra}`)) return;
  state.obras = state.obras.filter((item) => item.id !== id);
  state.transactions = state.transactions.filter((tx) => tx.obraId !== id);
  state.funcionarios = state.funcionarios.map((f) => {
    if (f.obraId !== id) return f;
    return { ...f, obraId: null };
  });
  if (state.activeObraId === id) state.activeObraId = state.obras[0]?.id || null;
  save();
  refresh();
  showToast("Obra excluída");
}

function funcionarioStatusLabel(status) {
  return status === "inativo" ? "Inativo" : "Ativo";
}

function openFuncionarioModal(funcionario) {
  document.getElementById("funcionario-modal-title").textContent = funcionario
    ? "Editar funcionário"
    : "Novo funcionário";
  document.getElementById("funcionario-id").value = funcionario?.id || "";
  document.getElementById("funcionario-name").value = funcionario?.name || "";
  const role = funcionario?.role || "";
  fillCargoSelect(document.getElementById("funcionario-role"), role);
  document.getElementById("funcionario-phone").value = funcionario?.phone || "";
  document.getElementById("funcionario-salary").value = funcionario?.salary ?? "";
  document.getElementById("funcionario-status").value = funcionario?.status || "ativo";
  document.getElementById("funcionario-notes").value = funcionario?.notes || "";
  fillFuncionarioObraSelect(
    document.getElementById("funcionario-obra"),
    funcionario?.obraId || "all",
    false
  );
  document.getElementById("funcionario-modal").showModal();
  document.getElementById("funcionario-name").focus();
}

function deleteFuncionario(id) {
  const funcionario = state.funcionarios.find((item) => item.id === id);
  if (!funcionario) return;
  if (!confirm(`Excluir o funcionário "${funcionario.name}"?`)) return;
  state.funcionarios = state.funcionarios.filter((item) => item.id !== id);
  save();
  refresh();
  showToast("Funcionário excluído");
}

function getObraDoDia(funcionario, date = todayISO()) {
  const dia = getFuncionarioHistorico(funcionario).find((item) => item.date === date);
  if (dia) return dia.obraId || null;
  if (date === todayISO()) return funcionario?.obraId || null;
  return null;
}

function renderFuncionarios() {
  const wrap = document.getElementById("funcionarios-grid");
  const badge = document.getElementById("funcionarios-count-badge");
  const filterSelect = document.getElementById("funcionario-role-filter");
  if (badge) badge.textContent = String(state.funcionarios.length);
  fillCargoSelect(filterSelect, state.funcionarioRoleFilter || "all", "Todos os cargos");
  if (!wrap) return;

  if (!state.funcionarios.length) {
    wrap.innerHTML = `
      <div class="obras-empty empty-state">
        <p>Ainda não há funcionários cadastrados.</p>
        <p class="muted">Clique em <strong>Novo funcionário</strong> para adicionar a equipe.</p>
        <button type="button" class="primary-btn" id="funcionarios-empty-add">Novo funcionário</button>
      </div>
    `;
    return;
  }

  const roleFilter = state.funcionarioRoleFilter || "all";
  const filtered = state.funcionarios.filter((f) =>
    roleFilter === "all" ? true : f.role === roleFilter
  );

  const sorted = [...filtered].sort((a, b) => {
    if (a.status !== b.status) return a.status === "ativo" ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  if (!sorted.length) {
    wrap.innerHTML = `
      <div class="obras-empty empty-state">
        <p>Nenhum funcionário com o cargo <strong>${roleFilter}</strong>.</p>
        <p class="muted">Troque o filtro ou cadastre alguém nessa função.</p>
      </div>
    `;
    return;
  }

  const obraOptions = [
    `<option value="all">Folga</option>`,
    ...state.obras.map((o) => `<option value="${o.id}">${o.name}</option>`)
  ].join("");

  wrap.innerHTML = sorted.map((f) => {
    const diaHoje = getFuncionarioHistorico(f).find((d) => d.date === todayISO());
    const statusHoje = normalizePontoStatus(diaHoje) || (f.obraId ? "presente" : "folga");
    const obraHojeId = getObraDoDia(f, todayISO());
    const obraHoje = obraHojeId ? obraById(obraHojeId) : null;
    const historicoCompleto = getFuncionarioHistorico(f);
    const historico = historicoCompleto.slice(0, 3);
    const totalDias = historicoCompleto.length;
    const totalFaltas = historicoCompleto.filter((d) => d.status === "falta").length;
    return `
    <article class="funcionario-card ${f.status === "inativo" ? "is-inactive" : ""}" data-funcionario-card="${f.id}">
      <div class="funcionario-card-top">
        <div>
          <strong class="funcionario-name">${f.name}</strong>
          <p class="funcionario-role">${f.role || "Cargo não informado"}</p>
        </div>
        <span class="obra-status-pill status-${f.status === "ativo" ? "em_andamento" : "pausada"}">
          ${funcionarioStatusLabel(f.status)}
        </span>
      </div>
      <div class="funcionario-info-grid">
        <div>
          <span>Telefone</span>
          <strong>${f.phone || "Não informado"}</strong>
        </div>
        <div>
          <span>Salário / diária</span>
          <strong>${f.salary ? currency(Number(f.salary)) : "Não informado"}</strong>
        </div>
        <div class="funcionario-obra-field">
          <span>Hoje</span>
          <strong>${
            statusHoje === "falta"
              ? "Falta"
              : statusHoje === "folga"
                ? "Folga"
                : (obraHoje ? obraHoje.name : "Presente")
          }</strong>
          <small>${totalDias} registro(s) · ${totalFaltas} falta(s)</small>
        </div>
      </div>

      <div class="funcionario-dias">
        <div class="funcionario-dias-head">
          <span>Últimos 3 dias</span>
          <button type="button" class="ghost-btn" data-funcionario-dias="${f.id}">
            Ver histórico (${totalDias})
          </button>
        </div>
        <div class="funcionario-dia-quick">
          <label>
            <span>Data</span>
            <input type="date" data-dia-date="${f.id}" value="${todayISO()}" />
          </label>
          <label>
            <span>Situação</span>
            <select data-dia-status="${f.id}">
              <option value="presente">Presente</option>
              <option value="falta">Falta</option>
              <option value="folga">Folga</option>
            </select>
          </label>
          <label>
            <span>Obra do dia</span>
            <select data-dia-obra="${f.id}">
              ${obraOptions}
            </select>
          </label>
          <button type="button" class="primary-btn" data-dia-save="${f.id}">Registrar dia</button>
        </div>
        ${historico.length ? `
          <ul class="funcionario-dias-list">
            ${historico.map((dia) => `
              <li>
                <strong>${formatShortDate(dia.date)}</strong>
                <span>${obraDiaLabel(dia)}</span>
              </li>
            `).join("")}
          </ul>
        ` : `<p class="funcionario-dias-empty">Nenhum dia registrado ainda. Use o controle acima.</p>`}
      </div>

      <p class="funcionario-notes">${f.notes || "Sem observações."}</p>
      <div class="obra-actions">
        <button type="button" class="ghost-btn" data-funcionario-edit="${f.id}">Editar</button>
        <button type="button" class="danger-btn" data-funcionario-del="${f.id}">Excluir</button>
      </div>
    </article>
  `;
  }).join("");

  sorted.forEach((f) => {
    const select = wrap.querySelector(`select[data-dia-obra="${f.id}"]`);
    const statusSelect = wrap.querySelector(`select[data-dia-status="${f.id}"]`);
    const diaHoje = getFuncionarioHistorico(f).find((d) => d.date === todayISO());
    if (statusSelect) statusSelect.value = normalizePontoStatus(diaHoje);
    if (!select) return;
    const obraHojeId = getObraDoDia(f, todayISO());
    if (obraHojeId && [...select.options].some((o) => o.value === obraHojeId)) {
      select.value = obraHojeId;
    } else {
      select.value = "all";
    }
  });
}

function fillFuncionarioObraSelect(select, selectedId = "all", includeAllObras = true) {
  if (!select) return;
  const obras = includeAllObras
    ? state.obras
    : state.obras.filter((o) => o.status === "em_andamento");
  fillSelect(select, obras.map((o) => ({ id: o.id, name: o.name })), "Sem obra / folga");
  const value = selectedId || "all";
  if (value !== "all" && ![...select.options].some((o) => o.value === value)) {
    const obra = obraById(value);
    if (obra) {
      const opt = document.createElement("option");
      opt.value = obra.id;
      opt.textContent = `${obra.name} (${obraStatusLabel(obra.status)})`;
      select.appendChild(opt);
    }
  }
  select.value = value !== "all" && [...select.options].some((o) => o.value === value) ? value : "all";
}

function renderFuncionarioDiasList(funcionario) {
  const list = document.getElementById("funcionario-dias-list");
  if (!list || !funcionario) return;
  const historico = getFuncionarioHistorico(funcionario);
  if (!historico.length) {
    list.innerHTML = `<li class="empty-state"><p>Nenhum dia registrado para este funcionário.</p></li>`;
    return;
  }
  const faltas = historico.filter((d) => d.status === "falta").length;
  const presentes = historico.filter((d) => d.status === "presente").length;
  list.innerHTML = `
    <li class="funcionario-dias-total">
      <strong>${historico.length} registro(s) · ${presentes} presente(s) · ${faltas} falta(s)</strong>
    </li>
    ${historico.map((dia) => `
    <li class="funcionario-dia-row">
      <div>
        <strong>${formatShortDate(dia.date)}</strong>
        <small>${obraDiaLabel(dia)}</small>
      </div>
      <button type="button" class="icon-btn" data-dia-del="${dia.id}" title="Excluir dia">✕</button>
    </li>
  `).join("")}`;
}

function openFuncionarioDiasModal(funcionario) {
  if (!funcionario) return;
  document.getElementById("funcionario-dias-id").value = funcionario.id;
  document.getElementById("funcionario-dias-title").textContent = `Controle diário — ${funcionario.name}`;
  document.getElementById("funcionario-dias-date").value = todayISO();
  const statusSelect = document.getElementById("funcionario-dias-status");
  if (statusSelect) statusSelect.value = "presente";
  fillFuncionarioObraSelect(
    document.getElementById("funcionario-dias-obra"),
    funcionario.obraId || "all",
    true
  );
  renderFuncionarioDiasList(funcionario);
  document.getElementById("funcionario-dias-modal").showModal();
}

function saveFuncionarioDia(funcionarioId, date, obraValue, status = "presente") {
  let obraId = !obraValue || obraValue === "all" ? null : obraValue;
  let resolvedStatus = status || "presente";
  if (resolvedStatus !== "presente") obraId = null;
  if (!funcionarioId || !date) {
    showToast("Informe a data");
    return;
  }
  const idx = state.funcionarios.findIndex((f) => f.id === funcionarioId);
  if (idx < 0) return;
  const atual = state.funcionarios[idx];
  const historico = upsertObraDia(atual.obraHistorico, date, obraId, resolvedStatus);
  const updated = {
    ...atual,
    obraHistorico: historico,
    obraId: date === todayISO()
      ? (resolvedStatus === "presente" ? obraId : null)
      : atual.obraId
  };
  state.funcionarios[idx] = updated;
  save();
  const modalOpen = document.getElementById("funcionario-dias-modal")?.open;
  if (modalOpen && document.getElementById("funcionario-dias-id").value === funcionarioId) {
    renderFuncionarioDiasList(updated);
  }
  refresh();
  showToast(
    resolvedStatus === "falta"
      ? "Falta registrada"
      : resolvedStatus === "folga"
        ? "Folga registrada"
        : "Presença registrada"
  );
}

function deleteFuncionarioDia(funcionarioId, diaId) {
  const idx = state.funcionarios.findIndex((f) => f.id === funcionarioId);
  if (idx < 0) return;
  const atual = state.funcionarios[idx];
  const historico = getFuncionarioHistorico(atual).filter((d) => d.id !== diaId);
  const hoje = historico.find((d) => d.date === todayISO());
  const updated = {
    ...atual,
    obraHistorico: historico,
    obraId: hoje ? hoje.obraId : atual.obraId
  };
  state.funcionarios[idx] = updated;
  save();
  renderFuncionarioDiasList(updated);
  refresh();
  showToast("Registro do dia removido");
}

function renderRecurring() {
  const list = document.getElementById("recurring-list");
  if (!RECURRING.length) {
    list.innerHTML = `<li class="empty-state"><p>Nenhum lançamento recorrente cadastrado.</p></li>`;
    return;
  }
  list.innerHTML = RECURRING.map((item) => `
    <li>
      <div>
        <strong>${item.name}</strong>
        <small>Todo dia ${item.day} · ${categoryById(item.category).name}</small>
      </div>
      <strong class="amount expense">-${currency(item.amount)}</strong>
    </li>
  `).join("");
}

function setMobileMenu(open) {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const toggle = document.getElementById("menu-toggle");
  if (!sidebar || !overlay || !toggle) return;
  sidebar.classList.toggle("is-open", open);
  overlay.classList.toggle("is-open", open);
  overlay.hidden = !open;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  document.body.classList.toggle("menu-open", open);
}

function closeMobileMenu() {
  setMobileMenu(false);
}

function openMobileMenu() {
  setMobileMenu(true);
}

function renderCatalogManager() {
  const expenseList = document.getElementById("settings-expense-list");
  const incomeList = document.getElementById("settings-income-list");
  const cargoList = document.getElementById("settings-cargo-list");
  if (!expenseList || !incomeList || !cargoList) return;

  const renderCatItems = (list, kind) => {
    if (!list.length) return `<li class="empty-state"><p>Nenhuma categoria cadastrada.</p></li>`;
    return list.map((cat) => `
      <li class="catalog-item">
        <span class="catalog-swatch" style="background:${cat.color}"></span>
        <strong>${cat.name}</strong>
        <button type="button" class="icon-btn" data-del-cat="${kind}:${cat.id}" title="Remover">✕</button>
      </li>
    `).join("");
  };

  expenseList.innerHTML = renderCatItems(getExpenseCategories(), "expense");
  incomeList.innerHTML = renderCatItems(getIncomeCategories(), "income");
  cargoList.innerHTML = getFuncionarioCargos().length
    ? getFuncionarioCargos().map((cargo) => `
      <li class="catalog-item">
        <strong>${cargo}</strong>
        <button type="button" class="icon-btn" data-del-cargo="${cargo}" title="Remover">✕</button>
      </li>
    `).join("")
    : `<li class="empty-state"><p>Nenhum cargo cadastrado.</p></li>`;
}

function addCategory(kind, name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    showToast("Informe o nome da categoria");
    return;
  }
  const list = kind === "income" ? getIncomeCategories() : getExpenseCategories();
  if (list.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
    showToast("Essa categoria já existe");
    return;
  }
  list.push({
    id: uniqueCategoryId(trimmed, getAllCategories()),
    name: trimmed,
    color: nextCategoryColor(list)
  });
  if (kind === "income") state.incomeCategories = list;
  else state.expenseCategories = list;
  save();
  refresh();
  showToast("Categoria adicionada");
}

function removeCategory(kind, id) {
  const list = kind === "income" ? getIncomeCategories() : getExpenseCategories();
  if (list.length <= 1) {
    showToast("Mantenha ao menos uma categoria");
    return;
  }
  const used = state.transactions.some((tx) => tx.category === id);
  if (used && !confirm("Há lançamentos com essa categoria. Remover mesmo assim?")) return;
  const next = list.filter((c) => c.id !== id);
  if (kind === "income") state.incomeCategories = next;
  else state.expenseCategories = next;
  save();
  refresh();
  showToast("Categoria removida");
}

function addCargo(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    showToast("Informe o cargo / função");
    return;
  }
  const list = getFuncionarioCargos();
  if (list.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    showToast("Esse cargo já existe");
    return;
  }
  state.funcionarioCargos = [...list, trimmed];
  save();
  refresh();
  showToast("Cargo adicionado");
}

function removeCargo(name) {
  const list = getFuncionarioCargos();
  if (list.length <= 1) {
    showToast("Mantenha ao menos um cargo");
    return;
  }
  const used = state.funcionarios.some((f) => f.role === name);
  if (used && !confirm("Há funcionários com esse cargo. Remover mesmo assim?")) return;
  state.funcionarioCargos = list.filter((c) => c !== name);
  if (state.funcionarioRoleFilter === name) state.funcionarioRoleFilter = "all";
  save();
  refresh();
  showToast("Cargo removido");
}

function monthKeyFromDate(iso = todayISO()) {
  return String(iso || todayISO()).slice(0, 7);
}

function shiftMonthKey(monthKey, delta) {
  const [y, m] = String(monthKey || monthKeyFromDate()).split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthKey) {
  const [y, m] = String(monthKey || monthKeyFromDate()).split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function daysInMonth(monthKey) {
  const [y, m] = String(monthKey).split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function firstWeekdayOfMonth(monthKey) {
  const [y, m] = String(monthKey).split("-").map(Number);
  // 0 = domingo
  return new Date(y, m - 1, 1).getDay();
}

function getPontoDia(funcionario, date) {
  return getFuncionarioHistorico(funcionario).find((d) => d.date === date) || null;
}

function renderPonto() {
  const list = document.getElementById("ponto-list");
  const badge = document.getElementById("ponto-count-badge");
  if (!list) return;

  const ativos = state.funcionarios
    .filter((f) => f.status !== "inativo")
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const hoje = todayISO();
  if (badge) {
    const faltasHoje = ativos.filter((f) => normalizePontoStatus(getPontoDia(f, hoje)) === "falta").length;
    badge.textContent = String(faltasHoje);
  }

  if (!ativos.length) {
    list.innerHTML = `
      <div class="obras-empty empty-state">
        <p>Cadastre funcionários para registrar o ponto.</p>
        <button type="button" class="primary-btn" id="ponto-goto-funcionarios">Ir para funcionários</button>
      </div>
    `;
    return;
  }

  list.innerHTML = ativos.map((f) => {
    const historico = getFuncionarioHistorico(f);
    const presentes = historico.filter((d) => d.status === "presente").length;
    const faltas = historico.filter((d) => d.status === "falta").length;
    const hojeStatus = normalizePontoStatus(getPontoDia(f, hoje));
    return `
      <article class="ponto-person-card" data-ponto-card="${f.id}">
        <div class="ponto-person-avatar">${(f.name || "?").trim().charAt(0).toUpperCase()}</div>
        <strong class="ponto-person-name">${f.name}</strong>
        <p class="ponto-person-role">${f.role || "Sem cargo"}</p>
        <p class="ponto-person-stats">${presentes} dia(s) · ${faltas} falta(s)</p>
        <span class="ponto-pill ${hojeStatus || "vazio"}">${hojeStatus ? `Hoje: ${pontoStatusLabel(hojeStatus)}` : "Hoje sem registro"}</span>
        <button type="button" class="primary-btn ponto-presenca-btn" data-ponto-presenca="${f.id}">Presença</button>
      </article>
    `;
  }).join("");
}

function openPontoCalendar(funcionarioId, monthKey = null) {
  const funcionario = state.funcionarios.find((f) => f.id === funcionarioId);
  if (!funcionario) return;
  state.pontoCalendarFuncionarioId = funcionarioId;
  state.pontoCalendarMonth = monthKey || state.pontoCalendarMonth || monthKeyFromDate();
  renderPontoCalendar();
  document.getElementById("ponto-calendar-modal")?.showModal();
}

function renderPontoCalendar() {
  const modal = document.getElementById("ponto-calendar-modal");
  const grid = document.getElementById("ponto-calendar-grid");
  const title = document.getElementById("ponto-calendar-title");
  const monthLabelEl = document.getElementById("ponto-calendar-month");
  const summary = document.getElementById("ponto-calendar-summary");
  if (!modal || !grid) return;

  const funcionario = state.funcionarios.find((f) => f.id === state.pontoCalendarFuncionarioId);
  if (!funcionario) return;

  if (!state.pontoCalendarMonth) state.pontoCalendarMonth = monthKeyFromDate();
  const monthKey = state.pontoCalendarMonth;
  const totalDays = daysInMonth(monthKey);
  const startPad = firstWeekdayOfMonth(monthKey);
  const byDate = new Map(getFuncionarioHistorico(funcionario).map((d) => [d.date, d]));

  if (title) title.textContent = `Presença — ${funcionario.name}`;
  if (monthLabelEl) monthLabelEl.textContent = monthLabel(monthKey);

  let presentes = 0;
  let faltas = 0;
  let folgas = 0;
  let semRegistro = 0;
  const today = todayISO();
  const cells = [];

  for (let i = 0; i < startPad; i += 1) {
    cells.push(`<div class="ponto-cal-cell is-empty"></div>`);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = `${monthKey}-${String(day).padStart(2, "0")}`;
    const dia = byDate.get(date);
    const status = dia ? normalizePontoStatus(dia) : "";
    if (status === "presente") presentes += 1;
    else if (status === "falta") faltas += 1;
    else if (status === "folga") folgas += 1;
    else semRegistro += 1;

    const detail = status === "presente" && dia?.obraId
      ? (obraById(dia.obraId)?.name || "Presente")
      : (status ? pontoStatusLabel(status) : "Sem registro");

    cells.push(`
      <button type="button" class="ponto-cal-cell status-${status || "none"} ${date === today ? "is-today" : ""}" data-ponto-day="${date}" title="${detail}">
        <span class="ponto-cal-day">${day}</span>
        <span class="ponto-cal-mark">${status === "presente" ? "●" : status === "falta" ? "✕" : status === "folga" ? "○" : ""}</span>
      </button>
    `);
  }

  grid.innerHTML = `
    <div class="ponto-cal-weekdays">
      <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
    </div>
    <div class="ponto-cal-days">${cells.join("")}</div>
  `;

  if (summary) {
    summary.innerHTML = `
      <span class="ponto-legend-item presente"><i></i> Trabalhou (${presentes})</span>
      <span class="ponto-legend-item falta"><i></i> Não trabalhou / falta (${faltas})</span>
      <span class="ponto-legend-item folga"><i></i> Folga (${folgas})</span>
      <span class="ponto-legend-item none"><i></i> Sem registro (${semRegistro})</span>
    `;
  }

  const obraSelect = document.getElementById("ponto-calendar-obra");
  if (obraSelect) {
    fillFuncionarioObraSelect(obraSelect, funcionario.obraId || "all", true);
  }
}

function cyclePontoStatus(current) {
  if (current === "presente") return "falta";
  if (current === "falta") return "folga";
  if (current === "folga") return "";
  return "presente";
}

function setPontoDayFromCalendar(date) {
  const funcionarioId = state.pontoCalendarFuncionarioId;
  const funcionario = state.funcionarios.find((f) => f.id === funcionarioId);
  if (!funcionario || !date) return;
  const current = normalizePontoStatus(getPontoDia(funcionario, date));
  const next = cyclePontoStatus(current);
  if (!next) {
    // remove registro do dia
    const idx = state.funcionarios.findIndex((f) => f.id === funcionarioId);
    if (idx < 0) return;
    const atual = state.funcionarios[idx];
    const historico = getFuncionarioHistorico(atual).filter((d) => d.date !== date);
    const hoje = historico.find((d) => d.date === todayISO());
    state.funcionarios[idx] = {
      ...atual,
      obraHistorico: historico,
      obraId: hoje ? hoje.obraId : (date === todayISO() ? null : atual.obraId)
    };
    save();
    renderPontoCalendar();
    renderPonto();
    showToast("Registro removido");
    return;
  }
  const obraValue = document.getElementById("ponto-calendar-obra")?.value || "all";
  saveFuncionarioDia(funcionarioId, date, obraValue, next);
  renderPontoCalendar();
}

function showView(name) {
  document.querySelectorAll(".view").forEach((el) => el.classList.add("hidden"));
  document.getElementById(`view-${name}`).classList.remove("hidden");
  document.querySelectorAll(".nav > .nav-item[data-view]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });
  const showMainFilters = ["dashboard", "accounts", "reports", "categories", "insights"].includes(name);
  document.getElementById("main-filters")?.classList.toggle("hidden", !showMainFilters);
  closeMobileMenu();
  refresh();
}

function refresh() {
  renderHeader();
  renderKpis();
  renderDashObras();
  renderWeeklyChart();
  drawDonut(filtered("dash"));
  drawTrend();
  renderQueue();
  renderTable();
  renderAccounts();
  renderGoals();
  renderReports();
  renderCategories();
  renderInsights();
  renderBudgets();
  renderRecurring();
  renderObras();
  renderFuncionarios();
  renderPonto();
  renderCatalogManager();
  syncCategorySelect("main-category", document.getElementById("main-type")?.value || "all", "Todas as categorias");
}

function openModal(tx, preferredType, obraId = "") {
  const modal = document.getElementById("tx-modal");
  const type = tx?.type || preferredType || "expense";
  const linkedObraId = tx?.obraId || obraId || "";
  const linkedObra = state.obras.find((o) => o.id === linkedObraId);
  const showEtapa = Boolean(linkedObra && linkedObra.status === "em_andamento");
  document.getElementById("modal-title").textContent = tx
    ? "Editar transação"
    : type === "income"
      ? "Nova receita"
      : "Nova despesa";
  document.getElementById("tx-id").value = tx?.id || "";
  document.getElementById("f-obra-id").value = linkedObraId;
  const hint = document.getElementById("obra-tx-hint");
  if (linkedObra) {
    hint.textContent = `Lançamento vinculado à obra: ${linkedObra.name}`;
    hint.classList.remove("hidden");
  } else {
    hint.textContent = "";
    hint.classList.add("hidden");
  }
  const etapaWrap = document.getElementById("f-etapa-wrap");
  const etapaSelect = document.getElementById("f-etapa");
  if (showEtapa) {
    fillSelect(etapaSelect, OBRA_ETAPAS);
    const preferredEtapa =
      tx?.etapa ||
      (state.obraEtapaFilter !== "all" ? state.obraEtapaFilter : null) ||
      linkedObra.etapa ||
      OBRA_ETAPAS[0].id;
    etapaSelect.value = preferredEtapa;
    etapaWrap.classList.remove("hidden");
  } else {
    etapaSelect.value = "";
    etapaWrap.classList.add("hidden");
  }
  document.getElementById("f-desc").value = tx?.desc || "";
  document.getElementById("f-type").value = type;
  document.getElementById("f-amount").value = tx?.amount || "";
  syncCategorySelect("f-category", type);
  document.getElementById("f-category").value = tx?.category || defaultCategoryForType(type);
  document.getElementById("f-account").value = tx?.account || "sicoob";
  document.getElementById("f-date").value = tx?.date || todayISO();
  modal.showModal();
  document.getElementById("f-desc").focus();
}

function bind() {
  syncCategorySelect("main-category", "all", "Todas as categorias");
  syncCategorySelect("tx-category", "all", "Categoria");
  fillSelect(document.getElementById("tx-account"), ACCOUNTS, "Banco");
  syncCategorySelect("f-category", "expense");
  fillSelect(document.getElementById("f-account"), ACCOUNTS);

  document.querySelectorAll(".nav > .nav-item[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  document.getElementById("menu-toggle")?.addEventListener("click", () => {
    const open = document.getElementById("sidebar")?.classList.contains("is-open");
    setMobileMenu(!open);
  });
  document.getElementById("sidebar-close")?.addEventListener("click", closeMobileMenu);
  document.getElementById("sidebar-overlay")?.addEventListener("click", closeMobileMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMobileMenu();
  });

  document.getElementById("dash-obras-strip")?.addEventListener("click", (e) => {
    const goto = e.target.closest("[data-goto]")?.dataset.goto;
    if (goto) {
      showView(goto);
      return;
    }
    const obraId = e.target.closest("[data-goto-obra]")?.dataset.gotoObra;
    if (obraId) {
      state.activeObraId = obraId;
      state.obraEtapaFilter = "all";
      save();
      showView("obras");
    }
  });

  document.getElementById("obras-nav-list").addEventListener("click", (e) => {
    const obraId = e.target.closest("[data-obra-nav]")?.dataset.obraNav;
    if (!obraId) return;
    state.activeObraId = obraId;
    state.obraEtapaFilter = "all";
    save();
    showView("obras");
  });

  document.getElementById("main-type").addEventListener("change", () => {
    syncCategorySelect("main-category", document.getElementById("main-type").value, "Todas as categorias");
    refresh();
  });
  document.getElementById("main-category").addEventListener("change", () => refresh());

  document.getElementById("tx-type").addEventListener("change", () => {
    syncCategorySelect("tx-category", document.getElementById("tx-type").value, "Categoria");
    refresh();
  });
  document.getElementById("f-type").addEventListener("change", () => {
    const type = document.getElementById("f-type").value;
    syncCategorySelect("f-category", type);
    document.getElementById("f-category").value = defaultCategoryForType(type);
  });

  ["dash", "tx", "report"].forEach((prefix) => {
    const form = document.getElementById(`${prefix}-filters`);
    form?.addEventListener("input", () => refresh());
    form?.addEventListener("change", () => refresh());
    document.getElementById(`${prefix}-clear`)?.addEventListener("click", () => {
      form.reset();
      if (prefix === "dash") {
        document.getElementById("main-type").value = "all";
        syncCategorySelect("main-category", "all", "Todas as categorias");
      } else if (prefix === "tx") {
        const typeEl = document.getElementById("tx-type");
        const cat = document.getElementById("tx-category");
        const acc = document.getElementById("tx-account");
        if (typeEl) typeEl.value = "all";
        syncCategorySelect("tx-category", "all", "Categoria");
        if (cat) cat.value = "all";
        if (acc) acc.value = "all";
      }
      refresh();
    });
  });

  document.getElementById("trend-range").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    state.trendDays = Number(btn.dataset.days);
    document.querySelectorAll("#trend-range button").forEach((b) => b.classList.toggle("on", b === btn));
    drawTrend();
  });

  document.getElementById("open-income-modal").addEventListener("click", () => openModal(null, "income"));
  document.getElementById("open-expense-modal").addEventListener("click", () => openModal(null, "expense"));
  document.getElementById("cancel-tx").addEventListener("click", () => document.getElementById("tx-modal").close());

  document.getElementById("dash-queue").addEventListener("click", (e) => {
    const quick = e.target.closest("[data-quick]")?.dataset.quick;
    if (quick) {
      openModal(null, quick);
      return;
    }
    const editId = e.target.closest("[data-edit]")?.dataset.edit;
    const delId = e.target.closest("[data-del]")?.dataset.del;
    if (editId) {
      const tx = state.transactions.find((item) => item.id === editId);
      if (tx) openModal(tx);
    }
    if (delId) deleteTransaction(delId);
  });

  document.getElementById("tx-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("tx-id").value;
    const payload = {
      id: id || uid(),
      desc: document.getElementById("f-desc").value.trim(),
      type: document.getElementById("f-type").value,
      amount: Number(document.getElementById("f-amount").value),
      category: document.getElementById("f-category").value,
      account: document.getElementById("f-account").value,
      date: document.getElementById("f-date").value,
      obraId: document.getElementById("f-obra-id").value || null,
      etapa: document.getElementById("f-etapa-wrap")?.classList.contains("hidden")
        ? null
        : (document.getElementById("f-etapa").value || null)
    };
    if (!payload.desc || payload.amount <= 0) return;
    const idx = state.transactions.findIndex((tx) => tx.id === id);
    const isEdit = idx >= 0;
    if (isEdit) state.transactions[idx] = payload;
    else state.transactions.push(payload);
    save();
    document.getElementById("tx-modal").close();
    refresh();
    showToast(isEdit
      ? "Lançamento atualizado"
      : payload.type === "income"
        ? "Receita adicionada"
        : "Despesa adicionada");
  });

  document.getElementById("tx-groups").addEventListener("click", (e) => {
    const editId = e.target.closest("[data-edit]")?.dataset.edit;
    const delId = e.target.closest("[data-del]")?.dataset.del;
    if (editId) {
      const tx = state.transactions.find((item) => item.id === editId);
      if (tx) openModal(tx);
    }
    if (delId) deleteTransaction(delId);
  });

  document.getElementById("open-obra-modal").addEventListener("click", () => openObraModal());
  document.getElementById("cancel-obra").addEventListener("click", () => document.getElementById("obra-modal").close());

  document.getElementById("obra-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("obra-id").value;
    const payload = {
      id: id || uid(),
      name: document.getElementById("obra-name").value.trim(),
      location: document.getElementById("obra-location").value.trim(),
      status: document.getElementById("obra-status").value,
      etapa: document.getElementById("obra-status").value === "em_andamento"
        ? document.getElementById("obra-etapa").value
        : null,
      notes: document.getElementById("obra-notes").value.trim(),
      createdAt: todayISO()
    };
    if (!payload.name) return;
    const idx = state.obras.findIndex((obra) => obra.id === id);
    if (idx >= 0) {
      payload.createdAt = state.obras[idx].createdAt || payload.createdAt;
      state.obras[idx] = payload;
    } else {
      state.obras.push(payload);
      state.activeObraId = payload.id;
    }
    save();
    document.getElementById("obra-modal").close();
    refresh();
    showToast(idx >= 0 ? "Obra atualizada" : "Nova obra criada");
  });

  document.getElementById("obras-tabs").addEventListener("click", (e) => {
    const delId = e.target.closest("[data-obra-del]")?.dataset.obraDel;
    if (delId) {
      e.stopPropagation();
      deleteObra(delId);
      return;
    }
    const tabId = e.target.closest("[data-obra-tab]")?.dataset.obraTab;
    if (tabId) {
      state.activeObraId = tabId;
      state.obraEtapaFilter = "all";
      save();
      renderObras();
    }
  });

  document.getElementById("obras-content").addEventListener("change", (e) => {
    if (e.target.id !== "obra-etapa-filter") return;
    state.obraEtapaFilter = e.target.value || "all";
    renderObras();
  });

  document.getElementById("obra-status").addEventListener("change", syncObraEtapaField);

  document.getElementById("obras-content").addEventListener("click", (e) => {
    if (e.target.id === "obras-empty-add") {
      openObraModal();
      return;
    }
    const addTeamObraId = e.target.closest("[data-obra-team-add]")?.dataset.obraTeamAdd;
    if (addTeamObraId) {
      const funcionarioId = document.getElementById("obra-team-select")?.value;
      if (!funcionarioId) {
        showToast("Selecione um funcionário");
        return;
      }
      assignFuncionarioToObra(funcionarioId, addTeamObraId);
      return;
    }
    const removeFuncionarioId = e.target.closest("[data-obra-team-remove]")?.dataset.obraTeamRemove;
    if (removeFuncionarioId) {
      assignFuncionarioToObra(removeFuncionarioId, null);
      return;
    }
    const incomeId = e.target.closest("[data-obra-income]")?.dataset.obraIncome;
    const expenseId = e.target.closest("[data-obra-expense]")?.dataset.obraExpense;
    if (incomeId) {
      openModal(null, "income", incomeId);
      return;
    }
    if (expenseId) {
      openModal(null, "expense", expenseId);
      return;
    }
    const editTx = e.target.closest("[data-edit]")?.dataset.edit;
    const delTx = e.target.closest("[data-del]")?.dataset.del;
    if (editTx) {
      const tx = state.transactions.find((item) => item.id === editTx);
      if (tx) openModal(tx);
      return;
    }
    if (delTx) {
      deleteTransaction(delTx);
      return;
    }
    const editId = e.target.closest("[data-obra-edit]")?.dataset.obraEdit;
    const delId = e.target.closest("[data-obra-del]")?.dataset.obraDel;
    if (editId) {
      const obra = state.obras.find((item) => item.id === editId);
      if (obra) openObraModal(obra);
    }
    if (delId) deleteObra(delId);
  });

  document.getElementById("open-funcionario-modal").addEventListener("click", () => openFuncionarioModal());
  document.getElementById("cancel-funcionario").addEventListener("click", () => {
    document.getElementById("funcionario-modal").close();
  });

  document.getElementById("funcionario-role-filter").addEventListener("change", (e) => {
    state.funcionarioRoleFilter = e.target.value || "all";
    renderFuncionarios();
  });

  document.getElementById("funcionario-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("funcionario-id").value;
    const salaryRaw = document.getElementById("funcionario-salary").value;
    const obraValue = document.getElementById("funcionario-obra").value;
    const obraId = !obraValue || obraValue === "all" ? null : obraValue;
    const existing = state.funcionarios.find((item) => item.id === id);
    let historico = Array.isArray(existing?.obraHistorico) ? existing.obraHistorico : [];
    if (!existing || existing.obraId !== obraId) {
      historico = upsertObraDia(historico, todayISO(), obraId);
    }
    const payload = {
      id: id || uid(),
      name: document.getElementById("funcionario-name").value.trim(),
      role: document.getElementById("funcionario-role").value.trim(),
      phone: document.getElementById("funcionario-phone").value.trim(),
      salary: salaryRaw === "" ? null : Number(salaryRaw),
      status: document.getElementById("funcionario-status").value,
      obraId,
      obraHistorico: historico,
      notes: document.getElementById("funcionario-notes").value.trim(),
      createdAt: todayISO()
    };
    if (!payload.name) return;
    const idx = state.funcionarios.findIndex((item) => item.id === id);
    if (idx >= 0) {
      payload.createdAt = state.funcionarios[idx].createdAt || payload.createdAt;
      state.funcionarios[idx] = payload;
    } else {
      if (obraId) payload.obraHistorico = upsertObraDia([], todayISO(), obraId);
      state.funcionarios.push(payload);
    }
    save();
    document.getElementById("funcionario-modal").close();
    refresh();
    showToast(idx >= 0 ? "Funcionário atualizado" : "Funcionário adicionado");
  });

  document.getElementById("funcionarios-grid").addEventListener("click", (e) => {
    if (e.target.id === "funcionarios-empty-add") {
      openFuncionarioModal();
      return;
    }
    const saveDiaId = e.target.closest("[data-dia-save]")?.dataset.diaSave;
    if (saveDiaId) {
      const date = document.querySelector(`input[data-dia-date="${saveDiaId}"]`)?.value;
      const obraValue = document.querySelector(`select[data-dia-obra="${saveDiaId}"]`)?.value;
      const status = document.querySelector(`select[data-dia-status="${saveDiaId}"]`)?.value || "presente";
      saveFuncionarioDia(saveDiaId, date, obraValue, status);
      return;
    }
    const diasId = e.target.closest("[data-funcionario-dias]")?.dataset.funcionarioDias;
    if (diasId) {
      const funcionario = state.funcionarios.find((item) => item.id === diasId);
      if (funcionario) openFuncionarioDiasModal(funcionario);
      return;
    }
    const editId = e.target.closest("[data-funcionario-edit]")?.dataset.funcionarioEdit;
    const delId = e.target.closest("[data-funcionario-del]")?.dataset.funcionarioDel;
    if (editId) {
      const funcionario = state.funcionarios.find((item) => item.id === editId);
      if (funcionario) openFuncionarioModal(funcionario);
    }
    if (delId) deleteFuncionario(delId);
  });

  document.getElementById("cancel-funcionario-dias").addEventListener("click", () => {
    document.getElementById("funcionario-dias-modal").close();
  });

  document.getElementById("funcionario-dias-save").addEventListener("click", () => {
    const funcionarioId = document.getElementById("funcionario-dias-id").value;
    const date = document.getElementById("funcionario-dias-date").value;
    const obraValue = document.getElementById("funcionario-dias-obra").value;
    const status = document.getElementById("funcionario-dias-status")?.value || "presente";
    saveFuncionarioDia(funcionarioId, date, obraValue, status);
  });

  document.getElementById("funcionario-dias-list").addEventListener("click", (e) => {
    const diaId = e.target.closest("[data-dia-del]")?.dataset.diaDel;
    if (!diaId) return;
    const funcionarioId = document.getElementById("funcionario-dias-id").value;
    deleteFuncionarioDia(funcionarioId, diaId);
  });

  document.getElementById("settings-add-expense")?.addEventListener("click", () => {
    const input = document.getElementById("settings-expense-name");
    addCategory("expense", input?.value);
    if (input) input.value = "";
  });
  document.getElementById("settings-add-income")?.addEventListener("click", () => {
    const input = document.getElementById("settings-income-name");
    addCategory("income", input?.value);
    if (input) input.value = "";
  });
  document.getElementById("settings-add-cargo")?.addEventListener("click", () => {
    const input = document.getElementById("settings-cargo-name");
    addCargo(input?.value);
    if (input) input.value = "";
  });
  ["settings-expense-name", "settings-income-name", "settings-cargo-name"].forEach((id) => {
    document.getElementById(id)?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      document.getElementById(id.replace("-name", "-add") === id ? id : null);
      if (id.includes("expense")) document.getElementById("settings-add-expense")?.click();
      else if (id.includes("income")) document.getElementById("settings-add-income")?.click();
      else document.getElementById("settings-add-cargo")?.click();
    });
  });

  document.getElementById("settings-expense-list")?.addEventListener("click", (e) => {
    const key = e.target.closest("[data-del-cat]")?.dataset.delCat;
    if (!key) return;
    const [kind, catId] = key.split(":");
    removeCategory(kind, catId);
  });
  document.getElementById("settings-income-list")?.addEventListener("click", (e) => {
    const key = e.target.closest("[data-del-cat]")?.dataset.delCat;
    if (!key) return;
    const [kind, catId] = key.split(":");
    removeCategory(kind, catId);
  });
  document.getElementById("settings-cargo-list")?.addEventListener("click", (e) => {
    const cargo = e.target.closest("[data-del-cargo]")?.dataset.delCargo;
    if (cargo) removeCargo(cargo);
  });

  document.getElementById("ponto-list")?.addEventListener("click", (e) => {
    if (e.target.id === "ponto-goto-funcionarios") {
      showView("funcionarios");
      return;
    }
    const id = e.target.closest("[data-ponto-presenca]")?.dataset.pontoPresenca;
    if (!id) return;
    openPontoCalendar(id, monthKeyFromDate());
  });

  document.getElementById("ponto-cal-prev")?.addEventListener("click", () => {
    state.pontoCalendarMonth = shiftMonthKey(state.pontoCalendarMonth || monthKeyFromDate(), -1);
    renderPontoCalendar();
  });
  document.getElementById("ponto-cal-next")?.addEventListener("click", () => {
    state.pontoCalendarMonth = shiftMonthKey(state.pontoCalendarMonth || monthKeyFromDate(), 1);
    renderPontoCalendar();
  });
  document.getElementById("ponto-calendar-grid")?.addEventListener("click", (e) => {
    const date = e.target.closest("[data-ponto-day]")?.dataset.pontoDay;
    if (date) setPontoDayFromCalendar(date);
  });
  document.getElementById("cancel-ponto-calendar")?.addEventListener("click", () => {
    document.getElementById("ponto-calendar-modal")?.close();
  });

  document.getElementById("save-settings").addEventListener("click", () => {
    state.settings.name = document.getElementById("setting-name").value.trim() || "Tiago";
    state.settings.currency = document.getElementById("setting-currency").value;
    state.settings.loginUser = document.getElementById("setting-login-user").value.trim() || "Tiago";
    state.settings.loginPass = document.getElementById("setting-login-pass").value || "Carlos27";
    save();
    refresh();
    showToast("Configurações salvas");
  });

  document.getElementById("sync-cloud-btn")?.addEventListener("click", async () => {
    const ok = await saveCloud();
    const status = document.getElementById("cloud-status")?.textContent || "";
    showToast(ok ? "Dados salvos na nuvem" : status || "Falha ao salvar na nuvem");
  });

  document.getElementById("copy-cloud-sql")?.addEventListener("click", async () => {
    const text = document.getElementById("cloud-sql-text")?.value || getCloudSetupSql();
    try {
      await navigator.clipboard.writeText(text);
      showToast("SQL copiado");
    } catch {
      document.getElementById("cloud-sql-text")?.select();
      showToast("Selecione o SQL e copie com Ctrl+C");
    }
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    lockApp();
    showToast("Sessão encerrada");
  });

  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    tryLogin();
  });

  document.getElementById("reset-data").addEventListener("click", () => {
    if (!confirm("Zerar todos os lançamentos? Esta ação não pode ser desfeita.")) return;
    state.transactions = [];
    save();
    refresh();
    showToast("Todos os lançamentos foram zerados");
  });

  window.addEventListener("resize", () => drawTrend());
}

load();
bind();

async function syncCloudAfterAuth() {
  try {
    await loadCloud();
    if (state.authenticated) refresh();
  } catch (err) {
    console.warn(err);
    setCloudStatus("Nuvem: indisponível no momento");
  }
}

async function boot() {
  // Mostra login primeiro; nuvem só depois do acesso (evita senha da nuvem travar o login)
  if (sessionStorage.getItem("financas-auth") === "1") {
    unlockApp();
    await syncCloudAfterAuth();
  } else {
    lockApp();
  }
}

boot();

function lockApp() {
  state.authenticated = false;
  sessionStorage.removeItem("financas-auth");
  document.getElementById("app-shell")?.classList.add("hidden");
  const screen = document.getElementById("login-screen");
  screen?.classList.remove("hidden");
  const error = document.getElementById("login-error");
  error?.classList.add("hidden");
  const user = document.getElementById("login-user");
  const pass = document.getElementById("login-pass");
  if (user) user.value = "";
  if (pass) pass.value = "";
  setTimeout(() => user?.focus(), 50);
}

function unlockApp() {
  state.authenticated = true;
  sessionStorage.setItem("financas-auth", "1");
  document.getElementById("login-screen")?.classList.add("hidden");
  document.getElementById("app-shell")?.classList.remove("hidden");
  refresh();
}

function tryLogin() {
  const user = (document.getElementById("login-user")?.value || "").trim();
  const pass = document.getElementById("login-pass")?.value || "";
  const expectedUser = (state.settings.loginUser || DEFAULT_LOGIN_USER).trim();
  const expectedPass = state.settings.loginPass || DEFAULT_LOGIN_PASS;
  const userOk =
    user.toLowerCase() === expectedUser.toLowerCase() ||
    user.toLowerCase() === DEFAULT_LOGIN_USER.toLowerCase();
  const passOk = pass === expectedPass || pass === DEFAULT_LOGIN_PASS;
  const error = document.getElementById("login-error");
  if (userOk && passOk) {
    error?.classList.add("hidden");
    unlockApp();
    showToast(`Bem-vindo, ${state.settings.name}`);
    syncCloudAfterAuth();
    return;
  }
  error?.classList.remove("hidden");
  document.getElementById("login-pass").value = "";
  document.getElementById("login-pass")?.focus();
}
