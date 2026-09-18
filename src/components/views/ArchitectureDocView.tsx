import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  RefreshCw,
  Lock,
  GitBranch,
  Terminal,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface ArchitectureDocViewProps {
  onBack?: () => void;
}

export const ArchitectureDocView: React.FC<ArchitectureDocViewProps> = ({ onBack }) => {
  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200 text-xs">
      {/* Header Back Button */}
      {onBack && (
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-cyan-400" />
            <span>بازگشت</span>
          </button>
        </div>
      )}

      {/* Architecture Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Principles */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>۱. اصول چهارگانه مهندسی محصول</span>
          </div>
          <ul className="space-y-2 text-slate-300 leading-relaxed list-disc list-inside">
            <li><strong className="text-white">Privacy-First:</strong> هیچ متن پیامک خام یا کلید رمزنگاری از دستگاه کاربر خارج نمی‌شود.</li>
            <li><strong className="text-white">Local-First:</strong> کلاینت به عنوان منبع حقیقت (Source of Truth) عمل می‌کند و در حالت آفلاین عملکرد کامل دارد.</li>
            <li><strong className="text-white">Zero-Knowledge Cloud:</strong> تمام Payload های ارسالی به ابر با کلید AES-GCM مشتق‌شده از پس‌ورد کاربر رمزنگاری می‌شوند.</li>
            <li><strong className="text-white">Deduplication:</strong> جلوگیری از ثبت تراکنش تکراری بر اساس هش SHA-256 ترکیبی از مقادیر پیامک.</li>
          </ul>
        </div>

        {/* SMS Parser Pipeline */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Cpu className="w-5 h-5" />
            <span>۲. پایپ‌لاین موتور پارسر پیامک بانکی (NLP & Regex)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-300 space-y-1 border border-slate-800">
            <div>1. Raw SMS Clean & Persian Digits Normalization</div>
            <div>2. Bank Header & Sender Identification Regex</div>
            <div>3. Transaction Type Classifier (Expense/Income/Transfer)</div>
            <div>4. Amount Extraction & Rial-to-Toman Converter</div>
            <div>5. Masked Card & Account Suffix Extraction (Last 4)</div>
            <div>6. Balance After & Merchant Suffix Stripper</div>
            <div>7. Confidence Scoring Engine & Deduplication Hash</div>
          </div>
        </div>

        {/* Local Storage Engine */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <Database className="w-5 h-5" />
            <span>۳. موتور ذخیره‌سازی محلی (Local Store)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            استفاده از ساختار بهینه‌سازی شده با ایندکس‌های زمانی، کش محاسبات ماهانه و مدیریت وضعیت بلادرنگ (Reactive Store) با تضمین ACID در سطح کلاینت.
          </p>
        </div>

        {/* Zero-Knowledge Sync Protocol */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <RefreshCw className="w-5 h-5" />
            <span>۴. پروتکل همگام‌سازی ابری امن (Cloud Sync)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            الگوریتم برطرف‌سازی تعارض‌ها (CRDT / Last-Write-Wins با برچسب زمانی وکتوری) جهت همگام‌سازی داده‌های رمزنگاری‌شده بین چند دستگاه بدون دسترسی سرور به محتوا.
          </p>
        </div>
      </div>
    </div>
  );
};
