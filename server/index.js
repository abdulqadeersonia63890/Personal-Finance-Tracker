import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const app = express();
const PORT = process.env.PORT || 5000;
const dir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(dir, "data");
const dataFile = path.join(dataDir, "transactions.json");
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

async function read() {
  await fs.mkdir(dataDir, { recursive: true });
  try { return JSON.parse(await fs.readFile(dataFile, "utf8")); }
  catch {
    const seed = [
      {id:crypto.randomUUID(),title:"Monthly salary",amount:85000,type:"income",category:"Salary",date:new Date().toISOString().slice(0,10),note:"Sample income"},
      {id:crypto.randomUUID(),title:"Groceries",amount:6500,type:"expense",category:"Food",date:new Date().toISOString().slice(0,10),note:"Sample expense"},
      {id:crypto.randomUUID(),title:"Internet bill",amount:2500,type:"expense",category:"Bills",date:new Date().toISOString().slice(0,10),note:"Sample expense"}
    ];
    await write(seed); return seed;
  }
}
async function write(items) {
  await fs.mkdir(dataDir, {recursive:true});
  await fs.writeFile(dataFile, JSON.stringify(items, null, 2));
}
function validate(b) {
  if (!String(b.title || "").trim()) return "Transaction title is required.";
  if (!Number.isFinite(Number(b.amount)) || Number(b.amount) <= 0) return "Amount must be greater than zero.";
  if (!["income","expense"].includes(b.type)) return "Select income or expense.";
  if (!String(b.category || "").trim()) return "Category is required.";
  if (!b.date || Number.isNaN(Date.parse(b.date))) return "Valid date is required.";
  return null;
}
app.get("/api/health", (_q,r) => r.json({status:"ok"}));
app.get("/api/transactions", async (q,r) => {
  try {
    let a = await read();
    if (q.query.type && q.query.type !== "all") a = a.filter(x => x.type === q.query.type);
    if (q.query.category && q.query.category !== "all") a = a.filter(x => x.category === q.query.category);
    if (q.query.search) a = a.filter(x => `${x.title} ${x.category} ${x.note||""}`.toLowerCase().includes(String(q.query.search).toLowerCase()));
    a.sort((x,y) => y.date.localeCompare(x.date)); r.json(a);
  } catch { r.status(500).json({message:"Could not read transactions."}); }
});
app.post("/api/transactions", async (q,r) => {
  const error = validate(q.body); if (error) return r.status(400).json({message:error});
  try {
    const a = await read(), item = {id:crypto.randomUUID(),title:q.body.title.trim(),amount:Number(q.body.amount),type:q.body.type,category:q.body.category,date:q.body.date,note:q.body.note||""};
    a.push(item); await write(a); r.status(201).json(item);
  } catch { r.status(500).json({message:"Could not save transaction."}); }
});
app.put("/api/transactions/:id", async (q,r) => {
  const error = validate(q.body); if (error) return r.status(400).json({message:error});
  try {
    const a = await read(), i = a.findIndex(x => x.id === q.params.id);
    if (i < 0) return r.status(404).json({message:"Transaction not found."});
    a[i] = {...a[i],title:q.body.title.trim(),amount:Number(q.body.amount),type:q.body.type,category:q.body.category,date:q.body.date,note:q.body.note||""};
    await write(a); r.json(a[i]);
  } catch { r.status(500).json({message:"Could not update transaction."}); }
});
app.delete("/api/transactions/:id", async (q,r) => {
  try {
    const a = await read(), b = a.filter(x => x.id !== q.params.id);
    if (a.length === b.length) return r.status(404).json({message:"Transaction not found."});
    await write(b); r.json({message:"Deleted"});
  } catch { r.status(500).json({message:"Could not delete transaction."}); }
});
app.get("/api/summary", async (_q,r) => {
  const a = await read(), sum = (type,items=a) => items.filter(x=>x.type===type).reduce((s,x)=>s+Number(x.amount),0);
  const month = new Date().toISOString().slice(0,7), m = a.filter(x=>x.date.startsWith(month)), income=sum("income"), expenses=sum("expense");
  r.json({balance:income-expenses,income,expenses,savingsRate:income?Math.round((income-expenses)/income*100):0,monthlyIncome:sum("income",m),monthlyExpenses:sum("expense",m),transactionCount:a.length});
});
app.listen(PORT, async () => { await read(); console.log(`API ready at http://localhost:${PORT}`); });
