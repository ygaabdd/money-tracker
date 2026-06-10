import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dns from "dns";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Fix DNS resolution issues on Node 18+ to prefer IPv4
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

// Supabase Connection Setup
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

const isSupabaseEnabled = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseEnabled ? createClient(supabaseUrl, supabaseKey) : null;

if (isSupabaseEnabled) {
  console.log("Supabase connection enabled dynamically!");
} else {
  console.log("Supabase URL or Key is missing from Environment. File Storage fallback is active.");
}

// WALLETS Helpers
async function getSupabaseWallets() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("wallets").select("*");
    if (error) {
      console.error("Supabase wallets fetch error:", error);
      return null;
    }
    // Try to normalize keys of some structures in case they were made using snake_case
    return data.map((w: any) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      balance: parseFloat(w.balance) || 0,
      ownerId: w.ownerId || w.owner_id || "Ry"
    }));
  } catch (err) {
    console.error("Supabase wallets catch:", err);
    return null;
  }
}

async function insertSupabaseWallet(wallet: any) {
  if (!supabase) return null;
  try {
    const payload = {
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      balance: parseFloat(wallet.balance) || 0,
      ownerId: wallet.ownerId,
      owner_id: wallet.ownerId // support snake_case
    };
    const { data, error } = await supabase.from("wallets").insert([payload]).select().single();
    if (error) {
       // fallback without snake_case or vice-versa
       const cleanPayload = { id: wallet.id, name: wallet.name, type: wallet.type, balance: parseFloat(wallet.balance) || 0 };
       const { data: fallbackData, error: fbErr } = await supabase.from("wallets").insert([cleanPayload]).select().single();
       if (fbErr) return null;
       return fallbackData;
    }
    return data;
  } catch (err) {
    return null;
  }
}

async function updateSupabaseWallet(id: string, updates: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("wallets").update(updates).eq("id", id).select().single();
    if (error) {
      // Try mapping only standard columns
      const cleanUpdate: any = {};
      if (updates.name !== undefined) cleanUpdate.name = updates.name;
      if (updates.type !== undefined) cleanUpdate.type = updates.type;
      if (updates.balance !== undefined) cleanUpdate.balance = parseFloat(updates.balance);
      const { data: d, error: err } = await supabase.from("wallets").update(cleanUpdate).eq("id", id).select().single();
      if (err) return null;
      return d;
    }
    return data;
  } catch (err) {
    return null;
  }
}

async function deleteSupabaseWallet(id: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("wallets").delete().eq("id", id);
    return !error;
  } catch (err) {
    return false;
  }
}

// BUDGETS HELPERS
async function getSupabaseBudgets() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("budgets").select("*");
    if (error) return null;
    return data.map((b: any) => ({
      id: b.id,
      category: b.category,
      limit: parseFloat(b.limit) || 0
    }));
  } catch (err) {
    return null;
  }
}

async function insertSupabaseBudget(budget: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("budgets").insert([budget]).select().single();
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

async function updateSupabaseBudget(id: string, updates: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("budgets").update(updates).eq("id", id).select().single();
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

async function deleteSupabaseBudget(id: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    return !error;
  } catch (err) {
    return false;
  }
}

// DEBTS HELPERS
async function getSupabaseDebts() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("debts").select("*");
    if (error) return null;
    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      amount: parseFloat(d.amount) || 0,
      person: d.person,
      type: d.type || "debt",
      status: d.status || "unpaid",
      date: d.date
    }));
  } catch (err) {
    return null;
  }
}

async function insertSupabaseDebt(debt: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("debts").insert([debt]).select().single();
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

async function updateSupabaseDebt(id: string, updates: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("debts").update(updates).eq("id", id).select().single();
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

async function deleteSupabaseDebt(id: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("debts").delete().eq("id", id);
    return !error;
  } catch (err) {
    return false;
  }
}

// CATEGORIES HELPERS
async function getSupabaseCategories() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) return null;
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji || "❓",
      type: c.type || "expense"
    }));
  } catch (err) {
    return null;
  }
}

async function insertSupabaseCategory(category: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("categories").insert([category]).select().single();
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

async function deleteSupabaseCategory(id: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    return !error;
  } catch (err) {
    return false;
  }
}

// TRANSACTIONS HELPERS
async function getSupabaseTransactions() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("transactions").select("*");
    if (error) return null;
    return data.map((t: any) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      category: t.category,
      type: t.type,
      amount: parseFloat(t.amount) || 0,
      addedBy: t.addedBy || t.added_by || "Sistem",
      createdAt: t.createdAt || t.created_at || new Date().toISOString(),
      walletId: t.walletId || t.wallet_id || null
    })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    return null;
  }
}

async function insertSupabaseTransaction(transaction: any) {
  if (!supabase) return null;
  try {
    const payload = {
      id: transaction.id,
      date: transaction.date,
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      amount: parseFloat(transaction.amount) || 0,
      addedBy: transaction.addedBy || "Sistem",
      added_by: transaction.addedBy || "Sistem",
      createdAt: transaction.createdAt || new Date().toISOString(),
      created_at: transaction.createdAt || new Date().toISOString(),
      walletId: transaction.walletId || null,
      wallet_id: transaction.walletId || null
    };

    const { data, error } = await supabase.from("transactions").insert([payload]).select().single();
    if (error) {
       // fallback without snake case
       const cleanPayload = {
         id: transaction.id,
         date: transaction.date,
         description: transaction.description,
         category: transaction.category,
         type: transaction.type,
         amount: parseFloat(transaction.amount) || 0
       };
       const { data: d, error: err } = await supabase.from("transactions").insert([cleanPayload]).select().single();
       if (err) return null;
       return d;
    }
    return data;
  } catch (err) {
    return null;
  }
}

async function updateSupabaseTransaction(id: string, updates: any) {
  if (!supabase) return null;
  try {
    const payload: any = { ...updates };
    if (updates.addedBy !== undefined) {
      payload.added_by = updates.addedBy;
    }
    if (updates.walletId !== undefined) {
      payload.wallet_id = updates.walletId;
    }
    const { data, error } = await supabase.from("transactions").update(payload).eq("id", id).select().single();
    if (error) {
       // remove camel/snake fields that might fail and retry
       const cleanUpdate = { ...updates };
       delete cleanUpdate.addedBy;
       delete cleanUpdate.walletId;
       const { data: d, error: err } = await supabase.from("transactions").update(cleanUpdate).eq("id", id).select().single();
       if (err) return null;
       return d;
    }
    return data;
  } catch (err) {
    return null;
  }
}

async function deleteSupabaseTransaction(id: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    return !error;
  } catch (err) {
    return false;
  }
}

// Auto-create data directory for local fallback persistence
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const WALLETS_FILE = path.join(DATA_DIR, "wallets.json");
const BUDGETS_FILE = path.join(DATA_DIR, "budgets.json");
const DEBTS_FILE = path.join(DATA_DIR, "debts.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");

// Helper to safely read transactions
function readTransactions() {
  try {
    if (fs.existsSync(TRANSACTIONS_FILE)) {
      const content = fs.readFileSync(TRANSACTIONS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading transactions:", error);
  }
  return [];
}

// Helper to safely write transactions
function writeTransactions(data: any) {
  try {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing transactions:", error);
  }
}

// Helpers for wallets, budgets, debts
function readWallets() {
  try {
    if (fs.existsSync(WALLETS_FILE)) {
      return JSON.parse(fs.readFileSync(WALLETS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading wallets:", e);
  }
  return [];
}

function writeWallets(data: any) {
  try {
    fs.writeFileSync(WALLETS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing wallets:", e);
  }
}

function readBudgets() {
  try {
    if (fs.existsSync(BUDGETS_FILE)) {
      return JSON.parse(fs.readFileSync(BUDGETS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading budgets:", e);
  }
  return [];
}

function writeBudgets(data: any) {
  try {
    fs.writeFileSync(BUDGETS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing budgets:", e);
  }
}

function readDebts() {
  try {
    if (fs.existsSync(DEBTS_FILE)) {
      return JSON.parse(fs.readFileSync(DEBTS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading debts:", e);
  }
  return [];
}

function writeDebts(data: any) {
  try {
    fs.writeFileSync(DEBTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing debts:", e);
  }
}

function readCategories() {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      return JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading categories:", e);
  }

  const defaultCats = [
    { id: "cat-makanan", name: "Makanan & Minuman", emoji: "🍔", type: "expense" },
    { id: "cat-transport", name: "Transportasi", emoji: "🚗", type: "expense" },
    { id: "cat-belanja", name: "Belanja", emoji: "🛍️", type: "expense" },
    { id: "cat-hiburan", name: "Hiburan", emoji: "🎮", type: "expense" },
    { id: "cat-tagihan", name: "Tagihan & Utilitas", emoji: "📄", type: "expense" },
    { id: "cat-kesehatan", name: "Kesehatan", emoji: "💊", type: "expense" },
    { id: "cat-investasi", name: "Investasi", emoji: "📈", type: "both" },
    { id: "cat-gaji", name: "Gaji", emoji: "💰", type: "income" },
    { id: "cat-bonus", name: "Bonus", emoji: "✨", type: "income" },
    { id: "cat-lainnya", name: "Lainnya", emoji: "❓", type: "both" }
  ];
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(defaultCats, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing initial categories error:", err);
  }
  return defaultCats;
}

function writeCategories(data: any) {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing categories:", e);
  }
}

// Helper to safely read spreadsheet config
function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        connected: parsed.connected || false,
        spreadsheetId: parsed.spreadsheetId || "",
        sheetName: parsed.sheetName || "Transaksi",
        spreadsheetUrl: parsed.spreadsheetUrl || "",
        lastSyncedAt: parsed.lastSyncedAt || "",
        accessToken: parsed.accessToken || "",
        user1Name: parsed.user1Name || "Ry",
        user1Wallet: parseFloat(parsed.user1Wallet) !== undefined && !isNaN(parseFloat(parsed.user1Wallet)) ? parseFloat(parsed.user1Wallet) : 0,
        user2Name: parsed.user2Name || "Partner",
        user2Wallet: parseFloat(parsed.user2Wallet) !== undefined && !isNaN(parseFloat(parsed.user2Wallet)) ? parseFloat(parsed.user2Wallet) : 0,
      };
    }
  } catch (error) {
    console.error("Error reading config:", error);
  }
  return {
    connected: false,
    spreadsheetId: "",
    sheetName: "Transaksi",
    spreadsheetUrl: "",
    lastSyncedAt: "",
    accessToken: "",
    user1Name: "Ry",
    user1Wallet: 0,
    user2Name: "Partner",
    user2Wallet: 0,
  };
}

// Helper to safely write spreadsheet config
function writeConfig(data: any) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing config:", error);
  }
}

// Enable JSON parsing middleware
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Custom Login for 1 shared account
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "adminry" && password === "adminry") {
    res.json({
      success: true,
      user: {
        username: "adminry",
        role: "admin",
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Username atau password salah!",
    });
  }
});

// --- CUSTOM WALLETS ROUTING ---
app.get("/api/wallets", async (req, res) => {
  const sbWallets = await getSupabaseWallets();
  if (sbWallets) {
    return res.json({ success: true, wallets: sbWallets });
  }

  const wallets = readWallets();
  res.json({ success: true, wallets });
});

app.post("/api/wallets", async (req, res) => {
  const newWallet = {
    id: "w-" + Date.now().toString(),
    name: req.body.name || "Dompet Baru",
    type: req.body.type || "Rekening Bank",
    balance: parseFloat(req.body.balance) || 0,
    ownerId: req.body.ownerId || "Ry"
  };

  const sbWallet = await insertSupabaseWallet(newWallet);
  if (sbWallet) {
    return res.json({ success: true, wallet: sbWallet });
  }

  const wallets = readWallets();
  wallets.push(newWallet);
  writeWallets(wallets);
  res.json({ success: true, wallet: newWallet });
});

app.put("/api/wallets/:id", async (req, res) => {
  const { id } = req.params;
  const updates = {
    name: req.body.name,
    type: req.body.type,
    balance: req.body.balance !== undefined ? parseFloat(req.body.balance) : undefined,
    ownerId: req.body.ownerId,
    owner_id: req.body.ownerId
  };
  Object.keys(updates).forEach(key => (updates as any)[key] === undefined && delete (updates as any)[key]);

  const sbWallet = await updateSupabaseWallet(id, updates);
  if (sbWallet) {
    return res.json({ success: true, wallet: sbWallet });
  }

  const wallets = readWallets();
  const idx = wallets.findIndex((w: any) => w.id === id);
  if (idx !== -1) {
    wallets[idx] = {
      ...wallets[idx],
      name: req.body.name !== undefined ? req.body.name : wallets[idx].name,
      type: req.body.type !== undefined ? req.body.type : wallets[idx].type,
      balance: req.body.balance !== undefined ? parseFloat(req.body.balance) : wallets[idx].balance,
      ownerId: req.body.ownerId !== undefined ? req.body.ownerId : (wallets[idx].ownerId || "Ry")
    };
    writeWallets(wallets);
    res.json({ success: true, wallet: wallets[idx] });
  } else {
    res.status(404).json({ success: false, message: "Wallet not found" });
  }
});

app.delete("/api/wallets/:id", async (req, res) => {
  const { id } = req.params;
  const success = await deleteSupabaseWallet(id);

  let wallets = readWallets();
  const initialLength = wallets.length;
  wallets = wallets.filter((w: any) => w.id !== id);
  if (wallets.length < initialLength) {
    writeWallets(wallets);
  }

  if (success || wallets.length < initialLength) {
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Wallet not found" });
  }
});

// --- CUSTOM BUDGETS ROUTING ---
app.get("/api/budgets", async (req, res) => {
  const sbBudgets = await getSupabaseBudgets();
  if (sbBudgets) {
    return res.json({ success: true, budgets: sbBudgets });
  }

  const budgets = readBudgets();
  res.json({ success: true, budgets });
});

app.post("/api/budgets", async (req, res) => {
  const newBudget = {
    id: "b-" + Date.now().toString(),
    category: req.body.category || "Makanan & Minuman",
    limit: parseFloat(req.body.limit) || 0
  };

  const sbBudget = await insertSupabaseBudget(newBudget);
  if (sbBudget) {
    return res.json({ success: true, budget: sbBudget });
  }

  const budgets = readBudgets();
  budgets.push(newBudget);
  writeBudgets(budgets);
  res.json({ success: true, budget: newBudget });
});

app.put("/api/budgets/:id", async (req, res) => {
  const { id } = req.params;
  const updates = {
    category: req.body.category,
    limit: req.body.limit !== undefined ? parseFloat(req.body.limit) : undefined
  };
  Object.keys(updates).forEach(key => (updates as any)[key] === undefined && delete (updates as any)[key]);

  const sbBudget = await updateSupabaseBudget(id, updates);
  if (sbBudget) {
    return res.json({ success: true, budget: sbBudget });
  }

  const budgets = readBudgets();
  const idx = budgets.findIndex((b: any) => b.id === id);
  if (idx !== -1) {
    budgets[idx] = {
      ...budgets[idx],
      category: req.body.category !== undefined ? req.body.category : budgets[idx].category,
      limit: req.body.limit !== undefined ? parseFloat(req.body.limit) : budgets[idx].limit
    };
    writeBudgets(budgets);
    res.json({ success: true, budget: budgets[idx] });
  } else {
    res.status(404).json({ success: false, message: "Budget not found" });
  }
});

app.delete("/api/budgets/:id", async (req, res) => {
  const { id } = req.params;
  const success = await deleteSupabaseBudget(id);

  let budgets = readBudgets();
  const idx = budgets.findIndex((b: any) => b.id === id);
  if (idx !== -1) {
    budgets.splice(idx, 1);
    writeBudgets(budgets);
  }

  if (success || idx !== -1) {
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Budget not found" });
  }
});

// --- DEBTS ROUTING ---
app.get("/api/debts", async (req, res) => {
  const sbDebts = await getSupabaseDebts();
  if (sbDebts) {
    return res.json({ success: true, debts: sbDebts });
  }

  const debts = readDebts();
  res.json({ success: true, debts });
});

app.post("/api/debts", async (req, res) => {
  const newDebt = {
    id: "d-" + Date.now().toString(),
    title: req.body.title || "Utang",
    amount: parseFloat(req.body.amount) || 0,
    person: req.body.person || "Teman",
    type: req.body.type || "debt",
    status: req.body.status || "unpaid",
    date: req.body.date || new Date().toISOString().split('T')[0]
  };

  const sbDebt = await insertSupabaseDebt(newDebt);
  if (sbDebt) {
    return res.json({ success: true, debt: sbDebt });
  }

  const debts = readDebts();
  debts.push(newDebt);
  writeDebts(debts);
  res.json({ success: true, debt: newDebt });
});

app.put("/api/debts/:id", async (req, res) => {
  const { id } = req.params;
  const updates = {
    title: req.body.title,
    amount: req.body.amount !== undefined ? parseFloat(req.body.amount) : undefined,
    person: req.body.person,
    type: req.body.type,
    status: req.body.status,
    date: req.body.date
  };
  Object.keys(updates).forEach(key => (updates as any)[key] === undefined && delete (updates as any)[key]);

  const sbDebt = await updateSupabaseDebt(id, updates);
  if (sbDebt) {
    return res.json({ success: true, debt: sbDebt });
  }

  const debts = readDebts();
  const idx = debts.findIndex((d: any) => d.id === id);
  if (idx !== -1) {
    debts[idx] = {
      ...debts[idx],
      title: req.body.title !== undefined ? req.body.title : debts[idx].title,
      amount: req.body.amount !== undefined ? parseFloat(req.body.amount) : debts[idx].amount,
      person: req.body.person !== undefined ? req.body.person : debts[idx].person,
      type: req.body.type !== undefined ? req.body.type : debts[idx].type,
      status: req.body.status !== undefined ? req.body.status : debts[idx].status,
      date: req.body.date !== undefined ? req.body.date : debts[idx].date
    };
    writeDebts(debts);
    res.json({ success: true, debt: debts[idx] });
  } else {
    res.status(404).json({ success: false, message: "Debt not found" });
  }
});

app.delete("/api/debts/:id", async (req, res) => {
  const { id } = req.params;
  const success = await deleteSupabaseDebt(id);

  let debts = readDebts();
  const initialLength = debts.length;
  debts = debts.filter((d: any) => d.id !== id);
  if (debts.length < initialLength) {
    writeDebts(debts);
  }

  if (success || debts.length < initialLength) {
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Debt not found" });
  }
});

// --- CUSTOM CATEGORIES ROUTING ---
app.get("/api/categories", async (req, res) => {
  const sbCategories = await getSupabaseCategories();
  if (sbCategories && sbCategories.length > 0) {
    return res.json({ success: true, categories: sbCategories });
  }

  const categories = readCategories();
  res.json({ success: true, categories });
});

app.post("/api/categories", async (req, res) => {
  const newCat = {
    id: "c-" + Date.now().toString(),
    name: req.body.name || "Kategori Baru",
    emoji: req.body.emoji || "❓",
    type: req.body.type || "expense"
  };

  const sbCategory = await insertSupabaseCategory(newCat);
  if (sbCategory) {
    return res.json({ success: true, category: sbCategory });
  }

  const categories = readCategories();
  categories.push(newCat);
  writeCategories(categories);
  res.json({ success: true, category: newCat });
});

app.delete("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  const success = await deleteSupabaseCategory(id);

  let categories = readCategories();
  const initialLength = categories.length;
  categories = categories.filter((c: any) => c.id !== id);
  if (categories.length < initialLength) {
    writeCategories(categories);
  }

  if (success || categories.length < initialLength) {
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Category not found" });
  }
});

// Universal helper to rewrite the spreadsheet with the local json data (both tabs: Transaksi and Dompet)
async function syncToSheets(config: any, transactions: any[]): Promise<boolean> {
  const { spreadsheetId, sheetName, accessToken } = config;
  if (!accessToken || !spreadsheetId) return false;

  try {
    // 1. Sync Transaksi Tab
    // Clear the values starting on row 2 (A2:H1000) to repopulate fresh
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A2:H1000:clear`;
    await fetch(clearUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Prepare the rows of transactions
    const rows = transactions.map((tx: any) => [
      tx.id || "",
      tx.date || "",
      tx.description || "",
      tx.category || "",
      tx.type || "",
      tx.amount || 0,
      tx.addedBy || "Sistem",
      tx.createdAt || new Date().toISOString(),
    ]);

    if (rows.length > 0) {
      // Write rows to sheet starting at A2
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A2:append?valueInputOption=USER_ENTERED`;
      await fetch(updateUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: rows,
        }),
      });
    }

    // 2. Sync Dompet Tab
    // Clear Dompet (A2:C10)
    const clearDompetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Dompet!A2:C10:clear`;
    await fetch(clearDompetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const dompetRows = [
      ["user1", config.user1Name || "Ry", config.user1Wallet || 0],
      ["user2", config.user2Name || "Partner", config.user2Wallet || 0]
    ];

    const updateDompetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Dompet!A2:append?valueInputOption=USER_ENTERED`;
    await fetch(updateDompetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: dompetRows,
      }),
    });

    return true;
  } catch (error) {
    console.error("Failed writing data to sheets:", error);
    return false;
  }
}

// Get transactions
app.get("/api/transactions", async (req, res) => {
  const sbTxs = await getSupabaseTransactions();
  if (sbTxs) {
    return res.json({ success: true, transactions: sbTxs });
  }

  const config = readConfig();
  if (config.connected && config.spreadsheetId && config.accessToken) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.sheetName}!A2:H1000`;
      const sheetsRes = await fetch(url, {
        headers: { Authorization: `Bearer ${config.accessToken}` },
      });
      if (sheetsRes.ok) {
        const data = await sheetsRes.json();
        const sheetTxs = (data.values || []).map((row: any) => ({
          id: row[0] || "",
          date: row[1] || "",
          description: row[2] || "",
          category: row[3] || "",
          type: row[4] || "expense",
          amount: parseFloat(row[5]) || 0,
          addedBy: row[6] || "",
          createdAt: row[7] || "",
        }));
        writeTransactions(sheetTxs);
        return res.json({ success: true, transactions: sheetTxs });
      }
    } catch (err) {
      console.error("Failed fetching transactions from Google Sheets:", err);
    }
  }

  const transactions = readTransactions();
  res.json({ success: true, transactions });
});

// Add new transaction
app.post("/api/transactions", async (req, res) => {
  const transactions = readTransactions();
  const newTransaction = {
    ...req.body,
    createdAt: new Date().toISOString(),
  };

  const sbTx = await insertSupabaseTransaction(newTransaction);
  const savedTransaction = sbTx || newTransaction;
  transactions.unshift(savedTransaction);
  writeTransactions(transactions);

  if (newTransaction.walletId) {
    if (isSupabaseEnabled) {
      const wallets = await getSupabaseWallets();
      if (wallets) {
        const wallet = wallets.find((w: any) => w.id === newTransaction.walletId);
        if (wallet) {
          const amount = parseFloat(newTransaction.amount) || 0;
          const newBalance = newTransaction.type === "income" ? wallet.balance + amount : wallet.balance - amount;
          await updateSupabaseWallet(newTransaction.walletId, { balance: newBalance });
        }
      }
    } else {
      const localWallets = readWallets();
      const walletIdx = localWallets.findIndex((w: any) => w.id === newTransaction.walletId);
      if (walletIdx !== -1) {
        const amount = parseFloat(newTransaction.amount) || 0;
        if (newTransaction.type === "income") {
          localWallets[walletIdx].balance += amount;
        } else if (newTransaction.type === "expense") {
          localWallets[walletIdx].balance -= amount;
        }
        writeWallets(localWallets);
      }
    }
  }

  const config = readConfig();
  if (config.connected && config.spreadsheetId && config.accessToken) {
    await syncToSheets(config, transactions);
  }

  res.json({ success: true, transaction: savedTransaction });
});

// Update transaction
app.put("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const transactions = readTransactions();
  const index = transactions.findIndex((tx: any) => tx.id === id);

  if (index !== -1 || isSupabaseEnabled) {
    let oldTx = index !== -1 ? transactions[index] : null;
    if (!oldTx && isSupabaseEnabled) {
      const activeTxs = await getSupabaseTransactions();
      if (activeTxs) {
        oldTx = activeTxs.find((tx: any) => tx.id === id) || null;
      }
    }

    const updatedPayload = { ...req.body };
    const sbTx = await updateSupabaseTransaction(id, updatedPayload);
    const checkTx = oldTx || sbTx;

    if (checkTx) {
      if (checkTx.walletId) {
        if (isSupabaseEnabled) {
          const sbWallets = await getSupabaseWallets();
          if (sbWallets) {
            const sbOldW = sbWallets.find((w: any) => w.id === checkTx.walletId);
            if (sbOldW) {
              const oldAmt = parseFloat(checkTx.amount) || 0;
              const revBal = checkTx.type === "income" ? sbOldW.balance - oldAmt : sbOldW.balance + oldAmt;
              await updateSupabaseWallet(checkTx.walletId, { balance: revBal });
            }
          }
        } else {
          const wallets = readWallets();
          const oldWalletIdx = wallets.findIndex((w: any) => w.id === checkTx.walletId);
          if (oldWalletIdx !== -1) {
            const oldAmt = parseFloat(checkTx.amount) || 0;
            if (checkTx.type === "income") {
              wallets[oldWalletIdx].balance -= oldAmt;
            } else if (checkTx.type === "expense") {
              wallets[oldWalletIdx].balance += oldAmt;
            }
            writeWallets(wallets);
          }
        }
      }

      const targetWalletId = req.body.walletId || checkTx.walletId;
      const targetAmt = req.body.amount !== undefined ? parseFloat(req.body.amount) : parseFloat(checkTx.amount);
      const targetType = req.body.type || checkTx.type;

      if (targetWalletId) {
        if (isSupabaseEnabled) {
          const freshSbWallets = await getSupabaseWallets();
          if (freshSbWallets) {
            const sbNewW = freshSbWallets.find((w: any) => w.id === targetWalletId);
            if (sbNewW) {
              const appBal = targetType === "income" ? sbNewW.balance + targetAmt : sbNewW.balance - targetAmt;
              await updateSupabaseWallet(targetWalletId, { balance: appBal });
            }
          }
        } else {
          const wallets = readWallets();
          const newWalletIdx = wallets.findIndex((w: any) => w.id === targetWalletId);
          if (newWalletIdx !== -1) {
            if (targetType === "income") {
              wallets[newWalletIdx].balance += targetAmt;
            } else if (targetType === "expense") {
              wallets[newWalletIdx].balance -= targetAmt;
            }
            writeWallets(wallets);
          }
        }
      }
    }

    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      writeTransactions(transactions);
    }

    const config = readConfig();
    if (config.connected && config.spreadsheetId && config.accessToken) {
      await syncToSheets(config, transactions);
    }

    res.json({ success: true, transaction: sbTx || (index !== -1 ? transactions[index] : null) });
  } else {
    res.status(404).json({ success: false, message: "Transaction not found" });
  }
});

// Delete transaction
app.delete("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const success = await deleteSupabaseTransaction(id);

  let transactions = readTransactions();
  let txToDelete = transactions.find((tx: any) => tx.id === id);

  if (!txToDelete && isSupabaseEnabled) {
    const activeTxs = await getSupabaseTransactions();
    if (activeTxs) {
      txToDelete = activeTxs.find((tx: any) => tx.id === id) || null;
    }
  }

  if (txToDelete || success) {
    if (txToDelete && txToDelete.walletId) {
      if (isSupabaseEnabled) {
        const sbWallets = await getSupabaseWallets();
        if (sbWallets) {
          const sbW = sbWallets.find((w: any) => w.id === txToDelete.walletId);
          if (sbW) {
            const amt = parseFloat(txToDelete.amount) || 0;
            const revBal = txToDelete.type === "income" ? sbW.balance - amt : sbW.balance + amt;
            await updateSupabaseWallet(txToDelete.walletId, { balance: revBal });
          }
        }
      } else {
        const wallets = readWallets();
        const walletIdx = wallets.findIndex((w: any) => w.id === txToDelete.walletId);
        if (walletIdx !== -1) {
          const amt = parseFloat(txToDelete.amount) || 0;
          if (txToDelete.type === "income") {
            wallets[walletIdx].balance -= amt;
          } else if (txToDelete.type === "expense") {
            wallets[walletIdx].balance += amt;
          }
          writeWallets(wallets);
        }
      }
    }

    transactions = transactions.filter((tx: any) => tx.id !== id);
    writeTransactions(transactions);

    const config = readConfig();
    if (config.connected && config.spreadsheetId && config.accessToken) {
      await syncToSheets(config, transactions);
    }

    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Transaction not found" });
  }
});

// Get Google Sheets Config
app.get("/api/sheets-config", async (req, res) => {
  const config = readConfig();
  if (config.connected && config.spreadsheetId && config.accessToken) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Dompet!A2:C10`;
      const sheetsRes = await fetch(url, {
        headers: { Authorization: `Bearer ${config.accessToken}` },
      });
      if (sheetsRes.ok) {
        const data = await sheetsRes.json();
        const values = data.values || [];
        const user1Row = values.find((r: any) => r[0] === "user1");
        const user2Row = values.find((r: any) => r[0] === "user2");
        if (user1Row) {
          config.user1Name = user1Row[1] || config.user1Name;
          config.user1Wallet = parseFloat(user1Row[2]) !== undefined && !isNaN(parseFloat(user1Row[2])) ? parseFloat(user1Row[2]) : config.user1Wallet;
        }
        if (user2Row) {
          config.user2Name = user2Row[1] || config.user2Name;
          config.user2Wallet = parseFloat(user2Row[2]) !== undefined && !isNaN(parseFloat(user2Row[2])) ? parseFloat(user2Row[2]) : config.user2Wallet;
        }
        writeConfig(config);
      }
    } catch (err) {
      console.error("Failed fetching config/wallet from Google Sheets:", err);
    }
  }

  res.json({ success: true, config });
});

// Save Google Sheets Config
app.post("/api/sheets-config", async (req, res) => {
  const currentConfig = readConfig();
  const newConfig = {
    ...currentConfig,
    ...req.body,
  };
  writeConfig(newConfig);

  // Synchronise names and wallets to Google sheets if active
  if (newConfig.connected && newConfig.spreadsheetId && newConfig.accessToken) {
    const transactions = readTransactions();
    await syncToSheets(newConfig, transactions);
  }

  res.json({ success: true, config: newConfig });
});

// Helper function to create sheets automatically with BOTH Transaksi and Dompet tabs
app.post("/api/sheets/create", async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ success: false, message: "Token Google diperlukan" });
  }

  try {
    const config = readConfig();
    const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          title: "Money Tracker - Akun Bersama",
        },
        sheets: [
          {
            properties: {
              title: "Transaksi",
            },
          },
          {
            properties: {
              title: "Dompet",
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sheets API error:", errorText);
      return res.status(response.status).json({
        success: false,
        message: "Gagal membuat spreadsheet baru di akun Google Anda.",
      });
    }

    const data = await response.json();
    const newConfig = {
      ...config,
      connected: true,
      spreadsheetId: data.spreadsheetId,
      sheetName: "Transaksi",
      spreadsheetUrl: data.spreadsheetUrl,
      lastSyncedAt: new Date().toISOString(),
      accessToken, // Save the active token
    };

    writeConfig(newConfig);

    // Initialize Transaksi Tab Headers
    const txHeadersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}/values/Transaksi!A1:H1?valueInputOption=USER_ENTERED`;
    await fetch(txHeadersUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [["ID", "Tanggal", "Deskripsi", "Kategori", "Tipe", "Jumlah", "Ditambahkan Oleh", "Waktu Input"]],
      }),
    });

    // Initialize Dompet Tab Headers and Initial profiles
    const dompetInitUrl = `https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}/values/Dompet!A1:C3?valueInputOption=USER_ENTERED`;
    await fetch(dompetInitUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [
          ["ID_User", "Nama_User", "Saldo_Dompet"],
          ["user1", config.user1Name || "Ry", config.user1Wallet || 0],
          ["user2", config.user2Name || "Partner", config.user2Wallet || 0]
        ],
      }),
    });

    // Sync all existing local transactions
    const transactions = readTransactions();
    await syncToSheets(newConfig, transactions);

    res.json({ success: true, config: readConfig() });
  } catch (error: any) {
    console.error("Create sheets failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to manually sync all data to Google Sheets
app.post("/api/sheets/sync", async (req, res) => {
  const { accessToken } = req.body;
  const config = readConfig();

  if (!config.connected || !config.spreadsheetId) {
    return res.status(400).json({ success: false, message: "Google Sheets belum terhubung." });
  }

  const activeToken = accessToken || config.accessToken;
  if (!activeToken) {
    return res.status(400).json({ success: false, message: "Token otorisasi Google tidak ditemukan. Masuk lagi ke Google." });
  }

  // Update token in config in case it's refreshed
  if (accessToken) {
    config.accessToken = accessToken;
    writeConfig(config);
  }

  try {
    const transactions = readTransactions();
    const syncSuccess = await syncToSheets(config, transactions);
    
    if (syncSuccess) {
      config.lastSyncedAt = new Date().toISOString();
      writeConfig(config);
      res.json({ success: true, config });
    } else {
      res.status(500).json({ success: false, message: "Sinkronisasi ke Google Sheets gagal." });
    }
  } catch (err: any) {
    console.error("Sync error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
