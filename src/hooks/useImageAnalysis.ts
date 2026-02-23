import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const resetAnalysis = () => setResult(null);

    const analyzeImage = async (imageFile: File) => {
        setLoading(true);
        setResult(null);

        // تأكد أن الاسم في Vercel هو NEXT_PUBLIC_GEMINI_API_KEY
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            setResult("❌ خطأ: لم يتم العثور على مفتاح API في النظام.");
            setLoading(false);
            return;
        }

        const prompt = "أنت مهندس فحص كهربائي. حلل الصورة بدقة: ترتيب الفازات (R-Y-B)، سلامة القاطع، وحالة شاشة العداد. قدم تقريراً فنياً نقاطياً موجزاً.";

        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Data } }] }]
                    })
                });

                const data = await response.json();
                if (data.candidates && data.candidates[0]) {
                    setResult(data.candidates[0].content.parts[0].text);
                } else {
                    setResult("⚠️ الرد فارغ. تأكد من جودة الصورة وصلاحية المفتاح.");
                }
            };
        } catch (error) {
            setResult("❌ خطأ تقني في الاتصال بالسيرفر.");
        } finally {
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};