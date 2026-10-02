# 🤖 ST Agent Company

> An AI-powered virtual company where an AI CEO manages specialized AI employees to plan, research, design, develop, test, and deliver projects.

![ST Agent Company](https://img.shields.io/badge/ST-Agent%20Company-111827?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-24+-green?style=for-the-badge&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-Backend-black?style=for-the-badge&logo=express)
![Ollama](https://img.shields.io/badge/Ollama-gpt--oss--120b--cloud-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Experimental-blue?style=for-the-badge)

---

## 🚀 What is ST Agent Company?

**ST Agent Company** is an experimental AI-agent platform designed to work like a virtual company.

Instead of asking one AI to do everything, you give the company a goal.

The **AI CEO** creates a plan, delegates tasks to specialized AI employees, monitors their work, and reviews the results.

```text
                    👤 USER
                       │
                       ▼
                  🧠 AI CEO
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
      CTO          Researcher      Designer
        │              │              │
        ▼              ▼              ▼
   Developer        Research       Visuals
        │
        ▼
      Tester
        │
        ▼
    📦 OUTPUTS



###✨ Features
🧠 AI CEO

The CEO can:

Receive a project goal
Create a task plan
Delegate tasks
Assign specialized employees
Monitor execution
Review employee results
Determine next actions


---



👨‍💻 **AI Employees**
| Employee      | Responsibility                      |
| ------------- | ----------------------------------- |
| 🏢 CTO        | Architecture and technical planning |
| 💻 Developer  | Coding and implementation           |
| 🔎 Researcher | Research and information gathering  |
| 🎨 Designer   | Visual design and image generation  |
| 📢 Marketing  | Marketing content and assets        |
| 🧪 Tester     | Testing and verification            |

--------------------------------------------------------------------------------------

🧪 Project Status

ST Agent Company is currently an experimental project under active development.

The architecture is being developed toward a system where AI employees can:

Plan
 ↓
Delegate
 ↓
Research
 ↓
Design
 ↓
Code
 ↓
Test
 ↓
Review
 ↓
Deliver

AI providers or models may occasionally return errors or have usage limitations.


--------------------


🗺️ Roadmap

Current
 AI CEO
 Employee roles
 Task delegation
 Employee tool system
 Workspace file tools
 Browser tools
 Image-generation tool architecture
 Live company events
 Task tracking
 Conversation tracking
 Output management
 HTML preview
Planned
 More reliable model fallback
 Persistent project memory
 Better task dependency handling
 Parallel employee execution
 Improved browser automation
 Git integration
 Better testing automation
 Project templates
 Agent performance monitoring
 More AI providers
 Company analytics
 Improved UI/UX

-------------------------------------------------------


🤝 Contributing

Contributions, ideas, and experiments are welcome.

Fork the repository
Create a branch
git checkout -b feature/my-feature
Make your changes
Commit them
git commit -m "Add my feature"
Push the branch
git push origin feature/my-feature
Open a Pull Request

-----------------------------------------------------------------

⚠️ Disclaimer

ST Agent Company is an experimental AI-agent project.

AI-generated code, research, designs, and other outputs should be reviewed by a human before being used in production.



-----------------------------------------------------------------


🤖 **AI Model**

ST Agent Company currently uses:

gpt-oss:120b-cloud

through Ollama.

ST Agent Company
       │
       ▼
     Ollama
       │
       ▼
gpt-oss:120b-cloud

The project currently does not require multiple AI providers.

--------------------------------------------------------------------------


👨‍💻 **Creator**

John Nikson

Founder & CEO — ST Group

ST Agent Company is an experimental project exploring how teams of AI agents can collaborate like a software company.

--------------------------------------------------------------------------------------------------------------------------

⭐ Support

If you find the project interesting, consider giving the repository a ⭐ on GitHub.

----------------------------------------------------------------------------------------------------------------------------

🛠️ Agent Tools

AI employees can use tools to perform real work.

Available tools include:

📁 List files
📖 Read files
✍️ Write files
💻 Run approved terminal commands
🌐 Open websites
📸 Browser screenshots
📥 Download assets
🖼️ Generate images

Agents are restricted to the project workspace and only receive tools appropriate for their role.

-----------------------------------------------------------------------------------------------------------------------------


📊 Live Company Dashboard

The dashboard is designed to show the AI company working in real time.

It includes:

📋 Tasks
👥 Team
💬 Conversations
📦 Outputs
⚡ Activity
📈 Task progress
🧠 CEO reviews
🔧 Tool activity

The backend streams company events to the dashboard using Server-Sent Events (SSE).


----------------------------------

📦 Output System

All generated project outputs are stored in:

public/
└── outputs/

Examples:

public/outputs/
├── website.html
├── report.html
├── logo.png
└── research.txt

Generated HTML files can be opened and previewed directly through the application.

---------------------------------------------

🧰 Tech Stack
Backend
Node.js
Express.js
JavaScript
AI
Ollama
gpt-oss:120b-cloud
Frontend
HTML
CSS
JavaScript
Automation
Playwright
Communication
Server-Sent Events (SSE)

---------------------------------------------
📁 Project Structure
ST-Agent-Company/
│
├── ai/
│   └── router.js
│
├── tools/
│   └── agentTools.js
│
├── public/
│   ├── index.html
│   └── outputs/
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── server.js

----------------------------------------------------
⚙️ Installation
1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ST-Agent-Company.git
cd ST-Agent-Company
2. Install dependencies
npm install
3. Install Ollama

Install Ollama on your computer.

Then check:

ollama --version
4. Make sure the model is available

Check your installed models:

ollama list

The project currently uses:

gpt-oss:120b-cloud

---------------------------------------------------------
5. Start ST Agent Company
node server.js

You should see:

========================================
       ST AGENT COMPANY ONLINE
========================================

Dashboard: http://localhost:3000
Outputs:   http://localhost:3000/outputs/
Health:    http://localhost:3000/health
========================================

Open:

http://localhost:3000
🎯 Example

Give the AI CEO a goal:

Build a simple AI study website for students.
Research the idea, design the interface, build the website,
test it, and prepare the final output.

The company can create a workflow such as:

👤 User
   │
   ▼
🧠 CEO
   │
   ├── 🔎 Researcher
   │      └── Research the market
   │
   ├── 🎨 Designer
   │      └── Design the interface
   │
   ├── 💻 Developer
   │      └── Build the website
   │
   ├── 🧪 Tester
   │      └── Test the website
   │
   └── 📢 Marketing
          └── Prepare promotional content



------------------------------------------------------------------------
🔄 How It Works
1. User gives a goal
          ↓
2. CEO creates a plan
          ↓
3. CEO delegates tasks
          ↓
4. Employees receive tasks
          ↓
5. Employees use tools
          ↓
6. Employees create real outputs
          ↓
7. CEO reviews the work
          ↓
8. Final outputs are delivered
🔐 Security

ST Agent Company is an experimental project.

Agent access is intentionally restricted.

Agents should not be given unrestricted access to:

System files
Passwords
API credentials
Administrative operations
Destructive commands

Never commit secrets or API keys to GitHub.

-----------------------------------------------------------------------------

📄 Environment Variables

Private configuration can be stored in:

.env

Do not commit .env.

Your .gitignore should contain:

node_modules/
.env
------------------------------------------------------------
🧪 Project Status

ST Agent Company is currently an experimental project under active development.

The goal is to build an AI company capable of:

PLAN
  ↓
DELEGATE
  ↓
RESEARCH
  ↓
DESIGN
  ↓
DEVELOP
  ↓
TEST
  ↓
REVIEW
  ↓
DELIVER

-------------------------------------------------------------------

🔥 ST Agent Company
One Goal. One AI CEO. A Whole AI Team.
        👤 HUMAN
           │
           ▼
       🧠 AI CEO
           │
     ┌─────┼─────┐
     ▼     ▼     ▼
    CTO   DEV  DESIGN
     │     │     │
     └─────┼─────┘
           ▼
       🧪 TESTER
           │
           ▼
       📦 OUTPUT

Built by John Nikson / ST Group



