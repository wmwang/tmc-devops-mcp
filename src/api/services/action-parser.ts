// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

export interface ActionResult {
    thought?: string;
    action?: string;
    actionInput?: Record<string, unknown>;
    finalAnswer?: string;
}

/**
 * Parse LLM output in ReAct format
 *
 * Expected format:
 * Thought: <reasoning>
 * Action: <tool_name>
 * Action Input: <json_params>
 *
 * Or:
 * Final Answer: <answer>
 */
export function parseAction(llmOutput: string): ActionResult {
    const result: ActionResult = {};

    // Extract Thought
    const thoughtMatch = llmOutput.match(/Thought:\s*([\s\S]*?)(?=Action:|Final Answer:|$)/i);
    if (thoughtMatch) {
        result.thought = thoughtMatch[1].trim();
    }

    // Check for Final Answer
    const finalAnswerMatch = llmOutput.match(/Final Answer:\s*([\s\S]*?)$/i);
    if (finalAnswerMatch) {
        result.finalAnswer = finalAnswerMatch[1].trim();
        return result;
    }

    // Extract Action
    const actionMatch = llmOutput.match(/Action:\s*([^\n]+)/i);
    if (actionMatch) {
        result.action = actionMatch[1].trim();
    }

    // Extract Action Input
    const actionInputMatch = llmOutput.match(/Action Input:\s*([\s\S]*?)(?=Thought:|Action:|Final Answer:|$)/i);
    if (actionInputMatch) {
        try {
            const inputStr = actionInputMatch[1].trim();
            // Try to find JSON in the input
            const jsonMatch = inputStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result.actionInput = JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            // If JSON parsing fails, store as empty object
            result.actionInput = {};
        }
    }

    return result;
}
