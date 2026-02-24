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

        // 🧠 البرومبت الجنائي الشامل والمحدث (v5.5) - مدمج مع "نفي السلامة"
        const prompt = `أنت الآن "خبير الفحص الفني" لفحص العدادات الذكية. 
        مهمتك: إصدار قرار هندسي حازم (سليم أم غير سليم) بناءً على بروتوكول "نفي السلامة".

        🎯 مصفوفة فحص حالات (غير سليم) الإلزامية:
        1. العبث الكهربائي: (Bypass مباشر، كباري خلفية، فراغ روزيتا، عكس فازات، Neutral-to-Earth، سرقة نيوترل خارجي، تلاعب بالـ CT أو Shunt).
        2. العبث الفيزيائي: (ثقوب مجهرية، أختام مقصوصة، آثار حرارة/تسخين، تلاعب بالمنفذ البصري، تأثير مغنايسي، ثقوب ليزر في الـ PCB).
        3. الأعطال الفنية: (كربنة/تفحم، انصهار، شاشة مطفأة، أخطاء Err، رطوبة، تآكل كيميائي، تلاعب بمعامل الضرب Multiplier).
        4. التدقيق المقارن: قارن تيار "شاشة العداد" مع تيار "الكلامب ميتر". أي فارق > 2% يعني (غير سليم - اشتباه تلاعب/عطل قياس).
        5. المنطق الهندسي: (تأكد من حالة القاطع، تطابق رقم الاشتراك، وعدم وجود طاقة عكسية 2.8.0).

        ⚠️ هيكلية الرد الإلزامية (ابدأ بالنتيجة فوراً):
        النتيجة النهائية: [سليم ✅ / غير سليم ⚠️ (عبث) / غير سليم 🛠️ (عطل) / غير سليم ❌ (خطر)]
        السبب: (اسم الحالة بدقة)
        التحليل الفني: (سطر واحد يوضح الدليل البصري المرصود).
        التوصية: (الفنية ان وجد ملاحظات اضافية).

        الأسلوب: هندسي، قاطع، خبير جنائي.`;

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