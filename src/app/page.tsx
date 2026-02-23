"use client";
import { useState, useRef } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import {
    Scan, Video, LayoutGrid, ChevronLeft,
    UploadCloud, Mic, ShieldCheck, Activity,
    Play, RotateCcw, AlertCircle, CheckCircle
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

    return (
        <main className="min-h-screen bg-[#000] text-[#eee] font-sans p-5 pb-16 overflow-x-hidden" dir="rtl">
            {/* Top Professional Navbar */}
            <div className="flex items-center justify-between mb-10 border-b border-zinc-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                        <Scan size={20} color="white" strokeWidth={3} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-tighter text-white">SMART METER AI</h1>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Supervisor v2.8 PRO</p>
                    </div>
                </div>
                <ShieldCheck className="text-zinc-600" size={20} />
            </div>

            {mode === "none" && (
                <div className="space-y-6 animate-in fade-in duration-700">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-white">لوحة التدقيق الميداني</h2>
                        <p className="text-zinc-500 text-xs mt-1">نظام الفحص الفني المعتمد للأصول الكهربائية</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button onClick={() => setMode("photo")} className="flex items-center justify-between p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl active:scale-95 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="bg-zinc-800 p-4 rounded-2xl"><LayoutGrid size={28} className="text-blue-500" /></div>
                                <div className="text-right">
                                    <span className="text-base font-bold block text-white">تدقيق فوتوغرافي</span>
                                    <span className="text-[10px] text-zinc-600 uppercase font-black">Static Photo Audit</span>
                                </div>
                            </div>
                            <ChevronLeft size={18} className="text-zinc-700" />
                        </button>

                        <button onClick={() => setMode("live")} className="flex items-center justify-between p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl active:scale-95 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="bg-zinc-800 p-4 rounded-2xl"><Video size={28} className="text-red-500" /></div>
                                <div className="text-right">
                                    <span className="text-base font-bold block text-white text-red-500">مفتش مباشر</span>
                                    <span className="text-[10px] text-zinc-600 uppercase font-black">Real-time Response</span>
                                </div>
                            </div>
                            <ChevronLeft size={18} className="text-zinc-700" />
                        </button>
                    </div>
                </div>
            )}

            {mode !== "none" && (
                <div className="animate-in fade-in duration-300">
                    <button onClick={() => { setMode("none"); setPreview(null); resetAnalysis(); }} className="mb-8 flex items-center gap-2 text-[11px] font-black text-zinc-500 hover:text-white transition-colors py-2 px-4 bg-zinc-900/50 rounded-full border border-zinc-800">
                        <RotateCcw size={14} /> العودة للرئيسية
                    </button>

                    {mode === "photo" && (
                        <div className="space-y-6">
                            {/* المربع المحسن لمعاينة الصورة - الحجم الآن مناسب للعدادات */}
                            <div className="relative w-full aspect-[4/5] max-h-[450px] bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all">
                                {preview ? (
                                    <img src={preview} className="w-full h-full object-cover" alt="Meter Preview" />
                                ) : (
                                    <label htmlFor="meter-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-zinc-800/50 transition-colors">
                                        <div className="bg-blue-600/10 p-6 rounded-full mb-4 border border-blue-500/10"><UploadCloud size={40} className="text-blue-500" /></div>
                                        <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">ارفـع صورة العـداد</span>
                                    </label>
                                )}
                                <input type="file" id="meter-upload" accept="image/*" onChange={handleSelectFile} className="hidden" />
                            </div>

                            {/* أزرار التحكم التشغيلية */}
                            {preview && !result && (
                                <button
                                    onClick={() => file && analyzeImage(file)}
                                    disabled={loading}
                                    className="w-full py-5 bg-blue-600 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(37,99,235,0.3)] active:scale-95 transition-all"
                                >
                                    {loading ? (
                                        <><Activity className="animate-spin" size={20} /> جارِ التدقيق الهندسي...</>
                                    ) : (
                                        <><Play size={20} fill="white" /> بـدء التحليل الفني</>
                                    )}
                                </button>
                            )}

                            {/* عرض التقارير الفنية الرسمية */}
                            {result && (
                                <div className="bg-zinc-900 border-t-4 border-blue-600 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center justify-between mb-5 border-b border-zinc-800 pb-4">
                                        <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase">
                                            <CheckCircle size={14} /> Inspection Complete
                                        </div>
                                        <button onClick={() => { setPreview(null); setFile(null); resetAnalysis(); }} className="text-[10px] text-zinc-600 font-bold flex items-center gap-1">
                                            <RotateCcw size={12} /> فحص جديد
                                        </button>
                                    </div>
                                    <div className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap font-medium report-text">
                                        {result}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "live" && (
                        <div className="space-y-6">
                            <div className="relative rounded-[3rem] overflow-hidden border-4 border-zinc-900 h-[500px] shadow-inner bg-black">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <div className="absolute top-6 left-6 bg-red-600 px-3 py-1.5 rounded-full text-[9px] font-black animate-pulse shadow-lg">FIELD AUDIT MODE</div>
                            </div>
                            <div className="flex justify-center"><button className="p-10 bg-blue-600 rounded-full shadow-[0_0_50px_rgba(37,99,235,0.4)] active:scale-75 transition-all"><Mic size={36} color="white" /></button></div>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}