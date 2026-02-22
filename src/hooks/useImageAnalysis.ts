"use client";
import { useState, useRef } from 'react';

export function useLiveAnalysis() {
    const [status, setStatus] = useState<"Idle" | "Running" | "Thinking">("Idle");
    const [lastResponse, setLastResponse] = useState("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("Running");
    };

    const captureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const context = canvasRef.current.getContext("2d");
        context?.drawImage(videoRef.current, 0, 0, 640, 480);
        const base64Image = canvasRef.current.toDataURL("image/jpeg").split(",")[1];

        setStatus("Thinking");
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        // الموديل الذي تم تأكيده في حسابك
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "حلل هذا الإطار من الفيديو بدقة. استخرج قراءة العداد الرقمية فوراً. أجب بالرقم فقط بالعربية." },
                            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                        ]
                    }]
                })
            });

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
                setLastResponse(text);
                const speech = new SpeechSynthesisUtterance(text);
                speech.lang = 'ar-SA';
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(speech);
            }
        } catch (e) {
            console.error("Analysis failed", e);
        }
        setStatus("Running");
    };

    return { videoRef, canvasRef, status, startCamera, captureAndAnalyze, lastResponse };
}