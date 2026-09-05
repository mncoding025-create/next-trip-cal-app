"use client";

import { useMemo, useState } from "react";

type Expense = { id: number; label: string; amount: number; paidBy: string };
type Settlement = { from: string; to: string; amount: number };

const currency = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatBaht = (amount: number) => `${currency.format(Math.round(amount))} ฿`;
const defaultMembers = ["คุณ", "มีน", "ต้น"];
const defaultExpenses: Expense[] = [
  { id: 1, label: "ค่าทางด่วน", amount: 320, paidBy: "คุณ" },
  { id: 2, label: "ค่าที่พักคืนแรก", amount: 1800, paidBy: "มีน" },
];

export default function Home() {
  const [members, setMembers] = useState(defaultMembers);
  const [newMember, setNewMember] = useState("");
  const [distance, setDistance] = useState(780);
  const [efficiency, setEfficiency] = useState(14);
  const [fuelPrice, setFuelPrice] = useState(35);
  const [expenses, setExpenses] = useState<Expense[]>(defaultExpenses);
  const [nextExpense, setNextExpense] = useState({ label: "", amount: "", paidBy: "คุณ" });

  const fuelCost = efficiency > 0 ? (distance / efficiency) * fuelPrice : 0;
  const otherCost = expenses.reduce((total, expense) => total + expense.amount, 0);
  const totalCost = fuelCost + otherCost;
  const fairShare = members.length > 0 ? totalCost / members.length : 0;
  const paidByMember = useMemo(() => members.map((member) => {
    const paid = expenses.filter((expense) => expense.paidBy === member).reduce((sum, expense) => sum + expense.amount, 0);
    return { name: member, paid, balance: paid - fairShare };
  }), [expenses, fairShare, members]);

  const settlements = useMemo<Settlement[]>(() => {
    const creditors = paidByMember.filter((person) => person.balance > 0.5).map((person) => ({ ...person }));
    const debtors = paidByMember.filter((person) => person.balance < -0.5).map((person) => ({ ...person }));
    const result: Settlement[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const amount = Math.min(creditors[creditorIndex].balance, Math.abs(debtors[debtorIndex].balance));
      result.push({ from: debtors[debtorIndex].name, to: creditors[creditorIndex].name, amount });
      creditors[creditorIndex].balance -= amount;
      debtors[debtorIndex].balance += amount;
      if (creditors[creditorIndex].balance < 0.5) creditorIndex += 1;
      if (Math.abs(debtors[debtorIndex].balance) < 0.5) debtorIndex += 1;
    }
    return result;
  }, [paidByMember]);

  const addMember = () => {
    const name = newMember.trim();
    if (name && !members.includes(name)) {
      setMembers([...members, name]);
      setNewMember("");
      if (!nextExpense.paidBy) setNextExpense({ ...nextExpense, paidBy: name });
    }
  };
  const removeMember = (member: string) => {
    if (members.length <= 1) return;
    setMembers(members.filter((item) => item !== member));
    setExpenses(expenses.filter((expense) => expense.paidBy !== member));
    if (nextExpense.paidBy === member) setNextExpense({ ...nextExpense, paidBy: members.find((item) => item !== member) ?? "" });
  };
  const addExpense = () => {
    const amount = Number(nextExpense.amount);
    if (!nextExpense.label.trim() || !amount || amount < 0 || !nextExpense.paidBy) return;
    setExpenses([...expenses, { id: Date.now(), label: nextExpense.label.trim(), amount, paidBy: nextExpense.paidBy }]);
    setNextExpense({ label: "", amount: "", paidBy: nextExpense.paidBy });
  };
  const resetTrip = () => {
    setMembers([]);
    setNewMember("");
    setDistance(0);
    setEfficiency(0);
    setFuelPrice(0);
    setExpenses([]);
    setNextExpense({ label: "", amount: "", paidBy: "" });
  };

  return (
    <main className="trip-shell">
      <div className="road-lines" aria-hidden="true" />
      <header className="topbar page-width"><div className="brand-mark"><span>✦</span> TRIP TAB</div><div className="topbar-actions"><button className="reset-button" type="button" onClick={resetTrip}>↺ รีเซ็ต</button><div className="trip-status"><span className="status-dot" /> ทริปใหม่ <span className="status-arrow">↗</span></div></div></header>
      <section className="hero page-width"><div className="eyebrow">ADVENTURE AWAITS / V1.0.0</div><h1>หารทริปให้ลงตัว<br /><em>แล้วออกเดินทาง</em></h1><p className="hero-copy">บันทึกค่าใช้จ่าย คำนวณค่าน้ำมัน และเคลียร์ยอดกับเพื่อนให้จบในที่เดียว</p><div className="route-badge"><span>⌁</span> BKK <b>— — —</b> EVERYWHERE IN THAILAND <span>⌁</span></div></section>
      <div className="dashboard page-width">
        <section className="input-column">
          <div className="section-heading"><span className="step-number">01</span><div><h2>ทีมเดินทาง</h2><p>ใครไปด้วยกันบ้าง?</p></div></div>
          <div className="panel member-panel"><div className="member-list">{members.map((member, index) => <span className={`member-chip chip-${index % 4}`} key={member}>{member}<button type="button" onClick={() => removeMember(member)} aria-label={`ลบ ${member}`}>×</button></span>)}</div><div className="add-row"><input value={newMember} onChange={(event) => setNewMember(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addMember()} placeholder="เพิ่มชื่อเพื่อน..." aria-label="เพิ่มชื่อสมาชิก" /><button className="add-button" type="button" onClick={addMember}>เพิ่ม <span>+</span></button></div></div>
          <div className="section-heading"><span className="step-number">02</span><div><h2>ระยะทางและน้ำมัน</h2><p>ข้อมูลสำคัญของเส้นทาง</p></div></div>
          <div className="panel fuel-panel"><label className="field large-field"><span>ระยะทางรวม</span><div><input type="number" min="0" value={distance} onChange={(event) => setDistance(Number(event.target.value))} /><b>กม.</b></div></label><div className="field-grid"><label className="field"><span>อัตราสิ้นเปลือง</span><div><input type="number" min="0" step="0.1" value={efficiency} onChange={(event) => setEfficiency(Number(event.target.value))} /><b>กม./ลิตร</b></div></label><label className="field"><span>ราคาน้ำมัน</span><div><input type="number" min="0" value={fuelPrice} onChange={(event) => setFuelPrice(Number(event.target.value))} /><b>บาท/ลิตร</b></div></label></div><div className="fuel-preview"><span>คาดการณ์ค่าน้ำมัน</span><strong>{formatBaht(fuelCost)}</strong><small>ประมาณ {efficiency > 0 ? (distance / efficiency).toFixed(1) : "0.0"} ลิตร</small></div></div>
          <div className="section-heading"><span className="step-number">03</span><div><h2>ค่าใช้จ่ายอื่นๆ</h2><p>ทางด่วน ที่พัก และค่าใช้จ่ายระหว่างทาง</p></div></div>
          <div className="panel expenses-panel"><div className="expense-items">{expenses.map((expense) => <div className="expense-item" key={expense.id}><div className="expense-icon">{expense.label.includes("ที่พัก") ? "⌂" : "⌁"}</div><div className="expense-name"><strong>{expense.label}</strong><span>จ่ายโดย {expense.paidBy}</span></div><b>{formatBaht(expense.amount)}</b><button type="button" onClick={() => setExpenses(expenses.filter((item) => item.id !== expense.id))} aria-label={`ลบ ${expense.label}`}>×</button></div>)}</div><div className="new-expense"><input value={nextExpense.label} onChange={(event) => setNextExpense({ ...nextExpense, label: event.target.value })} placeholder="ชื่อรายการ เช่น ค่าทางด่วน" aria-label="ชื่อค่าใช้จ่าย" /><input className="amount-input" type="number" min="0" value={nextExpense.amount} onChange={(event) => setNextExpense({ ...nextExpense, amount: event.target.value })} placeholder="จำนวนเงิน" aria-label="จำนวนเงิน" /><select value={nextExpense.paidBy || members[0]} onChange={(event) => setNextExpense({ ...nextExpense, paidBy: event.target.value })} aria-label="ผู้จ่าย">{members.map((member) => <option key={member} value={member}>{member}</option>)}</select><button className="icon-add" type="button" onClick={addExpense} aria-label="เพิ่มค่าใช้จ่าย">+</button></div></div>
        </section>
        <aside className="summary-column"><div className="summary-kicker">TRIP TOTAL <span>✦</span></div><div className="total-card"><p>ค่าใช้จ่ายรวมทั้งทริป</p><strong>{formatBaht(totalCost)}</strong><div className="total-breakdown"><span>ค่าน้ำมัน <b>{formatBaht(fuelCost)}</b></span><span>ค่าใช้จ่ายอื่นๆ <b>{formatBaht(otherCost)}</b></span></div></div><div className="fair-share"><span>ค่าเฉลี่ยที่แต่ละคนควรจ่าย</span><strong>{formatBaht(fairShare)}</strong><small>หารเท่ากัน {members.length} คน</small></div><div className="balance-heading"><h2>เคลียร์ยอด</h2><span>{settlements.length} รายการโอน</span></div><div className="balance-list">{paidByMember.map((person) => <div className={`balance-card ${person.balance >= 0 ? "positive" : "negative"}`} key={person.name}><div className="avatar">{person.name.slice(0, 1)}</div><div className="balance-person"><strong>{person.name}</strong><span>จ่ายไปแล้ว {formatBaht(person.paid)}</span></div><div className="balance-amount"><b>{person.balance >= 0 ? "+" : "−"}{formatBaht(Math.abs(person.balance))}</b><small>{person.balance >= 0 ? "ได้เงินคืน" : "ต้องจ่ายเพิ่ม"}</small></div></div>)}</div><div className="transfer-box"><div className="transfer-title"><span>⇄</span><strong>รายการโอนที่แนะนำ</strong></div>{settlements.length === 0 ? <p>ยอดลงตัวแล้ว ไม่มีรายการโอน</p> : settlements.map((settlement) => <div className="transfer-row" key={`${settlement.from}-${settlement.to}`}><span><b>{settlement.from}</b> โอนให้ <b>{settlement.to}</b></span><strong>{formatBaht(settlement.amount)}</strong></div>)}</div></aside>
      </div>
      <footer className="page-width footer"><span>TRIP TAB / MADE FOR THE ROAD</span><span>เดินทางดีๆ แล้วอย่าลืมเติมน้ำมัน ⛽</span></footer>
    </main>
  );
}
