import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const resetAnalysis = () => setResult(null);

    const analyzeImage = async (imageFile: File) => {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        // تعليمات التدقيق الهندسي الشامل
        const prompt = `أنت مهندس تدقيق كهربائي خبير. حلل الصورة المرفقة بتقرير فني نقاطي ومباشر يغطي الأجزاء التالية:
    1. شاشة العداد: قراءة البيانات، حالة أيقونة الشبكة، وتفسير أي رموز خطأ (Error Codes).
    2. التوصيلات (الفازات): تدقيق ترتيب الألوان (أحمر، أصفر، أزرق) ورصد أي ارتخاء، تداخل، أو أسلاك مكشوفة.
    3. الفحص الحراري: رصد أي آثار تفحم أو كربنة أو انصهار في العوازل ونقاط الربط.
    4. القاطع الرئيسي: حالة وضعية المفتاح (ON/OFF) وسلامة القالب الخارجي.
    5. التدقيق الأمني: حالة الأختام ورصد أي علامات عبث أو تلاعب في الجسم الخارجي.`;

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
            setResult("خطأ فني: فشل محرك الذكاء الاصطناعي في الاستجابة.");
        } finally {
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};