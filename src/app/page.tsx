"use client";
import { useState, useRef } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import {
    Scan, Video, ChevronLeft, Upload,
    Play, RefreshCcw, ShieldCheck, Activity,
    Mic, AlertCircle, CheckCircle2, LayoutGrid
} from "lucide-react";

export default function SmartMeterPage() {
    const [mode, setMode] = useState<"none" | "photo" | "live">("none");
    const { analyzeImage, loading, result, resetAnalysis } = useImageAnalysis();
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            resetAnalysis();
        }
    };

    const executeAnalysis = () => {
        if (file) analyzeImage(file);
    };

    return (
        <main className="min-h-screen bg-[#050505] text-[#f4f4f5] p-6 pb-24 font-sans rtl" dir="rtl">
            {/* Header - Global Branding Style */}
            <div className="flex items-center justify-between mb-12 border-b border-zinc-800/50 pb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-transform hover:scale-105">
                        <Scan size={24} color="white" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-0.5">
                        <h1 className="text-base font-black tracking-tight leading-none text-white">SMART METER AI</h1>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em]">Supervisor v3.0 PRO</p>
                    </div>
                </div>
                <ShieldCheck className="text-zinc-700 hover:text-blue-500 transition-colors" size={26} />
            </div>

            {mode === "none" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="space-y-2 px-2">
                        <h2 className="text-3xl font-extrabold text-white">المركز التقني</h2>
                        <p className="text-zinc-500 text-sm">اختر الأداة المناسبة لبدء عملية التدقيق الهندسي.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <button onClick={() => setMode("photo")} className="group flex items-center justify-between p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] hover:bg-zinc-900 hover:border-blue-500/50 transition-all active:scale-[0.98]">
                            <div className="flex items-center gap-6">
                                <div className="bg-zinc-800 p-5 rounded-2xl group-hover:bg-blue-500/10 transition-colors text-zinc-400 group-hover:text-blue-500"><LayoutGrid size={32} /></div>
                                <div className="text-right">
                                    <span className="text-lg font-black block text-white">التدقيق بالصور</span>
                                    <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Static Frame Audit</span>
                                </div>
                            </div>
                            <ChevronLeft size={20} className="text-zinc-800 group-hover:text-blue-500" />
                        </button>

                        <button onClick={() => setMode("live")} className="group flex items-center justify-between p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] hover:bg-zinc-900 hover:border-red-500/50 transition-all active:scale-[0.98]">
                            <div className="flex items-center gap-6">
                                <div className="bg-zinc-800 p-5 rounded-2xl group-hover:bg-red-500/10 transition-colors text-zinc-400 group-hover:text-red-500"><Video size={32} /></div>
                                <div className="text-right">
                                    <span className="text-lg font-black block text-red-500">المفتش المباشر</span>
                                    <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Real-time Vision</span>
                                </div>
                            </div>
                            <ChevronLeft size={20} className="text-zinc-800 group-hover:text-red-500" />
                        </button>
                    </div>
                </div>
            )}

            {mode !== "none" && (
                <div className="animate-in fade-in duration-500">
                    <button onClick={() => { setMode("none"); setPreview(null); setFile(null); resetAnalysis(); }} className="mb-10 flex items-center gap-2 py-2.5 px-6 bg-zinc-900/80 hover:bg-zinc-800 rounded-full border border-zinc-800 text-[11px] font-black text-zinc-400 uppercase tracking-tighter transition-all">
                        <RefreshCcw size={14} className="rotate-45" /> عودة للرئيسية
                    </button>

                    {mode === "photo" && (
                        <div className="max-w-xl mx-auto space-y-8">
                            {/* المربع الهندسي لمعاينة العداد */}
                            <div className="relative aspect-[3/4] w-full bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-[3.5rem] overflow-hidden shadow-2xl group transition-all">
                                {preview ? (
                                    <>
                                        <img src={preview} className="w-full h-full object-cover animate-in zoom-in-95 duration-500" alt="Meter View" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                        <label htmlFor="re-upload" className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-xl p-4 rounded-full border border-white/10 text-white cursor-pointer active:scale-90 transition-transform">
                                            <Scan size={20} />
                                        </label>
                                    </>
                                ) : (
                                    <label htmlFor="init-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-zinc-800/30 transition-colors group">
                                        <div className="bg-blue-600/10 p-8 rounded-full mb-6 border border-blue-500/10 group-hover:bg-blue-600/20 transition-all"><Upload size={48} className="text-blue-500" /></div>
                                        <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">بـدء رفـع الـبيانات</span>
                                    </label>
                                )}
                                <input type="file" id="init-upload" accept="image/*" onChange={handleSelectFile} className="hidden" />
                                <input type="file" id="re-upload" accept="image/*" onChange={handleSelectFile} className="hidden" />
                            </div>

                            {/* زر التشغيل القوي */}
                            {preview && !result && (
                                <button
                                    onClick={executeAnalysis}
                                    disabled={loading}
                                    className="w-full py-7 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-base flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(37,99,235,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <><Activity className="animate-spin" size={24} /> جارِ التحليل الهندسي الشامل...</>
                                    ) : (
                                        <><Play size={24} fill="currentColor" /> بـدء الـتحـلـيل الـفنـي</>
                                    )}
                                </button>
                            )}

                            {/* تقرير الفحص الفني */}
                            {result && (
                                <div className="bg-zinc-900 border-t-[6px] border-blue-600 rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-top-6 duration-500">
                                    <div className="flex items-center justify-between mb-8 border-b border-zinc-800/50 pb-6">
                                        <div className="flex items-center gap-3 text-green-500 font-black text-[11px] uppercase tracking-widest">
                                            <CheckCircle2 size={18} /> التدقيق مكتمل
                                        </div>
                                        <button onClick={() => { setPreview(null); setFile(null); resetAnalysis(); }} className="text-zinc-600 hover:text-white transition-colors"><RefreshCcw size={16} /></button>
                                    </div>
                                    <div className="text-sm md:text-base leading-relaxed text-zinc-300 whitespace-pre-wrap font-medium report-text">
                                        {result}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}