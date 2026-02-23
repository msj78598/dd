import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    // هذه هي الدالة التي كانت مفقودة وسببت الخطأ!
    const resetAnalysis = () => setResult(null);

    const analyzeImage = async (imageFile: File) => {
        setLoading(true);
        setResult(null);

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            setResult("❌ خطأ: مفتاح API غير موجود.");
            setLoading(false);
            return;
        }

        const prompt = `أنت مهندس تدقيق كهربائي خبير في مشروع Smart Meter AI Supervisor. حلل صورة العداد هذه بدقة:
    1. شاشة العداد: استخرج القراءات وأي رموز خطأ.
    2. التوصيلات: دقق في تسلسل الفازات (R-Y-B) وسلامة الربط.
    3. الفحص الإنشائي: رصد آثار حرارة أو تفحم.
    4. القاطع: تحقق من وضعية المفتاح.
    قدم تقريراً فنياً نقاطياً ومباشراً باللغة العربية.`;

        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];

                // استخدام الموديل gemini-2.5-flash الذي حددته بالنص
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Data } }] }]
                    })
                });

                const data = await response.json();

                if (data.error) {
                    setResult(`❌ رسالة من السيرفر: ${data.error.message}`);
                } else if (data.candidates && data.candidates[0]) {
                    const text = data.candidates[0].content.parts[0].text;
                    setResult(text);

                    // نطق التقرير آلياً
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'ar-SA';
                    window.speechSynthesis.speak(utterance);
                } else {
                    setResult("⚠️ تعذر استخلاص البيانات. حاول التقاط صورة أوضح.");
                }
                setLoading(false);
            };
        } catch (error) {
            setResult("❌ فشل الاتصال بالسيرفر.");
            setLoading(false);
        }
    };

    // الآن الدالة resetAnalysis موجودة ولن يظهر الخطأ
    return { analyzeImage, loading, result, resetAnalysis };
};