import { useCallback } from "react";
import { useAmi } from "../context/AmiContext";

export default function useAmiSubjects() {
  const { chatbots, selectedSource, selectedName, selectSubject, setMessages, newConversation } = useAmi();

  const handleSelectSubject = useCallback((bot) => {
    if (!bot) return;
    const prevSource = selectedSource;
    selectSubject(bot);

    if (bot.source !== prevSource) {
      newConversation();
      setMessages([
        {
          id: `sys-${Date.now()}`,
          role: "assistant",
          content: `📚 Ami đã sẵn sàng học môn **${bot.name}** cùng bạn! Hãy hỏi Ami bất cứ điều gì nhé.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [selectedSource, selectSubject, newConversation, setMessages]);

  return {
    chatbots,
    selectedSource,
    selectedName,
    selectSubject: handleSelectSubject,
  };
}
