import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ToolCategory {
    name: string;
    tools: Array<{
        name: string;
        description: string;
    }>;
}

interface ToolsData {
    connected: boolean;
    totalTools: number;
    categories: ToolCategory[];
}

interface UseToolsReturn {
    toolsData: ToolsData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useTools(): UseToolsReturn {
    const [toolsData, setToolsData] = useState<ToolsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTools = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/tools`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setToolsData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            // 如果連線失敗，先取得狀態
            try {
                const statusRes = await fetch(`${API_BASE_URL}/api/chat/status`);
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    setToolsData({
                        connected: statusData.connected,
                        totalTools: statusData.totalTools,
                        categories: [],
                    });
                }
            } catch {
                // Ignore
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTools();
    }, [fetchTools]);

    return { toolsData, isLoading, error, refetch: fetchTools };
}

export type { ToolCategory, ToolsData };
