import { useState } from "react";

// 🧠 1. الدستور الهندسي (تعليمات النظام الصارمة)
// تم دمج كل الخبرات الميدانية وقواعد الفحص الجنائي هنا
const SYSTEM_INSTRUCTION = {
    parts: [{
        text: `أنت "كبير مهندسي التدقيق الفني والجنائي للمنظومة الكهربائية". 
مهمتك: فحص الصور بدقة لاستخراج البيانات، كشف التلاعب، ورصد الأعطال بناءً على المعايير الصارمة التالية:

⚠️ البروتوكول الفني والتعليمات التراكمية (إلزامي):

1. بوابة التحقق الهندسية (Safety Gate):
   - إذا كانت الصورة لا تتعلق بالكهرباء، الرد الإلزامي: "⚠️ عذراً، الصورة المرفقة لا تحتوي على مكونات كهربائية قابلة للفحص."

2. استخراج البيانات الإدارية بدقة (OCR):
   - رقم العداد: استخرج الرقم التسلسلي (3 حروف إنجليزية + 13 رقماً = 16 رمزاً) بدقة 100%.
   - سعة القاطع: استخرج قيمة الأمبير (A) المطبوعة (مثل 60A, 100A).

3. التصنيف الذكي لنوع العداد:
   - (محولات تيار CT): إذا وجدت تيار (1.5(6)A) أو رأيت محولات تيار.
   - (مباشر Direct): إذا وجدت تيارات مثل (10(60)A).
   - اذكر النوع فقط في التقرير بصمت.

4. 🚨 بروتوكول التتبع البصري الإلزامي (لمنع الانخداع بالشاشات المطفأة):
   - تحذير: لا تدع انطفاء شاشة العداد يخدعك!
   - تتبع بصرياً الكابلات الداخلة للقاطع والخارجة منه مروراً بالروزيتا.
   - ابحث عن أسلاك تتجاوز العداد (Bypass). إذا وجدت توصيلاً مباشراً، فالنتيجة هي (غير سليم ⚠️ - عبث) حتى لو كانت الشاشة مطفأة.

5. مصفوفة التشخيص الفني:
   - العبث: توصيل مباشر، كباري (جنابر)، عكس فازات.
   - الأعطال: شاشة مطفأة، أسلاك محروقة، فقد جهد، عطل مرابط.
   - العوائق: مسامير تالفة (مبوشة)، ارتفاع عالٍ.

6. معايير التقرير:
   - ابدأ بكلمة "النتيجة النهائية" فوراً. (سليم ✅ / غير سليم ⚠️ (عبث) / غير سليم 🛠️ (عطل فني) / غير سليم 🚧 (عائق))
   - استخدم النقاط (Bullet points)، بدون مقدمات أو ترحيب.`
    }]
};

// ⚙️ 2. محرك التحليل والاتصال بالـ API
export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
    const [savedImageParts, setSavedImageParts] = useState<any[] | null>(null);

    const resetAnalysis = () => {
        setResult(null);
        setChatHistory([]);
        setSavedImageParts(null);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    };

    const analyzeImage = async (imageInput: File | File[]) => {
        setLoading(true);
        setResult(null);
        setChatHistory([]);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const files = Array.isArray(imageInput) ? imageInput : [imageInput];

        try {
            // تحويل الصور إلى Base64
            const imageParts = await Promise.all(
                files.map((file) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = () => {
                        const base64Data = (reader.result as string).split(',')[1];
                        resolve({ inline_data: { mime_type: file.type, data: base64Data } });
                    };
                    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
                }))
            );

            setSavedImageParts(imageParts);

            // 🚀 الاتصال بمحرك Gemini 2.5 Pro بالهيكلية الصحيحة
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: SYSTEM_INSTRUCTION, // التعليمات ككيان منفصل هنا
                    contents: [
                        {
                            parts: [
                                { text: "قم بإجراء الفحص الفني والجنائي للصور المرفقة وإصدار التقرير." },
                                ...imageParts as any[]
                            ]
                        }
                    ],
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ],
                    generationConfig: {
                        temperature: 0, // صفر لمنع الهلوسة وقراءة الأرقام بدقة 
                        maxOutputTokens: 2048
                    }
                })
            });

            const data = await response.json();

            // معالجة أخطاء السيرفر (مثل الكوتا أو المفتاح غير الصحيح)
            if (data.error) {
                console.error("API Error:", data.error);
                setResult(`❌ خطأ تقني من السيرفر: ${data.error.message}`);
                return;
            }

            // عرض النتيجة
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const text = data.candidates[0].content.parts[0].text;
                const inspectionTime = new Date().toLocaleString('ar-SA');
                setResult(`🕒 وقت الفحص: ${inspectionTime}\nــــــــــــــــــــــــــــــــــــــــ\n\n${text}`);
            } else {
                setResult("⚠️ تعذر تحليل الحالة. تأكد من وضوح الصورة وتصوير المكونات بدقة.");
            }
        } catch (error) {
            setResult("❌ فشل الاتصال. تأكد من جودة الإنترنت وصلاحية مفتاح الـ API.");
        } finally {
            setLoading(false);
        }
    };

    const askFollowUp = async (question: string) => {
        if (!savedImageParts || !result || !question.trim()) return;
        setChatLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        setChatHistory((prev) => [...prev, { role: "user", text: question }]);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: "أنت المستشار الفني. أجب باختصار هندسي حاد بناءً على التقرير السابق والصور المرفقة." }] },
                    contents: [
                        { parts: [{ text: `التقرير السابق: "${result}"\nسؤال الفني: "${question}"` }, ...savedImageParts] }
                    ],
                    generationConfig: { temperature: 0.2 } // حرارة منخفضة جداً للإجابة المنطقية
                })
            });

            const data = await response.json();
            const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ لا توجد إجابة فنية واضحة.";
            setChatHistory((prev) => [...prev, { role: "ai", text: aiReply }]);
        } catch (error) {
            setChatHistory((prev) => [...prev, { role: "ai", text: "❌ فشل الاستفسار." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis, askFollowUp, chatHistory, chatLoading };
};