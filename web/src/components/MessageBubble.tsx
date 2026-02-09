import { useState } from 'react';
import {
    Card,
    Text,
    Button,
    makeStyles,
    tokens,
    shorthands,
    Divider,
} from '@fluentui/react-components';
import {
    PersonCircle24Regular,
    Bot24Regular,
    ChevronDown20Regular,
    ChevronUp20Regular,
    Lightbulb20Regular,
    Play20Regular,
    Eye20Regular,
} from '@fluentui/react-icons';
import type { Message } from '../hooks/useChat';

const useStyles = makeStyles({
    userMessage: {
        alignSelf: 'flex-end',
        maxWidth: '70%',
        backgroundColor: tokens.colorBrandBackground,
        color: tokens.colorNeutralForegroundOnBrand,
        ...shorthands.borderRadius('12px', '12px', '4px', '12px'),
        ...shorthands.padding('12px', '16px'),
        flexShrink: 0, // Prevent from collapsing
    },
    assistantMessage: {
        alignSelf: 'flex-start',
        maxWidth: '80%',
        backgroundColor: tokens.colorNeutralBackground1,
        boxShadow: tokens.shadow4,
        ...shorthands.borderRadius('12px', '12px', '12px', '4px'),
        ...shorthands.padding('12px', '16px'),
        flexShrink: 0, // Prevent from collapsing
    },
    messageHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
    },
    stepsContainer: {
        marginTop: '12px',
        ...shorthands.padding('8px'),
        backgroundColor: tokens.colorNeutralBackground3,
        ...shorthands.borderRadius('8px'),
    },
    step: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        ...shorthands.padding('8px', '0'),
    },
    stepIcon: {
        marginTop: '2px',
        flexShrink: 0,
    },
    stepContent: {
        fontSize: '13px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    thoughtStep: {
        color: tokens.colorPaletteBlueForeground2,
    },
    actionStep: {
        color: tokens.colorPaletteGreenForeground1,
    },
    observationStep: {
        color: tokens.colorNeutralForeground2,
        maxHeight: '150px',
        overflowY: 'auto',
    },
    errorStep: {
        color: tokens.colorPaletteRedForeground1,
    },
    messageContent: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        display: 'block',
    },
    toggleButton: {
        marginTop: '8px',
    },
});

interface MessageBubbleProps {
    message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const styles = useStyles();
    const [showSteps, setShowSteps] = useState(false);

    const isUser = message.role === 'user';
    const hasSteps = message.steps && message.steps.length > 0;

    return (
        <Card className={isUser ? styles.userMessage : styles.assistantMessage}>
            <div className={styles.messageHeader}>
                {isUser ? (
                    <PersonCircle24Regular />
                ) : (
                    <Bot24Regular />
                )}
                <Text weight="semibold">{isUser ? '您' : 'AI 助手'}</Text>
            </div>

            <Text className={styles.messageContent}>
                {message.content || '處理中...'}
            </Text>

            {hasSteps && (
                <>
                    <Button
                        appearance="subtle"
                        size="small"
                        icon={showSteps ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
                        onClick={() => setShowSteps(!showSteps)}
                        className={styles.toggleButton}
                    >
                        {showSteps ? '隱藏推理過程' : '顯示推理過程'}
                    </Button>

                    {showSteps && (
                        <div className={styles.stepsContainer}>
                            {message.steps?.map((step: { type: string; content: string }, index: number) => (
                                <div key={index}>
                                    <div className={styles.step}>
                                        <span className={styles.stepIcon}>
                                            {step.type === 'thought' && <Lightbulb20Regular className={styles.thoughtStep} />}
                                            {step.type === 'action' && <Play20Regular className={styles.actionStep} />}
                                            {step.type === 'observation' && <Eye20Regular />}
                                        </span>
                                        <div>
                                            <Text size={200} weight="semibold">
                                                {step.type === 'thought' && '思考'}
                                                {step.type === 'action' && '執行動作'}
                                                {step.type === 'observation' && '觀察結果'}
                                                {step.type === 'error' && '錯誤'}
                                            </Text>
                                            <div
                                                className={`${styles.stepContent} ${step.type === 'thought' ? styles.thoughtStep :
                                                    step.type === 'action' ? styles.actionStep :
                                                        step.type === 'observation' ? styles.observationStep :
                                                            step.type === 'error' ? styles.errorStep : ''
                                                    }`}
                                            >
                                                {step.content}
                                            </div>
                                        </div>
                                    </div>
                                    {index < (message.steps?.length || 0) - 1 && <Divider />}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </Card>
    );
};
