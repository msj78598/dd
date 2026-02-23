import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const analyzeImage = async (imageFile: File) => {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        // التعليمات الهندسية الشاملة للتحليل الثابت
        const prompt = `
      أنت الآن "كبير مهندسي الفحص الميداني". قم بإجراء تدقيق فني شامل على صورة العداد الذكي المرفقة:
      
      1. **شاشة العداد (Display Audit)**: 
         - حلل القراءات الرقمية الظاهرة.
         - تحقق من وجود أيقونة الاتصال بالشبكة (Signal) وحالة البطارية.
         - ابحث عن أي رموز خطأ (Error Codes) واشرح معناها الفني فوراً.
      
      2. **التوصيلات والفازات (Phase Integrity)**:
         - دقق في تسلسل الفازات الثلاث بناءً على الألوان (أحمر، أصفر، أزرق).
         - هل يوجد أي تداخل، أسلاك مكشوفة، أو ارتخاء في نقاط الربط؟
         - رصد أي علامات تفحم أو تغير في لون العوازل نتيجة الحرارة العالية.
      
      3. **القاطع الرئيسي (MCCB Inspection)**:
         - تحقق من وضعية مفتاح القاطع (ON/OFF).
         - رصد أي تلف مادي أو تسريب في جسم القاطع.
      
      4. **الملاحظات الفنية العامة**:
         - فحص حالة الأختام (Seals) لمنع التلاعب.
         - رصد أي عوامل بيئية مؤثرة (غبار كثيف، رطوبة، أو آثار مياه).
      
      قدم التقرير بصيغة نقاط مهنية مركزة جداً للمفتش الميداني.
    `;

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
            setResult("خطأ: فشل في الاتصال بمحرك الفحص الهندسي.");
        } finally {
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result };
};