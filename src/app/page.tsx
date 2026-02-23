"use client";
import { useState, useRef } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { Camera, Video, LayoutDashboard, ChevronLeft, Upload, Mic, Loader2, ShieldCheck, Zap } from "lucide-react";

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
        <main className="min-h-screen bg-[#050505] text-white p-5 pb-12 font-sans select-none" dir="rtl">
            {/* Header البراندينج */}
            <div className="flex items-center justify-between mb-10 mt-2">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2.5 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                        <Zap size={22} fill="white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight leading-none">SMART METER AI</h1>
                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Supervisor v2.6</span>
                    </div>
                </div>
                <ShieldCheck className="text-zinc-700" size={24} />
            </div>

            {mode === "none" && (
                <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="space-y-1 mb-2">
                        <h2 className="text-2xl font-bold">لوحة المفتش</h2>
                        <p className="text-zinc-500 text-sm">اختر نمط التدقيق الميداني المطلوب</p>
                    </div>

                    <button onClick={() => setMode("photo")} className="group relative flex flex-col items-center p-12 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] hover:bg-zinc-900 transition-all active:scale-95 shadow-2xl">
                        <div className="bg-blue-500/10 p-5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <Camera size={48} className="text-blue-500" />
                        </div>
                        <span className="text-lg font-bold">فحص فوتوغرافي</span>
                        <span className="text-xs text-zinc-500 mt-2">للأسلاك، الأرقام، وحالة العداد الثابتة</span>
                    </button>

                    <button onClick={() => setMode("live")} className="group relative flex flex-col items-center p-12 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] hover:bg-zinc-900 transition-all active:scale-95 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 p-4"><div className="w-2 h-2 bg-red-500 rounded-full animate-ping" /></div>
                        <div className="bg-red-500/10 p-5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <Video size={48} className="text-red-500" />
                        </div>
                        <span className="text-lg font-bold text-red-500">المفتش المباشر</span>
                        <span className="text-xs text-zinc-500 mt-2">بث حي وتفاعل صوتي لحظي مع Gemini</span>
                    </button>
                </div>
            )}

            {mode !== "none" && (
                <div className="animate-in fade-in duration-500">
                    <button onClick={() => { setMode("none"); setPreview(null); }} className="mb-8 text-zinc-400 flex items-center gap-2 py-2.5 px-5 bg-zinc-900 rounded-2xl border border-zinc-800 active:scale-95 transition-all">
                        <ChevronLeft size={18} /> <span className="text-sm font-medium">العودة للرئيسية</span>
                    </button>

                    {mode === "photo" && (
                        <div className="flex flex-col gap-6">
                            <label className="relative flex flex-col items-center justify-center h-80 border-2 border-dashed border-zinc-800 rounded-[3rem] bg-zinc-900/30 cursor-pointer overflow-hidden group shadow-inner">
                                {preview ? (
                                    <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                                        <Upload size={48} />
                                        <span className="font-bold">ارفع أو التقط صورة العداد</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>

                            {loading && (
                                <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex items-center justify-center gap-3 animate-pulse">
                                    <Loader2 className="animate-spin text-blue-500" />
                                    <span className="text-blue-400 font-bold">جارِ التدقيق الهندسي الشامل...</span>
                                </div>
                            )}

                            {result && (
                                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl animate-in slide-in-from-top-4">
                                    <div className="flex items-center gap-2 mb-4 text-blue-500 font-black text-xs uppercase tracking-widest">
                                        <span>التقرير الفني للمفتش الذكي</span>
                                    </div>
                                    <div className="text-sm leading-relaxed text-zinc-300 space-y-2 whitespace-pre-wrap">{result}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "live" && (
                        <div className="flex flex-col gap-6">
                            <div className="relative rounded-[3rem] overflow-hidden border-4 border-zinc-900 shadow-2xl bg-zinc-900">
                                <video ref={videoRef} autoPlay playsInline className="w-full aspect-[3/4] object-cover" />
                                <div className="absolute top-6 right-6 bg-red-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter animate-pulse shadow-lg">LIVE FIELD AUDIT</div>
                            </div>
                            <div className="flex justify-center py-4">
                                <button className="p-10 bg-blue-600 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-75 transition-all">
                                    <Mic size={40} />
                                </button>
                            </div>
                            <p className="text-center text-zinc-500 text-xs">اضغط وتحدث مع المفتش حول حالة التوصيلات</p>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}