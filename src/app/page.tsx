"use client";
import { useState, useRef } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import {
    Scan, Video, ChevronLeft, Upload,
    Play, RefreshCcw, ShieldCheck, Activity,
    Mic, StopCircle, CheckCircle2
} from "lucide-react";

export default function SmartMeterPage() {
    const [mode, setMode] = useState<"none" | "photo" | "live">("none");
    const { analyzeImage, loading, result, resetAnalysis } = useImageAnalysis();
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLive, setIsLive] = useState(false);

    // منطق اختيار الملف
    const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            resetAnalysis(); // تصفير النتائج القديمة فور اختيار صورة جديدة
        }
    };

    // منطق تشغيل الكاميرا (حل مشكلة الشاشة السوداء)
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: true
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsLive(true);
            }
        } catch (err) {
            alert("يرجى السماح بالوصول للكاميرا والميكروفون للفحص الميداني");
        }
    };

    return (
        <main className="min-h-screen bg-[#000] text-[#fff] p-6 pb-24 font-sans rtl" dir="rtl">
            {/* الهيدر الرسمي */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
                        <Scan size={22} color="white" strokeWidth={3} />
                    </div>
                    <h1 className="text-sm font-black tracking-tighter">SMART METER AI <span className="text-blue-500 text-[10px] block">SUPERVISOR v3.5</span></h1>
                </div>
                <ShieldCheck className="text-zinc-700" size={24} />
            </div>

            {mode === "none" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <button onClick={() => setMode("photo")} className="w-full flex items-center justify-between p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem]">
                        <div className="flex items-center gap-6">
                            <div className="bg-blue-500/10 p-5 rounded-2xl"><Scan size={32} className="text-blue-500" /></div>
                            <div className="text-right"><span className="text-lg font-bold block">تدقيق الصور</span><span className="text-[10px] text-zinc-600 uppercase">Static Audit</span></div>
                        </div>
                        <ChevronLeft size={20} className="text-zinc-700" />
                    </button>
                    <button onClick={() => setMode("live")} className="w-full flex items-center justify-between p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem]">
                        <div className="flex items-center gap-6">
                            <div className="bg-red-500/10 p-5 rounded-2xl"><Video size={32} className="text-red-500" /></div>
                            <div className="text-right"><span className="text-lg font-bold block text-red-500">المفتش المباشر</span><span className="text-[10px] text-zinc-600 uppercase">Live Stream</span></div>
                        </div>
                        <ChevronLeft size={20} className="text-zinc-700" />
                    </button>
                </div>
            )}

            {mode !== "none" && (
                <div className="animate-in fade-in">
                    <button onClick={() => { setMode("none"); setPreview(null); setIsLive(false); resetAnalysis(); }} className="mb-8 flex items-center gap-2 py-2 px-5 bg-zinc-900 rounded-full border border-zinc-800 text-[10px] font-black text-zinc-500">
                        <RefreshCcw size={14} /> العودة للرئيسية
                    </button>

                    {mode === "photo" && (
                        <div className="space-y-6">
                            {/* مربع المعاينة - حجم ثابت للعدادات */}
                            <div className="relative aspect-[3/4] w-full bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl mx-auto">
                                {preview ? <img src={preview} className="w-full h-full object-cover" /> :
                                    <label className="flex flex-col items-center justify-center h-full cursor-pointer"><Upload size={48} className="text-zinc-700 mb-4" /><span className="text-xs font-black text-zinc-600 uppercase tracking-widest">ارفـع صورة العـداد</span><input type="file" accept="image/*" onChange={handleSelectFile} className="hidden" /></label>
                                }
                            </div>

                            {/* زر التحليل - يعمل الآن بربط مباشر */}
                            {preview && !result && (
                                <button
                                    onClick={() => file && analyzeImage(file)}
                                    disabled={loading}
                                    className="w-full py-6 bg-blue-600 rounded-3xl font-black text-sm flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(37,99,235,0.3)] active:scale-95 transition-all"
                                >
                                    {loading ? <><RefreshCcw className="animate-spin" /> جارِ تحليل التوصيلات...</> : <><Play size={20} fill="white" /> بـدء الـتـدقيق الـفني</>}
                                </button>
                            )}

                            {result && (
                                <div className="bg-zinc-900 border-t-4 border-blue-600 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-top-4">
                                    <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase"><CheckCircle2 size={16} /> التقرير مكتمل</div><button onClick={() => { setPreview(null); resetAnalysis(); }} className="text-zinc-600"><RefreshCcw size={12} /></button></div>
                                    <div className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{result}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "live" && (
                        <div className="space-y-6">
                            <div className="relative rounded-[3rem] overflow-hidden border-4 border-zinc-900 aspect-[3/4] shadow-2xl bg-black">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                {!isLive && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90">
                                        <button onClick={startCamera} className="bg-blue-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl"><Video size={20} /> تفعيل الكاميرا الميدانية</button>
                                    </div>
                                )}
                                {isLive && <div className="absolute top-6 left-6 bg-red-600 px-3 py-1.5 rounded-full text-[9px] font-black animate-pulse shadow-lg">LIVE FIELD AUDIT</div>}
                            </div>
                            {isLive && <div className="flex justify-center"><button className="p-10 bg-blue-600 rounded-full shadow-2xl active:scale-75 transition-all"><Mic size={36} color="white" /></button></div>}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}