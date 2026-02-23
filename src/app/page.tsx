"use client";
import { useState, useRef } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { Scan, Video, Upload, Play, RefreshCw, Zap, Mic, Camera, ShieldCheck } from "lucide-react";

export default function SmartMeterPage() {
    const [activeTab, setActiveTab] = useState<"photo" | "live">("photo");
    const { analyzeImage, loading, result, resetAnalysis } = useImageAnalysis();
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    const startLive = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) { alert("يجب السماح بالوصول للكاميرا"); }
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white p-5 font-sans rtl" dir="rtl">
            <div className="max-w-xl mx-auto">
                <div className="flex items-center justify-between mb-10 border-b border-zinc-800 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Zap size={22} fill="white" /></div>
                        <h1 className="text-xl font-black tracking-tight">SUPERVISOR AI</h1>
                    </div>
                    <ShieldCheck className="text-zinc-700" size={24} />
                </div>

                {/* مبدل التبويبات */}
                <div className="flex p-1 bg-zinc-900 rounded-[1.8rem] border border-zinc-800 mb-8">
                    <button onClick={() => { setActiveTab("photo"); setCameraActive(false); }} className={`flex-1 py-4 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 ${activeTab === "photo" ? "bg-blue-600" : "text-zinc-500"}`}><Scan size={18} /> صور</button>
                    <button onClick={() => { setActiveTab("live"); resetAnalysis(); }} className={`flex-1 py-4 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 ${activeTab === "live" ? "bg-red-600" : "text-zinc-500"}`}><Video size={18} /> بث مباشر</button>
                </div>

                {/* الإطار التقني الموحد */}
                <div className="relative aspect-[3/4] w-full bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl mb-8">
                    {activeTab === "photo" ? (
                        preview ? <img src={preview} className="w-full h-full object-cover" /> :
                            <label className="flex flex-col items-center justify-center h-full cursor-pointer"><Upload size={48} className="text-blue-500 mb-4" /><span className="text-zinc-500 font-bold text-sm">ارفع صورة العداد</span><input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); setPreview(URL.createObjectURL(f)); resetAnalysis(); } }} className="hidden" /></label>
                    ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            {!cameraActive && <button onClick={startCamera} className="absolute bg-red-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl"><Camera size={20} /> تشغيل المفتش المباشر</button>}
                        </div>
                    )}
                </div>

                {/* أزرار التحكم */}
                {activeTab === "photo" && preview && !result && (
                    <button onClick={() => selectedFile && analyzeImage(selectedFile)} disabled={loading} className="w-full py-6 bg-blue-600 rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
                        {loading ? <RefreshCw className="animate-spin" /> : <Play fill="white" />} {loading ? "جارِ التحليل الفني..." : "بـدء الـتـحـلـيـل الـفـنـي"}
                    </button>
                )}

                {/* النتائج */}
                {result && (
                    <div className="bg-zinc-900 p-8 rounded-[2rem] border-t-4 border-blue-600 animate-in slide-in-from-bottom-4">
                        <h3 className="text-blue-500 font-black text-xs uppercase mb-4 tracking-widest">نتائج التدقيق الفني</h3>
                        <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{result}</p>
                    </div>
                )}
            </div>
        </main>
    );
}