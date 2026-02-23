import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const resetAnalysis = () => setResult(null);

    const analyzeImage = async (imageFile: File) => {
        console.log("1. بدء عملية التحليل للملف:", imageFile.name);
        setLoading(true);

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            console.error("خطأ: مفتاح NEXT_PUBLIC_GEMINI_API_KEY غير موجود!");
            setResult("خطأ: لم يتم العثور على مفتاح API في إعدادات Vercel.");
            setLoading(false);
            return;
        }

        const prompt = "أنت مهندس فحص عدادات خبير. حلل الصورة بدقة: افحص شاشة العداد، ترتيب الفازات (أحمر، أصفر، أزرق)، القاطع، وأي علامات تلف أو تلاعب. قدم تقريراً فنياً نقاطياً باللغة العربية.";

        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                console.log("2. تم تحويل الصورة لـ Base64، جارِ الإرسال لـ Gemini...");

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Data } }] }]
                    })
                });

                const data = await response.json();

                if (data.candidates && data.candidates[0]) {
                    const textResponse = data.candidates[0].content.parts[0].text;
                    console.log("3. استلام النتيجة بنجاح ✅");
                    setResult(textResponse);

                    // تشغيل الصوت تلقائياً عند استلام النتيجة
                    const utterance = new SpeechSynthesisUtterance(textResponse);
                    utterance.lang = 'ar-SA';
                    window.speechSynthesis.speak(utterance);
                } else {
                    console.error("خطأ في استجابة الـ API:", data);
                    setResult("لم يتمكن الذكاء الاصطناعي من تحليل الصورة. حاول مرة أخرى.");
                }
            };
        } catch (error) {
            console.error("خطأ تقني:", error);
            setResult("حدث خطأ أثناء الاتصال بالسيرفر.");
        } finally {
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};