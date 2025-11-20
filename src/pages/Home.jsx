import React, { useState } from "react";

function HomePage() {
    const [formData, setFormData] = useState({
        companyName: "",
        applyingAsA: "Experienced",
        coverLetterTone: "Formal",
        jobDescription: "",
        currentResume: ""
    });

    const [geminiResponse, setGeminiResponse] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const parseAndDisplayResponse = (response) => {
        if (!response) return null;
        if (response === 'Generating response, please wait...') {
            return (
                <div className="loading-state">
                    <div className="loading-container">
                        <div className="loading-ring"></div>
                        <div className="loading-ring"></div>
                        <div className="loading-ring"></div>
                    </div>
                    <p className="loading-text">Crafting your personalized content with AI magic...</p>
                    <div className="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            );
        }

        const sections = response.split(/(?=\d+\.\s\*\*)|(?=##\s)|(?=\*\*\d+\.)/);
        
        return (
            <div className="response-sections">
                {sections.map((section, index) => {
                    if (!section.trim()) return null;
                    
                    const isMainSection = /^\d+\.\s\*\*/.test(section.trim()) || /^\*\*\d+\./.test(section.trim());
                    
                    if (isMainSection) {
                        const lines = section.trim().split('\n');
                        const titleLine = lines[0];
                        const content = lines.slice(1).join('\n').trim();
                        const title = titleLine.replace(/^\d+\.\s\*\*/, '').replace(/\*\*$/, '').replace(/^\*\*\d+\./, '').trim();
                        
                        const sectionConfig = {
                            'Tailored Cover Letter': { icon: '✉️', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#667eea' },
                            'Updated Resume Content': { icon: '📄', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#f093fb' },
                            'Keyword Match Analysis': { icon: '🔍', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: '#4facfe' },
                            'ATS Score Estimate': { icon: '📊', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: '#43e97b' }
                        };
                        
                        const config = sectionConfig[title] || { icon: '✨', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: '#fa709a' };
                        
                        return (
                            <div key={index} className="response-section" style={{'--section-color': config.color}}>
                                <div className="section-gradient-bg" style={{background: config.gradient}}></div>
                                <div className="section-header">
                                    <div className="section-icon-wrapper">
                                        <span className="section-icon">{config.icon}</span>
                                    </div>
                                    <h3 className="section-title">{title}</h3>
                                </div>
                                <div className="section-content">
                                    {formatContent(content)}
                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <div key={index} className="response-section">
                                <div className="section-content">
                                    {formatContent(section.trim())}
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
        );
    };

    const formatContent = (content) => {
        if (!content) return null;
        
        return content.split('\n').map((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return <br key={index} />;
            
            if (trimmedLine.startsWith('- ')) {
                return (
                    <div key={index} className="bullet-point">
                        <span className="bullet-icon">◆</span>
                        <span>{trimmedLine.substring(2)}</span>
                    </div>
                );
            }
            
            if (trimmedLine.includes('**')) {
                const parts = trimmedLine.split('**');
                return (
                    <p key={index}>
                        {parts.map((part, partIndex) => 
                            partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part
                        )}
                    </p>
                );
            }
            
            if (trimmedLine.endsWith(':')) {
                return <h4 key={index} className="sub-header">{trimmedLine}</h4>;
            }
            
            return <p key={index}>{trimmedLine}</p>;
        });
    };
    console.log("VITE_GEMINI_API_KEY:", import.meta.env.VITE_GEMINI_API_KEY);

    async function handleGenerateData() {
        console.log("FormDATA: ", formData);
        setIsGenerating(true);
        setGeminiResponse('Generating response, please wait...');
        
        const prompt = `
        You are a professional career coach and resume optimization expert. 
Your task is to generate a personalized cover letter, improve the resume content, 
and provide an ATS (Applicant Tracking System) analysis.

Inputs:
- Company Name: ${formData.companyName}
- Experience Level: ${formData.applyingAsA}  (Fresher / Experienced)
- Job Description: ${formData.jobDescription}
- Current Resume: ${formData.currentResume} (If empty, assume no resume exists and create a draft)
- Preferred Tone: ${formData.coverLetterTone}

Output (format clearly in sections):

1. **Tailored Cover Letter**  
   - Write a professional cover letter addressed to ${formData.companyName}.  
   - Use the specified tone: ${formData.coverLetterTone}.  
   - Highlight relevant skills and experiences based on the job description.  

2. **Updated Resume Content**  
   - Suggest optimized resume summary, bullet points, and skills tailored to ${formData.jobDescription}.  
   - Ensure the content is concise, achievement-focused, and ATS-friendly.  

3. **Keyword Match Analysis**  
   - Extract the most important keywords from the job description.  
   - Check if they exist in the provided resume (if given).  
   - List missing keywords that should be added.  

4. **ATS Score Estimate (0–100)**  
   - Provide a rough ATS match score for the current resume against the job description.  
   - Explain the reasoning briefly (e.g., missing keywords, formatting issues, irrelevant content).  

Ensure the response is structured, clear, and easy to display in a React app. 
        `;
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        const options = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'X-goog-api-key': apiKey
            },
            body: `{"contents":[{"parts":[{"text":"${prompt}"}]}]}`
        };

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            console.log('Generated Gemini Data: ', data.candidates[0].content.parts[0].text);
            setGeminiResponse(data.candidates[0].content.parts[0].text);
        } catch (error) {
            console.error(error);
            setGeminiResponse('Paste your current resume to get optimization suggestions');
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div style={styles.pageWrapper}>
            {/* Mesh Gradient Background */}
            <div style={styles.meshBg}>
                <div style={styles.meshLayer1}></div>
                <div style={styles.meshLayer2}></div>
                <div style={styles.meshLayer3}></div>
                <div style={styles.meshLayer4}></div>
            </div>

            {/* Floating Particles */}
            <div className="particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="particle" style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 15}s`,
                        animationDuration: `${15 + Math.random() * 10}s`
                    }}></div>
                ))}
            </div>

            {/* Glassmorphic Hero Section */}
            <div style={styles.heroSection}>
                <div style={styles.heroGlass}>
                    <div style={styles.heroContent}>
                        <div className="hero-badge">AI-Powered</div>
                        <h1 style={styles.heroTitle}>
                            <span className="gradient-text">Resume Builder</span>
                        </h1>
                        <p style={styles.heroSubtitle}>
                            Transform your career story into a compelling narrative that gets you hired
                        </p>
                        <div style={styles.heroBadges}>
                            <span className="feature-badge">🎯 ATS Optimized</span>
                            <span className="feature-badge">✨ AI-Powered</span>
                            <span className="feature-badge">⚡ Instant Results</span>
                        </div>
                        <div style={styles.heroCredit}>
                            <span>Crafted by</span> <strong>Aishwarya</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div style={styles.container}>
                {/* Glassmorphic Input Form */}
                <div style={styles.formCard} className="glass-card">
                    <div style={styles.cardHeader}>
                        <div className="floating-icon">
                            <div style={styles.headerIconBg}></div>
                            <span style={styles.headerIcon}>📝</span>
                        </div>
                        <h2 style={styles.cardTitle}>Tell Us About Yourself</h2>
                        <p style={styles.cardSubtitle}>Share your details and let AI work its magic</p>
                    </div>

                    <div style={styles.cardBody}>
                        <div style={styles.formGrid}>
                            <div style={styles.formGroup} className="form-group-hover">
                                <label style={styles.label}>
                                    <span style={styles.labelIcon}>🏢</span>
                                    Company Name
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        style={styles.input}
                                        placeholder="Google, Microsoft, Amazon..."
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        className="glass-input"
                                    />
                                </div>
                            </div>

                            <div style={styles.formGroup} className="form-group-hover">
                                <label style={styles.label}>
                                    <span style={styles.labelIcon}>👤</span>
                                    Experience Level
                                </label>
                                <div className="input-wrapper">
                                    <select
                                        style={styles.select}
                                        value={formData.applyingAsA}
                                        onChange={(e) => setFormData({ ...formData, applyingAsA: e.target.value })}
                                        className="glass-input"
                                    >
                                        <option value="Fresher">🌱 Fresher</option>
                                        <option value="Experienced">💼 Experienced</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={styles.formGroup} className="form-group-hover">
                            <label style={styles.label}>
                                <span style={styles.labelIcon}>💬</span>
                                Cover Letter Tone
                            </label>
                            <div style={styles.toneSelector}>
                                {[
                                    { value: 'Formal', emoji: '🎩', label: 'Formal' },
                                    { value: 'Informal', emoji: '😊', label: 'Informal' },
                                    { value: 'Casual', emoji: '✌️', label: 'Casual' }
                                ].map(tone => (
                                    <button
                                        key={tone.value}
                                        type="button"
                                        className={`tone-button ${formData.coverLetterTone === tone.value ? 'tone-active' : ''}`}
                                        onClick={() => setFormData({ ...formData, coverLetterTone: tone.value })}
                                    >
                                        <span className="tone-emoji">{tone.emoji}</span>
                                        <span>{tone.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={styles.formGroup} className="form-group-hover">
                            <label style={styles.label}>
                                <span style={styles.labelIcon}>📋</span>
                                Job Description
                            </label>
                            <div className="input-wrapper">
                                <textarea
                                    style={{...styles.textarea, minHeight: '180px'}}
                                    placeholder="Paste the complete job description here..."
                                    value={formData.jobDescription}
                                    onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                                    className="glass-input"
                                />
                            </div>
                        </div>

                        <div style={styles.formGroup} className="form-group-hover">
                            <label style={styles.label}>
                                <span style={styles.labelIcon}>📄</span>
                                Current Resume
                                <span style={styles.optional}>Optional</span>
                            </label>
                            <div className="input-wrapper">
                                <textarea
                                    style={{...styles.textarea, minHeight: '220px'}}
                                    placeholder="Paste your current resume for optimization suggestions..."
                                    value={formData.currentResume}
                                    onChange={(e) => setFormData({ ...formData, currentResume: e.target.value })}
                                    className="glass-input"
                                />
                            </div>
                        </div>

                        <button
                            className={`generate-button ${isGenerating ? 'generating' : ''}`}
                            onClick={handleGenerateData}
                            disabled={isGenerating}
                        >
                            <span className="button-bg"></span>
                            <span className="button-content">
                                {isGenerating ? (
                                    <>
                                        <span className="button-spinner"></span>
                                        <span>Generating Magic...</span>
                                    </>
                                ) : (
                                    <>
                                        <span style={styles.buttonIcon}>✨</span>
                                        <span>Generate with AI</span>
                                        <span className="button-arrow">→</span>
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Glassmorphic Output Section */}
                {geminiResponse && (
                    <div style={styles.outputCard} className="glass-card output-reveal">
                        <div style={styles.outputHeader}>
                            <div className="success-icon-wrapper">
                                <div className="success-ripple"></div>
                                <span style={styles.outputHeaderIcon}>✨</span>
                            </div>
                            <div>
                                <h2 style={styles.outputTitle}>Your Personalized Results</h2>
                                <p style={styles.outputSubtitle}>AI-crafted content tailored just for you</p>
                            </div>
                        </div>
                        <div style={styles.outputBody}>
                            {parseAndDisplayResponse(geminiResponse)}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                
                * {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                @keyframes meshMove1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30%, -30%) scale(1.1); }
                    66% { transform: translate(-20%, 20%) scale(0.9); }
                }
                
                @keyframes meshMove2 {
                    0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    50% { transform: translate(-30%, 30%) scale(1.2) rotate(180deg); }
                }
                
                @keyframes meshMove3 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20%, 20%) scale(1.15); }
                    75% { transform: translate(-30%, -10%) scale(0.95); }
                }
                
                @keyframes particleFloat {
                    0% { transform: translateY(100vh) scale(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-100vh) scale(1); opacity: 0; }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
                
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes ripple {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(2.4); opacity: 0; }
                }
                
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }

                .particles {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    pointer-events: none;
                }
                
                .particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: white;
                    border-radius: 50%;
                    animation: particleFloat linear infinite;
                    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                }

                .gradient-text {
                    background: linear-gradient(135deg, #fff 0%, #a8dadc 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: gradientShift 3s ease infinite;
                    background-size: 200% 200%;
                }
                
                .hero-badge {
                    display: inline-block;
                    padding: 8px 20px;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 50px;
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    margin-bottom: 24px;
                    animation: pulse 2s ease-in-out infinite;
                }
                
                .feature-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 20px;
                    background: rgba(255, 255, 255, 0.12);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 50px;
                    color: white;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .feature-badge:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }

                .glass-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    animation: slideInUp 0.8s ease-out;
                }
                
                .floating-icon {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                    animation: bounce 3s ease-in-out infinite;
                }
                
                .input-wrapper {
                    position: relative;
                }
                
                .glass-input {
                    background: rgba(255, 255, 255, 0.7) !important;
                    backdrop-filter: blur(10px);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .glass-input:focus {
                    background: rgba(255, 255, 255, 0.95) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.15), 0 0 0 4px rgba(102, 126, 234, 0.1);
                }
                
                .form-group-hover {
                    transition: all 0.3s ease;
                }
                
                .form-group-hover:hover {
                    transform: translateX(4px);
                }

                .tone-button {
                    flex: 1;
                    min-width: 140px;
                    padding: 18px 24px;
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(102, 126, 234, 0.2);
                    border-radius: 16px;
                    color: #334155;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    position: relative;
                    overflow: hidden;
                }
                
                .tone-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                    transition: left 0.5s ease;
                }
                
                .tone-button:hover::before {
                    left: 100%;
                }
                
                .tone-button:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
                    border-color: rgba(102, 126, 234, 0.4);
                }
                
                .tone-emoji {
                    font-size: 24px;
                    transition: transform 0.3s ease;
                }
                
                .tone-button:hover .tone-emoji {
                    transform: scale(1.2) rotate(10deg);
                }
                
                .tone-active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-color: transparent;
                    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
                    transform: scale(1.05);
                }

                .generate-button {
                    width: 100%;
                    padding: 22px 40px;
                    background: transparent;
                    border: none;
                    border-radius: 16px;
                    font-size: 18px;
                    font-weight: 700;
                    cursor: pointer;
                    margin-top: 40px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .button-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    transition: all 0.4s ease;
                    z-index: 1;
                }
                
                .generate-button:hover .button-bg {
                    transform: scale(1.05);
                    box-shadow: 0 15px 50px rgba(102, 126, 234, 0.5);
                }
                
                .button-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: white;
                }
                
                .button-arrow {
                    font-size: 24px;
                    transition: transform 0.3s ease;
                }
                
                .generate-button:hover .button-arrow {
                    transform: translateX(5px);
                }
                
                .generate-button:active {
                    transform: scale(0.98);
                }
                
                .generating {
                    cursor: not-allowed;
                }
                
                .button-spinner {
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .output-reveal {
                    animation: slideInUp 0.8s ease-out;
                }
                
                .success-icon-wrapper {
                    position: relative;
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 8px 30px rgba(67, 233, 123, 0.3);
                }
                
                .success-ripple {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 3px solid #43e97b;
                    animation: ripple 2s ease-out infinite;
                }

                .response-sections {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .response-section {
                    background: white;
                    border-radius: 20px;
                    padding: 0;
                    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    animation: slideInUp 0.6s ease-out;
                }
                
                .response-section::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                    transition: left 0.6s ease;
                }
                
                .response-section:hover::before {
                    left: 100%;
                }

                .response-section:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                }
                
                .section-gradient-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 6px;
                    opacity: 0.8;
                }

                .section-header {
                    padding: 32px 40px 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                
                .section-icon-wrapper {
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                    border-radius: 16px;
                    transition: all 0.3s ease;
                }
                
                .response-section:hover .section-icon-wrapper {
                    transform: scale(1.1) rotate(5deg);
                    background: var(--section-color, #667eea);
                }
                
                .section-icon {
                    font-size: 32px;
                    transition: all 0.3s ease;
                }
                
                .response-section:hover .section-icon {
                    filter: grayscale(0);
                }

                .section-title {
                    font-size: 26px;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0;
                    letter-spacing: -0.5px;
                }

                .section-content {
                    padding: 0 40px 40px;
                    line-height: 1.8;
                }

                .section-content p {
                    margin-bottom: 16px;
                    color: #475569;
                    font-size: 16px;
                    line-height: 1.8;
                }

                .bullet-point {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 14px;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
                    border-radius: 10px;
                    color: #334155;
                    font-size: 15px;
                    line-height: 1.7;
                    transition: all 0.3s ease;
                }
                
                .bullet-point:hover {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
                    transform: translateX(8px);
                    padding-left: 24px;
                }

                .bullet-icon {
                    color: #667eea;
                    font-weight: bold;
                    flex-shrink: 0;
                    font-size: 18px;
                    margin-top: 2px;
                }

                .sub-header {
                    color: #1e293b;
                    font-size: 19px;
                    font-weight: 700;
                    margin: 28px 0 18px 0;
                    padding: 14px 20px;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
                    border-left: 5px solid #667eea;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }
                
                .sub-header:hover {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%);
                    padding-left: 28px;
                }

                .section-content strong {
                    color: #667eea;
                    font-weight: 700;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .loading-state {
                    text-align: center;
                    padding: 80px 20px;
                }
                
                .loading-container {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    margin: 0 auto 40px;
                }
                
                .loading-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 4px solid transparent;
                    border-top-color: #667eea;
                    animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
                }
                
                .loading-ring:nth-child(2) {
                    width: 80%;
                    height: 80%;
                    top: 10%;
                    left: 10%;
                    border-top-color: #764ba2;
                    animation-delay: 0.2s;
                    animation-duration: 1.2s;
                }
                
                .loading-ring:nth-child(3) {
                    width: 60%;
                    height: 60%;
                    top: 20%;
                    left: 20%;
                    border-top-color: #f093fb;
                    animation-delay: 0.4s;
                    animation-duration: 0.9s;
                }

                .loading-text {
                    color: #64748b;
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .loading-dots {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                }
                
                .loading-dots span {
                    width: 12px;
                    height: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 50%;
                    animation: bounce 1.4s ease-in-out infinite;
                }
                
                .loading-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }
                
                .loading-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @media (max-width: 768px) {
                    .hero-badge, .feature-badge {
                        font-size: 12px;
                        padding: 6px 14px;
                    }
                    
                    .response-section {
                        padding: 0;
                    }
                    
                    .section-header {
                        padding: 24px 20px 16px;
                    }
                    
                    .section-content {
                        padding: 0 20px 24px;
                    }
                    
                    .section-title {
                        font-size: 20px;
                    }
                    
                    .tone-button {
                        min-width: 100px;
                        padding: 14px 18px;
                        font-size: 14px;
                    }
                    
                    .tone-emoji {
                        font-size: 20px;
                    }
                    
                    .bullet-point {
                        padding: 10px 12px;
                        font-size: 14px;
                    }
                }

                @media (max-width: 576px) {
                    .tone-selector {
                        flex-direction: column;
                    }
                    
                    .tone-button {
                        width: 100%;
                    }
                    
                    .particle {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}

const styles = {
    pageWrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        position: 'relative',
        overflow: 'hidden',
    },
    meshBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
    },
    meshLayer1: {
        position: 'absolute',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%)',
        top: '-200px',
        left: '-200px',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'meshMove1 25s ease-in-out infinite',
    },
    meshLayer2: {
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(118, 75, 162, 0.3) 0%, transparent 70%)',
        bottom: '-150px',
        right: '-150px',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'meshMove2 20s ease-in-out infinite',
    },
    meshLayer3: {
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(240, 147, 251, 0.25) 0%, transparent 70%)',
        top: '40%',
        right: '10%',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'meshMove3 30s ease-in-out infinite',
    },
    meshLayer4: {
        position: 'absolute',
        width: '700px',
        height: '700px',
        background: 'radial-gradient(circle, rgba(79, 172, 254, 0.2) 0%, transparent 70%)',
        bottom: '20%',
        left: '20%',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'meshMove1 35s ease-in-out infinite reverse',
    },
    heroSection: {
        position: 'relative',
        zIndex: 1,
        padding: '100px 20px 80px',
        textAlign: 'center',
    },
    heroGlass: {
        maxWidth: '900px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '30px',
        padding: '60px 40px',
        boxShadow: '0 20px 80px rgba(0, 0, 0, 0.3)',
    },
    heroContent: {
        maxWidth: '800px',
        margin: '0 auto',
    },
    heroTitle: {
        fontSize: '72px',
        fontWeight: '900',
        color: 'white',
        margin: '0 0 20px 0',
        letterSpacing: '-2px',
        lineHeight: '1.1',
    },
    heroSubtitle: {
        fontSize: '20px',
        color: 'rgba(255, 255, 255, 0.8)',
        margin: '0 0 32px 0',
        fontWeight: '400',
        lineHeight: '1.6',
    },
    heroBadges: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '32px',
    },
    heroCredit: {
        fontSize: '16px',
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '400',
    },
    container: {
        position: 'relative',
        zIndex: 1,
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '0 20px 100px',
    },
    formCard: {
        borderRadius: '30px',
        boxShadow: '0 30px 90px rgba(0, 0, 0, 0.3)',
        marginBottom: '60px',
        overflow: 'hidden',
    },
    cardHeader: {
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        backdropFilter: 'blur(20px)',
        padding: '50px 40px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    headerIconBg: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        opacity: 0.15,
        filter: 'blur(15px)',
    },
    headerIcon: {
        fontSize: '48px',
        position: 'relative',
        zIndex: 2,
    },
    cardTitle: {
        fontSize: '36px',
        fontWeight: '800',
        margin: '0 0 12px 0',
        color: '#1e293b',
        letterSpacing: '-0.5px',
    },
    cardSubtitle: {
        fontSize: '17px',
        color: '#64748b',
        margin: 0,
        fontWeight: '500',
    },
    cardBody: {
        padding: '50px 40px',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '28px',
        marginBottom: '28px',
    },
    formGroup: {
        marginBottom: '28px',
    },
    label: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '16px',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '14px',
        letterSpacing: '-0.2px',
    },
    labelIcon: {
        fontSize: '22px',
    },
    optional: {
        fontSize: '13px',
        fontWeight: '500',
        color: '#94a3b8',
        fontStyle: 'italic',
        marginLeft: '6px',
    },
    input: {
        width: '100%',
        padding: '16px 20px',
        fontSize: '16px',
        border: '2px solid rgba(226, 232, 240, 0.5)',
        borderRadius: '14px',
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        color: '#1e293b',
        fontWeight: '500',
    },
    select: {
        width: '100%',
        padding: '16px 20px',
        fontSize: '16px',
        border: '2px solid rgba(226, 232, 240, 0.5)',
        borderRadius: '14px',
        outline: 'none',
        fontFamily: 'inherit',
        cursor: 'pointer',
        boxSizing: 'border-box',
        color: '#1e293b',
        fontWeight: '500',
    },
    textarea: {
        width: '100%',
        padding: '16px 20px',
        fontSize: '16px',
        border: '2px solid rgba(226, 232, 240, 0.5)',
        borderRadius: '14px',
        outline: 'none',
        fontFamily: 'inherit',
        resize: 'vertical',
        lineHeight: '1.7',
        boxSizing: 'border-box',
        color: '#1e293b',
        fontWeight: '500',
    },
    toneSelector: {
        display: 'flex',
        gap: '14px',
        flexWrap: 'wrap',
    },
    buttonIcon: {
        fontSize: '24px',
    },
    outputCard: {
        borderRadius: '30px',
        boxShadow: '0 30px 90px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
    },
    outputHeader: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 50px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        color: 'white',
    },
    outputHeaderIcon: {
        fontSize: '32px',
    },
    outputTitle: {
        fontSize: '32px',
        fontWeight: '800',
        margin: '0 0 6px 0',
        letterSpacing: '-0.5px',
    },
    outputSubtitle: {
        fontSize: '16px',
        margin: 0,
        opacity: 0.9,
        fontWeight: '400',
    },
    outputBody: {
        padding: '50px',
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.98) 0%, white 100%)',
    },
};

export default HomePage;