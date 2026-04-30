import os
import sqlite3
import requests
import json
import re
from contextlib import contextmanager
from deep_translator import GoogleTranslator
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import from config
try:
    from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, CHROMA_PATH, DATABASE_PATH
except ImportError:
    # Fallback to environment variables
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_data")
    DATABASE_PATH = os.getenv("DATABASE_PATH", "medibook.db")

from database import get_db, init_database

# ============ CHROMA DB INITIALIZATION (ONCE ONLY) ============
print("🔌 Connecting to ChromaDB...")
chroma_client = chromadb.PersistentClient(path=os.path.join(CHROMA_PATH, "medical_vector_db"))
ef = embedding_functions.DefaultEmbeddingFunction()
collection = chroma_client.get_or_create_collection(
    name="medical_assistant",
    embedding_function=ef
)
print("✅ Connected successfully to ChromaDB!")

# ============ TRANSLATOR INITIALIZATION ============
translator = GoogleTranslator()

# ============ LANGUAGE DETECTION ============
def detect_language(text):
    """Detect if text is Arabic or English"""
    arabic_pattern = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
    
    if arabic_pattern.search(text):
        return 'arabic'
    else:
        return 'english'

# ============ FIXED TRANSLATION FUNCTION ============
def translate_to_english(text):
    """Translate Arabic text to English for vector search"""
    if not text or detect_language(text) != 'arabic':
        return text
    
    try:
        # FIXED: Use 'target' instead of 'dest'
        translator = GoogleTranslator(source='auto', target='en')
        translated = translator.translate(text)
        print(f"   🔄 Internal translation: '{text[:50]}...' → '{translated[:50]}...'")
        return translated
    except Exception as e:
        print(f"   ⚠️ Translation failed: {e}, using original text")
        return text

# ============ GREETING DETECTION ============
def is_greeting_or_non_medical(text, language):
    """Check if user input is just a greeting or non-medical text"""
    
    arabic_non_medical = [
        'اهلا', 'أهلا', 'مرحبا', 'سلام', 'شكرا', 'شكراً', 'الله', 'كيف', 
        'الحال', 'اخبارك', 'صباح', 'مساء', 'بخير', 'تمام', 'حلو', 
        'ماشي', 'طيب', 'نعم', 'لا', 'اه', 'ايوه', 'هلا', 'هلا والله',
        'يعطيك العافية', 'يعطيكم العافية', 'حياك', 'الله يسلمك'
    ]
    
    english_non_medical = [
        'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
        'thanks', 'thank you', 'how are you', 'fine', 'ok', 'okay', 'yes', 'no',
        'good', 'bad', 'well', 'great', 'awesome', 'salam', 'ahlan', 'hey there',
        'whats up', 'howdy', 'greetings', 'yo', 'sup'
    ]
    
    text_lower = text.lower().strip()
    
    if language == 'arabic':
        words = text_lower.split()
        if len(words) <= 3: 
            for greeting in arabic_non_medical:
                if greeting in text_lower:
                    return True
    else:
        words = text_lower.split()
        if len(words) <= 3:  
            for greeting in english_non_medical:
                if greeting in text_lower:
                    return True
    
    return False

def get_greeting_response(language):
    """Return a friendly greeting response without searching database"""
    
    if language == 'arabic':
        return """أهلاً بك! 👋

أنا المساعد الطبي الذكي. أنا هنا لمساعدتك في:
• تحليل الأعراض الأولية
• اقتراح التخصص الطبي المناسب
• توجيهك للحجز في العيادة المناسبة

يرجى كتابة الأعراض التي تعاني منها بالتفصيل، مثل:
• "عندي صداع شديد مع غثيان"
• "عندي طفح جلدي وحكة"
• "ألم في الصدر وصعوبة في التنفس"

كيف يمكنني مساعدتك اليوم؟"""
    
    else:
        return """Welcome! 👋

I'm your AI medical assistant. I'm here to help you with:
• Preliminary symptom analysis
• Suggesting the right medical specialty
• Guiding you to book an appointment

Please describe your symptoms in detail, for example:
• "I have a severe headache with nausea"
• "I have a skin rash and itching"
• "Chest pain and difficulty breathing"

How can I help you today?"""

# ============ PROMPT FUNCTIONS ============
def get_system_prompt(language):
    if language == 'arabic':
        return """أنت مساعد طبي محترف يعمل في منصة حجز عيادات.
ردودك دقيقة، متعاطفة، ومهنية.
تحدث باللغة العربية الفصحى.
قدم نصائح طبية أولية فقط، ولا تقدم تشخيصاً نهائياً."""
    else:
        return """You are a professional medical assistant working for a clinic booking platform.
Your responses are accurate, empathetic, and professional.
Provide preliminary medical guidance only, no definitive diagnosis."""

def get_response_prompt(language, context, disease, severity, specialty, urgency, emergency_warning, user_input, conversation_context=None):
    """
    Build the prompt for AI based on detected language.
    """
    
    context_section = ""
    if conversation_context:
        if language == 'arabic':
            context_section = f"""
**سياق المحادثة السابقة:**
{conversation_context}

"""
        else:
            context_section = f"""
**Conversation Context:**
{conversation_context}

"""
    
    if language == 'arabic':
        emergency_text = ""
        if emergency_warning:
            emergency_text = f"""
🚨 **تحذير عاجل!** 🚨
{urgency}
المرض المحتمل: {disease}

⚠️ هذه حالة طارئة تحتاج تدخل طبي فوري!
"""
        
        severity_desc = ""
        if severity >= 9:
            severity_desc = "🔴 حرجة جداً - طوارئ"
        elif severity >= 7:
            severity_desc = "🟠 عالية - مراجعة عاجلة"
        elif severity >= 4:
            severity_desc = "🟡 متوسطة - مراجعة قريبة"
        else:
            severity_desc = "🟢 بسيطة - متابعة"
        
        return f"""أنت مساعد طبي ذكي يعمل في منصة حجز عيادات.
{context_section}
**المعلومات الطبية المسترجعة:**
{context}

**تحليل الحالة:**
- المرض المحتمل: {disease}
- درجة الخطورة: {severity}/10 ({severity_desc})
- التخصص المطلوب (بالإنجليزية): {specialty}
- حالة الطوارئ: {emergency_text if emergency_text else '✅ لا توجد حالة طوارئ'}

**شكوى المستخدم:** "{user_input}"

**المطلوب منك:**
1. قم بالرد باللغة العربية الفصحى
2. اذكر المرض المحتمل بناءً على المعلومات المقدمة
3. **هام جداً:** عند ذكر التخصص الطبي في ردك، استخدم الاسم الإنجليزي (مثل "Infectious Disease" أو "Cardiology" أو "Pediatrics") حتى لو كان باقي الرد بالعربي
4. إذا كانت درجة الخطورة 7 أو أكثر، ابدأ الرد بتحذير واضح
5. أضف التنويه الإلزامي: "تنبيه: هذا الاستبيان أولي فقط ولا يغني عن استشارة الطبيب المختص."
6. كن متعاطفاً ومهنياً في ردك
7. لا تقدم تشخيصاً نهائياً، فقط توجيهات أولية
8. إذا كان المستخدم يسأل عن الحجز، وجهه لاستخدام زر الحجز الموجود

**الرد:**"""
    
    else:
        emergency_text = ""
        if emergency_warning:
            emergency_text = f"""
🚨 **URGENT WARNING!** 🚨
{urgency}
Potential condition: {disease}

⚠️ This is an emergency that requires immediate medical attention!
"""
        
        severity_desc = ""
        if severity >= 9:
            severity_desc = "🔴 CRITICAL - Emergency"
        elif severity >= 7:
            severity_desc = "🟠 HIGH - Urgent care needed"
        elif severity >= 4:
            severity_desc = "🟡 MODERATE - Schedule soon"
        else:
            severity_desc = "🟢 LOW - Monitor symptoms"
        
        return f"""You are an intelligent medical assistant working for a clinic booking platform.
{context_section}
**Retrieved Medical Information:**
{context}

**Case Analysis:**
- Potential Condition: {disease}
- Severity Level: {severity}/10 ({severity_desc})
- Recommended Specialty: {specialty}
- Emergency Status: {emergency_text if emergency_text else '✅ No emergency detected'}

**User Symptoms:** "{user_input}"

**Instructions:**
1. Respond in English
2. Mention the potential condition based on the provided information
3. Advise the user to consult a doctor in the {specialty} department
4. If severity is 7 or higher, start the response with a clear warning
5. Include this mandatory disclaimer: "Disclaimer: This is a preliminary assessment only and does not replace professional medical advice. Please consult a qualified healthcare provider for proper diagnosis."
6. Be empathetic and professional in your response
7. Do not provide definitive diagnosis, only preliminary guidance
8. If the user asks about booking, direct them to use the booking button

**Response:**"""

# ============ SPECIALTY MAPPING ============
def get_specialty_arabic(specialty):
    arabic_names = {
        'Dermatology': 'جلدية',
        'Neurology': 'مخ وأعصاب',
        'Internal Medicine': 'باطنة',
        'Cardiology': 'قلبية',
        'Gastroenterology': 'جهاز هضمي',
        'Respiratory Medicine': 'صدرية',
        'Orthopedics': 'عظام',
        'Urology': 'مسالك بولية',
        'Ophthalmology': 'عيون',
        'ENT': 'أنف وأذن وحنجرة',
        'Psychiatry': 'نفسية',
        'Infectious Disease': 'أمراض معدية',
        'General Medicine': 'طب عام',
    }
    return arabic_names.get(specialty, 'طب عام')

def map_to_app_specialty(ai_detected):
    """Convert AI detected specialty to match app's dropdown options"""
    if not ai_detected:
        return "Internal Medicine"
    
    val = ai_detected.lower().strip()
    
    mapping = {
        "pediatric": "Pediatrics",
        "pediatrics": "Pediatrics",
        "أطفال": "Pediatrics",
        "اطفال": "Pediatrics",
        "child": "Pediatrics",
        "baby": "Pediatrics",
        "kid": "Pediatrics",
        "internal medicine": "Internal Medicine",
        "internal": "Internal Medicine",
        "باطنة": "Internal Medicine",
        "cardiology": "Cardiology",
        "قلب": "Cardiology",
        "heart": "Cardiology",
        "dermatology": "Dermatology",
        "جلدية": "Dermatology",
        "orthopedics": "Orthopedics",
        "عظام": "Orthopedics",
        "ent": "ENT",
        "neurology": "Neurology",
        "مخ وأعصاب": "Neurology",
        "ophthalmology": "Ophthalmology",
        "عيون": "Ophthalmology",
        "urology": "Urology",
        "gastroenterology": "Gastroenterology",
        "respiratory": "Respiratory Medicine",
        "psychiatry": "Psychiatry",
        "infectious": "Infectious Disease",
        "general medicine": "General Medicine",
        "general": "General Medicine",
    }
    
    for key, target in mapping.items():
        if key in val:
            print(f"🔄 Mapping: '{ai_detected}' → '{target}'")
            return target
    
    return "Internal Medicine"

# ============ URGENCY FUNCTIONS ============
def get_urgency_arabic(score):
    if score >= 9:
        return "🚨 حالة خطيرة جداً - يجب التوجه للطوارئ فوراً!"
    elif score >= 7:
        return "⚠️ حالة عالية الخطورة - يجب مراجعة الطبيب خلال 24 ساعة"
    elif score >= 4:
        return "🟡 حالة متوسطة - يفضل مراجعة الطبيب خلال أسبوع"
    else:
        return "🟢 حالة بسيطة - يمكن مراقبة الأعراض مع استشارة الطبيب عند الحاجة"

def get_urgency_english(score):
    if score >= 9:
        return "🚨 CRITICAL EMERGENCY - Immediate medical attention required!"
    elif score >= 7:
        return "⚠️ HIGH URGENCY - See a doctor within 24 hours"
    elif score >= 4:
        return "🟡 MODERATE URGENCY - Schedule an appointment within a week"
    else:
        return "🟢 LOW URGENCY - Monitor symptoms, consult if persists"

# ============ OPENROUTER CLIENT ============
class OpenRouterClient:
    """Client for OpenRouter API calls"""
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.chat = self
    
    def completions(self):
        return self
    
    def create(self, **kwargs):
        """Create chat completion"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Medical Assistant RAG System",
        }
        
        payload = {
            "model": kwargs.get("model", "openai/gpt-4o"),
            "messages": kwargs.get("messages", []),
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 500)
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=kwargs.get("timeout", 30)
            )
            
            if response.status_code == 200:
                class Response:
                    def __init__(self, data):
                        self.choices = [Choice(data['choices'][0])]
                
                class Choice:
                    def __init__(self, data):
                        self.message = Message(data['message'])
                
                class Message:
                    def __init__(self, data):
                        self.content = data['content']
                
                return Response(response.json())
            else:
                raise Exception(f"API Error: {response.status_code}")
        
        except Exception as e:
            raise Exception(f"OpenRouter Error: {str(e)}")

ai_client = OpenRouterClient(OPENROUTER_API_KEY, OPENROUTER_BASE_URL)

# ============ SMART MEDICAL QUERY ============
def smart_medical_query(user_input, original_language, n_results=3):
    """Query the vector database with automatic Arabic translation"""
    
    if original_language == 'arabic':
        search_query = translate_to_english(user_input)
    else:
        search_query = user_input
    
    results = collection.query(
        query_texts=[search_query],
        n_results=n_results
    )
    
    max_severity = 0
    most_critical_doc = None
    
    if results['metadatas'] and results['metadatas'][0]:
        for i, metadata in enumerate(results['metadatas'][0]):
            severity = metadata.get('severity_score', 0)
            if severity > max_severity:
                max_severity = severity
                most_critical_doc = {
                    'disease': metadata.get('disease', 'Unknown'),
                    'severity': severity,
                    'specialty': metadata.get('specialty', 'General Medicine'),
                    'text': results['documents'][0][i] if results['documents'] else ''
                }
    
    return {
        'results': results,
        'max_severity': max_severity,
        'most_critical': most_critical_doc,
        'emergency_alert': most_critical_doc if max_severity >= 7 else None,
        'recommended_specialty': most_critical_doc['specialty'] if most_critical_doc else 'General Medicine',
        'search_query_used': search_query
    }

# ============ OPENROUTER CALL ============
# تأكد من استيراد المفتاح بشكل صحيح في بداية الملف
from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL

def call_openrouter(prompt, language):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY.strip()}", # استخدام strip لإزالة أي مسافات
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", # ضروري لـ OpenRouter
        "X-Title": "MediBook Assistant",
    }
    
    system_prompt = get_system_prompt(language)
    
    payload = {
        "model": "openai/gpt-4o",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }
    
    try:
        response = requests.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            return f"API Error: {response.status_code}"
    
    except Exception as e:
        return f"Error: {str(e)}"

# ============ INTENT DETECTION ============
from typing import Literal
import functools
import time

IntentType = Literal["greeting", "medical"]

@functools.lru_cache(maxsize=1000)
def check_intent_with_llm(
    user_text: str,
    model: str = "openrouter/google/gemini-2.0-flash-001",
    retry_count: int = 2,
    timeout: int = 5
) -> IntentType:
    """Detect intent using LLM with retry logic"""
    
    user_text = user_text.strip()
    if not user_text:
        return "medical"
    
    # Quick keyword-based check first (for speed)
    pure_greetings_ar = ['اهلا', 'أهلا', 'مرحبا', 'سلام', 'هلا', 'صباح الخير', 'مساء الخير']
    pure_greetings_en = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon']
    
    strong_medical = ['pain', 'ache', 'fever', 'cough', 'symptom', 'hospital', 'doctor', 'مرض', 'ألم', 'علاج']
    
    user_lower = user_text.lower()
    
    # Check for pure greeting (short message)
    if len(user_text.split()) <= 2:
        if any(g in user_lower for g in pure_greetings_ar + pure_greetings_en):
            has_medical = any(m in user_lower for m in strong_medical)
            if not has_medical:
                return "greeting"
    
    # Check for medical keywords
    if any(kw in user_lower for kw in strong_medical):
        return "medical"
    
    # LLM fallback for ambiguous cases
    for attempt in range(retry_count + 1):
        try:
            system_prompt = (
                "Classify the user's message as 'greeting' or 'medical'.\n"
                "Output exactly one word.\n"
                "'greeting': hello, hi, how are you, thanks, welcome, etc.\n"
                "'medical': symptoms, health concerns, pain, fever, medication, etc."
            )
            
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            }
            
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_text}
                ],
                "max_tokens": 10,
                "temperature": 0
            }
            
            response = requests.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=timeout
            )
            
            if response.status_code == 200:
                intent = response.json()['choices'][0]['message']['content'].strip().lower()
                if intent in ["greeting", "medical"]:
                    return intent
                    
        except Exception as e:
            print(f"⚠️ Intent detection attempt {attempt + 1} failed: {e}")
            if attempt == retry_count:
                return "medical"
            time.sleep(0.5)
    
    return "medical"

# ============ GENERATE MEDICAL RESPONSE ============
def generate_medical_response(user_input, conversation_context=None):
    """Generate response with internal translation for Arabic queries"""
    
    user_language = detect_language(user_input)
    print(f"\n🌐 Detected language: {'العربية' if user_language == 'arabic' else 'English'}")
    
    if is_greeting_or_non_medical(user_input, user_language):
        print("👋 Greeting detected - returning friendly response")
        return {
            'success': True,
            'ai_response': get_greeting_response(user_language),
            'language': user_language,
            'is_greeting': True,
            'search_query_used': None,
            'analysis': {
                'disease': 'N/A',
                'severity': 0,
                'specialty': None,
                'urgency': 'N/A',
                'is_emergency': False
            }
        }
    
    print("🔍 Analyzing your symptoms...")
    analysis = smart_medical_query(user_input, user_language)
    
    if analysis.get('most_critical'):
        best_match = analysis['most_critical']
        context = best_match.get('text', 'No specific medical information found')
        disease = best_match.get('disease', 'Unknown condition')
        severity = best_match.get('severity', 0)
        specialty = best_match.get('specialty', 'General Medicine')
        
        if user_language == 'arabic':
            urgency = get_urgency_arabic(severity)
            specialty_display = get_specialty_arabic(specialty)
        else:
            urgency = get_urgency_english(severity)
            specialty_display = specialty
        
        emergency_warning = analysis.get('emergency_alert') is not None
    else:
        context = "No matching disease found in medical database"
        disease = "Not specified" if user_language == 'english' else "غير محدد"
        severity = 0
        specialty = None
        specialty_display = "General Medicine" if user_language == 'english' else "طب عام"
        urgency = get_urgency_arabic(0) if user_language == 'arabic' else get_urgency_english(0)
        emergency_warning = False
    
    # Call with correct parameter order
    prompt = get_response_prompt(
        language=user_language,
        context=context,
        disease=disease,
        severity=severity,
        specialty=specialty_display,
        urgency=urgency,
        emergency_warning=emergency_warning,
        user_input=user_input,
        conversation_context=conversation_context
    )
    
    print("🤖 Generating response with AI...")
    ai_response = call_openrouter(prompt, user_language)
    
    if ai_response and len(ai_response) > 2:
        if ai_response[0] == '"' and ai_response[-1] == '"':
            ai_response = ai_response[1:-1]
    
    return {
        'success': True,
        'ai_response': ai_response,
        'language': user_language,
        'is_greeting': False,
        'search_query_used': analysis.get('search_query_used'),
        'analysis': {
            'disease': disease,
            'severity': severity,
            'specialty': specialty_display if specialty else None,
            'specialty_raw': specialty,
            'urgency': urgency,
            'is_emergency': emergency_warning
        }
    }

# ============ DYNAMIC RESPONSE WITH LLM (FIXED) ============
def generate_dynamic_response_with_llm(conversation_context, user_message, history=None):
    """
    نسخة محسنة وأكثر استقراراً لتصنيف الـ Intent
    """
    if history is None:
        history = []

    user_language = detect_language(user_message)
    user_message = user_message.strip()

    system_prompt = f"""
أنت مصنف ذكي لرسائل المستخدمين في تطبيق حجز عيادات طبية يدعى MediBook.

**صنف الرسالة إلى واحد من الأنواع التالية فقط:**
- "greeting": تحية بسيطة فقط (اهلا، مرحبا، ازيك، شكرا، تمام...).
- "doctor_request": أي طلب يتعلق بحجز أو عرض أطباء أو دكاترة (احجز، دكتور، دكاترة، أطباء، عايز دكتور، قولي الدكاترة، أريني دكاترة...).
- "medical": وصف أعراض أو شكوى صحية (عندي ألم، صداع، كحة، تعبان، وجع...).
- "general": أي سؤال عادي آخر غير طبي (رياضيات، أسئلة عامة، "كنت عايز اسالك سوال", "5*5 بكام"...).

**قواعد صارمة:**
- أي رسالة تحتوي على كلمات "دكتور" أو "دكاترة" أو "احجز" أو "أطباء" → يجب أن تكون "doctor_request" حتى لو فيها تحية.
- إذا كانت الرسالة تحتوي على أعراض طبية → "medical".
- التحيات النقية فقط مثل "اهلا" أو "مرحبا" → "greeting".
- أي سؤال غير طبي (حساب، معلومات عامة) → "general".

**أرجع JSON صالح تماماً بهذا الشكل فقط، بدون أي نص إضافي:**

{{
  "type": "doctor_request",
  "ai_response": "رد ودود ومناسب بالعربية",
  "analysis": {{
    "specialty": "Cardiology"
  }}
}}

إذا لم يكن doctor_request، اجعل "analysis": {{}} 
"""

    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY.strip()}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "MediBook Assistant",
        }

        payload = {
            "model": "openai/gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"الرسالة من المستخدم: {user_message}"}
            ],
            "temperature": 0.05,   # منخفضة جداً للدقة
            "max_tokens": 450,
        }

        response = requests.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=12
        )

        if response.status_code != 200:
            print(f"API Error: {response.status_code}")
            raise Exception(f"Status code: {response.status_code}")

        content = response.json()['choices'][0]['message']['content'].strip()
        print(f"Raw AI output: {content[:400]}...")

        # تحسين استخراج الـ JSON (أقوى)
        import re
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = content

        # تنظيف الـ JSON
        json_str = json_str.strip().replace('\n', ' ').replace('```json', '').replace('```', '')

        result = json.loads(json_str)

        # Default values
        result.setdefault('type', 'general')
        result.setdefault('ai_response', "حاضر، تفضل قولي أكتر عشان أساعدك 👋")

        if not isinstance(result.get('analysis'), dict):
            result['analysis'] = {}

        # تحسين التخصص تلقائياً
        if result.get('type') == 'doctor_request' and not result['analysis'].get('specialty'):
            msg_lower = user_message.lower()
            if 'cardiology' in msg_lower or 'قلب' in msg_lower or 'صدر' in msg_lower:
                result['analysis']['specialty'] = 'Cardiology'
            else:
                result['analysis']['specialty'] = 'Internal Medicine'

        result['success'] = True
        result['language'] = user_language

        print(f"✅ Dynamic LLM decided: type = {result.get('type')} | Specialty = {result['analysis'].get('specialty')}")
        return result

    except Exception as e:
        print(f"❌ Error in generate_dynamic_response_with_llm: {str(e)}")
        if "Expecting" in str(e) or "JSON" in str(e):
            print(f"Problematic content: {content[:500] if 'content' in locals() else 'N/A'}")

        # Fallback قوي
        return {
            'success': True,
            'type': 'general',
            'ai_response': "حاضر، ممكن توضح طلبك أكثر؟ 👋",
            'language': user_language,
            'analysis': {}
        }
# ============ PATIENT HISTORY FUNCTIONS ============
def get_patient_history(patient_id):
    """Get last follow-up record or appointment"""
    if not patient_id:
        return None

    patient_id = str(patient_id).strip()

    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # Check FollowUp_History table first
            cursor.execute('''
                SELECT 
                    last_diagnosis,
                    last_severity,
                    medications,
                    last_symptoms,
                    timestamp,
                    'FollowUp' as source
                FROM FollowUp_History 
                WHERE patient_id = ?
                ORDER BY timestamp DESC LIMIT 1
            ''', (patient_id,))
            
            row = cursor.fetchone()
            if row:
                return dict(row)

            # If no follow-up, get last appointment
            cursor.execute('''
                SELECT 
                    u.specialty as last_specialty,
                    a.date as last_appointment_date,
                    'Appointment' as source
                FROM appointments a
                JOIN users u ON a.doctor_id = u._id
                WHERE a.patient_id = ?
                ORDER BY a._id DESC LIMIT 1
            ''', (patient_id,))
            
            row = cursor.fetchone()
            if row:
                history = dict(row)
                history['last_diagnosis'] = history.get('last_specialty', 'غير محدد')
                history['last_severity'] = 5
                history['last_symptoms'] = 'لا توجد أعراض سابقة'
                return history

            return None

    except Exception as e:
        print(f"⚠️ Error in get_patient_history: {e}")
        return None

def save_session_to_db(patient_id, diagnosis, severity, meds, symptoms):
    """Save follow-up session to database"""
    try:
        with get_db() as conn:   
            cursor = conn.cursor()
            now = datetime.now().isoformat()

            cursor.execute('''
                INSERT INTO FollowUp_History 
                (patient_id, last_diagnosis, last_severity, medications, last_symptoms, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                str(patient_id),
                diagnosis or "غير محدد",
                int(severity) if severity is not None else 5,
                meds or "",
                symptoms.strip(),
                now
            ))
            conn.commit()
            print(f"✅ Saved session for Patient {patient_id}")
    except Exception as e:
        print(f"❌ Error saving session: {e}")

def get_automated_medical_context(patient_id):
    """Get medical context using proper database connection"""
    try:
        # FIXED: Use get_db() instead of direct sqlite3.connect
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT specialty 
                FROM appointments 
                WHERE patient_id = ? 
                ORDER BY appointment_date DESC LIMIT 1
            ''', (patient_id,))
            result = cursor.fetchone()
            if result:
                return result[0]
            return "General"
    except Exception as e:
        print(f"❌ Database Error: {e}")
        return "General"

def generate_vip_personalized_response(patient_id: str, user_input: str):
    """VIP Follow-up with smart comparison and saving"""
    
    if not patient_id or str(patient_id).strip() == "":
        return {
            'success': False, 
            'ai_response': 'عذراً، هذه الخدمة للمرضى المسجلين فقط.',
            'language': detect_language(user_input)
        }

    history = get_patient_history(patient_id)
    user_language = detect_language(user_input)

    if not history:
        return {
            'success': True,
            'ai_response': "مرحباً! 👋 لسه مفيش سجل سابق ليك. لو عندك أي أعراض أو استفسار، وصفها لي وأنا هتابع معاك.",
            'language': user_language,
            'is_vip': True,
            'analysis': {'is_followup': False}
        }

    prev_symptoms = history.get('last_symptoms', 'لا توجد أعراض سابقة')
    specialty = history.get('last_specialty', 'طب عام')
    prev_severity = int(history.get('last_severity', 5))
    final_diagnosis = history.get('last_diagnosis') or specialty or "متابعة أطفال"

    prompt = f"""أنت مدرب طبي شخصي ذكي متخصص في متابعة المرضى في تخصص {specialty}.

**السجل السابق:**
- الأعراض السابقة: {prev_symptoms}
- شدة الأعراض السابقة: {prev_severity}/10
- التشخيص/التخصص: {final_diagnosis}

**كلام المريض دلوقتي:** "{user_input}"

**مهمتك:**
1. قارن الحالة الحالية بالسابقة بوضوح جدًا (تحسنت / مستقرة / تدهورت).
2. لو تحسن → أبرز التحسن وشجع.
3. لو لسه فيه أعراض → اقترح نصيحة بسيطة.
4. لو تدهور → أعطِ تحذير واضح ونصيحة عاجلة.

رد بطريقة ودودة ومهنية.
أنهي الرد بـ:
"تنبيه: هذه متابعة أولية فقط ولا تغني عن زيارة الطبيب المختص."""

    ai_response = call_openrouter(prompt, user_language)

    try:
        save_session_to_db(
            patient_id=str(patient_id),
            diagnosis=final_diagnosis,
            severity=prev_severity,
            meds=history.get('medications', ""),
            symptoms=user_input
        )
    except Exception as e:
        print(f"⚠️ Failed to save session: {e}")

    return {
        'success': True,
        'ai_response': ai_response,
        'language': user_language,
        'is_vip': True,
        'patient_id': patient_id,
        'analysis': {
            'previous_specialty': specialty,
            'previous_symptoms': prev_symptoms,
            'previous_severity': prev_severity,
            'current_diagnosis': final_diagnosis,
            'is_followup': True
        }
    }

# ============ UTILITY FUNCTIONS ============
def build_conversation_context(history, current_message, max_messages=6):
    """Build conversation context from history"""
    if not history:
        return current_message
    
    recent_history = history[-max_messages:]
    context_parts = []
    
    for msg in recent_history:
        if msg.get('suggestedDoctors'):
            continue
        role = "Patient" if not msg.get('isBot', False) else "Assistant"
        text = msg.get('text', '')
        if len(text) > 500:
            text = text[:500] + "..."
        context_parts.append(f"{role}: {text}")
    
    context_parts.append(f"Patient (current): {current_message}")
    context = "\n".join(context_parts)
    
    return f"""Previous conversation:
{context}

Based on the conversation above, analyze the patient's current symptoms."""

def generate_medical_response_with_context(full_context, original_message, history):
    """Generate response with conversation context"""
    return generate_medical_response(original_message, full_context)

def get_response_prompt_with_context(language, context, disease, severity, specialty, urgency, emergency_warning, user_input, full_context):
    """Build prompt with conversation context"""
    return get_response_prompt(
        language, context, disease, severity, 
        specialty, urgency, emergency_warning, user_input, full_context
    )

# Import datetime for timestamp
from datetime import datetime

# ============ FIXED __all__ EXPORTS ============
__all__ = [
    'generate_medical_response',
    'generate_dynamic_response_with_llm',
    'generate_vip_personalized_response',
    'detect_language',
    'is_greeting_or_non_medical',
    'get_greeting_response',
    'smart_medical_query',
    'check_intent_with_llm',
    'get_specialty_arabic',
    'get_urgency_arabic',
    'get_urgency_english',
    'call_openrouter',
    'map_to_app_specialty',
    'build_conversation_context',
    'get_patient_history',
    'get_response_prompt',
    'generate_medical_response_with_context',
    'get_automated_medical_context'
]

# ============ MAIN (for testing) ============
def main():
    print("="*60)
    print("🏥 AI Medical Assistant - Clinic Booking System")
    print("🌐 Multi-Language Support (Arabic / English)")
    print("="*60)
    
    while True:
        print("\n" + "-"*60)
        user_input = input("💬 Enter your symptoms (or 'quit' to exit): ")
        
        if user_input.lower() in ['quit', 'exit', 'q', 'خروج']:
            print("\n👋 Goodbye! Wishing you good health!")
            break
        
        if not user_input.strip():
            print("❌ Please enter symptoms")
            continue
        
        intent = check_intent_with_llm(user_input)
        
        if intent == "greeting":
            lang = detect_language(user_input)
            print("\n🤖 Response:")
            print("-"*60)
            print(get_greeting_response(lang))
            print("-"*60)
            continue
        
        result = generate_medical_response(user_input)
        
        if result['success']:
            if result['analysis'].get('is_emergency'):
                print("\n" + "="*60)
                print("🚨 EMERGENCY ALERT 🚨")
                print("="*60)
                print(result['analysis']['urgency'])
                print("="*60)
            
            print("\n🤖 Response:")
            print("-"*60)
            print(result['ai_response'])
            print("-"*60)
            
            if not result.get('is_greeting', False):
                print(f"\n📋 Analysis:")
                print(f"   • Potential Condition: {result['analysis']['disease']}")
                print(f"   • Severity: {result['analysis']['severity']}/10")
                print(f"   • Specialty: {result['analysis']['specialty']}")
        else:
            print(f"\n❌ Error: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()