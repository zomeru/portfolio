import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { IoSendSharp } from "react-icons/io5";
import ReactTyped from "react-typed";

import { fadeUp, parentVar } from "@/configs/animations";
import { motion } from "framer-motion";
import useScrollReveal from "@/hooks/useScrollReveal";

const StyledChatAI = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .form {
    max-width: 980px;
    width: 100%;
    margin-top: 10px;
  }

  .title {
    font-size: 14px;
  }

  .textarea {
    width: calc(100% - 15px);
    outline: none;
    padding: 15px 5px 15px 10px;
    scrollbar-width: none;
    overflow: hidden;
    margin-right: 10px;
    background-color: ${({ theme }) => theme.chatGPTInput};
    /* background-color: blue; */
    border: none;
    color: ${({ theme }) => theme.textMain};
    border-radius: 10px;
    resize: none;
  }

  .text-wrapper {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: ${({ theme }) => theme.chatGPTInput};
    color: ${({ theme }) => theme.textMain};
    border-radius: 10px;
  }
  .send-icon {
    padding-right: 10px;
    width: 30px;
    height: 30px;
  }

  .answer {
    background-color: ${({ theme }) => theme.chatGPTInput};
    padding: 10px;
    border-radius: 10px;
    margin-top: 10px;
    max-width: 980px;
    width: 100%;
    height: auto;
  }

  .btn {
    background-color: transparent;
    border: none;
    outline: none;
    color: ${({ theme }) => theme.textMain};
    cursor: pointer;
  }

  .small-text {
    font-size: 10px;
    margin-top: 10px;
  }

  .jumping-dots span {
    position: relative;
    bottom: 0px;
    animation: jump 2s infinite;
  }
  .jumping-dots .dot-1 {
    animation-delay: 200ms;
    margin-right: 2px;
  }
  .jumping-dots .dot-2 {
    animation-delay: 400ms;
    margin-right: 2px;
  }
  .jumping-dots .dot-3 {
    animation-delay: 600ms;
  }

  @keyframes jump {
    0% {
      bottom: 0px;
    }
    20% {
      bottom: 4px;
    }
    40% {
      bottom: 0px;
    }
  }

  .answer-block {
    margin-bottom: 10px;
    font-size: 14px;

    @media only screen and (max-width: 480px) {
      font-size: var(--fz-sm);
    }
  }
`;

const ChatAI = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [ref, controls] = useScrollReveal(-250);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [currentValue, setCurrentValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [typeComplete, setTypeComplete] = useState(false);
  const [currentTypeIndexes, setCurrentTypeIndexes] = useState([0]);

  useEffect(() => {
    if (textareaRef.current === null) return;

    textareaRef.current.style.height = "0px";
    const scrollHeight = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = scrollHeight + "px";
  }, [currentValue]);

  const handleAIRequest = async () => {
    // onEnterPress(e as any);

    if (!currentValue) return;

    setLoading(true);
    setTypeComplete(false);
    setCurrentTypeIndexes([0]);

    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: currentValue }),
      });
      const data = await res.json();
      if (data.bot) {
        setAnswer(data.bot);
      }
    } catch (error) {
      setAnswer("Something went wrong! ChatGPT may be down. Try again later.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const onEnterPress = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      buttonRef.current?.click();
    }
  };

  const dotLoader = () => {
    return (
      <span className="jumping-dots">
        <span className="dot-1">.</span>
        <span className="dot-2">.</span>
        <span className="dot-3">.</span>
      </span>
    );
  };

  return (
    <StyledChatAI variants={parentVar} initial="hidden" animate="visible">
      <motion.p ref={ref} variants={fadeUp} animate={controls}>
        Ask me anything!
      </motion.p>
      <motion.form
        ref={ref}
        variants={fadeUp}
        animate={controls}
        className="form"
      >
        <div className="text-wrapper">
          <textarea
            ref={textareaRef}
            className="textarea"
            onChange={(e) => {
              setCurrentValue(e.target.value);
              //to do something with value, maybe callback?
            }}
            onKeyDown={onEnterPress}
          />
          <button
            ref={buttonRef}
            type="button"
            className="btn"
            onClick={handleAIRequest}
          >
            <IoSendSharp className="send-icon" />
          </button>
        </div>
      </motion.form>
      <div
        style={{
          visibility: loading || answer ? "visible" : "hidden",
          display: loading || answer ? "block" : "none",
          // height: '0px',
        }}
        className="answer"
      >
        {loading
          ? dotLoader()
          : answer
          ? answer.split("\n").map((ans, i) => {
              if (currentTypeIndexes.includes(i)) {
                return (
                  <div key={i} className="answer-block">
                    <ReactTyped
                      strings={[ans]}
                      loop={false}
                      onComplete={() =>
                        setCurrentTypeIndexes((prev) => {
                          return [...prev, i + 1];
                        })
                      }
                      stopped={typeComplete}
                      contentType="html"
                      showCursor={false}
                    />
                  </div>
                );
              }
            })
          : null}
      </div>
      <motion.a
        ref={ref}
        variants={fadeUp}
        animate={controls}
        href="https://chat.openai.com/chat"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="small-text">Powered by ChatGPT</div>
      </motion.a>
    </StyledChatAI>
  );
};

export default ChatAI;
