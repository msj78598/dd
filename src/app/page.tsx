"use client";
import { useState, useRef } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import {
    Camera, Video, LayoutDashboard, ChevronRight,
    Upload, Mic, ShieldCheck, Zap, PlayCircle,
    RefreshCcw, AlertTriangle, CheckCircle2
} from "lucide-react";

export default function SmartMeterPage() {
    const [mode, setMode] = useState<"none" | "photo" | "live">("none");
    const { analyzeImage, loading, result, resetAnalysis } = useImageAnalysis();
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            resetAnalysis();
        }
    };

    const handleStartAnalysis = () => {
        if (selectedFile) analyzeImage(selectedFile);
    };

    return (
        <main className="min-h-screen bg-[#080808] text-white font-sans rtl p-4" dir="rtl">
            {/* هيدر النظام الرسمي */}
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-8 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg"><Zap size={18} fill="white" /></div>
                    <div>
                        <h1 className="text-xs font-black tracking-widest text-zinc-400">SMART METER AI</h1>
                        <p className="text-[10px] text-blue-500 font-bold uppercase">Supervisor v2.7 PRO</p>
                    </div>
                </div>
                <ShieldCheck className="text-zinc-700" size={20} />
            </div>

            {mode === "none" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="px-2">
                        <h2 className="text-2xl font-bold">لوحة التحكم الميدانية</h2>
                        <p className="text-zinc-500 text-xs mt-1">اختر المهمة المطلوبة لبدء التدقيق الهندسي</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button onClick={() => setMode("photo")} className="flex items-center justify-between p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:bg-zinc-800 transition-all active:scale-95 shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/10 p-4 rounded-2xl"><Camera size={32} className="text-blue-500" /></div>
                                <div className="text-right">
                                    <span className="text-base font-bold block">التدقيق الفوتوغرافي</span>
                                    <span className="text-[10px] text-zinc-500">تحليل الأسلاك، الشاشة والقاطع</span>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-zinc-700" />
                        </button>

                        <button onClick={() => setMode("live")} className="flex items-center justify-between p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:bg-zinc-800 transition-all active:scale-95 shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="bg-red-500/10 p-4 rounded-2xl"><Video size={32} className="text-red-500" /></div>
                                <div className="text-right">
                                    <span className="text-base font-bold block text-red-500">المفتش المباشر</span>
                                    <span className="text-[10px] text-zinc-500">بث حي واستجابة صوتية لحظية</span>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-zinc-700" />
                        </button>
                    </div>
                </div>
            )}

            {mode !== "none" && (
                <div className="animate-in fade-in duration-300">
                    <button onClick={() => { setMode("none"); setPreview(null); setSelectedFile(null); resetAnalysis(); }} className="mb-6 flex items-center gap-2 py-2 px-4 bg-zinc-900 rounded-xl border border-zinc-800 text-[10px] font-bold text-zinc-400">
                        <RefreshCcw size={14} /> العودة للرئيسية
                    </button>

                    {mode === "photo" && (
                        <div className="space-y-6">
                            {/* منطقة رفع ومعاينة الصورة */}
                            <div className="relative h-80 rounded-[2.5rem] bg-zinc-900 border-2 border-dashed border-zinc-800 overflow-hidden shadow-2xl">
                                {preview ? (
                                    <>
                                        <img src={preview} className="w-full h-full object-cover" />
                                        <label htmlFor="change-photo" className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-full border border-white/10 cursor-pointer">
                                            <Camera size={20} />
                                        </label>
                                    </>
                                ) : (
                                    <label htmlFor="upload-photo" className="flex flex-col items-center justify-center w-full h-full cursor-pointer group">
                                        <div className="bg-blue-600/10 p-6 rounded-full group-hover:bg-blue-600/20 transition-all mb-4">
                                            <Upload size={40} className="text-blue-500" />
                                        </div>
                                        <span className="text-sm font-bold text-zinc-400">ارفع أو التقط صورة العداد</span>
                                    </label>
                                )}
                                <input type="file" id="upload-photo" accept="image/*" onChange={onFileChange} className="hidden" />
                                <input type="file" id="change-photo" accept="image/*" onChange={onFileChange} className="hidden" />
                            </div>

                            {/* أزرار التحكم بعد اختيار الصورة */}
                            {preview && !result && (
                                <button
                                    onClick={handleStartAnalysis}
                                    disabled={loading}
                                    className="w-full py-5 bg-blue-600 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.3)] active:scale-95 transition-all"
                                >
                                    {loading ? (
                                        <><RefreshCcw className="animate-spin" size={20} /> جارِ فحص الأجزاء التقنية...</>
                                    ) : (
                                        <><PlayCircle size={24} /> بدء التحليل الهندسي</>
                                    )}
                                </button>
                            )}

                            {/* عرض النتائج بتنسيق فني */}
                            {result && (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-top-4">
                                    <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-4">
                                        <div className="flex items-center gap-2 text-green-500 font-bold text-xs">
                                            <CheckCircle2 size={16} /> مكتمل
                                        </div>
                                        <button onClick={() => { setPreview(null); setSelectedFile(null); resetAnalysis(); }} className="text-[10px] text-zinc-500 flex items-center gap-1">
                                            <RefreshCcw size={12} /> فحص جديد
                                        </button>
                                    </div>
                                    <div className="text-sm leading-relaxed text-zinc-300 space-y-4 whitespace-pre-wrap font-medium">
                                        {result}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "live" && (
                        <div className="space-y-6">
                            <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-zinc-900 shadow-2xl bg-zinc-900 h-[500px]">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <div className="absolute top-6 left-6 bg-red-600 px-3 py-1 rounded-full text-[10px] font-black animate-pulse shadow-lg">LIVE FIELD AUDIT</div>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-10 text-center">
                                    <p className="bg-black/40 backdrop-blur-md py-2 px-4 rounded-full text-[10px] text-zinc-300 border border-white/5 inline-block">وجه الكاميرا ببطء نحو الأجزاء التقنية للعداد</p>
                                </div>
                            </div>
                            <div className="flex justify-center"><button className="p-10 bg-blue-600 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.4)] active:scale-75 transition-all"><Mic size={40} /></button></div>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}