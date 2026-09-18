import React, { useState, useEffect } from 'react';
import {
  MessageSquareCode,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  RotateCcw,
  FileCheck2,
  Check,
  HelpCircle
} from 'lucide-react';
import { SmsParserEngine } from '../../parser/smsParserEngine';
import { SAMPLE_SMS_DATA } from '../../parser/bankRules';
import { Account, BankCard, Currency, ParsedSmsResult } from '../../types';
import { formatMoney, toPersianDigits } from '../../utils/persianDate';

interface SmsParserLabViewProps {
  accounts: Account[];
  cards: BankCard[];
  currency: Currency;
  onCommitParsedSms: (result: ParsedSmsResult, rawSms: string) => { success: boolean; message: string };
}

const defaultResult: ParsedSmsResult = {
  bankCode: 'mellat',
  bankName: 'بانک ملت',
  type: 'expense',
  amount: 0,
  rawAmount: 0,
  rawUnit: 'TOMAN',
  timestamp: Date.now(),
  jalaliDate: '',
  confidence: 0,
  confidenceReasons: [],
  dedupHash: '',
  rawSms: '',
};

export const SmsParserLabView: React.FC<SmsParserLabViewProps> = ({
  accounts,
  cards,
  currency,
  onCommitParsedSms,
}) => {
  const [rawSmsInput, setRawSmsInput] = useState<string>(SAMPLE_SMS_DATA[0]?.text || '');
  const [senderInput, setSenderInput] = useState<string>('20004000');
  const [parseResult, setParseResult] = useState<ParsedSmsResult>(defaultResult);
  const [commitFeedback, setCommitFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Trigger parsing whenever input changes
  useEffect(() => {
    let isMounted = true;
    if (!rawSmsInput.trim()) {
      setParseResult(defaultResult);
      return;
    }

    SmsParserEngine.parse(rawSmsInput, senderInput).then((res) => {
      if (isMounted) {
        setParseResult(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rawSmsInput, senderInput]);

  const handleSelectSample = (sample: { bank: string; text: string }) => {
    setRawSmsInput(sample.text);
    setCommitFeedback(null);
  };

  const handleCommit = () => {
    const res = onCommitParsedSms(parseResult, rawSmsInput);
    setCommitFeedback(res);
    setTimeout(() => {
      setCommitFeedback(null);
    }, 4000);
  };

  return (
    <div id="sms_lab_box" className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Preset Bank SMS Templates */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm flex items-center gap-3 overflow-hidden">
        <span className="text-xs text-slate-400 font-semibold shrink-0">نمونه‌ها:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs flex-1">
          {SAMPLE_SMS_DATA.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                rawSmsInput === sample.text
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-black shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {sample.bank}
            </button>
          ))}
        </div>
      </div>

      {/* Main Sandbox Grid: SMS Input vs Parsed Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: SMS Input Form */}
        <div id="sms_input_area" className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquareCode className="w-4 h-4 text-emerald-400" />
                <span>متن پیامک</span>
              </h3>
              {rawSmsInput && (
                <button
                  type="button"
                  onClick={() => setRawSmsInput('')}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>پاک کردن</span>
                </button>
              )}
            </div>

            {/* Sender / Number */}
            <div>
              <label className="block text-slate-400 font-medium mb-1 text-xs">
                سرشماره یا نام بانک:
              </label>
              <input
                type="text"
                value={senderInput}
                onChange={(e) => setSenderInput(e.target.value)}
                placeholder="مثلاً: Mellat, Saman, 2000400..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            {/* Raw Textarea */}
            <div>
              <label className="block text-slate-400 font-medium mb-1 text-xs">
                متن پیامک بانکی:
              </label>
              <textarea
                value={rawSmsInput}
                onChange={(e) => {
                  setRawSmsInput(e.target.value);
                  setCommitFeedback(null);
                }}
                rows={5}
                placeholder="متن پیامک را اینجا الصاق کنید..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 outline-none leading-relaxed font-mono resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Analysis Breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>اطلاعات استخراج‌شده</span>
              </h3>

              {/* Confidence Badge */}
              <div
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border ${
                  parseResult.confidence >= 0.8
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : parseResult.confidence >= 0.5
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {parseResult.confidence >= 0.8 ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>اطمینان: {(parseResult.confidence * 100).toFixed(0)}٪</span>
              </div>
            </div>

            {/* Structured Parsed Fields */}
            <div className="space-y-1.5 text-xs">
              {/* Bank Name */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-slate-400">بانک:</span>
                <span className="font-bold text-white">
                  {parseResult.bankName || <span className="text-slate-500">-</span>}
                </span>
              </div>

              {/* Transaction Type */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-slate-400">نوع:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-lg text-xs ${
                    parseResult.type === 'income'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : parseResult.type === 'transfer'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {parseResult.type === 'income'
                    ? 'واریز'
                    : parseResult.type === 'transfer'
                    ? 'انتقال'
                    : parseResult.type === 'fee'
                    ? 'کارمزد'
                    : parseResult.type === 'refund'
                    ? 'برگشت وجه'
                    : 'برداشت / خرید'}
                </span>
              </div>

              {/* Amount (Normalized to Toman) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-slate-400">مبلغ:</span>
                <div className="text-left">
                  <div className="font-black text-white text-sm tabular-nums">
                    {parseResult.amount > 0 ? formatMoney(parseResult.amount, currency) : '۰ تومان'}
                  </div>
                  {parseResult.rawUnit === 'IRR' && (
                    <div className="text-[10px] text-slate-500">
                      معادل {formatMoney(parseResult.rawAmount, 'IRR')}
                    </div>
                  )}
                </div>
              </div>

              {/* Card / Account Last 4 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-slate-400">کارت / حساب:</span>
                <span className="font-mono text-slate-200">
                  {parseResult.cardLast4 ? `****${parseResult.cardLast4}` : (parseResult.accountNumber || '-')}
                </span>
              </div>

              {/* Balance After */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-slate-400">مانده حساب:</span>
                <span className="font-bold text-slate-200 tabular-nums">
                  {parseResult.balanceAfter !== undefined ? formatMoney(parseResult.balanceAfter, currency) : '-'}
                </span>
              </div>

              {/* Merchant / Counterparty */}
              {parseResult.merchantName && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                  <span className="text-slate-400">پذیرنده / طرف حساب:</span>
                  <span className="font-bold text-amber-300">{parseResult.merchantName}</span>
                </div>
              )}

              {/* Tracking Code */}
              {parseResult.trackingCode && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                  <span className="text-slate-400">کد پیگیری:</span>
                  <span className="font-mono text-slate-300">{parseResult.trackingCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Commit Actions & Feedback */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            {commitFeedback && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  commitFeedback.success
                    ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-200'
                    : 'bg-rose-950/60 border border-rose-800/60 text-rose-200'
                }`}
              >
                {commitFeedback.success ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{commitFeedback.message}</span>
              </div>
            )}

            <button
              id="btn_commit_sms_transaction"
              type="button"
              onClick={handleCommit}
              disabled={parseResult.amount <= 0}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FileCheck2 className="w-4 h-4 stroke-[2.5]" />
              <span>ثبت تراکنش</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
