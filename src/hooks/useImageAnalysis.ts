import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const resetAnalysis = () => setResult(null);

    const analyzeImage = async (imageFile: File) => {
        setLoading(true);
        // التأكد من استخدام المفتاح الصحيح المعتمد في Vercel
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            setResult("❌ خطأ: مفتاح الـ API غير معرف. تأكد من إعدادات Vercel.");
            setLoading(false);
            return;
        }

        // استعادة الأمر الهندسي المفصل الذي كان يعمل بنجاح
        const prompt = `بصفتك مهندس تدقيق كهربائي خبير، حلل صورة العداد هذه بدقة:
    1. شاشة العداد: استخرج القراءات، أيقونة الاتصال، وأي رموز خطأ (Error Codes).
    2. التوصيلات: دقق في ترتيب الفازات (أحمر R، أصفر Y، أزرق B) ورصد أي تداخل أو ارتخاء.
    3. الفحص الإنشائي: رصد آثار حرارة، تفحم، أو تلاعب بالأختام.
    4. القاطع: تحقق من وضعية المفتاح وسلامته.
    قدم تقريراً فنياً نقاطياً مباشراً باللغة العربية.`;

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
                    const textResponse = data.candidates[0].content.parts[0].text;
                    setResult(textResponse);

                    // تفعيل الاستجابة الصوتية للتقرير
                    const utterance = new SpeechSynthesisUtterance(textResponse);
                    utterance.lang = 'ar-SA';
                    window.speechSynthesis.speak(utterance);
                } else {
                    setResult("⚠️ تعذر التحليل. يرجى تحسين إضاءة الصورة والتقاطها من زاوية مقابلة للعداد.");
                }
            };
        } catch (error) {
            setResult("❌ خطأ في الاتصال بمحرك الذكاء الاصطناعي.");
        } finally {
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};