"use client";
import { useState, useRef } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import {
    Scan, Video, UploadCloud, Play,
    RefreshCcw, ShieldCheck, Activity,
    Mic, Camera, CheckCircle2, Zap
} from "lucide-react";

export default function SmartMeterPage() {
    // حالة التبويب النشط: إما صورة أو بث مباشر
    const [activeTab, setActiveTab] = useState<"photo" | "live">("photo");

    const { analyzeImage, loading, result, resetAnalysis } = useImageAnalysis();
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);

    // معالجة اختيار الملف
    const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            resetAnalysis();
        }
    };

    // تشغيل الكاميرا يدوياً لضمان عملها
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }, // استخدام الكاميرا الخلفية
                audio: true
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraOn(true);
            }
        } catch (err) {
            alert("يرجى السماح بالوصول للكاميرا والميكروفون");
        }
    };

    // إيقاف الكاميرا عند التبديل
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            setIsCameraOn(false);
        }
    };

    // دالة التبديل بين التبويبات
    const switchTab = (tab: "photo" | "live") => {
        if (tab === "photo") stopCamera();
        setActiveTab(tab);
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white p-4 sm:p-6 font-sans rtl select-none" dir="rtl">
            {/* الهيدر الاحترافي */}
            <div className="flex items-center justify-between mb-8 border-b border-zinc-800/50 pb-5">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 rounded-2xl shadow-lg shadow-blue-900/30">
                        <Zap size={24} fill="white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight">SMART METER AI</h1>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Industrial Supervisor v4.0</p>
                    </div>
                </div>
                <ShieldCheck className="text-zinc-600" size={28} />
            </div>

            {/* منطقة التحكم الرئيسية */}
            <div className="max-w-2xl mx-auto">

                {/* مبدل التبويبات (Tabs Switcher) */}
                <div className="flex p-1 bg-zinc-900/80 rounded-[2rem] border border-zinc-800 mb-6 relative overflow-hidden">
                    <button
                        onClick={() => switchTab("photo")}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.8rem] transition-all duration-300 ${activeTab === "photo" ? "bg-blue-600 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        <Scan size={20} />
                        <span className="font-bold text-sm">تدقيق الصور</span>
                    </button>
                    <button
                        onClick={() => switchTab("live")}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.8rem] transition-all duration-300 ${activeTab === "live" ? "bg-red-600 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        <Video size={20} />
                        <span className="font-bold text-sm">بث مباشر</span>
                    </button>
                </div>

                {/* إطار العرض الموحد (The Main Stage) */}
                <div className="relative w-full aspect-[3/4] bg-zinc-900/50 border-2 border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl mb-6">

                    {/* محتوى وضع الصور */}
                    {activeTab === "photo" && (
                        <div className="w-full h-full animate-in fade-in">
                            {preview ? (
                                <img src={preview} className="w-full h-full object-cover" alt="Meter Preview" />
                            ) : (
                                <label htmlFor="upload-meter" className="flex flex-col items-center justify-center w-full h-full cursor-pointer group hover:bg-zinc-800/50 transition-colors">
                                    <div className="bg-blue-500/10 p-6 rounded-full mb-5 group-hover:scale-110 transition-transform border border-blue-500/20">
                                        <UploadCloud size={40} className="text-blue-500" />
                                    </div>
                                    <span className="text-sm font-black text-zinc-500 uppercase tracking-widest">اضغط لرفع صورة العداد</span>
                                    <input type="file" id="upload-meter" accept="image/*" onChange={handleSelectFile} className="hidden" />
                                </label>
                            )}
                            {preview && (
                                <button onClick={() => setPreview(null)} className="absolute top-6 right-6 bg-black/60 backdrop-blur-md p-3 rounded-full text-white/80 hover:text-white transition-colors">
                                    <RefreshCcw size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* محتوى وضع البث المباشر */}
                    {activeTab === "live" && (
                        <div className="w-full h-full bg-black animate-in fade-in relative">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                            {!isCameraOn && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-sm gap-4">
                                    <button onClick={startCamera} className="flex flex-col items-center gap-4 group">
                                        <div className="bg-red-600 p-6 rounded-full shadow-lg group-active:scale-95 transition-transform">
                                            <Camera size={36} fill="white" />
                                        </div>
                                        <span className="font-bold text-sm">تفعيل الكاميرا الميدانية</span>
                                    </button>
                                </div>
                            )}

                            {isCameraOn && (
                                <>
                                    <div className="absolute top-6 left-6 bg-red-600 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Live Audit</span>
                                    </div>
                                    <div className="absolute bottom-10 inset-x-0 flex justify-center">
                                        <button className="bg-blue-600 p-8 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.5)] active:scale-90 transition-all border-4 border-blue-400/20">
                                            <Mic size={32} fill="white" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* منطقة الأزرار السفلية والنتائج (خاص بوضع الصور) */}
                {activeTab === "photo" && preview && !result && (
                    <button
                        onClick={() => file && analyzeImage(file)}
                        disabled={loading}
                        className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl font-black text-base flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {loading ? (
                            <><Activity className="animate-spin" size={24} /> جـارِ الـتحلـيل الـهندسـي...</>
                        ) : (
                            <><Play size={24} fill="white" /> بــدء الـتـدقـيـق الـفـنـي</>
                        )}
                    </button>
                )}

                {/* عرض النتيجة */}
                {result && activeTab === "photo" && (
                    <div className="bg-zinc-900 border-t-[6px] border-blue-600 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
                            <CheckCircle2 size={20} className="text-green-500" />
                            <span className="text-sm font-black uppercase tracking-wider text-zinc-300">تقرير الفحص المكتمل</span>
                        </div>
                        <div className="text-sm leading-loose text-zinc-300 whitespace-pre-wrap font-medium">
                            {result}
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}