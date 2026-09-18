import React, { useState } from 'react';
import {
  Layers,
  CreditCard,
  MessageSquareCode,
  Target,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Compass,
  Check
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      icon: Layers,
      color: 'from-emerald-500 to-teal-500',
      title: 'مدیریت یکپارچه مالی و دارایی‌ها',
      desc: 'ثبت، دسته‌بندی و پایش لحظه‌ای کلیه تراکنش‌های درآمد و هزینه، موجودی حساب‌ها و دارایی‌های نقد و غیرنقد.',
    },
    {
      icon: CreditCard,
      color: 'from-blue-500 to-indigo-500',
      title: 'کارت‌های بانکی شتاب و شماره شبا',
      desc: 'مدیریت و تجمیع تمام کارت‌های بانکی، دسترسی سریع به شماره شبا، شماره حساب و کپی فوری با یک لمس.',
    },
    {
      icon: MessageSquareCode,
      color: 'from-emerald-500 to-cyan-500',
      title: 'پردازش هوشمند پیامک بانکی',
      desc: 'استخراج خودکار مبلغ، واریز/برداشت، مانده، نام فروشگاه و تاریخ بدون نیاز به اینترنت و بدون ارسال داده به سرور.',
    },
    {
      icon: Target,
      color: 'from-amber-500 to-orange-500',
      title: 'بودجه‌بندی هوشمند و کنترل هزینه‌ها',
      desc: 'تعیین سقف هزینه ماهانه، ثبت بدهی و طلب‌های شخصی و هشدارهای خودکار قبل از سررسید اقساط و قبوض.',
    },
    {
      icon: ShieldCheck,
      color: 'from-purple-500 to-pink-500',
      title: 'امنیت آفلاین و رمزنگاری محلی',
      desc: 'کلیه اطلاعات مالی شما صرفاً در مرورگر و دستگاه خودتان به صورت رمزنگاری‌شده ذخیره می‌شود و هیچ واسطه‌ای به آن دسترسی ندارد.',
    },
  ];

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleStartTourAndClose = () => {
    onClose();
    setTimeout(() => {
      onStartTour();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-black/60 overflow-hidden space-y-6">
        {/* Slide Visual Icon */}
        <div className="text-center space-y-4">
          <div
            className={`w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr ${slide.color} flex items-center justify-center shadow-lg shadow-black/40 ring-1 ring-white/20`}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-white tracking-tight">{slide.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">{slide.desc}</p>
          </div>
        </div>

        {/* Step Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? 'w-6 bg-emerald-400' : 'w-1.5 bg-slate-800 hover:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2">
            {currentSlide > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>قبلی</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-300 text-xs font-medium cursor-pointer transition-colors"
              >
                رد کردن
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
            >
              <span>{currentSlide === slides.length - 1 ? 'شروع کار' : 'بعدی'}</span>
              {currentSlide === slides.length - 1 ? <Check className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Start Tour Option */}
          <button
            type="button"
            onClick={handleStartTourAndClose}
            className="w-full py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>شروع تور تعاملی راهنمای برنامه</span>
          </button>
        </div>
      </div>
    </div>
  );
};
