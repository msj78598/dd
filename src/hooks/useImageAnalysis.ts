import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const resetAnalysis = () => setResult(null);

    const analyzeImage = async (imageFile: File) => {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        // تعليمات الخبير الفني لشركة الكهرباء
        const prompt = `بصفتك مهندس تدقيق جودة، حلل صورة العداد هذه بدقة هندسية:
    1. شاشة العداد: استخرج القراءات ورموز الخطأ وحالة الاتصال.
    2. التوصيلات: دقق في تسلسل الفازات (أحمر، أصفر، أزرق) وسلامة الربط.
    3. القاطع: تحقق من وضعيته وسلامته الفيزيائية.
    4. الملاحظات: رصد أي تلاعب أو آثار حرارة أو رطوبة.
    تحدث بلهجة فنية محترفة ومباشرة.`;

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
                setResult(data.candidates[0].content.parts[0].text);
            };
        } catch (error) {
            setResult("خطأ: فشل محرك الذكاء الاصطناعي في الاستجابة.");
        } finally {
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};