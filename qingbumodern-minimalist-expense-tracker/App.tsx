
import React, { useState, useMemo, useEffect } from 'react';
import { TransactionRecord, RecordType } from './types';
import { CATEGORY_MAP, EXPENSE_CATEGORIES, INCOME_CATEGORIES, COLORS } from './constants';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// --- Helper Components ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <nav className="fixed bottom-0 left-0 right-0 glass z-50 px-6 py-3 flex justify-around items-center border-t border-slate-100 shadow-sm sm:max-w-md sm:mx-auto sm:rounded-t-2xl">
    {[
      { id: 'home', icon: 'Home', label: '首页', emoji: '🏠' },
      { id: 'stats', icon: 'BarChart', label: '统计', emoji: '📊' },
      { id: 'settings', icon: 'Settings', label: '我的', emoji: '👤' }
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`flex flex-col items-center transition-all duration-300 ${activeTab === tab.id ? 'text-[#4DB6AC] scale-110' : 'text-slate-400'}`}
      >
        <span className="text-xl mb-1">{tab.emoji}</span>
        <span className="text-[10px] font-medium">{tab.label}</span>
      </button>
    ))}
  </nav>
);

// Explicitly typing as React.FC ensures the component allows standard React props like 'key' in JSX
const RecordItem: React.FC<{ record: TransactionRecord; onDelete: (id: string) => void }> = ({ record, onDelete }) => (
  <div className="group flex items-center justify-between p-4 mb-3 bg-white rounded-2xl transition-all duration-200 hover:shadow-md border border-slate-50">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-xl">
        {CATEGORY_MAP[record.category] || '✨'}
      </div>
      <div>
        <p className="font-semibold text-sm text-slate-800">{record.category}</p>
        <p className="text-[11px] text-slate-400 font-medium">
          {record.note || new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <p className={`font-bold text-sm ${record.type === 'income' ? 'text-[#4DB6AC]' : 'text-[#EF5350]'}`}>
        {record.type === 'income' ? '+' : '-'}{record.amount.toFixed(2)}
      </p>
      <button 
        onClick={() => onDelete(record.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-slate-50 text-slate-400 transition-opacity"
      >
        🗑️
      </button>
    </div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [records, setRecords] = useState<TransactionRecord[]>([
    { id: '1', amount: 32.5, type: 'expense', category: '餐饮', date: Date.now() - 3600000, note: '早餐咖啡' },
    { id: '2', amount: 200, type: 'expense', category: '购物', date: Date.now() - 86400000, note: 'T恤' },
    { id: '3', amount: 8500, type: 'income', category: '工资', date: Date.now() - 172800000 },
  ]);
  const [activeTab, setActiveTab] = useState('home');
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<RecordType>('expense');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('餐饮');
  const [newNote, setNewNote] = useState('');

  const monthlySummary = useMemo(() => {
    const income = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    return { income, expense, balance: income - expense };
  }, [records]);

  const sortedRecords = useMemo(() => {
    const grouped: { [key: string]: TransactionRecord[] } = {};
    records.forEach(r => {
      const d = new Date(r.date).toLocaleDateString();
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(r);
    });
    return Object.entries(grouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [records]);

  const categoryStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    records.filter(r => r.type === 'expense').forEach(r => {
      stats[r.category] = (stats[r.category] || 0) + r.amount;
    });
    return Object.entries(stats).map(([category, amount]) => ({
      name: category,
      value: amount,
    }));
  }, [records]);

  const handleAddRecord = () => {
    if (!newAmount || isNaN(parseFloat(newAmount))) return;
    const record: TransactionRecord = {
      id: Math.random().toString(36).substr(2, 9),
      amount: parseFloat(newAmount),
      type: newType,
      category: newCategory,
      date: Date.now(),
      note: newNote
    };
    setRecords([record, ...records]);
    setIsAdding(false);
    setNewAmount('');
    setNewNote('');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#FBFBFC] pb-24 relative shadow-2xl">
      {/* Header & Summary */}
      <header className="px-6 pt-10 pb-6 bg-white rounded-b-[40px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold tracking-tight">2024年 10月</h1>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer">
            📅
          </div>
        </div>
        
        <div className="bg-[#E0F2F1] rounded-[32px] p-8 flex flex-col items-center">
          <p className="text-xs font-semibold text-[#4DB6AC] mb-1 opacity-80 uppercase tracking-widest">本月结余</p>
          <h2 className="text-4xl font-bold text-[#004D40] mb-8">
            ¥{monthlySummary.balance.toLocaleString()}
          </h2>
          
          <div className="w-full flex justify-between px-2">
            <div className="text-center">
              <p className="text-[11px] font-bold text-[#4DB6AC] opacity-60 mb-1">收入</p>
              <p className="text-lg font-bold text-[#00695C]">¥{monthlySummary.income.toLocaleString()}</p>
            </div>
            <div className="w-[1px] bg-[#B2DFDB] h-10 self-center"></div>
            <div className="text-center">
              <p className="text-[11px] font-bold text-[#EF5350] opacity-60 mb-1">支出</p>
              <p className="text-lg font-bold text-[#D32F2F]">¥{monthlySummary.expense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="px-6 py-6 overflow-y-auto hide-scrollbar">
        {activeTab === 'home' && (
          <div className="space-y-6">
            {sortedRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <span className="text-6xl mb-4">🍃</span>
                <p className="text-sm font-medium">暂时没有记录哦</p>
              </div>
            ) : (
              sortedRecords.map(([date, items]) => (
                <div key={date}>
                  <p className="text-[11px] font-bold text-slate-400 mb-3 px-1 uppercase tracking-wider">{date}</p>
                  {items.map(r => (
                    <RecordItem key={r.id} record={r} onDelete={(id) => setRecords(records.filter(x => x.id !== id))} />
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <section>
              <h3 className="text-lg font-bold mb-4 px-2">收支趋势</h3>
              <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={records.slice(-10).map(r => ({ name: new Date(r.date).getDate(), amount: r.amount }))}>
                    <Bar dataKey="amount" fill="#4DB6AC" radius={[4, 4, 0, 0]} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#86868B' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-4 px-2">分类占比</h3>
              <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex flex-col items-center">
                <div className="h-48 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryStats} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#4DB6AC', '#80CBC4', '#B2DFDB', '#E0F2F1', '#26A69A'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full grid grid-cols-2 gap-4 mt-4">
                  {categoryStats.map((stat, i) => (
                    <div key={stat.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#4DB6AC', '#80CBC4', '#B2DFDB', '#E0F2F1', '#26A69A'][i % 5] }}></div>
                      <p className="text-[11px] font-medium text-slate-600">{stat.name} ¥{stat.value.toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            {[
              { label: '账单提醒', emoji: '🔔' },
              { label: '主题设置', emoji: '🎨' },
              { label: '多币种管理', emoji: '💱' },
              { label: '数据备份', emoji: '☁️' },
              { label: '导出报表', emoji: '📊' },
              { label: '关于轻簿', emoji: 'ℹ️' }
            ].map(item => (
              <button key={item.label} className="w-full flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="font-semibold text-sm text-slate-700">{item.label}</span>
                </div>
                <span className="text-slate-300">›</span>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-24 right-8 w-16 h-16 bg-[#4DB6AC] text-white rounded-full shadow-lg shadow-[#4DB6AC44] flex items-center justify-center text-3xl transition-transform hover:scale-110 active:scale-95 z-40 sm:absolute sm:bottom-8 sm:right-6"
      >
        +
      </button>

      {/* Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Add Record Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="relative glass w-full max-w-md rounded-t-[40px] p-8 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-8"></div>
            
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-10">
              <button 
                onClick={() => setNewType('expense')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${newType === 'expense' ? 'bg-white text-[#EF5350] shadow-sm' : 'text-slate-400'}`}
              >
                支出
              </button>
              <button 
                onClick={() => setNewType('income')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${newType === 'income' ? 'bg-white text-[#4DB6AC] shadow-sm' : 'text-slate-400'}`}
              >
                收入
              </button>
            </div>

            <div className="mb-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold text-slate-400">¥</span>
                <input 
                  autoFocus
                  type="number" 
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-5xl font-bold w-48 text-center outline-none border-none placeholder-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {(newType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).slice(0, 8).map(cat => (
                <button 
                  key={cat.name}
                  onClick={() => setNewCategory(cat.name)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${newCategory === cat.name ? 'bg-[#E0F2F1] scale-105' : 'bg-transparent'}`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className={`text-[10px] font-bold ${newCategory === cat.name ? 'text-[#4DB6AC]' : 'text-slate-400'}`}>{cat.name}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-6">
              <input 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="添加备注..."
                className="w-full bg-slate-50/50 p-4 rounded-2xl outline-none text-sm font-medium border border-slate-100"
              />
              <button 
                onClick={handleAddRecord}
                className={`w-full py-4 rounded-3xl text-white font-bold shadow-lg transition-all active:scale-95 ${newType === 'expense' ? 'bg-[#EF5350] shadow-[#EF535044]' : 'bg-[#4DB6AC] shadow-[#4DB6AC44]'}`}
              >
                保存记账
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
