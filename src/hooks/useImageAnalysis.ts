import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const resetAnalysis = () => setResult(null);

    const analyzeImage = async (imageInput: File | File[]) => {
        setLoading(true);
        setResult(null);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            setResult("❌ خطأ: لم يتم العثور على مفتاح API.");
            setLoading(false);
            return;
        }

        const files = Array.isArray(imageInput) ? imageInput : [imageInput];

        // 🧠 البرومبت الجنائي المطور (V5.6) - معالجة الفحص الشامل وترتيب الأولويات
        const prompt = `أنت الآن "خبير الفحص الفني للعدادات الذكية" لفحص العدادات الذكية. 
        مهمتك: إصدار قرار هندسي حازم حول سلامة العداد بناءً على بروتوكول "نفي السلامة والفحص الشامل".

        🚨 خطوة الفحص الأولى والأهم (الأسلاك والروزيتا):
        - انظر بدقة مجهرية إلى روزيتا العداد السفلية (Terminal Block). هل هي فارغة؟ هل تدخلها وتخرج منها الكابلات فعلياً؟
        - تتبع مسار الكابلات الخارجة من القاطع (Breaker). هل تذهب للحمل مباشرة لتتجاوز العداد؟
        - إذا كانت الروزيتا فارغة، فهذا العطل هو الأولوية القصوى ويسمى (توصيل مباشر / فراغ الروزيتا).

        🎯 مصفوفة فحص حالات (غير سليم):
        1. العبث الكهربائي (الأعلى خطورة): Bypass مباشر، روزيتا فارغة، كباري خلفية، عكس فازات، Neutral-to-Earth.
        2. العبث الفيزيائي: أختام مقصوصة، غطاء مفقود، ثقوب مجهرية، آثار حرارة.
        3. الأعطال الفنية: كربنة/تفحم، انصهار، شاشة مطفأة، أخطاء Err.
        4. التدقيق المقارن: مطابقة تيار الشاشة مع الكلامب ميتر.

        ⚠️ قاعدة تعدد الأعطال (هام جداً):
        لا تكتفِ باكتشاف خطأ واحد! إذا وجدت عدة أخطاء (مثلاً: روزيتا فارغة + أختام مفقودة)، اذكرها جميعاً ورتبها بحيث يكون الأخطر هو السبب الرئيسي.

        هيكلية الرد الإلزامية:
        النتيجة النهائية: [سليم ✅ / غير سليم ⚠️ (عبث) / غير سليم 🛠️ (عطل) / غير سليم ❌ (خطر)]
        السبب الرئيسي: (اذكر الأخطر أولاً، مثل: توصيل مباشر وفراغ الروزيتا + غياب الأختام)
        التحليل الفني: (اشرح حالة الروزيتا ومسار الأسلاك أولاً، ثم اذكر الملاحظات الظاهرية الأخرى).
        التوصية: (الإجراء الميداني المطلوب فوراً).

        الأسلوب: هندسي، قاطع، خبير جنائي لا يفوته شيء.`;
        try {
            const imageParts = await Promise.all(
                files.map((file) => new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = () => {
                        const base64Data = (reader.result as string).split(',')[1];
                        resolve({ inline_data: { mime_type: file.type, data: base64Data } });
                    };
                }))
            );

            // ⚠️ الحفاظ على إصدار الموديل الذي طلبت: gemini-2.5-flash
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, ...imageParts as any[]] }]
                })
            });

            const data = await response.json();

            if (data.error) {
                setResult(`❌ رسالة من السيرفر: ${data.error.message}`);
            } else if (data.candidates && data.candidates[0]) {
                const text = data.candidates[0].content.parts[0].text;

                const inspectionTime = new Date().toLocaleString('ar-SA', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                });

                const modeTitle = files.length > 1 ? "🔍 نتيجة الفحص الشامل والمقارن" : "⚡ نتيجة الفحص السريع";
                const finalReport = `🕒 وقت الفحص الفعلي: ${inspectionTime}\n${modeTitle}\nــــــــــــــــــــــــــــــــــــــــ\n\n${text}`;

                setResult(finalReport);

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ar-SA';
                window.speechSynthesis.speak(utterance);
            } else {
                setResult("⚠️ تعذر استخلاص القرار الهندسي. تأكد من وضوح الصور.");
            }
            setLoading(false);
        } catch (error) {
            setResult("❌ فشل الاتصال بمحرك الفحص الجنائي.");
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};