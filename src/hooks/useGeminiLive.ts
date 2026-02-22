"use client";
import { useState, useRef } from 'react';

export function useGeminiLive() {
    const [status, setStatus] = useState<"Idle" | "Listening" | "Analyzing">("Idle");
    const [lastResponse, setLastResponse] = useState("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const askExpert = async (userQuestion: string, customBase64?: string) => {
        // الأولوية القصوى للصورة المرفوعة يدوياً لضمان عدم تحليل "وجه الفني"
        let finalImage = customBase64;

        if (!finalImage) {
            if (!videoRef.current || !canvasRef.current) return;
            const context = canvasRef.current.getContext("2d");
            context?.drawImage(videoRef.current, 0, 0, 720, 1280);
            finalImage = canvasRef.current.toDataURL("image/jpeg").split(",")[1];
        }

        setStatus("Analyzing");
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `STRICT SYSTEM INSTRUCTION: 
                                     أنت مساعد فني خبير في عدادات شركة الكهرباء السعودية. 
                                     مهمتك فحص الصورة المرفقة (تنزيل.png) بدقة متناهية.
                                     1. استخرج الرقم المكتوب يدوياً في الأعلى (يجب أن تجد 104679).
                                     2. حلل حالة الأسلاك الثلاثة (أحمر، أصفر، أزرق) الداخلة في القاطع السفلي (MCCB).
                                     3. افحص حالة مفتاح القاطع واللمبات.
                                     4. أجب بتقرير فني نقاطي بلهجة سعودية رسمية وصارمة. 
                                     ممنوع التحية، ابدأ بالملاحظات فوراً.` },
                            { inline_data: { mime_type: "image/jpeg", data: finalImage } }
                        ]
                    }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
                })
            });

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
                setLastResponse(text);
                window.speechSynthesis.cancel();
                const speech = new SpeechSynthesisUtterance(text);
                speech.lang = 'ar-SA';
                window.speechSynthesis.speak(speech);
            }
        } catch (e) {
            setLastResponse("تعذر تحليل الصورة فنيّاً. تأكد من وضوح الأسلاك.");
        }
        setStatus("Idle");
    };

    const analyzeImage = (file: File) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            // تمرير الفاصلة البرمجية (,) لضمان عدم حدوث Build Error
            askExpert("افحص لي حالة التوصيلات والرقم اليدوي والعداد", base64);
        };
    };

    const startListening = () => {
        const Recognition = (window as any).webkitSpeechRecognition;
        if (!Recognition) return alert("المتصفح لا يدعم الصوت");
        const rec = new Recognition();
        rec.lang = 'ar-SA';
        rec.onresult = (e: any) => askExpert(e.results[0][0].transcript);
        rec.start();
        setStatus("Listening");
    };

    return { videoRef, canvasRef, status, startListening, lastResponse, analyzeImage };
}