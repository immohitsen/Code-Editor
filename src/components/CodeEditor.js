import React, { useEffect, useRef, useState } from "react";
import { AppBar, Toolbar, Button, Switch, Typography, Box, Tooltip, Fab } from "@mui/material";
import Cookies from "js-cookie";
import { debounce } from "lodash";
import { styled } from "@mui/system";
import Confetti from "react-confetti";
import { js } from "js-beautify"; // Import js-beautify

const StyledBox = styled(Box)(({ theme, darkMode }) => ({
  backgroundColor: darkMode ? "#1e1e2f" : "#f9f9f9",
  color: darkMode ? "#ffffff" : "#000000",
  minHeight: "100vh",
  padding: theme.spacing(3),
  transition: "all 0.3s ease",
}));

const CodeEditor = () => {
  const editorRef = useRef(null);

  // State variables
  const [darkMode, setDarkMode] = useState(
    () => Cookies.get("editorDarkMode") === "true"
  );
  const [code, setCode] = useState(() => Cookies.get("editorCode") || "");
  const [showConfetti, setShowConfetti] = useState(false);

  // Update iframe content
  const updateEditorContent = () => {
    if (editorRef.current) {
      editorRef.current.contentWindow.postMessage(
        {
          eventType: "populateCode",
          language: "javascript",
          files: [
            {
              name: "script.js",
              content: code,
            },
          ],
        },
        "*"
      );
    }
  };

  // Theme toggle
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    Cookies.set("editorDarkMode", newMode);
  };

  // Save code to cookies
  const debouncedSaveCode = debounce((newCode) => {
    Cookies.set("editorCode", newCode);
  }, 1000);

  // Handle editor messages
  const handleEditorMessage = (e) => {
    if (e.data && e.data.language && e.data.files) {
      const codeFile = e.data.files.find((file) => file.name === "script.js");
      if (codeFile) {
        setCode(codeFile.content);
        debouncedSaveCode(codeFile.content);
      }
    }
  };

  // Run code
  const runCode = () => {
    if (editorRef.current) {
      editorRef.current.contentWindow.postMessage(
        {
          eventType: "triggerRun",
        },
        "*"
      );
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const formatCode = () => {
    const formattedCode = js(code, {
      indent_size: 2,
      space_in_empty_paren: true,
      end_with_newline: true,
    });
    updateEditorContent(formattedCode); // Update editor with formatted code
    setCode(formattedCode); // Update local state with formatted code
  };

  // Attach message listener
  useEffect(() => {
    const handleEditorLoad = () => {
      updateEditorContent();
    };

    if (editorRef.current) {
      editorRef.current.addEventListener("load", handleEditorLoad);
    }

    window.addEventListener("message", handleEditorMessage);

    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener("load", handleEditorLoad);
      }
      window.removeEventListener("message", handleEditorMessage);
      debouncedSaveCode.cancel();
    };
  }, [code]);

  return (
    <StyledBox darkMode={darkMode}>
        <AppBar position="static" sx={{ bgcolor: darkMode ? "#333" : "#1976d2" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            My Code Editor
          </Typography>
          <Switch checked={darkMode} onChange={toggleTheme} color="default" />
          <Typography variant="subtitle1">
          {darkMode ? "Dark Mode" : "Light Mode"}
        </Typography>
        </Toolbar>
      </AppBar>      
      <Box display="flex" gap={2} mb={3} mt={7}>
        <Tooltip title="Run Code">
          <Fab color="primary" onClick={runCode}>
            ▶
          </Fab>
        </Tooltip>
        <Tooltip title="Format Code">
          <Fab color="secondary" onClick={formatCode}>
            🖹
          </Fab>
        </Tooltip>
      </Box>
      <iframe
        ref={editorRef}
        src={`https://onecompiler.com/embed/javascript?theme=${
          darkMode ? "dark" : "light"
        }&hideRun=true&codeChangeEvent=true&listenToEvents=true`}
        width="100%"
        height="450px"
        frameBorder="0"
        style={{ borderRadius: "8px", overflow: "hidden" }}
      />
      {showConfetti && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            overflow: "hidden", // Prevent horizontal scrolling
          }}
        >
          {/* Add confetti rendering here */}
          <Confetti />
        </Box>
      )}
    </StyledBox>
  );
};

export default CodeEditor;
