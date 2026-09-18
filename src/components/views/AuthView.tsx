import React, { useState, useEffect } from 'react';
import { Layers, Phone, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { toPersianDigits } from '../../utils/persianDate';

interface AuthViewProps {
  onLoginSuccess: (phoneNumber: string, name?: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phoneNumber.trim().replace(/[^\d]/g, '');
    if (!cleanPhone.startsWith('09') || cleanPhone.length !== 11) {
      setError('لطفاً شماره موبایل ۱۱ رقمی معتبر با پیش‌شماره ۰۹ وارد کنید.');
      return;
    }

    setStep('otp');
    setTimer(60);
    setCanResend(false);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otpCode.trim();
    // Accept 11111, 1111 or 1234 for testing
    if (cleanOtp.length < 4 || cleanOtp.length > 5) {
      setError('کد تأیید باید ۴ یا ۵ رقم باشد.');
      return;
    }

    if (cleanOtp !== '11111' && cleanOtp !== '1111' && cleanOtp !== '1234') {
      // In demo mode, accept 11111 or 1111 as requested
      setError('کد تأیید وارد شده نامعتبر است. (کد آزمایشی: ۱۱۱۱۱ یا ۱۱۱۱)');
      return;
    }

    onLoginSuccess(phoneNumber, name.trim() || undefined);
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setError(null);
    setOtpCode('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/60 ring-2 ring-white/15">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">تَـراز</h1>
          <p className="text-xs text-slate-400">مدیریت مالی شخصی، حساب‌ها، بودجه و پردازش هوشمند پیامک بانکی</p>
        </div>

        {/* Auth Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-2xl shadow-black/40 space-y-5">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white">ورود یا ثبت‌نام با شماره موبایل</h2>
                <p className="text-[11px] text-slate-400">برای ورود، شماره همراه خود را وارد کنید.</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">شماره همراه</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="09123456789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      maxLength={11}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white font-mono text-right outline-none transition-all placeholder-slate-600"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    نام و نام‌خانوادگی <span className="text-slate-500 text-[10px]">(اختیاری)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: احسان مرادی"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>دریافت کد تأیید</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">تأیید شماره همراه</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError(null);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    ویرایش شماره
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  کد ۴ رقمی ارسال شده به شماره <span className="font-mono text-slate-200">{phoneNumber}</span> را وارد کنید.
                </p>
              </div>

              {/* Demo Hint Banner */}
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>کد آزمایشی: <strong className="font-mono text-white text-sm">11111</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode('11111')}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[10px] font-bold cursor-pointer"
                >
                  درج خودکار
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">کد تأیید</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="11111"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                    maxLength={5}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pr-10 pl-4 py-2.5 text-base text-white font-mono tracking-widest text-center outline-none transition-all placeholder-slate-600"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>ارسال مجدد کد</span>
                  </button>
                ) : (
                  <span>ارسال مجدد تا {toPersianDigits(timer)} ثانیه دیگر</span>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ورود به برنامه</span>
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>اطلاعات شما رمزنگاری‌شده و محلی نگهداری می‌شود</span>
          </div>
        </div>
      </div>
    </div>
  );
};
