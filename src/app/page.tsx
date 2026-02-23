"use client";
import { useState, useRef, useEffect } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { Scan, Video, UploadCloud, Play, RefreshCcw, Zap, Mic, Camera } from "lucide-react";

export default function SmartMeterPage() {
    const [activeTab, setActiveTab] = useState<"photo" | "live">("photo");
    const { analyzeImage, loading, result, resetAnalysis } = useImageAnalysis();
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log("تم اختيار ملف:", file.name);
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            resetAnalysis();
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white p-6 font-sans rtl" dir="rtl">
            {/* اللوحة العلوية */}
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-5">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/40"><Zap size={24} fill="white" /></div>
                    <h1 className="text-xl font-black">SUPERVISOR AI v4.1</h1>
                </div>

                {/* المبدل (Tabs) */}
                <div className="flex p-1 bg-zinc-900 rounded-[2rem] border border-zinc-800 mb-6">
                    <button onClick={() => setActiveTab("photo")} className={`flex-1 py-4 rounded-[1.8rem] font-bold text-sm flex items-center justify-center gap-2 ${activeTab === "photo" ? "bg-blue-600" : "text-zinc-500"}`}><Scan size={18} /> تدقيق الصور</button>
                    <button onClick={() => setActiveTab("live")} className={`flex-1 py-4 rounded-[1.8rem] font-bold text-sm flex items-center justify-center gap-2 ${activeTab === "live" ? "bg-red-600" : "text-zinc-500"}`}><Video size={18} /> بث مباشر</button>
                </div>

                {/* الإطار الموحد */}
                <div className="relative aspect-[3/4] w-full bg-zinc-900 border-2 border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl mb-8">
                    {activeTab === "photo" ? (
                        preview ? <img src={preview} className="w-full h-full object-cover" /> :
                            <label className="flex flex-col items-center justify-center h-full cursor-pointer"><UploadCloud size={48} className="text-blue-500 mb-4" /><span className="text-zinc-500 font-bold">ارفع صورة العداد</span><input type="file" onChange={handleFile} className="hidden" /></label>
                    ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center text-zinc-700 font-bold">بث المباشر (قيد التطوير)</div>
                    )}
                </div>

                {/* زر التشغيل (الحاسم) */}
                {activeTab === "photo" && preview && !result && (
                    <button
                        onClick={() => selectedFile && analyzeImage(selectedFile)}
                        disabled={loading}
                        className="w-full py-6 bg-blue-600 rounded-3xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <RefreshCcw className="animate-spin" /> : <Play fill="white" />}
                        {loading ? "جارِ التحليل..." : "بـدء الـتـحـلـيـل الـفـنـي"}
                    </button>
                )}

                {/* النتائج المكتوبة */}
                {result && (
                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] border-t-4 border-blue-600 animate-in slide-in-from-bottom-5">
                        <h3 className="text-blue-500 font-black mb-4 text-xs tracking-widest">تقرير المفتش الذكي</h3>
                        <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{result}</p>
                    </div>
                )}
            </div>
        </main>
    );
}