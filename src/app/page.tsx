"use client";
import { useState, useRef } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { Camera, Video, LayoutDashboard, ChevronLeft, Upload, Mic, ShieldCheck, Zap, Activity, Info } from "lucide-react";

export default function SmartMeterPage() {
    const [mode, setMode] = useState<"none" | "photo" | "live">("none");
    const { analyzeImage, loading, result } = useImageAnalysis();
    const [preview, setPreview] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            analyzeImage(file);
        }
    };

    return (
        <main className="min-h-screen bg-[#020202] text-white font-sans p-6 pb-16" dir="rtl">
            {/* الشريط العلوي الاحترافي */}
            <div className="flex items-center justify-between mb-12 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
                        <Zap size={20} fill="white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-widest text-zinc-300">SMART METER AI</h1>
                        <p className="text-[10px] text-blue-500 font-bold">SUPERVISOR v2.6.5</p>
                    </div>
                </div>
                <ShieldCheck className="text-zinc-600" size={24} />
            </div>

            {mode === "none" && (
                <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold">لوحة التدقيق</h2>
                        <p className="text-zinc-500 text-sm">ابدأ فحص العداد، التوصيلات، والقاطع الرئيسي</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <button onClick={() => setMode("photo")} className="group flex flex-col items-center p-12 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] hover:border-blue-500 transition-all active:scale-95">
                            <Camera size={48} className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                            <span className="text-lg font-bold">تدقيق شامل (صور)</span>
                            <span className="text-[10px] text-zinc-500 mt-2 uppercase tracking-widest">Static Audit</span>
                        </button>

                        <button onClick={() => setMode("live")} className="group flex flex-col items-center p-12 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] hover:border-red-500 transition-all active:scale-95">
                            <Video size={48} className="text-red-500 mb-4 group-hover:scale-110 transition-transform" />
                            <span className="text-lg font-bold text-red-500">مفتش مباشر (فيديو)</span>
                            <span className="text-[10px] text-zinc-500 mt-2 uppercase tracking-widest">Live Response</span>
                        </button>
                    </div>
                </div>
            )}

            {mode !== "none" && (
                <div className="animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={() => { setMode("none"); setPreview(null); }} className="flex items-center gap-2 py-2 px-4 bg-zinc-900 rounded-xl border border-zinc-800 text-sm font-medium">
                            <ChevronLeft size={16} /> العودة
                        </button>
                        <div className="flex items-center gap-2 text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 text-[10px] font-bold">
                            <Activity size={12} className="animate-pulse" />
                            {mode === "photo" ? "تحليل فوتوغرافي" : "بث مباشر تقني"}
                        </div>
                    </div>

                    {mode === "photo" && (
                        <div className="space-y-6">
                            <label className="relative flex flex-col items-center justify-center h-80 border-2 border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-900/30 overflow-hidden cursor-pointer shadow-inner">
                                {preview ? <img src={preview} className="w-full h-full object-cover" /> : <div className="text-center space-y-3"><Upload className="mx-auto text-zinc-600" size={40} /><p className="text-xs text-zinc-500">التقط صورة للعداد والأسلاك</p></div>}
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>

                            {loading && <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex items-center justify-center gap-3 animate-pulse text-blue-400 font-bold text-sm">جارِ التحليل الهندسي الشامل...</div>}

                            {result && (
                                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl space-y-4">
                                    <div className="flex items-center gap-2 text-blue-500 border-b border-zinc-800 pb-3">
                                        <Info size={16} />
                                        <span className="text-[10px] font-black uppercase">Technical Report</span>
                                    </div>
                                    <div className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{result}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "live" && (
                        <div className="space-y-6">
                            <div className="relative rounded-[3rem] overflow-hidden border-4 border-zinc-900 shadow-2xl bg-zinc-900">
                                <video ref={videoRef} autoPlay playsInline className="w-full aspect-[3/4] object-cover" />
                                <div className="absolute top-6 right-6 bg-red-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter animate-pulse shadow-lg">FIELD AUDIT MODE</div>
                            </div>
                            <div className="flex justify-center"><button className="p-10 bg-blue-600 rounded-full shadow-2xl active:scale-75 transition-all"><Mic size={40} /></button></div>
                            <p className="text-center text-zinc-500 text-[10px] font-bold">تحدث مع المفتش حول حالة التوصيلات والعداد</p>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}