"use client";
import { useEffect } from 'react';
import { useGeminiLive } from "@/hooks/useGeminiLive";

export default function Home() {
    const { videoRef, canvasRef, status, startListening, lastResponse, analyzeImage } = useGeminiLive();

    useEffect(() => {
        // تشغيل الكاميرا الخلفية تلقائياً
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; });
    }, []);

    return (
        <main className="flex min-h-screen bg-black text-white p-4 font-sans items-center justify-center">
            <div className="flex flex-col md:flex-row w-full max-w-7xl gap-6 h-[90vh]">

                {/* إطار الفيديو الميداني */}
                <div className="w-full md:w-[40%] rounded-[3rem] border-4 border-blue-600 overflow-hidden bg-zinc-950 relative shadow-2xl shrink-0">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" width="720" height="1280" />
                    <div className="absolute top-8 left-8 bg-red-600 px-4 py-1 rounded-full text-xs font-black animate-pulse uppercase tracking-widest">Live Inspector</div>
                </div>

                {/* لوحة التقارير والتحكم */}
                <div className="w-full md:w-[60%] flex flex-col gap-6 py-4 overflow-hidden">
                    <div className="shrink-0 space-y-2">
                        <h1 className="text-4xl font-black text-blue-500 tracking-tighter uppercase">Smart Meter AI 2.5</h1>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">نظام التدقيق الفني المعتمد للميدان</p>
                    </div>

                    <div className="flex gap-4 shrink-0">
                        <button onClick={startListening} className={`flex-[2] py-8 rounded-[2.5rem] font-black text-2xl transition-all active:scale-95 shadow-2xl ${status === "Listening" ? "bg-green-600 shadow-green-900/50" : "bg-blue-600 shadow-blue-900/50 hover:bg-blue-700"}`}>
                            {status === "Listening" ? "يستمع..." : "🎤 فحص صوتي"}
                        </button>
                        <label className="flex-1 bg-zinc-800 border-2 border-zinc-700 py-8 rounded-[2.5rem] font-black text-xl text-center cursor-pointer hover:bg-zinc-700 transition-all shadow-2xl flex items-center justify-center">
                            📸 ارفع صورة
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && analyzeImage(e.target.files[0])} />
                        </label>
                    </div>

                    {/* منطقة التقرير - تم حل مشكلة انقطاع النص نهائياً */}
                    <div className="flex-1 bg-zinc-900/80 p-10 rounded-[4rem] border border-zinc-800 shadow-inner overflow-y-auto scrollbar-hide relative">
                        <div className="sticky top-0 w-full flex justify-between items-center mb-6 bg-zinc-900/50 backdrop-blur pb-2">
                            <span className="text-blue-500 text-xs font-black uppercase tracking-widest">الملاحظات الفنية للمشرف</span>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            </div>
                        </div>

                        <div className="text-right text-xl leading-[2.2] font-bold text-zinc-100 whitespace-pre-line">
                            {status === "Analyzing" ? "جاري فحص العداد واستخراج البيانات..." : (lastResponse || "الرجاء ارفاق صورة العداد (تنزيل.png) أو البدء بالفحص المباشر.")}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}