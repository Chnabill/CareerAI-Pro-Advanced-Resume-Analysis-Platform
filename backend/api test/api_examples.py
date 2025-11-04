from openai import OpenAI
import os
import PyPDF2

# Initialize OpenAI client with OpenRouter base URL
client = OpenAI(
    api_key="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",
    base_url="https://openrouter.ai/api/v1"
)

def ask_question(question: str, system_prompt: str = "You are a helpful assistant."):
    """
    Ask a question to the AI model
    
    Args:
        question: The question to ask
        system_prompt: Optional system prompt to set the AI's behavior
    
    Returns:
        The AI's response
    """
    try:
        response = client.chat.completions.create(
            model="minimax/minimax-m2:free",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {e}"


def extract_text_from_pdf(pdf_path: str):
    """
    Extract text from a PDF file
    
    Args:
        pdf_path: Path to the PDF file
    
    Returns:
        Extracted text from the PDF
    """
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        return f"Error extracting PDF: {e}"


def analyze_pdf(pdf_path: str, question: str):
    """
    Analyze a PDF file and answer questions about it
    
    Args:
        pdf_path: Path to the PDF file
        question: Question to ask about the PDF content
    
    Returns:
        The AI's analysis/answer
    """
    # Extract text from PDF
    pdf_text = extract_text_from_pdf(pdf_path)
    
    if pdf_text.startswith("Error"):
        return pdf_text
    
    # Create a prompt with the PDF content
    prompt = f"""Here is the content from a PDF document:

{pdf_text}

Based on this content, please answer the following question:
{question}"""
    
    try:
        response = client.chat.completions.create(
            model="minimax/minimax-m2:free",
            messages=[
                {"role": "system", "content": "You are an expert document analyst. Analyze the provided document and answer questions accurately."},
                {"role": "user", "content": prompt}
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {e}"


def analyze_resume(pdf_path: str):
    """
    Analyze a resume PDF and provide insights
    
    Args:
        pdf_path: Path to the resume PDF file
    
    Returns:
        Analysis of the resume
    """
    pdf_text = extract_text_from_pdf(pdf_path)
    
    if pdf_text.startswith("Error"):
        return pdf_text
    
    prompt = f"""Analyze this resume and provide:
1. Key skills identified
2. Years of experience
3. Education background
4. Strengths
5. Areas for improvement
6. Overall assessment

Resume content:
{pdf_text}"""
    
    try:
        response = client.chat.completions.create(
            model="minimax/minimax-m2:free",
            messages=[
                {"role": "system", "content": "You are an expert HR recruiter and resume analyst. Provide detailed, constructive feedback."},
                {"role": "user", "content": prompt}
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {e}"


def chat_with_context(messages: list):
    """
    Have a multi-turn conversation with context
    
    Args:
        messages: List of message dictionaries with 'role' and 'content'
                 Example: [{"role": "user", "content": "Hello"}]
    
    Returns:
        The AI's response
    """
    try:
        response = client.chat.completions.create(
            model="minimax/minimax-m2:free",
            messages=messages,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {e}"


# ============= EXAMPLES =============

if __name__ == "__main__":
    print("=" * 60)
    print("EXAMPLE 1: Simple Question")
    print("=" * 60)
    answer = ask_question("What is artificial intelligence?")
    print(f"Q: What is artificial intelligence?")
    print(f"A: {answer}\n")
    
    print("=" * 60)
    print("EXAMPLE 2: Question with Custom System Prompt")
    print("=" * 60)
    answer = ask_question(
        "Explain Python in one sentence",
        system_prompt="You are a programming expert who explains things concisely."
    )
    print(f"Q: Explain Python in one sentence")
    print(f"A: {answer}\n")
    
    print("=" * 60)
    print("EXAMPLE 3: Multi-turn Conversation")
    print("=" * 60)
    conversation = [
        {"role": "user", "content": "I'm learning to code. What language should I start with?"},
    ]
    response1 = chat_with_context(conversation)
    print(f"User: {conversation[0]['content']}")
    print(f"AI: {response1}\n")
    
    # Continue the conversation
    conversation.append({"role": "assistant", "content": response1})
    conversation.append({"role": "user", "content": "Why is that better than JavaScript?"})
    response2 = chat_with_context(conversation)
    print(f"User: Why is that better than JavaScript?")
    print(f"AI: {response2}\n")
    
    print("=" * 60)
    print("EXAMPLE 4: Analyze PDF (Uncomment to use)")
    print("=" * 60)
    print("# To analyze a PDF, uncomment the following lines:")
    print("# pdf_path = 'path/to/your/resume.pdf'")
    print("# analysis = analyze_resume(pdf_path)")
    print("# print(analysis)")
    print()
    print("# Or ask specific questions about a PDF:")
    print("# answer = analyze_pdf('path/to/document.pdf', 'What are the main points?')")
    print("# print(answer)")
