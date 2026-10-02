require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");

const {
  askAI,
  runEmployee,
  runCompany,
  createCompanyPlan
} = require("./ai/router");

const app = express();

const PORT = 3000;

const WORKSPACE = path.resolve(__dirname);
const PUBLIC_DIR = path.join(WORKSPACE, "public");
const OUTPUT_DIR = path.join(PUBLIC_DIR, "outputs");

// --------------------------------------------------
// DIRECTORIES
// --------------------------------------------------

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(
  express.json({
    limit: "20mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb"
  })
);

// Main public folder
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ["html"],
    index: "index.html"
  })
);

// Outputs folder
app.use(
  "/outputs",
  express.static(OUTPUT_DIR, {
    fallthrough: false
  })
);

// --------------------------------------------------
// HOME
// --------------------------------------------------

app.get("/", (req, res) => {
  res.sendFile(
    path.join(PUBLIC_DIR, "index.html")
  );
});

// --------------------------------------------------
// HEALTH
// --------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    company: "ST Agent Company",
    status: "online",
    time: new Date().toISOString()
  });
});

// --------------------------------------------------
// SIMPLE AI CHAT
// --------------------------------------------------

app.post("/ask", async (req, res) => {

  try {

    const prompt =
      String(
        req.body?.prompt || ""
      ).trim();

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required."
      });
    }

    console.log("");
    console.log("========== AI ASK ==========");
    console.log(prompt);

    const answer =
      await askAI(prompt);

    res.json({
      success: true,
      answer
    });

  }
  catch (error) {

    console.error(
      "ASK ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

// --------------------------------------------------
// CREATE COMPANY PLAN
// --------------------------------------------------

app.post("/create-plan", async (req, res) => {

  try {

    const goal =
      String(
        req.body?.goal || ""
      ).trim();

    if (!goal) {
      return res.status(400).json({
        success: false,
        error: "Goal is required."
      });
    }

    console.log("");
    console.log("========== CREATE PLAN ==========");
    console.log("GOAL:", goal);

    const plan =
      await createCompanyPlan(goal);

    console.log(
      "TASK COUNT:",
      Array.isArray(plan.tasks)
        ? plan.tasks.length
        : 0
    );

    res.json({
      success: true,
      plan
    });

  }
  catch (error) {

    console.error(
      "PLAN ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

// --------------------------------------------------
// EXECUTE ONE EMPLOYEE TASK
// --------------------------------------------------

app.post("/execute-task", async (req, res) => {

  try {

    const employee =
      String(
        req.body?.employee || ""
      ).trim();

    const task =
      String(
        req.body?.task || ""
      ).trim();

    if (!employee || !task) {

      return res.status(400).json({
        success: false,
        error:
          "employee and task are required."
      });

    }

    console.log("");
    console.log(
      "========== SINGLE TASK =========="
    );

    console.log(
      "EMPLOYEE:",
      employee
    );

    console.log(
      "TASK:",
      task
    );

    const events = [];

    const result =
      await runEmployee(
        employee,
        task,
        event => {

          console.log(
            "TASK EVENT:",
            event.type,
            event
          );

          events.push({
            time:
              new Date().toISOString(),
            ...event
          });

        }
      );

    res.json({
      success: true,
      employee,
      task,
      events,
      result
    });

  }
  catch (error) {

    console.error(
      "TASK ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

// --------------------------------------------------
// RUN ENTIRE AI COMPANY
// --------------------------------------------------

app.post("/run-company", async (req, res) => {

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "      RUN COMPANY REQUEST RECEIVED"
  );
  console.log(
    "========================================"
  );

  const goal =
    String(
      req.body?.goal || ""
    ).trim();

  console.log(
    "GOAL:",
    goal
  );

  if (!goal) {

    return res.status(400).json({
      success: false,
      error: "Goal is required."
    });

  }

  // ------------------------------------------------
  // SSE HEADERS
  // ------------------------------------------------

  res.statusCode = 200;

  res.setHeader(
    "Content-Type",
    "text/event-stream; charset=utf-8"
  );

  res.setHeader(
    "Cache-Control",
    "no-cache, no-transform"
  );

  res.setHeader(
    "Connection",
    "keep-alive"
  );

  res.setHeader(
    "X-Accel-Buffering",
    "no"
  );

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  if (
    typeof res.flushHeaders === "function"
  ) {
    res.flushHeaders();
  }

  // ------------------------------------------------
  // CONNECTION STATE
  // ------------------------------------------------

  let closed = false;

  // IMPORTANT:
  // Listen on RESPONSE, not request.
  res.on("close", () => {

    closed = true;

    console.log(
      "Company stream connection closed."
    );

  });

  res.on("error", error => {

    console.error(
      "SSE RESPONSE ERROR:",
      error
    );

    closed = true;

  });

  // ------------------------------------------------
  // SEND SSE EVENT
  // ------------------------------------------------

  function send(event) {

    if (closed) {

      console.log(
        "EVENT SKIPPED — STREAM CLOSED:",
        event.type
      );

      return;

    }

    try {

      const payload = {
        time:
          new Date().toISOString(),
        ...event
      };

      const message =
        `data: ${JSON.stringify(payload)}\n\n`;

      res.write(message);

      if (
        typeof res.flush === "function"
      ) {
        res.flush();
      }

      console.log(
        "COMPANY EVENT:",
        event.type,
        event
      );

    }
    catch (error) {

      console.error(
        "SSE SEND ERROR:",
        error
      );

      closed = true;

    }

  }

  // ------------------------------------------------
  // INITIAL EVENT
  // ------------------------------------------------

  send({
    type: "company_start",
    goal,
    message:
      "ST Agent Company started."
  });

  send({
    type: "conversation",
    speaker: "CEO",
    message:
      "I received the goal. I'm creating the company plan now."
  });

  // ------------------------------------------------
  // RUN COMPANY
  // ------------------------------------------------

  try {

    console.log(
      "Starting runCompany..."
    );

    const result =
      await runCompany(
        goal,
        event => {

          console.log(
            "RUN COMPANY CALLBACK:",
            event.type
          );

          send(event);

        }
      );

    console.log(
      "runCompany finished."
    );

    // ------------------------------------------------
    // FINAL EVENT
    // ------------------------------------------------

    send({
      type: "company_complete",
      result,
      message:
        "All company tasks have been processed."
    });

    send({
      type: "conversation",
      speaker: "CEO",
      message:
        "Company execution finished. Check Tasks, Conversations, Activity and Outputs."
    });

  }
  catch (error) {

    console.error("");
    console.error(
      "========================================"
    );
    console.error(
      "          COMPANY EXECUTION ERROR"
    );
    console.error(
      "========================================"
    );
    console.error(error);

    send({
      type: "company_error",
      error:
        error.message ||
        String(error)
    });

    send({
      type: "conversation",
      speaker: "CEO",
      message:
        "Company execution stopped because an error occurred."
    });

  }
  finally {

    console.log(
      "Ending company SSE stream."
    );

    if (!closed) {

      try {
        res.end();
      }
      catch (error) {
        console.error(
          "STREAM END ERROR:",
          error
        );
      }

    }

  }

});

// --------------------------------------------------
// OUTPUT LIST
// --------------------------------------------------

app.get("/outputs-list", (req, res) => {

  try {

    if (
      !fs.existsSync(OUTPUT_DIR)
    ) {

      return res.json({
        outputs: []
      });

    }

    const files =
      fs.readdirSync(
        OUTPUT_DIR,
        {
          withFileTypes: true
        }
      );

    const outputs =
      files
        .filter(
          item =>
            item.isFile()
        )
        .map(item => {

          const file =
            item.name;

          const encoded =
            encodeURIComponent(file);

          const isHTML =
            /\.(html?|xhtml)$/i.test(
              file
            );

          return {
            file,

            url:
              `/outputs/${encoded}`,

            preview:
              isHTML
                ? `/preview?file=${encoded}`
                : null
          };

        });

    res.json({
      outputs
    });

  }
  catch (error) {

    console.error(
      "OUTPUT LIST ERROR:",
      error
    );

    res.status(500).json({
      outputs: [],
      error: error.message
    });

  }

});

// --------------------------------------------------
// HTML PREVIEW
// --------------------------------------------------

app.get("/preview", (req, res) => {

  try {

    let file =
      String(
        req.query.file || ""
      );

    file =
      decodeURIComponent(file);

    file =
      file
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .replace(
          /^public\/outputs\//i,
          ""
        )
        .replace(
          /^outputs\//i,
          ""
        );

    // Only allow a filename.
    if (
      !file ||
      file.includes("..") ||
      file.includes("/") ||
      file.includes("\\")
    ) {

      return res.status(400).send(
        "Invalid output file."
      );

    }

    if (
      !/\.(html?|xhtml)$/i.test(file)
    ) {

      return res.status(400).send(
        "Preview is only available for HTML files."
      );

    }

    const filePath =
      path.resolve(
        OUTPUT_DIR,
        file
      );

    if (
      !filePath.startsWith(
        OUTPUT_DIR + path.sep
      )
    ) {

      return res.status(403).send(
        "Access denied."
      );

    }

    if (
      !fs.existsSync(filePath)
    ) {

      return res.status(404).send(
        "Output file not found."
      );

    }

    res.sendFile(filePath);

  }
  catch (error) {

    console.error(
      "PREVIEW ERROR:",
      error
    );

    res.status(500).send(
      "Preview error."
    );

  }

});

// --------------------------------------------------
// OUTPUT FILE INFORMATION
// --------------------------------------------------

app.get("/output-info", (req, res) => {

  try {

    let file =
      String(
        req.query.file || ""
      );

    file =
      decodeURIComponent(file);

    file =
      file
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .replace(
          /^public\/outputs\//i,
          ""
        )
        .replace(
          /^outputs\//i,
          ""
        );

    if (
      !file ||
      file.includes("..") ||
      file.includes("/") ||
      file.includes("\\")
    ) {

      return res.status(400).json({
        error: "Invalid file."
      });

    }

    const filePath =
      path.resolve(
        OUTPUT_DIR,
        file
      );

    if (
      !fs.existsSync(filePath)
    ) {

      return res.status(404).json({
        error: "File not found."
      });

    }

    const stats =
      fs.statSync(filePath);

    res.json({
      file,
      size: stats.size,
      created:
        stats.birthtime,
      modified:
        stats.mtime,
      url:
        `/outputs/${encodeURIComponent(file)}`
    });

  }
  catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

// --------------------------------------------------
// 404
// --------------------------------------------------

app.use((req, res) => {

  res.status(404).json({
    success: false,
    error: "Not found",
    path: req.path
  });

});

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "GLOBAL SERVER ERROR:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    res.status(500).json({
      success: false,
      error:
        error.message ||
        "Internal server error."
    });

  }
);

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(
  PORT,
  () => {

    console.log("");

    console.log(
      "========================================"
    );

    console.log(
      "       ST AGENT COMPANY ONLINE"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Dashboard: http://localhost:${PORT}`
    );

    console.log(
      `Outputs:   http://localhost:${PORT}/outputs/`
    );

    console.log(
      `Health:    http://localhost:${PORT}/health`
    );

    console.log(
      `Preview:   http://localhost:${PORT}/preview`
    );

    console.log(
      "========================================"
    );

    console.log("");

  }
);