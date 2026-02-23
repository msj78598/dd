"use client";
import { useState, useRef } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { Camera, Video, LayoutDashboard, ChevronLeft, Upload, Mic, Loader2 } from "lucide-react";

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

    const startLive = async () => {
        setMode("live");
        // يتم تفعيل البث المباشر هنا بناءً على إعدادات Gemini Live
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 pb-10 font-sans rtl">
            <div className="flex items-center gap-2 mb-8 mt-4">
                <LayoutDashboard className="text-blue-500" />
                <h1 className="text-xl font-bold tracking-tight">SMART METER AI 2.6</h1>
            </div>

            {mode === "none" && (
                <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    <button onClick={() => setMode("photo")} className="flex flex-col items-center p-12 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] active:scale-95 transition-all">
                        <Camera size={54} className="text-blue-500 mb-4" />
                        <span className="text-lg font-bold">فحص فوتوغرافي (صور)</span>
                        <span className="text-xs text-zinc-500 mt-2">تحليل عميق للأسلاك والأرقام</span>
                    </button>

                    <button onClick={startLive} className="flex flex-col items-center p-12 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] active:scale-95 transition-all">
                        <Video size={54} className="text-red-500 mb-4" />
                        <span className="text-lg font-bold text-red-500">المفتش المباشر (فيديو)</span>
                        <span className="text-xs text-zinc-500 mt-2">توجيه صوحي لحظي من Gemini</span>
                    </button>
                </div>
            )}

            {mode !== "none" && (
                <button onClick={() => { setMode("none"); setPreview(null); }} className="mb-6 text-zinc-400 flex items-center gap-1 py-2 px-4 bg-zinc-900 rounded-full border border-zinc-800">
                    <ChevronLeft size={16} /> العودة للرئيسية
                </button>
            )}

            {mode === "photo" && (
                <div className="flex flex-col gap-5 animate-in fade-in">
                    <label className="flex flex-col items-center justify-center h-72 border-2 border-dashed border-zinc-800 rounded-[2rem] bg-zinc-900 cursor-pointer overflow-hidden shadow-2xl">
                        {preview ? <img src={preview} className="w-full h-full object-cover" alt="Preview" /> : <div className="flex flex-col items-center gap-2 text-zinc-500"><Upload size={40} /><span>ارفع صورة العداد</span></div>}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {loading && <div className="p-4 bg-blue-600/10 text-blue-400 rounded-2xl flex items-center justify-center gap-2 border border-blue-500/20"><Loader2 className="animate-spin" /> جارِ الفحص الهندسي العميق...</div>}
                    {result && <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-[1.5rem] text-sm leading-relaxed text-zinc-300 shadow-xl">{result}</div>}
                </div>
            )}

            {mode === "live" && (
                <div className="flex flex-col gap-6 animate-in fade-in">
                    <div className="relative rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-2xl">
                        <video ref={videoRef} autoPlay playsInline className="w-full aspect-[3/4] object-cover bg-zinc-900" />
                        <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full text-[10px] font-bold animate-pulse">LIVE INSPECTOR</div>
                    </div>
                    <div className="flex justify-center"><button className="p-8 bg-blue-600 rounded-full shadow-2xl active:scale-90 transition-transform"><Mic size={32} /></button></div>
                </div>
            )}
        </main>
    );
}