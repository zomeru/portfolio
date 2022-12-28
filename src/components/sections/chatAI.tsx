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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onEnterPress(e as any);
  };

  const onEnterPress = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
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
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    }

    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      setCurrentValue(currentValue + "");
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
        onSubmit={handleSubmit}
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
            onKeyPress={onEnterPress}
          />
          <button type="submit" className="btn">
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
        href="https://chat.openai.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="small-text">Powered by OpenAI</div>
      </motion.a>
    </StyledChatAI>
  );
};

export default ChatAI;
