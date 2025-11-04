from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client with OpenRouter base URL
client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

response = client.chat.completions.create(
    model="minimax/minimax-m2:free",  # MiniMax M2 free model
    messages=[{"role": "user", "content": "Scan this resume and give me AES results : N A B I L   C H A I B I  C O M P U T E R   E N G I N E E R  F U L L   S T A C K   D E V E L O P M E N T   &   C Y B E R S E C U R I T Y  C O N T A C T   P R O F I L E  Computer   Engineer   specialized   in   full-stack   development   and  cybersecurity, with strong expertise in designing and deploying modern,   secure   web   applications.   Passionate   about   innovative technologies,   I   have   led   complex   projects   ranging   from   HR management platforms to IT security audits. Curious, proactive, and solution-oriented, I thrive in dynamic and agile teams.  itsn.chaibi@gmail.com  +212 659379919   TANGIER  LinkedIn  E D U C A T I O N  P R O F E S S I O N A L E X P E R I E N C E  PROVINCE OF LARACHE – IT SECURITY INTERN  06/2023-08/2023  CONCEPTIFY - FULL STACK DEVELOPER  TE CONNECTIVITY – TE-CONNECT LITE (FYP)  07/2024-09/2024  03/2025 - 08/2025  Developed a modern HR management platform.  Backend: FastAPI (Python), SQLAlchemy, PostgreSQL, JWT Auth, Face Recognition (OpenCV, dlib).  Frontend: Angular (TypeScript), Tailwind CSS, Chart.js.  Architecture: REST API + SPA, deployed with Docker.  Key   features:   RBAC   user   management,   announcements, tasks, leave requests, document management, meetings,  real-time internal messaging, HR chatbot.  Worked in an Agile/Scrum methodology, collaborating with  HR teams to refine requirements.  Built   a   real   estate   website   using   React.js   (frontend)   and Django (backend).  Participated in client meetings and ensured requirements  compliance  Conducted IT systems and data security audits.  Detected   vulnerabilities   (via   Nmap)   and   implemented  security enhancements.  MOROCCAN SCHOOL OF ENGINEERING  SCIENCES (EMSI) - TANGIER  Engineering   Degree   in   Computer  Science and Networks (2022 – 2025)  PREPARATORY CLASSES MP  2019 - 2021  Al Bayrounie TANGIER  I N T E R P E R S O N A L  S K I L L S  Te amwork  Adaptability  Analytical Thinking  Problem-Solving  L A N G U A G E S  C E R T I F I C A T I O N S  English : C1 (fluent)  French : B2 (advanced)  Arabic: C2 (native)  Malware Analysis and Introduction to Assembly Language By IBM Skills Network Team  Building Scalable Java Microservices with Spring Boot and Spring Cloud By Google Cloud  Introduction to Git and GitHub By Google Career Certificates  T E C H N I C A L S K I L L S  LANGAGES  DATABASES  FRAMEWORKS  OPERATING SYSTEMS  CYBERSECURITY  Python, C++, Java, JavaScript/TypeScript, Bash  PostgreSQL, SQL Server, MongoDB  Angular, React, Node.js, Express.js, FastAPI, Django, Spring Boot  Windows, Linux  Nmap, Wireshak, BurpSuite, Metasploit  P R O J E C T S  Vulnerability Testing and Security  Audit Application   (Python, Nmap,  Wireshark)  TE-Connect Lite (FYP, 2025)   – Full-  stack HR platform (Angular, FastAPI,  PostgreSQL, Docker, Face Recognition)  AI Resume Analyzer   – Web application  built with React.js, React Router v7, and  Zustand for global state management  DEVOPS & CLOUD  Docker, Git, Azure"}],
)

print(response.choices[0].message.content)



