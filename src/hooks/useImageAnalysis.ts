import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const resetAnalysis = () => setResult(null);

    const analyzeImage = async (imageFile: File) => {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        const prompt = `أنت مهندس تدقيق كهربائي خبير. حلل الصورة المرفقة بتقرير فني شامل يغطي:
    1. شاشة العداد: القراءات، رموز الخطأ (Error Codes)، وحالة الاتصال بالشبكة.
    2. التوصيلات (الفازات): ترتيب الألوان (أحمر R، أصفر Y، أزرق B) ورصد أي ارتخاء أو تداخل.
    3. القاطع الرئيسي: حالة وضعية المفتاح وسلامة التوصيل الفيزيائي.
    4. الملاحظات الفنية: رصد آثار حرارة، تلاعب بالأختام، أو رطوبة.
    قدم النتائج بنقاط واضحة ومباشرة للفني الميداني.`;

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
            setResult("حدث خطأ في الاتصال بمحرك الفحص الفني.");
        } finally {
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};