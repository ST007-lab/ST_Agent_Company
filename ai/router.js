const { Ollama } = require("ollama");

const {
  readFile,
  writeFile,
  listFiles,
  runTerminal,
  openBrowser,
  browserScreenshot,
  downloadAsset,
  generateImage
} = require("../tools/agentTools");

const ollama = new Ollama();

const MODEL =
  process.env.OLLAMA_MODEL ||
  "gpt-oss:120b-cloud";

const TOOLS = {
  readFile,
  writeFile,
  listFiles,
  runTerminal,
  openBrowser,
  browserScreenshot,
  downloadAsset,
  generateImage
};

/* =========================================================
   EMPLOYEE TOOL PERMISSIONS
========================================================= */

const EMPLOYEE_TOOLS = {
  CTO: [
    "listFiles",
    "readFile",
    "writeFile",
    "runTerminal",
    "openBrowser"
  ],

  Developer: [
    "listFiles",
    "readFile",
    "writeFile",
    "runTerminal",
    "openBrowser",
    "browserScreenshot",
    "downloadAsset"
  ],

  Researcher: [
    "listFiles",
    "readFile",
    "openBrowser",
    "downloadAsset",
    "writeFile"
  ],

  Designer: [
    "listFiles",
    "readFile",
    "writeFile",
    "openBrowser",
    "browserScreenshot",
    "generateImage"
  ],

  Marketing: [
    "listFiles",
    "readFile",
    "writeFile",
    "openBrowser",
    "generateImage"
  ],

  Tester: [
    "listFiles",
    "readFile",
    "writeFile",
    "runTerminal",
    "openBrowser",
    "browserScreenshot"
  ]
};

/* =========================================================
   JSON PARSER
========================================================= */

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (_) {}

  const start =
    text.indexOf("{");

  const end =
    text.lastIndexOf("}");

  if (
    start !== -1 &&
    end !== -1
  ) {
    try {
      return JSON.parse(
        text.slice(
          start,
          end + 1
        )
      );
    } catch (_) {}
  }

  throw new Error(
    "AI returned invalid JSON."
  );
}

/* =========================================================
   CHAT
========================================================= */

async function chat(messages) {
  const response =
    await ollama.chat({
      model: MODEL,
      messages
    });

  return response.message.content;
}

/* =========================================================
   COMPANY PLAN
========================================================= */

async function createCompanyPlan(goal) {
  const system = `
You are the CEO of ST Agent Company.

You operate a real AI company.

AVAILABLE EMPLOYEES:

CTO
Developer
Researcher
Designer
Marketing
Tester

Your job is to break the user's goal into REAL executable tasks.

TASK DELEGATION:

Architecture -> CTO
Research -> Researcher
Coding -> Developer
UI/UX -> Designer
Logo/image -> Designer
Marketing -> Marketing
Testing/debugging -> Tester
Website -> CTO + Designer + Developer + Tester

Do not assign every task to Researcher.

Every task must have a clear deliverable.

IMPORTANT:

The company must actually produce something.

Possible deliverables:

- HTML website
- CSS
- JavaScript
- images
- logos
- reports
- research documents
- screenshots
- downloaded assets
- tested applications

Return ONLY JSON.

{
  "goal": "string",
  "company_status": "PLANNING",
  "tasks": [
    {
      "id": 1,
      "employee": "Designer",
      "task": "specific executable task",
      "priority": "HIGH",
      "status": "PLANNED"
    }
  ],
  "dependencies": [],
  "next_action": {
    "task_id": 1,
    "employee": "Designer",
    "task": "specific executable task"
  }
}

Allowed employees:

CTO
Developer
Researcher
Designer
Marketing
Tester

Allowed priorities:

HIGH
MEDIUM
LOW
`;

  const result =
    await chat([
      {
        role: "system",
        content: system
      },
      {
        role: "user",
        content: goal
      }
    ]);

  return parseJSON(result);
}

/* =========================================================
   EMPLOYEE PROMPT
========================================================= */

function employeePrompt(
  employee,
  task
) {
  return `
You are the ${employee} at ST Agent Company.

You are NOT a chatbot.

You are a REAL working employee.

USER GOAL:

${task}

YOUR JOB:

Actually perform the task using your tools.

DO NOT merely explain what somebody could do.

DO NOT pretend something was created.

DO NOT claim completion without performing real work.

==================================================
OUTPUT DIRECTORY RULE
==================================================

ALL GENERATED DELIVERABLES MUST BE STORED UNDER:

public/outputs/

Examples:

public/outputs/logo.png
public/outputs/index.html
public/outputs/style.css
public/outputs/script.js
public/outputs/report.md
public/outputs/research.txt
public/outputs/screenshot.png

NEVER create generated deliverables in:

./
../
ai/
tools/

The ST Agent Company engine itself is maintained separately.

==================================================
WEBSITE RULE
==================================================

When creating a website:

1. Create HTML under public/outputs/
2. Create CSS under public/outputs/
3. Create JavaScript under public/outputs/
4. Create images under public/outputs/
5. Use relative paths between these files.

Example:

public/outputs/my-site.html
public/outputs/style.css
public/outputs/script.js
public/outputs/logo.png

Inside HTML:

<link rel="stylesheet" href="./style.css">

<script src="./script.js"></script>

<img src="./logo.png">

This makes the website preview correctly.

==================================================
PREVIEW RULE
==================================================

After creating an HTML website:

1. Start/verify the local server if needed.
2. Open the website with the browser tool.
3. Check for errors.
4. Take a screenshot if useful.
5. Return the preview URL.

Preview format:

/preview?file=filename.html

Direct format:

/outputs/filename.html

==================================================
TOOLS
==================================================

Available tools:

${(
    EMPLOYEE_TOOLS[
      employee
    ] || []
  ).join(", ")}

==================================================
TOOL ACTION FORMAT
==================================================

When you need a tool, return ONLY:

{
  "action": "tool",
  "tool": "toolName",
  "arguments": {}
}

==================================================
FINAL FORMAT
==================================================

When the task is genuinely finished:

{
  "action": "final",
  "status": "COMPLETED",
  "summary": "what you actually did",
  "outputs": [
    {
      "type": "website",
      "file": "/outputs/example.html",
      "preview": "/preview?file=example.html"
    }
  ],
  "next_recommendation": "what the company should do next"
}

If the task failed:

{
  "action": "final",
  "status": "FAILED",
  "summary": "what failed",
  "outputs": [],
  "next_recommendation": "what should happen next"
}

==================================================
IMPORTANT
==================================================

NO REAL WORK = NO COMPLETION.

If you need multiple tools, use multiple tool actions.

Keep working until the task is genuinely complete.
`;
}

/* =========================================================
   TOOL ARGUMENT EXECUTION
========================================================= */

async function executeTool(
  toolName,
  args
) {
  const tool =
    TOOLS[toolName];

  if (!tool) {
    throw new Error(
      `Tool ${toolName} does not exist.`
    );
  }

  args = args || {};

  switch (toolName) {
    case "readFile":
      return tool(
        args.relativePath ||
          args.path
      );

    case "writeFile":
      return tool(
        args.relativePath ||
          args.path ||
          "output.txt",
        args.content || ""
      );

    case "listFiles":
      return tool(
        args.relativePath ||
          args.path ||
          "."
      );

    case "runTerminal":
      return tool(
        args.command,
        args.args || []
      );

    case "openBrowser":
      return tool(
        args.url
      );

    case "browserScreenshot":
      return tool(
        args.relativePath ||
          args.path ||
          "browser-screenshot.png"
      );

    case "downloadAsset":
      return tool(
        args.url,
        args.relativePath ||
          args.path ||
          "download.bin"
      );

    case "generateImage":
      return tool(
        args.prompt,
        args.outputPath ||
          args.relativePath ||
          args.path ||
          "agent-image.png"
      );

    default:
      throw new Error(
        `Unsupported tool: ${toolName}`
      );
  }
}

/* =========================================================
   RUN EMPLOYEE
========================================================= */

async function runEmployee(
  employee,
  task,
  onEvent = () => {}
) {
  if (
    !EMPLOYEE_TOOLS[employee]
  ) {
    throw new Error(
      `Unknown employee: ${employee}`
    );
  }

  const allowedTools =
    EMPLOYEE_TOOLS[employee];

  let messages = [
    {
      role: "system",
      content:
        employeePrompt(
          employee,
          task
        )
    },
    {
      role: "user",
      content:
        `Start working now.\n\n${task}`
    }
  ];

  for (
    let step = 1;
    step <= 25;
    step++
  ) {
    onEvent({
      type: "agent_step",
      employee,
      step
    });

    const raw =
      await chat(messages);

    let action;

    try {
      action =
        parseJSON(raw);
    } catch (_) {
      messages.push({
        role: "assistant",
        content: raw
      });

      messages.push({
        role: "user",
        content:
          "INVALID RESPONSE. Return ONLY valid JSON with either action=tool or action=final."
      });

      continue;
    }

    /* ================================
       TOOL
    ================================= */

    if (
      action.action ===
      "tool"
    ) {
      const toolName =
        action.tool;

      const args =
        action.arguments || {};

      if (
        !allowedTools.includes(
          toolName
        )
      ) {
        const error =
          `Tool ${toolName} is not allowed for ${employee}.`;

        onEvent({
          type: "tool_error",
          employee,
          tool: toolName,
          error
        });

        messages.push({
          role: "assistant",
          content: raw
        });

        messages.push({
          role: "user",
          content:
            `TOOL ERROR: ${error}`
        });

        continue;
      }

      onEvent({
        type: "tool_start",
        employee,
        tool: toolName,
        arguments: args
      });

      try {
        const result =
          await executeTool(
            toolName,
            args
          );

        onEvent({
          type: "tool_result",
          employee,
          tool: toolName,
          result
        });

        messages.push({
          role: "assistant",
          content: raw
        });

        messages.push({
          role: "user",
          content:
            `TOOL RESULT:\n${JSON.stringify(
              result,
              null,
              2
            )}\n\nContinue working.`
        });
      } catch (error) {
        onEvent({
          type: "tool_error",
          employee,
          tool: toolName,
          error:
            error.message
        });

        messages.push({
          role: "assistant",
          content: raw
        });

        messages.push({
          role: "user",
          content:
            `TOOL ERROR:\n${error.message}\n\nTry another safe approach.`
        });
      }

      continue;
    }

    /* ================================
       FINAL
    ================================= */

    if (
      action.action ===
      "final"
    ) {
      return {
        status:
          action.status ||
          "COMPLETED",

        summary:
          action.summary ||
          "",

        outputs:
          Array.isArray(
            action.outputs
          )
            ? action.outputs
            : [],

        next_recommendation:
          action.next_recommendation ||
          ""
      };
    }

    messages.push({
      role: "assistant",
      content: raw
    });

    messages.push({
      role: "user",
      content:
        "Continue working. Use tools and produce the actual deliverable."
    });
  }

  return {
    status: "FAILED",
    summary:
      "Agent reached the maximum execution steps.",
    outputs: [],
    next_recommendation:
      "Break the task into smaller tasks."
  };
}

/* =========================================================
   CEO REVIEW
========================================================= */

async function reviewTask(
  goal,
  employee,
  task,
  result
) {
  const prompt = `
You are the CEO of ST Agent Company.

GOAL:
${goal}

EMPLOYEE:
${employee}

TASK:
${task}

RESULT:
${JSON.stringify(
    result,
    null,
    2
  )}

Review whether real work was performed.

Return ONLY JSON:

{
  "message": "short CEO message",
  "next_action": "what should happen next",
  "company_status": "IN PROGRESS"
}
`;

  try {
    const raw =
      await chat([
        {
          role: "system",
          content:
            "You are the CEO reviewer."
        },
        {
          role: "user",
          content: prompt
        }
      ]);

    return parseJSON(raw);
  } catch (_) {
    return {
      message:
        `CEO reviewed ${employee}'s work.`,
      next_action:
        "Continue with the next task.",
      company_status:
        "IN PROGRESS"
    };
  }
}

/* =========================================================
   RUN COMPANY
========================================================= */

async function runCompany(
  goal,
  onEvent = () => {}
) {
  onEvent({
    type: "conversation",
    speaker: "CEO",
    message:
      "Goal received. I'm creating the company execution plan."
  });

  const plan =
    await createCompanyPlan(
      goal
    );

  const tasks =
    Array.isArray(
      plan.tasks
    )
      ? plan.tasks
      : [];

  onEvent({
    type: "plan",
    plan
  });

  onEvent({
    type: "conversation",
    speaker: "CEO",
    message:
      `Plan created with ${tasks.length} tasks.`
  });

  const completed = [];

  for (
    const task of tasks
  ) {
    const employee =
      task.employee;

    onEvent({
      type: "task_start",
      task_id: task.id,
      employee,
      task: task.task,
      priority:
        task.priority,
      status:
        "IN PROGRESS"
    });

    onEvent({
      type: "conversation",
      speaker: "CEO",
      employee,
      task_id: task.id,
      message:
        `Assigning Task ${task.id} to ${employee}.`
    });

    onEvent({
      type: "conversation",
      speaker: employee,
      task_id: task.id,
      message:
        `Task ${task.id} received. Starting real work.`
    });

    const result =
      await runEmployee(
        employee,
        task.task,
        onEvent
      );

    onEvent({
      type: "task_complete",
      task_id: task.id,
      employee,
      task: task.task,
      result
    });

    onEvent({
      type: "conversation",
      speaker: employee,
      task_id: task.id,
      message:
        result.summary ||
        "Task processed."
    });

    completed.push({
      ...task,
      result
    });

    const review =
      await reviewTask(
        goal,
        employee,
        task.task,
        result
      );

    onEvent({
      type: "ceo_review",
      task_id: task.id,
      employee,
      review
    });

    onEvent({
      type: "conversation",
      speaker: "CEO",
      task_id: task.id,
      message:
        review.message
    });

    if (
      review.next_action
    ) {
      onEvent({
        type: "conversation",
        speaker: "CEO",
        task_id: task.id,
        message:
          `Next action: ${review.next_action}`
      });
    }
  }

  onEvent({
    type: "conversation",
    speaker: "CEO",
    message:
      "All planned company tasks have been processed."
  });

  return {
    goal,
    company_status:
      "COMPLETED",
    tasks: completed
  };
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  askAI: async prompt => {
    return chat([
      {
        role: "system",
        content:
          "You are the AI CEO of ST Agent Company."
      },
      {
        role: "user",
        content: prompt
      }
    ]);
  },

  runEmployee,
  runCompany,
  createCompanyPlan
};