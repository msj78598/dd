import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const analyzeImage = async (imageFile: File) => {
        setLoading(true);
        setResult(null);

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            setResult("خطأ: مفتاح API غير موجود.");
            setLoading(false);
            return;
        }

        const prompt = `أنت مهندس تدقيق كهربائي. حلل صورة العداد: 
    1. القراءات والشاشة.
    2. تسلسل الفازات (أحمر، أصفر، أزرق).
    3. سلامة القاطع والتوصيلات.
    أعطني تقريراً مباشراً.`;

        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];

                // تم وضع الرابط والنموذج الذي طلبته بالنص هنا
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Data } }] }]
                    })
                });

                const data = await response.json();

                if (data.error) {
                    setResult(`رسالة من السيرفر: ${data.error.message}`);
                } else if (data.candidates && data.candidates[0]) {
                    setResult(data.candidates[0].content.parts[0].text);
                } else {
                    setResult("حدث خطأ في تحليل الصورة من قبل السيرفر.");
                }
                setLoading(false);
            };
        } catch (error) {
            setResult("فشل الاتصال بالسيرفر.");
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result };
};