import { createClient } from "@supabase/supabase-js";

const ACCOUNT_ID = "adminry";
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const isSupabaseEnabled = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseEnabled ? createClient(supabaseUrl, supabaseKey) : null;

const defaultConfig = {
  connected: false,
  spreadsheetId: "",
  sheetName: "Transaksi",
  spreadsheetUrl: "",
  lastSyncedAt: "",
  accessToken: "",
  user1Name: "Ry",
  user1Wallet: 500000,
  user2Name: "Partner",
  user2Wallet: 2500000,
  activeUserIdentity: "Ry",
};

const jsonResponse = (status, body) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const getConfig = async () => {
  if (!supabase) return defaultConfig;

  try {
    const { data, error } = await supabase
      .from("app_configs")
      .select("config")
      .eq("account_id", ACCOUNT_ID)
      .single();

    if (error || !data?.config) {
      return defaultConfig;
    }

    return { ...defaultConfig, ...data.config };
  } catch (err) {
    console.error("getConfig error:", err);
    return defaultConfig;
  }
};

const saveConfig = async (config) => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("app_configs")
      .upsert({ account_id: ACCOUNT_ID, config })
      .select()
      .single();

    if (error) {
      console.error("saveConfig error:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("saveConfig catch:", err);
    return null;
  }
};

const getSupabaseWallets = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.from("wallets").select("*").eq("account_id", ACCOUNT_ID);
  if (error) {
    console.error("Supabase wallets fetch error:", error);
    return null;
  }
  return data.map((w) => ({
    id: w.id,
    name: w.name,
    type: w.type,
    balance: parseFloat(w.balance) || 0,
    ownerId: w.ownerId || w.owner_id || "Ry",
  }));
};

const insertSupabaseWallet = async (wallet) => {
  if (!supabase) return null;
  const payload = {
    id: wallet.id,
    name: wallet.name,
    type: wallet.type,
    balance: parseFloat(wallet.balance) || 0,
    ownerId: wallet.ownerId,
    owner_id: wallet.ownerId,
    account_id: ACCOUNT_ID,
  };
  const { data, error } = await supabase.from("wallets").insert([payload]).select().single();
  if (error) {
    console.error("insert wallet error:", error);
    return null;
  }
  return data;
};

const updateSupabaseWallet = async (id, updates) => {
  if (!supabase) return null;
  const { data, error } = await supabase.from("wallets").update(updates).eq("id", id).select().single();
  if (error) {
    console.error("update wallet error:", error);
    return null;
  }
  return data;
};

const deleteSupabaseWallet = async (id) => {
  if (!supabase) return false;
  const { error } = await supabase.from("wallets").delete().eq("id", id);
  return !error;
};

const getSupabaseBudgets = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.from("budgets").select("*").eq("account_id", ACCOUNT_ID);
  if (error) {
    console.error("get budgets error:", error);
    return null;
  }
  return data.map((b) => ({ id: b.id, category: b.category, limit: parseFloat(b.limit) || 0 }));
};

const insertSupabaseBudget = async (budget) => {
  if (!supabase) return null;
  const payload = { ...budget, account_id: ACCOUNT_ID };
  const { data, error } = await supabase.from("budgets").insert([payload]).select().single();
  if (error) {
    console.error("insert budget error:", error);
    return null;
  }
  return data;
};

const updateSupabaseBudget = async (id, updates) => {
  if (!supabase) return null;
  const { data, error } = await supabase.from("budgets").update(updates).eq("id", id).select().single();
  if (error) {
    console.error("update budget error:", error);
    return null;
  }
  return data;
};

const deleteSupabaseBudget = async (id) => {
  if (!supabase) return false;
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  return !error;
};

const getSupabaseDebts = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.from("debts").select("*").eq("account_id", ACCOUNT_ID);
  if (error) {
    console.error("get debts error:", error);
    return null;
  }
  return data.map((d) => ({
    id: d.id,
    title: d.title,
    amount: parseFloat(d.amount) || 0,
    person: d.person,
    type: d.type || "debt",
    status: d.status || "unpaid",
    date: d.date,
  }));
};

const insertSupabaseDebt = async (debt) => {
  if (!supabase) return null;
  const payload = { ...debt, account_id: ACCOUNT_ID };
  const { data, error } = await supabase.from("debts").insert([payload]).select().single();
  if (error) {
    console.error("insert debt error:", error);
    return null;
  }
  return data;
};

const updateSupabaseDebt = async (id, updates) => {
  if (!supabase) return null;
  const { data, error } = await supabase.from("debts").update(updates).eq("id", id).select().single();
  if (error) {
    console.error("update debt error:", error);
    return null;
  }
  return data;
};

const deleteSupabaseDebt = async (id) => {
  if (!supabase) return false;
  const { error } = await supabase.from("debts").delete().eq("id", id);
  return !error;
};

const getSupabaseCategories = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.from("categories").select("*").eq("account_id", ACCOUNT_ID);
  if (error) {
    console.error("get categories error:", error);
    return null;
  }
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji || "❓",
    type: c.type || "expense",
  }));
};

const insertSupabaseCategory = async (category) => {
  if (!supabase) return null;
  const payload = { ...category, account_id: ACCOUNT_ID };
  const { data, error } = await supabase.from("categories").insert([payload]).select().single();
  if (error) {
    console.error("insert category error:", error);
    return null;
  }
  return data;
};

const deleteSupabaseCategory = async (id) => {
  if (!supabase) return false;
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return !error;
};

const getSupabaseTransactions = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.from("transactions").select("*").eq("account_id", ACCOUNT_ID);
  if (error) {
    console.error("get transactions error:", error);
    return null;
  }
  return data
    .map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      category: t.category,
      type: t.type,
      amount: parseFloat(t.amount) || 0,
      addedBy: t.addedBy || t.added_by || "Sistem",
      createdAt: t.createdAt || t.created_at || new Date().toISOString(),
      walletId: t.walletId || t.wallet_id || null,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const insertSupabaseTransaction = async (transaction) => {
  if (!supabase) return null;
  const payload = {
    ...transaction,
    amount: parseFloat(transaction.amount) || 0,
    addedBy: transaction.addedBy || "Sistem",
    added_by: transaction.addedBy || "Sistem",
    createdAt: transaction.createdAt || new Date().toISOString(),
    created_at: transaction.createdAt || new Date().toISOString(),
    walletId: transaction.walletId || null,
    wallet_id: transaction.walletId || null,
    account_id: ACCOUNT_ID,
  };
  const { data, error } = await supabase.from("transactions").insert([payload]).select().single();
  if (error) {
    console.error("insert transaction error:", error);
    return null;
  }
  return data;
};

const updateSupabaseTransaction = async (id, updates) => {
  if (!supabase) return null;
  const payload = { ...updates };
  if (updates.addedBy !== undefined) payload.added_by = updates.addedBy;
  if (updates.walletId !== undefined) payload.wallet_id = updates.walletId;
  const { data, error } = await supabase.from("transactions").update(payload).eq("id", id).select().single();
  if (error) {
    console.error("update transaction error:", error);
    return null;
  }
  return data;
};

const deleteSupabaseTransaction = async (id) => {
  if (!supabase) return false;
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  return !error;
};

const syncToSheets = async (config, transactions) => {
  if (!config?.accessToken || !config?.spreadsheetId) return false;

  try {
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.sheetName}!A2:H1000:clear`;
    await fetch(clearUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
    });

    const rows = transactions.map((tx) => [
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
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.sheetName}!A2:append?valueInputOption=USER_ENTERED`;
      await fetch(updateUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: rows }),
      });
    }

    const clearDompetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Dompet!A2:C10:clear`;
    await fetch(clearDompetUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
    });

    const dompetRows = [
      ["user1", config.user1Name || "Ry", config.user1Wallet || 0],
      ["user2", config.user2Name || "Partner", config.user2Wallet || 0],
    ];
    const updateDompetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Dompet!A2:append?valueInputOption=USER_ENTERED`;
    await fetch(updateDompetUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: dompetRows }),
    });

    return true;
  } catch (err) {
    console.error("syncToSheets error:", err);
    return false;
  }
};

const handler = async (event) => {
  let route = event.path || "/";
  if (route.startsWith("/.netlify/functions/api")) {
    route = route.replace(/^\/\.netlify\/functions\/api/, "");
  }
  if (route.startsWith("/api")) {
    route = route.replace(/^\/api/, "");
  }
  route = route || "/";
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    if (route === "/" && method === "GET") {
      return jsonResponse(200, { success: true, message: "API proxy alive" });
    }

    if (route === "/health" && method === "GET") {
      return jsonResponse(200, { status: "ok" });
    }

    if (route === "/auth/login" && method === "POST") {
      const { username, password } = body;
      if (username === "adminry" && password === "adminry") {
        return jsonResponse(200, { success: true, user: { username: "adminry", role: "admin" } });
      }
      return jsonResponse(401, { success: false, message: "Username atau password salah!" });
    }

    const parts = route.split("/").filter(Boolean);
    const resource = parts[0];
    const resourceId = parts[1] || null;

    if (resource === "wallets") {
      if (method === "GET") {
        const wallets = await getSupabaseWallets();
        return jsonResponse(200, { success: true, wallets: wallets || [] });
      }
      if (method === "POST") {
        const newWallet = {
          id: `w-${Date.now()}`,
          name: body.name || "Dompet Baru",
          type: body.type || "Rekening Bank",
          balance: parseFloat(body.balance) || 0,
          ownerId: body.ownerId || "Ry",
        };
        const wallet = await insertSupabaseWallet(newWallet);
        return wallet ? jsonResponse(200, { success: true, wallet }) : jsonResponse(500, { success: false, message: "Failed saving wallet" });
      }
      if (resourceId && method === "PUT") {
        const updates = {
          name: body.name,
          type: body.type,
          balance: body.balance !== undefined ? parseFloat(body.balance) : undefined,
          ownerId: body.ownerId,
          owner_id: body.ownerId,
        };
        Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);
        const wallet = await updateSupabaseWallet(resourceId, updates);
        return wallet ? jsonResponse(200, { success: true, wallet }) : jsonResponse(404, { success: false, message: "Wallet not found" });
      }
      if (resourceId && method === "DELETE") {
        const success = await deleteSupabaseWallet(resourceId);
        return success ? jsonResponse(200, { success: true }) : jsonResponse(404, { success: false, message: "Wallet not found" });
      }
    }

    if (resource === "budgets") {
      if (method === "GET") {
        const budgets = await getSupabaseBudgets();
        return jsonResponse(200, { success: true, budgets: budgets || [] });
      }
      if (method === "POST") {
        const newBudget = {
          id: `b-${Date.now()}`,
          category: body.category || "Makanan & Minuman",
          limit: parseFloat(body.limit) || 0,
        };
        const budget = await insertSupabaseBudget(newBudget);
        return budget ? jsonResponse(200, { success: true, budget }) : jsonResponse(500, { success: false, message: "Failed saving budget" });
      }
      if (resourceId && method === "PUT") {
        const updates = { category: body.category, limit: body.limit !== undefined ? parseFloat(body.limit) : undefined };
        Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);
        const budget = await updateSupabaseBudget(resourceId, updates);
        return budget ? jsonResponse(200, { success: true, budget }) : jsonResponse(404, { success: false, message: "Budget not found" });
      }
      if (resourceId && method === "DELETE") {
        const success = await deleteSupabaseBudget(resourceId);
        return success ? jsonResponse(200, { success: true }) : jsonResponse(404, { success: false, message: "Budget not found" });
      }
    }

    if (resource === "debts") {
      if (method === "GET") {
        const debts = await getSupabaseDebts();
        return jsonResponse(200, { success: true, debts: debts || [] });
      }
      if (method === "POST") {
        const newDebt = {
          id: `d-${Date.now()}`,
          title: body.title || "Utang",
          amount: parseFloat(body.amount) || 0,
          person: body.person || "Teman",
          type: body.type || "debt",
          status: body.status || "unpaid",
          date: body.date || new Date().toISOString().split("T")[0],
        };
        const debt = await insertSupabaseDebt(newDebt);
        return debt ? jsonResponse(200, { success: true, debt }) : jsonResponse(500, { success: false, message: "Failed saving debt" });
      }
      if (resourceId && method === "PUT") {
        const updates = {
          title: body.title,
          amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
          person: body.person,
          type: body.type,
          status: body.status,
          date: body.date,
        };
        Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);
        const debt = await updateSupabaseDebt(resourceId, updates);
        return debt ? jsonResponse(200, { success: true, debt }) : jsonResponse(404, { success: false, message: "Debt not found" });
      }
      if (resourceId && method === "DELETE") {
        const success = await deleteSupabaseDebt(resourceId);
        return success ? jsonResponse(200, { success: true }) : jsonResponse(404, { success: false, message: "Debt not found" });
      }
    }

    if (resource === "categories") {
      if (method === "GET") {
        const categories = await getSupabaseCategories();
        return jsonResponse(200, { success: true, categories: categories || [] });
      }
      if (method === "POST") {
        const newCategory = {
          id: `c-${Date.now()}`,
          name: body.name || "Kategori Baru",
          emoji: body.emoji || "❓",
          type: body.type || "expense",
        };
        const category = await insertSupabaseCategory(newCategory);
        return category ? jsonResponse(200, { success: true, category }) : jsonResponse(500, { success: false, message: "Failed saving category" });
      }
      if (resourceId && method === "DELETE") {
        const success = await deleteSupabaseCategory(resourceId);
        return success ? jsonResponse(200, { success: true }) : jsonResponse(404, { success: false, message: "Category not found" });
      }
    }

    if (resource === "transactions") {
      if (method === "GET") {
        const transactions = await getSupabaseTransactions();
        return jsonResponse(200, { success: true, transactions: transactions || [] });
      }
      if (method === "POST") {
        const newTransaction = { ...body, createdAt: new Date().toISOString() };
        const tx = await insertSupabaseTransaction(newTransaction);
        return tx ? jsonResponse(200, { success: true, transaction: tx }) : jsonResponse(500, { success: false, message: "Failed saving transaction" });
      }
      if (resourceId && method === "PUT") {
        const tx = await updateSupabaseTransaction(resourceId, body);
        return tx ? jsonResponse(200, { success: true, transaction: tx }) : jsonResponse(404, { success: false, message: "Transaction not found" });
      }
      if (resourceId && method === "DELETE") {
        const success = await deleteSupabaseTransaction(resourceId);
        return success ? jsonResponse(200, { success: true }) : jsonResponse(404, { success: false, message: "Transaction not found" });
      }
    }

    if (route === "/sheets-config" && method === "GET") {
      const config = await getConfig();
      return jsonResponse(200, { success: true, config });
    }
    if (route === "/sheets-config" && method === "POST") {
      const currentConfig = await getConfig();
      const newConfig = { ...currentConfig, ...body };
      await saveConfig(newConfig);
      if (newConfig.connected && newConfig.spreadsheetId && newConfig.accessToken) {
        const transactions = (await getSupabaseTransactions()) || [];
        await syncToSheets(newConfig, transactions);
      }
      return jsonResponse(200, { success: true, config: newConfig });
    }
    if (route === "/sheets/create" && method === "POST") {
      const { accessToken } = body;
      if (!accessToken) return jsonResponse(400, { success: false, message: "Token Google diperlukan" });
      const config = await getConfig();
      const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: { title: "Money Tracker - Akun Bersama" },
          sheets: [{ properties: { title: "Transaksi" } }, { properties: { title: "Dompet" } }],
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        return jsonResponse(response.status, { success: false, message: errorText });
      }
      const data = await response.json();
      const newConfig = {
        ...config,
        connected: true,
        spreadsheetId: data.spreadsheetId,
        sheetName: "Transaksi",
        spreadsheetUrl: data.spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
        accessToken,
      };
      await saveConfig(newConfig);
      const txs = (await getSupabaseTransactions()) || [];
      await syncToSheets(newConfig, txs);
      return jsonResponse(200, { success: true, config: newConfig });
    }
    if (route === "/sheets/sync" && method === "POST") {
      const { accessToken } = body;
      const config = await getConfig();
      const activeToken = accessToken || config.accessToken;
      if (!config.connected || !config.spreadsheetId) {
        return jsonResponse(400, { success: false, message: "Google Sheets belum terhubung." });
      }
      if (!activeToken) {
        return jsonResponse(400, { success: false, message: "Token otorisasi Google tidak ditemukan. Masuk lagi ke Google." });
      }
      if (accessToken) {
        config.accessToken = accessToken;
        await saveConfig(config);
      }
      const txs = (await getSupabaseTransactions()) || [];
      const syncSuccess = await syncToSheets(config, txs);
      if (syncSuccess) {
        config.lastSyncedAt = new Date().toISOString();
        await saveConfig(config);
        return jsonResponse(200, { success: true, config });
      }
      return jsonResponse(500, { success: false, message: "Sinkronisasi ke Google Sheets gagal." });
    }

    return jsonResponse(404, { success: false, message: "Route not found" });
  } catch (err) {
    console.error("API function error:", err);
    return jsonResponse(500, { success: false, message: "Internal server error" });
  }
};

export { handler };
