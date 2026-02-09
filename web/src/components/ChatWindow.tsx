import { useState, useRef, useEffect } from 'react';
import {
    Card,
    Input,
    Button,
    Spinner,
    Text,
    makeStyles,
    tokens,
    shorthands,
    Dropdown,
    Option,
    type OptionOnSelectData,
    type SelectionEvents,
    Label,
} from '@fluentui/react-components';
import { Send24Regular } from '@fluentui/react-icons';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';

interface Project {
    id: string;
    name: string;
}

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: tokens.colorNeutralBackground2,
    },
    header: {
        ...shorthands.padding('16px', '20px'),
        backgroundColor: tokens.colorBrandBackground,
        color: tokens.colorNeutralForegroundOnBrand,
    },
    headerTitle: {
        fontSize: '18px',
        fontWeight: 600,
    },
    messagesContainer: {
        flexGrow: 1,
        flexShrink: 1,
        minHeight: 0, // Critical for flexbox scroll to work
        overflowY: 'auto',
        ...shorthands.padding('20px'),
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    inputContainer: {
        ...shorthands.padding('16px', '20px'),
        backgroundColor: tokens.colorNeutralBackground1,
        boxShadow: tokens.shadow8,
    },
    inputWrapper: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
    },
    input: {
        flexGrow: 1,
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: tokens.colorNeutralForeground3,
        ...shorthands.padding('40px'),
        textAlign: 'center',
    },
});

export function ChatWindow() {
    const styles = useStyles();
    const { messages, isLoading, error, sendMessage, currentProject, setCurrentProject } = useChat();
    const [inputValue, setInputValue] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch projects on mount
        fetch('http://localhost:3001/api/projects')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setProjects(data);
                    // Optional: set first project as default if none selected
                    // if (data.length > 0 && !currentProject) {
                    //    setCurrentProject(data[0].name);
                    // }
                }
            })
            .catch((err) => console.error('Failed to fetch projects:', err));
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const message = inputValue;
        setInputValue('');
        await sendMessage(message);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text className={styles.headerTitle}>TMC DevOps AI 助手</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Label style={{ color: tokens.colorNeutralForegroundOnBrand }}>Project Context:</Label>
                    <Dropdown
                        aria-labelledby="project-dropdown"
                        placeholder="Select a project"
                        value={currentProject}
                        selectedOptions={currentProject ? [currentProject] : []}
                        onOptionSelect={(_e: SelectionEvents, data: OptionOnSelectData) => {
                            if (data.optionValue) {
                                setCurrentProject(data.optionValue);
                            }
                        }}
                        style={{ minWidth: '150px' }}
                    >
                        {projects.map((option) => (
                            <Option key={option.id} value={option.name}>
                                {option.name}
                            </Option>
                        ))}
                    </Dropdown>
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Text size={500} weight="semibold">
                            歡迎使用 TMC DevOps AI 助手
                        </Text>
                        <Text size={300} style={{ marginTop: '8px' }}>
                            您可以詢問關於 Azure DevOps 專案、Pipeline、工作項目等問題
                        </Text>
                        <Text size={200} style={{ marginTop: '16px', color: tokens.colorNeutralForeground4 }}>
                            試試看：「列出所有專案」或「顯示最近的建置紀錄」
                        </Text>
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                    ))
                )}
                {isLoading && (
                    <Card style={{ padding: '12px', width: 'fit-content' }}>
                        <Spinner size="tiny" label="AI 正在思考中..." />
                    </Card>
                )}
                {error && (
                    <Card style={{ padding: '12px', backgroundColor: tokens.colorPaletteRedBackground2 }}>
                        <Text style={{ color: tokens.colorPaletteRedForeground1 }}>錯誤: {error}</Text>
                    </Card>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={styles.inputContainer}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.inputWrapper}>
                        <Input
                            className={styles.input}
                            placeholder="輸入您的問題..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isLoading}
                            size="large"
                        />
                        <Button
                            appearance="primary"
                            icon={<Send24Regular />}
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                        >
                            傳送
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
