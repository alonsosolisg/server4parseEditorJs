const express = require("express");
const bodyParser = require("body-parser");
const jsdom = require("jsdom");
const crypto = require("crypto");
const app = express();
const port = 5000;

app.use(bodyParser.urlencoded({ extended: false }));

const options = {
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true,
  includeNodeLocations: true,
  beforeParse(window) {
    window.crypto = {
      getRandomValues: function (buffer) {
        return crypto.randomFillSync(buffer);
      },
    };

    // Polyfill for matchMedia
    window.matchMedia =
      window.matchMedia ||
      function () {
        return {
          matches: false,
          addListener: function () {},
          removeListener: function () {},
        };
      };
  },
};

const { JSDOM } = jsdom;
const { window } = new JSDOM(
  `
<!DOCTYPE html>
<div id="editorjs"></div>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.26.5"></script>
<script src="https://cdn.jsdelivr.net/npm/codex.editor.header@latest/dist/bundle.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/table@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/header@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/link@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/checklist@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/embed@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/quote@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/inline-code@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/warning@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/code@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/marker@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/underline@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/delimiter@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/paragraph@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/codex.editor.paragraph@latest/dist/bundle.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/list@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/raw@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/image@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/@editorjs/simple-image@latest"></script>
<script>
    const editor = new EditorJS({
        holder: 'editorjs',
        tools: {
          header: Header,
          image: SimpleImage,
          checklist: Checklist,
          list: List,
          raw: RawTool,
          quote: Quote,
          Code: CodeTool,
          warning: Warning,
          Marker: Marker,
          delimiter: Delimiter,
          underline: Underline,
          paragraph: Paragraph,
          inlineCode: InlineCode,
          table: Table
        }
    });

    let me = this;
    editor.isReady.then(() => {
        me.editor = editor;
    }).catch(error => {
        console.error('Editor failed to initialize:', error);
    });
</script>`,
  options
);

app.post("/html2blocks", function (req, res) {
  if (window.editor) {
    if (req.body.html) {
      window.editor.blocks
        .renderFromHTML(req.body.html)
        .then(() => {
          window.editor
            .save()
            .then((data) => {
              console.log("Editor data:", data);
              res.json(data); // Use res.json to handle JSON properly
            })
            .catch((error) => {
              console.error("Failed to save editor data:", error);
              res
                .status(500)
                .json({ code: -6, data: "Failed to save editor data" });
            });
        })
        .catch((error) => {
          console.error("Failed to render HTML:", error);
          res.status(500).json({ code: -6, data: "Failed to render HTML" });
        });
    } else {
      res.status(400).json({ code: -5, data: "HTML content is missing" });
    }
  } else {
    res.status(500).json({ code: -7, data: "Editor initialization failed" });
  }
});

app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
